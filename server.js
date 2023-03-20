require('colors');
require('dotenv').config();

const cors = require('cors');
const path = require('path');
const cpus = require('os').cpus();
const cluster = require('cluster');
const express = require('express');
const { engine: handlebarsEngine } = require('express-handlebars');
const compression = require('compression');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');


const app = express();
const router = express.Router();
const PORT = process.env.PORT || 9999;


app.use(cors());
app.use(compression()); // Node.js compression middleware
app.use(express.json()); // For parsing application/json


const isProduction = process.env.NODE_ENV === 'production';


if (!isProduction) {
  app.use(require('morgan')('dev'));
}


app.use(express.static(path.join(__dirname, 'public')));


const rootRouter = require('./src/routes/index')(router);

// Handlebars view engine
app.engine('handlebars', handlebarsEngine({
  defaultLayout: false,
  helpers: {
    ifEquals: function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    },
    formatDate: value => {
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
      return new Intl.DateTimeFormat('en-US', options).format(value)
    },
    math: function(lvalue, operator, rvalue, options) {
      lvalue = parseFloat(lvalue);
      rvalue = parseFloat(rvalue);

      return {
        '+': lvalue + rvalue,
        '-': lvalue - rvalue,
        '*': lvalue * rvalue,
        '/': lvalue / rvalue,
        '%': lvalue % rvalue
      }[operator];
    },
    formatDateToNow: date => {
      return formatDistanceToNow(date, { addSuffix: true, includeSeconds: true })
    }
  }
}));
app.set('view engine', 'handlebars');


app.use(helmet()); // Set security headers
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP param pollution


app.use('/', rootRouter);


if (cluster.isMaster) {
  // Fork workers
  cpus.forEach(() => cluster.fork());

  cluster.on('exit', () => cluster.fork());
} else {
  // Workers can share any TCP connection
  // In this case, it is an HTTP server
  const server = app.listen(PORT, () => {
    console.log(':>>'.green.bold, 'Server running in'.yellow.bold, process.env.NODE_ENV.toUpperCase().blue.bold, 'mode, on port'.yellow.bold, `${PORT}`.blue.bold);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', error => {
    console.error(`✖ | Unhandled Rejection: ${error.message}`.red.bold);
    // Server log
    server.close(() => process.exit(1));
  });
}
