const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController.js');

const {
  registerValidation,
  loginValidation,
  handleValidationErrors
} = require('../middleware/validation.js');

const {
  protect,
  authorize
} = require('../middleware/auth.js');

// Public routes
router.post('/register', registerValidation, handleValidationErrors, register);
router.post('/login', loginValidation, handleValidationErrors, login);

// Protected routes (require authentication)
router.use(protect); // All routes below this line require authentication

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/logout', logout);

module.exports = router;