const router = require('express').Router();
const { viewProfile, generateImageCode } = require('../controllers/app.controller');


router.route('/').get(viewProfile);
router.route('/generateImageCode').get(generateImageCode);

module.exports = router;