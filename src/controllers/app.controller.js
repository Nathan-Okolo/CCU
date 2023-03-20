const fs = require('fs');
const path = require('path');
const  { AwesomeQR } = require('awesome-qr');
const { encrypt, decrypt } = require('../utils/hash');
const bufferToStream = require('../utils/bufferToStream');

// NPM - Novices Plagiarizing Mozart


/**
 * @desc    Returns user profile
 * @route   GET /?uid=
 * @access  Public
 */
exports.viewProfile = async (req, res, next) => {
  const { uid } = req.query;

  if (!uid) {
    return res.status(400).json({ status: 'failure', message: 'UID not provided!' });
  }

  if (!/^(([a-f0-9]){32}):(([a-f0-9]){32})$/.test(uid)) {
    return res.status(400).json({ status: 'failure', message: 'Invalid UID provided!' });
  }

  try {
    console.log('Decrypted :>', decrypt(uid));




    // res.send(decrypt(uid));
    res.render('viewProfile', { title: 'Home' });
  } catch (error) {
    console.log(error);
    const ERROR_CODES = ['ERR_OSSL_EVP_BAD_DECRYPT', 'ERR_OSSL_DSO_COULD_NOT_LOAD_THE_SHARED_LIBRARY', 'ERR_OSSL_EVP_WRONG_FINAL_BLOCK_LENGTH'];
    if (ERROR_CODES.includes(error.code)) {
      return res.status(400).json({ status: 'failure', message: 'An error occured while decoding UID!' });
    }

    return res.status(400).json({ status: 'failure', message: 'An unexpected error occured!' });
  }
};


/**
 * @desc    Generate student QR code
 * @route   GET /generateImageCode?regNumber=
 * @access  Public
 */
exports.generateImageCode = async (req, res, next) => {
  const { regNumber } = req.query;

  if (!regNumber) {
    return res.status(400).json({ status: 'failure', message: 'Registration number not provided!' });
  }

  if (!/(^[0-9]{4})+([\/])+([0-9]{5})+([A-Z]{3}$)/.test(regNumber)) {
    return res.status(400).json({ status: 'failure', message: 'Invalid CCU registration number provided!' });
  }

  try {
    const encryptedId = encrypt(regNumber);
    const profileUrl = `${req.protocol}://${req.get('host')}?uid=${encryptedId}`;
    console.log('Profile URL :>', profileUrl);

    const logo = fs.readFileSync(path.join(__dirname, '../../public', 'logo.png'));
    const qrBuffer = await new AwesomeQR({
      text: profileUrl,
      size: 500,
      colorDark: '#533e05',
      colorLight: '#533e05',
      logoImage: logo,
      logoScale: 0.25,
      logoMargin: 10,
      logoCornerRadius: 16
    }).draw();

    const qrStream = bufferToStream(qrBuffer);

    res.type('png') && qrStream.pipe(res);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: 'failure', message: 'An error occured while generating the QR code!' });
  }
};