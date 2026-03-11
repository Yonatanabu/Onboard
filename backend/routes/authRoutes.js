const express = require('express');
const { authUser, signup, refreshToken, logout, createAdminUser } = require('../controllers/authController');
const router = express.Router();

router.route('/login').post(authUser);
router.route('/signup').post(signup);
router.route('/refresh').post(refreshToken);
router.route('/logout').post(logout);
// Development helper: create an admin user. Requires ADMIN_SETUP_KEY header if configured.
router.route('/create-admin').post(createAdminUser);

module.exports = router;