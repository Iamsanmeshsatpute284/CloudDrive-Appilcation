const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  getFolders, getFolder, createFolder,
  renameFolder, moveFolder, deleteFolder,
  getTrashedFolders, restoreFolder, permanentDeleteFolder
} = require('../controllers/folderController')

router.use(protect)

// Specific routes first
router.get('/trash', getTrashedFolders)
router.patch('/restore/:id', restoreFolder)
router.delete('/permanent/:id', permanentDeleteFolder)
router.patch('/move/:id', moveFolder)

// General routes
router.get('/', getFolders)
router.post('/', createFolder)
router.get('/:id', getFolder)
router.patch('/:id', renameFolder)
router.delete('/:id', deleteFolder)

module.exports = router