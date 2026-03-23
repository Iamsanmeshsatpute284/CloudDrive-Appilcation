const mongoose = require('mongoose')

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    mimeType: {
      type: String,
      required: true
    },
    sizeBytes: {
      type: Number,
      required: true
    },
    storageKey: {
      type: String,
      required: true,
      unique: true
    },
    thumbnailKey: {
      type: String,
      default: null
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    // This field MUST exist for starring to work
    isStarred: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

const File = mongoose.model('File', fileSchema)
module.exports = File