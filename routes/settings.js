const router = require('express').Router();
const ctrl = require('../controllers/settingsController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', ctrl.getSettings);
router.put('/', ctrl.updateSettings);
router.put('/password', ctrl.changePassword);

module.exports = router;