import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import multer from 'multer';
import nodemailer from 'nodemailer';

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
app.use(helmet({
  crossOriginResourcePolicy: false, // Disable CORP restrictions
}));
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
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(204).end();
});

// Pricing request
app.post('/api/contact/pricing-request', upload.array('photos'), async (req, res) => {
  try {
    const { name, contact, description, contactMethod, videoLink, lat, lng, address } = req.body || {};
    if (!name || !contact || !description) {
      return res.status(400).json({ success: false, message: 'Name, contact and description are required' });
    }

    // Email configuration
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'magicdecorofficiel@gmail.com',
        pass: 'dmwkwqzcryqccgms'
      }
    });

    const to = 'magicdecorofficiel@gmail.com';
    const subject = `Nouvelle demande de devis – ${name}`;

    const html = `
      <div style="font-family:Inter,Segoe UI,Arial,sans-serif;font-size:15px;color:#0f172a">
        <h2 style="margin:0 0 8px">Demande de devis</h2>
        <p style="margin:0 0 16px;color:#334155">Envoyée depuis le formulaire premium du site.</p>
        <table style="border-collapse:collapse;width:100%;max-width:680px">
          <tbody>
            <tr><td style="padding:8px 0;width:180px;color:#64748b">Nom</td><td style="padding:8px 0">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Contact (${contactMethod || 'Non spécifié'})</td><td style="padding:8px 0">${contact}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Description</td><td style="padding:8px 0">${description}</td></tr>
            ${address ? `<tr><td style="padding:8px 0;color:#64748b">Adresse</td><td style="padding:8px 0">${address}</td></tr>` : ''}
            ${videoLink ? `<tr><td style="padding:8px 0;color:#64748b">Lien vidéo</td><td style="padding:8px 0"><a href="${videoLink}">${videoLink}</a></td></tr>` : ''}
          </tbody>
        </table>
      </div>
    `;

    // Build attachments from uploaded files
    const files = req.files as Express.Multer.File[] | undefined;
    const attachments = (files || []).map((f) => ({ 
      filename: f.originalname, 
      content: f.buffer, 
      contentType: f.mimetype 
    }));

    await transporter.sendMail({
      from: 'magicdecorofficiel@gmail.com',
      to,
      subject,
      html,
      attachments
    });

    return res.json({ success: true, message: 'Demande envoyée avec succès!' });
  } catch (e) {
    console.error('Email error:', e);
    return res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi de l\'email' });
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
