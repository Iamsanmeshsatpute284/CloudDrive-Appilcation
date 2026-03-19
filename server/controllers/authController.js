const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

const sendTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })
}

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'All fields are required' }
      })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        error: { code: 'EMAIL_EXISTS', message: 'Email already registered' }
      })
    }

    // Hash password manually here
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    })

    const token = generateToken(user._id)
    sendTokenCookie(res, token)

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Register error:', error.message)
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message }
    })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'Email and password are required' }
      })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      })
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      })
    }

    const token = generateToken(user._id)
    sendTokenCookie(res, token)

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Login error:', error.message)
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message }
    })
  }
}

const logout = (req, res) => {
  res.cookie('token', '', { maxAge: 0 })
  res.status(200).json({ success: true, message: 'Logged out successfully' })
}

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    res.status(200).json({ success: true, user })
  } catch (error) {
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message }
    })
  }
}

module.exports = { register, login, logout, getMe }