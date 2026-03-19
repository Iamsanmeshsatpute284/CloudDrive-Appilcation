const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  createShare, getShares, deleteShare,
  createLinkShare, deleteLinkShare, getLinks
} = require('../controllers/shareController')

router.use(protect)

// Per-user shares
router.post('/', createShare)
router.get('/:resourceType/:resourceId', getShares)
router.delete('/:id', deleteShare)

// Public links
router.post('/links', createLinkShare)
router.get('/links/:resourceType/:resourceId', getLinks)
router.delete('/links/:id', deleteLinkShare)

module.exports = router