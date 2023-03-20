/* eslint-disable no-unused-expressions */
/* eslint-disable no-param-reassign */
const {
  InternalServerError,
  NotFoundError,
  BadRequestError,
} = require('../utils/appError');


const sendErrorInDev = (errorObject, res) => {
  // eslint-disable-next-line no-console
  console.log('✖ | Error:'.red.bold, errorObject);
  res.status(errorObject.statusCode).json({
    status: errorObject.status,
    message: errorObject.message,
    error: errorObject,
    stack: errorObject.stack,
  });
};


const sendErrorInProduction = (errorObject, res) => {
  let details;

  // Mongoose bad ObjectId
  if (errorObject.name === 'CastError') {
    errorObject = new NotFoundError('Requested resource not found :(');
  }

  // Mongoose duplicate key error
  if (errorObject.name === 'MongoServerError' && errorObject.code === 11000) {
    errorObject = new BadRequestError('You can only perform this action once!');
  }

  // Mongoose duplicate key error
  if (errorObject.name === 'MongoError' && errorObject.code === 11000) {
    let duplicateError = errorObject.message.split('dup key: ').pop();
    duplicateError = duplicateError.slice(3 - 1, duplicateError.length - 3).split(': "');
    
    details = { [duplicateError.shift()]: duplicateError.pop() }
    errorObject = new BadRequestError('A record exists with some of your entered values', 400);
  }

  // Mongoose validation & assertion errors
  if (errorObject.name === 'ValidationError') {
    const errorArray = Object.entries(errorObject.errors);

    try {
      errorObject = new BadRequestError('Validation failed. Please enter all required values correctly', 400);

      details = errorArray.reduce((previous, [key, value]) => {
        return { ...previous, [key]: value.properties.message }
      }, {});
    } catch (error) {
      errorObject = new BadRequestError('Assertion failed. Please enter valid values', 400);

      details = errorArray.reduce((previous, [key, value]) => {
        return { ...previous, [key]: {
          'reason': value.reason.code,
          'value': value.details,
          'valueType': value.valueType,
          'requiredType': value.kind
        } }
      }, {})
    }
  }

  if (errorObject?.error) {
    if (errorObject?.error.code === 'ENOTFOUND' || errorObject?.error.code === 'ECONNRESET') {
      errorObject = new InternalServerError('An error occured while connecting to a required external service');
    }
  }

  res.status(errorObject.statusCode || 500).json({
    status: errorObject.status || 'failure',
    message: errorObject.message || 'Internal server error',
    details: details
  });
};

module.exports = (errorObject, req, res, next) => {
  errorObject.statusCode = errorObject.statusCode || 500;
  errorObject.status = errorObject.status || 'error';

  process.env.NODE_ENV !== 'production' && sendErrorInDev(errorObject, res);
  process.env.NODE_ENV === 'production' && sendErrorInProduction(errorObject, res);
};
