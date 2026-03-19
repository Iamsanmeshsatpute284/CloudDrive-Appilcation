const express = require('express')
const router = express.Router()
const { register, login, logout, getMe } = require('../controllers/authController')
const { protect } = require('../middleware/authMiddleware')

// Public routes (no login needed)
router.post('/register', register)
router.post('/login', login)

// Private routes (must be logged in)
router.post('/logout', protect, logout)
router.get('/me', protect, getMe)

module.exports = router