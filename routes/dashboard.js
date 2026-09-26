const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/stats', ctrl.getStats);
router.get('/recent-students', ctrl.getRecentStudents);
router.get('/recent-enrollments', ctrl.getRecentEnrollments);
router.get('/today-schedule', ctrl.getTodaySchedule);

module.exports = router;