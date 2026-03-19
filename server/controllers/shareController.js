const Share = require('../models/Share')
const LinkShare = require('../models/LinkShare')
const User = require('../models/User')
const Activity = require('../models/Activity')
const File = require('../models/File')
const Folder = require('../models/Folder')
const bcrypt = require('bcryptjs')

// Share a file/folder with a specific user
const createShare = async (req, res) => {
  try {
    const { resourceType, resourceId, granteeEmail, role } = req.body

    // Find the user to share with by email
    const grantee = await User.findOne({ email: granteeEmail })
    if (!grantee) {
      return res.status(404).json({
        error: { message: 'User not found with that email' }
      })
    }

    // Cant share with yourself
    if (grantee._id.toString() === req.user.id) {
      return res.status(400).json({
        error: { message: 'You cannot share with yourself' }
      })
    }

    // Create share record
    const share = await Share.create({
      resourceType,
      resourceId,
      granteeUserId: grantee._id,
      role: role || 'viewer',
      createdBy: req.user.id
    })

    // Get resource name for activity log
    const resource = resourceType === 'file'
      ? await File.findById(resourceId)
      : await Folder.findById(resourceId)

    // Log activity
    await Activity.create({
      actor: req.user.id,
      action: 'share',
      resourceType,
      resourceId,
      resourceName: resource?.name || 'Unknown',
      context: { sharedWith: granteeEmail, role }
    })

    res.status(201).json({ success: true, share })
  } catch (error) {
    // Handle duplicate share
    if (error.code === 11000) {
      return res.status(400).json({
        error: { message: 'Already shared with this user' }
      })
    }
    res.status(500).json({ error: { message: error.message } })
  }
}

// Get all shares for a resource
const getShares = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params
    const shares = await Share.find({ resourceType, resourceId })
      .populate('granteeUserId', 'name email')
    res.status(200).json({ success: true, shares })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

// Revoke a share
const deleteShare = async (req, res) => {
  try {
    await Share.findByIdAndDelete(req.params.id)
    res.status(200).json({ success: true, message: 'Access revoked' })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

// Create a public link
const createLinkShare = async (req, res) => {
  try {
    const { resourceType, resourceId, expiresAt, password } = req.body

    let passwordHash = null
    if (password) {
      const salt = await bcrypt.genSalt(10)
      passwordHash = await bcrypt.hash(password, salt)
    }

    const linkShare = await LinkShare.create({
      resourceType,
      resourceId,
      expiresAt: expiresAt || null,
      passwordHash,
      createdBy: req.user.id
    })

    res.status(201).json({
      success: true,
      linkShare,
      // Full shareable URL
      shareUrl: `${process.env.CLIENT_URL}/shared/${linkShare.token}`
    })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

// Access a public link (no auth needed)
const accessLinkShare = async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    const linkShare = await LinkShare.findOne({ token })
    if (!linkShare) {
      return res.status(404).json({ error: { message: 'Link not found or expired' } })
    }

    // Check expiry
    if (linkShare.expiresAt && new Date() > linkShare.expiresAt) {
      return res.status(410).json({ error: { message: 'This link has expired' } })
    }

    // Check password
    if (linkShare.passwordHash) {
      if (!password) {
        return res.status(401).json({ error: { message: 'Password required', needsPassword: true } })
      }
      const match = await bcrypt.compare(password, linkShare.passwordHash)
      if (!match) {
        return res.status(401).json({ error: { message: 'Incorrect password' } })
      }
    }

    // Get the resource
    const resource = linkShare.resourceType === 'file'
      ? await File.findById(linkShare.resourceId)
      : await Folder.findById(linkShare.resourceId)

    res.status(200).json({ success: true, resource, resourceType: linkShare.resourceType })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

// Delete a public link
const deleteLinkShare = async (req, res) => {
  try {
    await LinkShare.findByIdAndDelete(req.params.id)
    res.status(200).json({ success: true, message: 'Link deleted' })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

// Get all links for a resource
const getLinks = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params
    const links = await LinkShare.find({ resourceType, resourceId })
    res.status(200).json({ success: true, links })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

module.exports = {
  createShare, getShares, deleteShare,
  createLinkShare, accessLinkShare, deleteLinkShare, getLinks
}