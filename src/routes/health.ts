import { Router } from 'express'

const router = Router()

// Health check endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ambed Backend API is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

export default router
