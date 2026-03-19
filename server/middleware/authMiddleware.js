const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  try {
    // Step 1: Get token from cookie
    const token = req.cookies.token

    // Step 2: If no token, reject the request
    if (!token) {
      return res.status(401).json({ 
        error: { code: 'NOT_AUTHENTICATED', message: 'Please log in to continue' }
      })
    }

    // Step 3: Verify the token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Step 4: Find the user from the token's payload
    req.user = await User.findById(decoded.id).select('-password')

    // Step 5: Continue to the next function
    next()
  } catch (error) {
    res.status(401).json({ 
      error: { code: 'INVALID_TOKEN', message: 'Session expired, please log in again' }
    })
  }
}

module.exports = { protect }