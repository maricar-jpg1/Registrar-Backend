const router = require('express').Router();
const ctrl = require('../controllers/reportsController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/generate', ctrl.generate);

module.exports = router;