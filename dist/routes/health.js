"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Health check endpoint
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Ambed Backend API is running!',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
exports.default = router;
//# sourceMappingURL=health.js.map