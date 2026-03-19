const Folder = require('../models/Folder')
const Activity = require('../models/Activity')
const path = require('path')
const fs = require('fs')
const File = require('../models/File')

const getFolders = async (req, res) => {
  try {
    const folders = await Folder.find({
      owner: req.user.id,
      parent: req.query.parentId || null,
      isDeleted: false
    })
    res.status(200).json({ success: true, folders })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

const getFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user.id })
    if (!folder) {
      return res.status(404).json({ error: { message: 'Folder not found' } })
    }
    res.status(200).json({ success: true, folder })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

const createFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body
    if (!name) {
      return res.status(400).json({ error: { message: 'Folder name is required' } })
    }
    const existing = await Folder.findOne({
      name, owner: req.user.id,
      parent: parentId || null, isDeleted: false
    })
    if (existing) {
      return res.status(400).json({ error: { message: 'A folder with this name already exists here' } })
    }
    const folder = await Folder.create({
      name, owner: req.user.id, parent: parentId || null
    })
    await Activity.create({
      actor: req.user.id,
      action: 'create_folder',
      resourceType: 'folder',
      resourceId: folder._id,
      resourceName: folder.name
    })
    res.status(201).json({ success: true, folder })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

const renameFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user.id })
    if (!folder) {
      return res.status(404).json({ error: { message: 'Folder not found' } })
    }
    const oldName = folder.name
    folder.name = req.body.name || folder.name
    await folder.save()
    await Activity.create({
      actor: req.user.id,
      action: 'rename',
      resourceType: 'folder',
      resourceId: folder._id,
      resourceName: folder.name,
      context: { oldName, newName: folder.name }
    })
    res.status(200).json({ success: true, folder })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

const moveFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user.id })
    if (!folder) {
      return res.status(404).json({ error: { message: 'Folder not found' } })
    }
    folder.parent = req.body.parentId || null
    await folder.save()
    res.status(200).json({ success: true, folder })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

// Soft delete — moves folder to trash
const deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user.id })
    if (!folder) {
      return res.status(404).json({ error: { message: 'Folder not found' } })
    }
    folder.isDeleted = true
    folder.deletedAt = new Date()
    await folder.save()

    await Activity.create({
      actor: req.user.id,
      action: 'delete',
      resourceType: 'folder',
      resourceId: folder._id,
      resourceName: folder.name
    })
    res.status(200).json({ success: true, message: 'Folder moved to trash' })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

// Get trashed folders
const getTrashedFolders = async (req, res) => {
  try {
    const folders = await Folder.find({
      owner: req.user.id,
      isDeleted: true
    })
    res.status(200).json({ success: true, folders })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

// Restore folder from trash
const restoreFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user.id })
    if (!folder) {
      return res.status(404).json({ error: { message: 'Folder not found' } })
    }
    folder.isDeleted = false
    folder.deletedAt = null
    await folder.save()

    await Activity.create({
      actor: req.user.id,
      action: 'restore',
      resourceType: 'folder',
      resourceId: folder._id,
      resourceName: folder.name
    })
    res.status(200).json({ success: true, message: 'Folder restored' })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

// Permanent delete folder + all files inside it
const permanentDeleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user.id,
      isDeleted: true
    })
    if (!folder) {
      return res.status(404).json({ error: { message: 'Folder not found in trash' } })
    }

    // Delete all files inside the folder from disk + DB
    const files = await File.find({ folder: folder._id, owner: req.user.id })
    for (const file of files) {
      const filePath = path.join(__dirname, '../uploads', file.storageKey)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      await File.findByIdAndDelete(file._id)
    }

    // Delete the folder itself
    await Folder.findByIdAndDelete(folder._id)

    res.status(200).json({ success: true, message: 'Folder permanently deleted' })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
}

module.exports = {
  getFolders, getFolder, createFolder,
  renameFolder, moveFolder, deleteFolder,
  getTrashedFolders, restoreFolder, permanentDeleteFolder
}