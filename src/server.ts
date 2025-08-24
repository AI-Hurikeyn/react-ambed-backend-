import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import multer from 'multer';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024, files: 8 } });

// CORS: allow all origins (no credentials). Handles preflight.
const corsOptions = {
  origin: (origin: any, cb: any) => cb(null, true),
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middlewares
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health
app.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));

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
