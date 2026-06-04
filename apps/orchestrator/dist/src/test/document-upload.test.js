"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
// Load .env variables before importing other local modules
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const jwt = __importStar(require("jsonwebtoken"));
const env_1 = require("../config/env");
const db_service_1 = require("../services/db.service");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';
let failedTests = 0;
function assert(condition, message) {
    if (condition) {
        console.log(`${GREEN}PASS:${RESET} ${message}`);
    }
    else {
        console.error(`${RED}FAIL:${RESET} ${message}`);
        failedTests++;
    }
}
// Replicate the gateway route mapping in isolation
function createTestServer(port) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    const uploadDir = path.join(__dirname, 'temp_test');
    if (!fs_1.default.existsSync(uploadDir)) {
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
    }
    const uploadLimiter = (0, express_rate_limit_1.default)({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 5,
        message: { error: 'Too many uploads. Limit is 5 files per minute.' },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => process.env.NODE_ENV === 'test' // skips during tests unless we change env
    });
    const upload = (0, multer_1.default)({
        dest: uploadDir,
        limits: { fileSize: 1024 * 1024 } // Set 1MB limit for testing instead of 50MB to test limits easily
    });
    app.post('/api/document-agent/upload', auth_middleware_1.authMiddleware, uploadLimiter, (req, res, next) => {
        upload.single('file')(req, res, (err) => {
            if (err) {
                if (err instanceof multer_1.default.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(413).json({ error: 'Payload Too Large: File size exceeds the 1MB limit.' });
                }
                return res.status(400).json({ error: err.message || 'File upload error.' });
            }
            next();
        });
    }, async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }
        try {
            const formData = new FormData();
            const fileBuffer = await fs_1.default.promises.readFile(req.file.path);
            const fileBlob = new Blob([fileBuffer]);
            formData.append('file', fileBlob, req.file.originalname);
            if (req.body.commitMessage) {
                formData.append('commit_message', req.body.commitMessage);
            }
            // Forward to Python AI Engine /api/document-agent/upload/
            const response = await fetch(`${env_1.env.AI_ENGINE_URL}/api/document-agent/upload/`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                let errorMessage = 'Failed to parse document.';
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await response.json();
                        errorMessage = errorData.detail || errorData.error || errorMessage;
                    }
                    else {
                        errorMessage = await response.text() || errorMessage;
                    }
                }
                catch (parseErr) {
                    // Safe fallback
                }
                return res.status(response.status).json({ error: errorMessage });
            }
            const data = await response.json();
            res.status(201).json(data);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to process document upload.' });
        }
        finally {
            fs_1.default.promises.unlink(req.file.path).catch(() => { });
        }
    });
    return app.listen(port);
}
async function runTests() {
    console.log(`\n==================================================`);
    console.log(`STARTING AUTOMATED ORCHESTRATOR UPLOAD GATEWAY TESTS`);
    console.log(`==================================================\n`);
    const PORT = 3012;
    const originalFetch = global.fetch;
    const originalNodeEnv = process.env.NODE_ENV;
    let server = null;
    try {
        // Initialize DB Connection
        await db_service_1.dbService.initialize();
        // Create test user and token
        const testUserId = `test_upload_user_${Date.now()}`;
        const testUserEmail = `user_${Date.now()}@antigravity.ai`;
        await db_service_1.dbService.client.user.create({
            data: {
                id: testUserId,
                email: testUserEmail,
                password: 'password123'
            }
        });
        const token = jwt.sign({ sub: testUserId, email: testUserEmail, role: 'authenticated' }, env_1.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
        // Boot test gateway server
        server = createTestServer(PORT);
        console.log(`${YELLOW}Test server booted on port ${PORT}.${RESET}\n`);
        // ----------------------------------------------------
        // TEST 1: Success Path upload
        // ----------------------------------------------------
        console.log(`${YELLOW}[TEST AREA 1] Success Path File Upload & Stream Forwarding${RESET}`);
        global.fetch = async (url, options) => {
            if (typeof url === 'string' && url.includes('/api/document-agent/upload/')) {
                return {
                    ok: true,
                    status: 201,
                    json: async () => ({
                        id: 'doc-uuid-12345',
                        title: 'test.txt',
                        status: 'PENDING',
                        created_at: new Date(),
                        updated_at: new Date(),
                        versions: []
                    })
                };
            }
            return originalFetch(url, options);
        };
        const formData1 = new FormData();
        formData1.append('file', new Blob([Buffer.from('Hello standard RAG text content.')]), 'test.txt');
        const res1 = await fetch(`http://localhost:${PORT}/api/document-agent/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData1
        });
        assert(res1.status === 201, `Status code is 201 Created (Got: ${res1.status})`);
        const data1 = await res1.json();
        assert(data1.id === 'doc-uuid-12345' && data1.title === 'test.txt', 'Document payload returned correctly from Python backend');
        // ----------------------------------------------------
        // TEST 2: File size limit (>1MB limit for testing)
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 2] File Size Limit Rejection${RESET}`);
        const largeBuffer = Buffer.alloc(1024 * 1024 + 100); // 1.0001 MB
        const formData2 = new FormData();
        formData2.append('file', new Blob([largeBuffer]), 'large.txt');
        const res2 = await fetch(`http://localhost:${PORT}/api/document-agent/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData2
        });
        // Multer size limit error should be caught and returned as 413 Payload Too Large
        assert(res2.status === 413, `Large file upload rejected with code 413 (Got: ${res2.status})`);
        // ----------------------------------------------------
        // TEST 3: Rate Limiting Enforcement
        // ----------------------------------------------------
        console.log(`\n${YELLOW}[TEST AREA 3] Upload Rate Limiter Enforcement${RESET}`);
        // Temporarily flip process.env.NODE_ENV = 'production' to trigger rate-limiter check
        process.env.NODE_ENV = 'production';
        try {
            let limitHit = false;
            for (let i = 0; i < 7; i++) {
                const fd = new FormData();
                fd.append('file', new Blob([Buffer.from(`Spam file ${i}`)]), `spam_${i}.txt`);
                const res = await fetch(`http://localhost:${PORT}/api/document-agent/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: fd
                });
                if (res.status === 429) {
                    limitHit = true;
                    assert(true, `Rate limiter successfully triggered at request #${i + 1} with 429`);
                    break;
                }
            }
            assert(limitHit, 'Rate limiter successfully blocked requests after 5 attempts');
        }
        finally {
            process.env.NODE_ENV = originalNodeEnv;
        }
        // ----------------------------------------------------
        // CLEANUP
        // ----------------------------------------------------
        console.log(`\n${YELLOW}🧹 Initiating test database cleanup...${RESET}`);
        await db_service_1.dbService.client.user.delete({ where: { id: testUserId } });
        console.log(`${GREEN}Cleanup finished. Test user deleted.${RESET}`);
    }
    catch (error) {
        console.error(`\n${RED}Critical test execution crash: ${error.message}${RESET}`);
        failedTests++;
    }
    finally {
        global.fetch = originalFetch;
        process.env.NODE_ENV = originalNodeEnv;
        if (server) {
            server.close();
            console.log('Test server closed.');
        }
        // Clean temp folder
        const uploadDir = path.join(__dirname, 'temp_test');
        if (fs_1.default.existsSync(uploadDir)) {
            fs_1.default.rmSync(uploadDir, { recursive: true, force: true });
        }
        await db_service_1.dbService.disconnect();
    }
    // ----------------------------------------------------
    // TEST SUITE REPORT
    // ----------------------------------------------------
    console.log(`\n==================================================`);
    console.log(`FINAL TEST REPORT`);
    console.log(`==================================================`);
    if (failedTests === 0) {
        console.log(`${GREEN}★ ALL GATEWAY TESTS PASSED SUCCESSFULLY! (0 failures)${RESET}`);
        process.exit(0);
    }
    else {
        console.log(`${RED}🚨 TEST SUITE COMPLETED WITH FAILURES (${failedTests} failures)${RESET}`);
        process.exit(1);
    }
}
runTests();
