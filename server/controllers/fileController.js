const File = require('../models/File')
const Folder = require('../models/Folder')
const Activity = require('../models/Activity')
const path = require('path')
const fs = require('fs')

let generateThumbnail, deleteThumbnail
try {
  const thumbService = require('../services/thumbnailService')
  generateThumbnail = thumbService.generateThumbnail
  deleteThumbnail = thumbService.deleteThumbnail
} catch (e) {
  generateThumbnail = async () => null
  deleteThumbnail = () => {}
}

const getFiles = async (req, res) => {
  try {
    const files = await File.find({
      owner: req.user.id,
      folder: req.query.folderId || null,
      isDeleted: false
    })
    res.status(200).json({ success: true, files })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } })
    }
    const file = await File.create({
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      storageKey: req.file.filename,
      owner: req.user.id,
      folder: req.body.folderId || null
    })
    await Activity.create({
      actor: req.user.id,
      action: 'upload',
      resourceType: 'file',
      resourceId: file._id,
      resourceName: file.name
    })
    generateThumbnail(req.file.filename, req.file.mimetype).then(async (thumbnailKey) => {
      if (thumbnailKey) await File.findByIdAndUpdate(file._id, { thumbnailKey })
    })
    res.status(201).json({ success: true, file })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

const downloadFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id, isDeleted: false })
    if (!file) return res.status(404).json({ error: { message: 'File not found' } })
    await Activity.create({ actor: req.user.id, action: 'download', resourceType: 'file', resourceId: file._id, resourceName: file.name })
    const filePath = path.join(__dirname, '../uploads', file.storageKey)
    res.download(filePath, file.name)
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

const renameFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id })
    if (!file) return res.status(404).json({ error: { message: 'File not found' } })
    const oldName = file.name
    file.name = req.body.name || file.name
    await file.save()
    await Activity.create({ actor: req.user.id, action: 'rename', resourceType: 'file', resourceId: file._id, resourceName: file.name, context: { oldName, newName: file.name } })
    res.status(200).json({ success: true, file })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

const moveFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id })
    if (!file) return res.status(404).json({ error: { message: 'File not found' } })
    file.folder = req.body.folderId || null
    await file.save()
    await Activity.create({ actor: req.user.id, action: 'move', resourceType: 'file', resourceId: file._id, resourceName: file.name })
    res.status(200).json({ success: true, file })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

const deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id })
    if (!file) return res.status(404).json({ error: { message: 'File not found' } })
    file.isDeleted = true
    file.deletedAt = new Date()
    await file.save()
    await Activity.create({ actor: req.user.id, action: 'delete', resourceType: 'file', resourceId: file._id, resourceName: file.name })
    res.status(200).json({ success: true, message: 'File moved to trash' })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

const permanentDeleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id, isDeleted: true })
    if (!file) return res.status(404).json({ error: { message: 'File not found in trash' } })
    const filePath = path.join(__dirname, '../uploads', file.storageKey)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    deleteThumbnail(file.thumbnailKey)
    await File.findByIdAndDelete(file._id)
    res.status(200).json({ success: true, message: 'File permanently deleted' })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

const getTrashedFiles = async (req, res) => {
  try {
    const files = await File.find({ owner: req.user.id, isDeleted: true })
    res.status(200).json({ success: true, files })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

const restoreFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id })
    if (!file) return res.status(404).json({ error: { message: 'File not found' } })
    file.isDeleted = false
    file.deletedAt = null
    await file.save()
    await Activity.create({ actor: req.user.id, action: 'restore', resourceType: 'file', resourceId: file._id, resourceName: file.name })
    res.status(200).json({ success: true, message: 'File restored' })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

const toggleStar = async (req, res) => {
  try {
    console.log('toggleStar called — file id:', req.params.id)
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id })
    if (!file) {
      console.log('File not found!')
      return res.status(404).json({ error: { message: 'File not found' } })
    }
    file.isStarred = !file.isStarred
    await file.save()
    console.log('isStarred is now:', file.isStarred)
    res.status(200).json({ success: true, file })
  } catch (error) {
    console.error('toggleStar error:', error.message)
    res.status(500).json({ error: { message: error.message } })
  }
}

const getStarredFiles = async (req, res) => {
  try {
    const files = await File.find({ owner: req.user.id, isStarred: true, isDeleted: false })
    res.status(200).json({ success: true, files })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

const searchFiles = async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.status(400).json({ error: { message: 'Search query required' } })
    const files = await File.find({ owner: req.user.id, isDeleted: false, name: { $regex: q, $options: 'i' } })
    const folders = await Folder.find({ owner: req.user.id, isDeleted: false, name: { $regex: q, $options: 'i' } })
    res.status(200).json({ success: true, files, folders })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

const getRecentFiles = async (req, res) => {
  try {
    console.log('getRecentFiles called for user:', req.user.id)
    const files = await File.find({ owner: req.user.id, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(20)
    console.log('Recent files count:', files.length)
    res.status(200).json({ success: true, files })
  } catch (error) {
    console.error('getRecentFiles error:', error.message)
    res.status(500).json({ error: { message: error.message } })
  }
}

module.exports = {
  getFiles, uploadFile, downloadFile,
  renameFile, moveFile, deleteFile,
  permanentDeleteFile, getTrashedFiles,
  restoreFile, toggleStar, getStarredFiles,
  searchFiles, getRecentFiles
}