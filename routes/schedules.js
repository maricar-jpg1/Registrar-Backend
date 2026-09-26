const router = require('express').Router();
const ctrl = require('../controllers/schedulesController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.delete('/:id', ctrl.remove);

module.exports = router;