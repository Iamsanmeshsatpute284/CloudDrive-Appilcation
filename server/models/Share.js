const mongoose = require('mongoose')

// Per-user share — grants a specific user access to a file/folder
const shareSchema = new mongoose.Schema(
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
    // Who gets access
    granteeUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // What level of access
    role: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'viewer'
    },
    // Who shared it
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
)

// Prevent duplicate shares for same resource + user
shareSchema.index(
  { resourceType: 1, resourceId: 1, granteeUserId: 1 },
  { unique: true }
)

const Share = mongoose.model('Share', shareSchema)
module.exports = Share