const mongoose = require('mongoose')

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    // Added — tracks when folder was deleted for 30-day auto purge
    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

const Folder = mongoose.model('Folder', folderSchema)
module.exports = Folder