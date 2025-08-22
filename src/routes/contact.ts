import { Router, Request, Response } from 'express'
import multer from 'multer'
import nodemailer from 'nodemailer'

const router = Router()

interface ContactFormData {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
}

// File upload middleware (memory storage)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024, files: 8 } })

// Helper: create mail transporter from env
function createTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP environment variables are not configured')
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE || '').toLowerCase() === 'true' || Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  })
  return transporter
}

// POST /api/contact - Handle contact form submission
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message }: ContactFormData = req.body

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required' })
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' })
    }

    // Log only (legacy)
    console.log('Contact form submission:', { name, email, phone, subject, message, timestamp: new Date().toISOString() })

    res.json({ success: true, message: 'Thank you for your message! We will get back to you soon.', submitted: true })
  } catch (error) {
    console.error('Contact form error:', error)
    res.status(500).json({ success: false, message: 'An error occurred while processing your request' })
  }
})

// POST /api/contact/pricing-request - Premium pricing request form (emails only, no storage)
router.post('/pricing-request', upload.array('photos'), async (req: Request, res: Response) => {
  try {
    const { name, contactMethod, contact, description, videoLink, lat, lng, address } = req.body as Record<string, string>

    if (!name || !contact || !description) {
      return res.status(400).json({ success: false, message: 'Name, contact and description are required' })
    }

    const to = 'magicdecorofficiel@gmail.com'
    const subject = `Nouvelle demande de devis – ${name}`

    const html = `
      <div style="font-family:Inter,Segoe UI,Arial,sans-serif;font-size:15px;color:#0f172a">
        <h2 style="margin:0 0 8px">Demande de devis</h2>
        <p style="margin:0 0 16px;color:#334155">Envoyée depuis le formulaire premium du site.</p>
        <table style="border-collapse:collapse;width:100%;max-width:680px">
          <tbody>
            <tr><td style="padding:8px 0;width:180px;color:#64748b">Nom</td><td style="padding:8px 0">${escapeHtml(name)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Contact</td><td style="padding:8px 0">${contactMethod === 'email' ? 'Email' : 'WhatsApp'} – ${escapeHtml(contact)}</td></tr>
            ${address ? `<tr><td style="padding:8px 0;color:#64748b">Adresse</td><td style="padding:8px 0">${escapeHtml(address)}</td></tr>` : ''}
            ${(lat && lng) ? `<tr><td style="padding:8px 0;color:#64748b">Coordonnées</td><td style="padding:8px 0">${lat}, ${lng}</td></tr>` : ''}
          </tbody>
        </table>
        <div style="margin:14px 0 6px;color:#64748b">Description</div>
        <pre style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px">${escapeHtml(description)}</pre>
        ${videoLink ? `<div style="margin:14px 0 6px;color:#64748b">Lien</div><a href="${escapeUrl(videoLink)}">${escapeHtml(videoLink)}</a>` : ''}
      </div>
    `

    // Build attachments from uploaded files
    const files = (req as any).files as Express.Multer.File[] | undefined
    const attachments = (files || []).map((f) => ({ filename: f.originalname, content: f.buffer, contentType: f.mimetype }))

    const transporter = createTransport()
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER!,
      to,
      subject,
      html,
      attachments
    })

    res.json({ success: true, message: 'Sent' })
  } catch (error) {
    console.error('pricing-request error:', error)
    res.status(500).json({ success: false, message: 'Failed to send. Check email configuration.' })
  }
})

export default router

// Utils
function escapeHtml(str: string) {
  return str.replace(/[&<>"]+/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c])
}
function escapeUrl(str: string) {
  try { return new URL(str).toString() } catch { return '#' }
}
