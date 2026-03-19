const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')
const cron = require('node-cron')
const connectDB = require('./config/db')

const authRoutes = require('./routes/authRoutes')
const folderRoutes = require('./routes/folderRoutes')
const fileRoutes = require('./routes/fileRoutes')
const shareRoutes = require('./routes/shareRoutes')
const activityRoutes = require('./routes/activityRoutes')

const File = require('./models/File')
const Folder = require('./models/Folder')
const fs = require('fs')

dotenv.config()
connectDB()

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/folders', folderRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/shares', shareRoutes)
app.use('/api/activities', activityRoutes)

const { accessLinkShare } = require('./controllers/shareController')
app.post('/api/shared/:token', accessLinkShare)
app.get('/api/shared/:token', accessLinkShare)

app.get('/', (req, res) => {
  res.json({ message: 'Cloud Drive API is running!' })
})

// ─────────────────────────────────────────
// 🗑️ AUTO PURGE CRON — runs every day at midnight
// Permanently deletes files AND folders in trash for 30+ days
// ─────────────────────────────────────────
cron.schedule('0 0 * * *', async () => {
  console.log('Running trash cleanup...')
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Purge expired files
    const expiredFiles = await File.find({
      isDeleted: true,
      deletedAt: { $lt: thirtyDaysAgo }
    })
    for (const file of expiredFiles) {
      const filePath = path.join(__dirname, 'uploads', file.storageKey)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      await File.findByIdAndDelete(file._id)
    }

    // Purge expired folders + files inside them
    const expiredFolders = await Folder.find({
      isDeleted: true,
      deletedAt: { $lt: thirtyDaysAgo }
    })
    for (const folder of expiredFolders) {
      // Delete files inside the folder
      const folderFiles = await File.find({ folder: folder._id })
      for (const file of folderFiles) {
        const filePath = path.join(__dirname, 'uploads', file.storageKey)
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        await File.findByIdAndDelete(file._id)
      }
      await Folder.findByIdAndDelete(folder._id)
    }

    console.log(`Purged ${expiredFiles.length} files and ${expiredFolders.length} folders from trash`)
  } catch (error) {
    console.error('Trash cleanup error:', error.message)
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})