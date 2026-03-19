const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const { protect } = require('../middleware/authMiddleware')
const {
  getFiles, uploadFile, downloadFile,
  renameFile, moveFile, deleteFile,
  permanentDeleteFile,
  getTrashedFiles, restoreFile,
  toggleStar, getStarredFiles, searchFiles
} = require('../controllers/fileController')

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/') },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueName + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4'
  ]
  allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('File type not allowed'), false)
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } })

router.use(protect)

// Specific routes first
router.get('/trash', getTrashedFiles)
router.get('/starred', getStarredFiles)
router.get('/search', searchFiles)
router.patch('/restore/:id', restoreFile)
router.patch('/star/:id', toggleStar)
router.patch('/move/:id', moveFile)
router.get('/download/:id', downloadFile)
router.post('/upload', upload.single('file'), uploadFile)

// Permanent delete from trash
router.delete('/permanent/:id', permanentDeleteFile)

// General routes
router.get('/', getFiles)
router.patch('/:id', renameFile)
router.delete('/:id', deleteFile)

module.exports = router