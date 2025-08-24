"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const multer_1 = __importDefault(require("multer"));
const app = (0, express_1.default)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024, files: 8 } });
// CORS configuration
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Add CORP header to fix cross-origin resource policy
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});
// Middlewares
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
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
// Pricing request
app.post('/api/contact/pricing-request', upload.array('photos'), async (req, res) => {
    try {
        const { name, contact, description } = req.body || {};
        if (!name || !contact || !description) {
            return res.status(400).json({ success: false, message: 'Name, contact and description are required' });
        }
        // TODO: send email if needed
        return res.json({ success: true, message: 'Sent' });
    }
    catch (e) {
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
exports.default = app;
//# sourceMappingURL=server.js.map