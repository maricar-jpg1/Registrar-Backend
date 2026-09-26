const router = require('express').Router();
const ctrl = require('../controllers/notificationsController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', ctrl.getMy);
router.patch('/:id/read', ctrl.markRead);

module.exports = router;