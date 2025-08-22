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
const dotenv_1 = __importDefault(require("dotenv"));
// Import routes
const contact_1 = __importDefault(require("./routes/contact"));
const health_1 = __importDefault(require("./routes/health"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// CORS configuration: allow production + optional preview origins
const allowAll = process.env.CORS_ALLOW_ALL === 'true';
const urls = (process.env.FRONTEND_URLS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
if (process.env.FRONTEND_URL) {
    urls.push(process.env.FRONTEND_URL.trim());
}
const whitelist = new Set(urls);
const corsOptions = {
    origin: (origin, callback) => {
        if (allowAll)
            return callback(null, true);
        if (!origin)
            return callback(null, true); // non-browser clients
        if (whitelist.size === 0)
            return callback(null, true); // default permissive if not configured
        if (whitelist.has(origin))
            return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/health', health_1.default);
app.use('/api/contact', contact_1.default);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
exports.default = app;
//# sourceMappingURL=server.js.map