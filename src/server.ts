import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import multer from 'multer';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024, files: 8 } });

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add CORP header to fix cross-origin resource policy
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Middlewares
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health
app.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));

// Root route
app.get('/', (_req, res) => {
  res.json({ 
    message: 'Magic Decor Backend API is running!', 
    status: 'online',
    timestamp: new Date().toISOString() 
  });
});

// Favicon route
app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

// Pricing request
app.post('/api/contact/pricing-request', upload.array('photos'), async (req, res) => {
  try {
    const { name, contact, description } = req.body || {};
    if (!name || !contact || !description) {
      return res.status(400).json({ success: false, message: 'Name, contact and description are required' });
    }
    // TODO: send email if needed
    return res.json({ success: true, message: 'Sent' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed' });
  }
});

// 404 handler
app.use('*', (_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Local dev only
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server http://localhost:${PORT}`));
}

export default app
