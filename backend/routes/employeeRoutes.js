const express = require('express');
const { 
  getEmployees, 
  createEmployeeUser,
  getPendingApprovals,
  approveUser,
  rejectUser,
  updateProfile,
  deleteEmployee,
  assignMentor,
  getMyMentees,
  getMyBuddy,
  getEmployeeProgress,
  addTask, 
  toggleTask, 
  assignBuddy 
} = require('../controllers/employeeController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').get(protect, admin, getEmployees).post(protect, admin, createEmployeeUser);
router.route('/pending').get(protect, admin, getPendingApprovals);
router.route('/mentor/mentees').get(protect, getMyMentees);
router.route('/me/buddy').get(protect, getMyBuddy);
router.route('/:employeeId/progress').get(protect, getEmployeeProgress);
router.route('/approve/:userId').put(protect, admin, approveUser);
router.route('/reject/:userId').put(protect, admin, rejectUser);
router.route('/:userId').delete(protect, admin, deleteEmployee);
router.route('/profile').put(protect, updateProfile);
router.route('/mentor').post(protect, admin, assignMentor);
router.route('/task').post(protect, admin, addTask);
router.route('/task/:taskId').put(protect, admin, toggleTask);
router.route('/buddy').post(protect, admin, assignBuddy);

module.exports = router;