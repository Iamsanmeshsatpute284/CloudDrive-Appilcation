const Activity = require('../models/Activity')

// Get recent activities for logged in user
const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ actor: req.user.id })
      .sort({ createdAt: -1 })  // newest first
      .limit(50)                 // last 50 actions
      .populate('actor', 'name email')

    res.status(200).json({ success: true, activities })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

module.exports = { getActivities }