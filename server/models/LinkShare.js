const mongoose = require('mongoose')
const crypto = require('crypto')

// Public link share — anyone with the token can access
const linkShareSchema = new mongoose.Schema(
  {
    resourceType: {
      type: String,
      enum: ['file', 'folder'],
      required: true
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    // Random unique token for the public URL
    token: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(32).toString('hex')
    },
    role: {
      type: String,
      enum: ['viewer'],
      default: 'viewer'
    },
    // Optional password protection
    passwordHash: {
      type: String,
      default: null
    },
    // Optional expiry date
    expiresAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
)

const LinkShare = mongoose.model('LinkShare', linkShareSchema)
module.exports = LinkShare