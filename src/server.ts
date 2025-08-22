import express from 'express'
import cors, { CorsOptions } from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'

// Import routes
import contactRoutes from './routes/contact'
import healthRoutes from './routes/health'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// CORS configuration: allow production + optional preview origins
const allowAll = process.env.CORS_ALLOW_ALL === 'true'
const urls = (process.env.FRONTEND_URLS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

if (process.env.FRONTEND_URL) {
  urls.push(process.env.FRONTEND_URL.trim())
}

const whitelist = new Set(urls)
console.log('[CORS] allowAll=%s, whitelist=%o', allowAll, Array.from(whitelist))

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (allowAll) return callback(null, true)
    if (!origin) return callback(null, true) // non-browser clients
    if (whitelist.size === 0) return callback(null, true) // default permissive if not configured
    if (whitelist.has(origin)) return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

// Middleware
app.use(helmet())
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(compression())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/health', healthRoutes)
app.use('/api/contact', contactRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

export default app
