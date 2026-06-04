import * as dotenv from 'dotenv';
import * as path from 'path';
// Load .env variables before importing other local modules
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

import express from 'express';
import * as http from 'http';
import multer from 'multer';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { dbService } from '../services/db.service';
import { authMiddleware } from '../middlewares/auth.middleware';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';

let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`${GREEN}PASS:${RESET} ${message}`);
  } else {
    console.error(`${RED}FAIL:${RESET} ${message}`);
    failedTests++;
  }
}

// Replicate the gateway route mapping in isolation
function createTestServer(port: number): http.Server {
  const app = express();
  app.use(express.json());

  const uploadDir = path.join(__dirname, 'temp_test');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const uploadLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5,
    message: { error: 'Too many uploads. Limit is 5 files per minute.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'test' // skips during tests unless we change env
  });

  const upload = multer({ 
    dest: uploadDir,
    limits: { fileSize: 1024 * 1024 } // Set 1MB limit for testing instead of 50MB to test limits easily
  });

  app.post(
    '/api/document-agent/upload', 
    authMiddleware as any, 
    uploadLimiter,
    (req: any, res: any, next: any) => {
      upload.single('file')(req, res, (err: any) => {
        if (err) {
          if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'Payload Too Large: File size exceeds the 1MB limit.' });
          }
          return res.status(400).json({ error: err.message || 'File upload error.' });
        }
        next();
      });
    },
    async (req: any, res: any) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      try {
        const formData = new FormData();
        const fileBuffer = await fs.promises.readFile(req.file.path);
        const fileBlob = new Blob([fileBuffer]);
        formData.append('file', fileBlob, req.file.originalname);
        if (req.body.commitMessage) {
          formData.append('commit_message', req.body.commitMessage);
        }

        // Forward to Python AI Engine /api/document-agent/upload/
        const response = await fetch(`${env.AI_ENGINE_URL}/api/document-agent/upload/`, {
          method: 'POST',
          body: formData as any,
        });

        if (!response.ok) {
          let errorMessage = 'Failed to parse document.';
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json() as any;
              errorMessage = errorData.detail || errorData.error || errorMessage;
            } else {
              errorMessage = await response.text() || errorMessage;
            }
          } catch (parseErr) {
            // Safe fallback
          }
          return res.status(response.status).json({ error: errorMessage });
        }

        const data = await response.json();
        res.status(201).json(data);
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to process document upload.' });
      } finally {
        fs.promises.unlink(req.file.path).catch(() => {});
      }
    }
  );

  return app.listen(port);
}

async function runTests() {
  console.log(`\n==================================================`);
  console.log(`STARTING AUTOMATED ORCHESTRATOR UPLOAD GATEWAY TESTS`);
  console.log(`==================================================\n`);

  const PORT = 3012;
  const originalFetch = global.fetch;
  const originalNodeEnv = process.env.NODE_ENV;
  let server: http.Server | null = null;

  try {
    // Initialize DB Connection
    await dbService.initialize();
    
    // Create test user and token
    const testUserId = `test_upload_user_${Date.now()}`;
    const testUserEmail = `user_${Date.now()}@antigravity.ai`;
    
    await dbService.client.user.create({
      data: {
        id: testUserId,
        email: testUserEmail,
        password: 'password123'
      }
    });

    const token = jwt.sign(
      { sub: testUserId, email: testUserEmail, role: 'authenticated' }, 
      env.JWT_SECRET, 
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    // Boot test gateway server
    server = createTestServer(PORT);
    console.log(`${YELLOW}Test server booted on port ${PORT}.${RESET}\n`);

    // ----------------------------------------------------
    // TEST 1: Success Path upload
    // ----------------------------------------------------
    console.log(`${YELLOW}[TEST AREA 1] Success Path File Upload & Stream Forwarding${RESET}`);
    
    global.fetch = async (url: any, options: any) => {
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
        } as any;
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
    const data1 = await res1.json() as any;
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
    (process.env as any).NODE_ENV = 'production';

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
          assert(true, `Rate limiter successfully triggered at request #${i+1} with 429`);
          break;
        }
      }
      assert(limitHit, 'Rate limiter successfully blocked requests after 5 attempts');
    } finally {
      (process.env as any).NODE_ENV = originalNodeEnv;
    }

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    console.log(`\n${YELLOW}🧹 Initiating test database cleanup...${RESET}`);
    await dbService.client.user.delete({ where: { id: testUserId } });
    console.log(`${GREEN}Cleanup finished. Test user deleted.${RESET}`);

  } catch (error: any) {
    console.error(`\n${RED}Critical test execution crash: ${error.message}${RESET}`);
    failedTests++;
  } finally {
    global.fetch = originalFetch;
    (process.env as any).NODE_ENV = originalNodeEnv;
    
    if (server) {
      server.close();
      console.log('Test server closed.');
    }
    
    // Clean temp folder
    const uploadDir = path.join(__dirname, 'temp_test');
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }
    
    await dbService.disconnect();
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
  } else {
    console.log(`${RED}🚨 TEST SUITE COMPLETED WITH FAILURES (${failedTests} failures)${RESET}`);
    process.exit(1);
  }
}

runTests();
