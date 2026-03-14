const express = require('express');
const { authUser, signup, refreshToken, logout, createAdminUser } = require('../controllers/authController');
const router = express.Router();

router.route('auth/login').post(authUser);
router.route('auth/signup').post(signup);
router.route('auth/refresh').post(refreshToken);
router.route('auth/logout').post(logout);
// Development helper: create an admin user. Requires ADMIN_SETUP_KEY header if configured.
router.route('/create-admin').post(createAdminUser);

module.exports = router;