const mongoose = require('mongoose')

// Activity log — records every action a user takes
const activitySchema = new mongoose.Schema(
  {
    // Who did the action
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // What action was performed
    action: {
      type: String,
      enum: ['upload', 'rename', 'delete', 'restore', 'move', 'share', 'download', 'create_folder'],
      required: true
    },
    // Was it a file or folder
    resourceType: {
      type: String,
      enum: ['file', 'folder'],
      required: true
    },
    // ID of the file or folder
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    // Name of the resource (stored so we can show it even if deleted)
    resourceName: {
      type: String,
      required: true
    },
    // Extra info e.g. { oldName: 'foo', newName: 'bar' }
    context: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
)

const Activity = mongoose.model('Activity', activitySchema)
module.exports = Activity