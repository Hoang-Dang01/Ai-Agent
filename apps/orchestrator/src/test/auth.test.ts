import { dbService } from '../services/db.service';
import { signup, login } from './../controllers/auth.controller';
import { authMiddleware } from './../middlewares/auth.middleware';
import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Simple colored console assertions
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';

let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`${GREEN}✔ PASS:${RESET} ${message}`);
  } else {
    console.error(`${RED}✘ FAIL:${RESET} ${message}`);
    failedTests++;
  }
}

function mockResponse() {
  const res: any = {};
  res.statusCode = 200; // default Express
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.body = data;
    return res;
  };
  return res;
}

async function runTests() {
  console.log(`\n==================================================`);
  console.log(`🧪 STARTING AUTOMATED AUTHENTICATION TEST SUITE`);
  console.log(`==================================================\n`);

  try {
    // 1. Setup DB Connection
    await dbService.initialize();
    console.log(`${YELLOW}⚡ Database connection initialized.${RESET}\n`);

    const testEmail = `test_operator_${Date.now()}@antigravity.ai`;
    const testPassword = 'SuperSecret123!';
    let testUserId = '';
    let generatedToken = '';

    // ----------------------------------------------------
    // TEST 1: User Registration (Sign-up)
    // ----------------------------------------------------
    console.log(`${YELLOW}[TEST AREA 1] Registration & Password Encryption${RESET}`);
    
    const signupReq: any = {
      body: {
        email: testEmail,
        password: testPassword,
      },
    };
    const signupRes = mockResponse();

    await signup(signupReq, signupRes);

    assert(signupRes.statusCode === 201, 'Signup returns status code 201 Created');
    assert(signupRes.body.status === 'OK', 'Signup returns status message OK');
    assert(signupRes.body.user && signupRes.body.user.email === testEmail, 'Signup returns correct registered email');
    assert(!signupRes.body.user.password, 'Signup does not leak user password or hash to client response');

    testUserId = signupRes.body.user.id;
    assert(!!testUserId, 'Signup returns a valid user ID');

    // Verify Password Crypting in Database
    const dbUser = await dbService.client.user.findUnique({ where: { email: testEmail } });
    assert(!!dbUser, 'User successfully stored in database');
    if (dbUser) {
      assert(dbUser.password !== testPassword, 'Stored password is encrypted (not plain text)');
      assert(dbUser.password.startsWith('$2a$') || dbUser.password.startsWith('$2b$'), 'Stored password matches standard bcrypt hash pattern ($2a$ / $2b$)');
    }

    // ----------------------------------------------------
    // TEST 2: Conflict & Input Validation
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[TEST AREA 2] Signup Conflict & Validations${RESET}`);
    
    const duplicateRes = mockResponse();
    await signup(signupReq, duplicateRes);
    assert(duplicateRes.statusCode === 409, 'Re-registering same email returns 409 Conflict');
    assert(duplicateRes.body.error === 'Email address is already in use.', 'Re-registering returns clear duplicate error message');

    const invalidPassReq: any = { body: { email: `invalid_${Date.now()}@test.com`, password: '123' } };
    const invalidPassRes = mockResponse();
    await signup(invalidPassReq, invalidPassRes);
    assert(invalidPassRes.statusCode === 400, 'Password under 6 chars is rejected with 400 Bad Request');

    const invalidEmailReq: any = { body: { email: 'notanemail', password: testPassword } };
    const invalidEmailRes = mockResponse();
    await signup(invalidEmailReq, invalidEmailRes);
    assert(invalidEmailRes.statusCode === 400, 'Invalid email format is rejected with 400 Bad Request');

    // ----------------------------------------------------
    // TEST 3: User Authentication (Login)
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[TEST AREA 3] User Authentication & Token Signature${RESET}`);
    
    const loginReq: any = {
      body: {
        email: testEmail,
        password: testPassword,
      },
    };
    const loginRes = mockResponse();

    await login(loginReq, loginRes);

    assert(loginRes.statusCode === 200, 'Login returns status code 200 OK');
    assert(loginRes.body.status === 'OK', 'Login returns status message OK');
    assert(!!loginRes.body.access_token, 'Login successfully issues access token');
    assert(loginRes.body.token_type === 'Bearer', 'Returned token is typed Bearer');

    generatedToken = loginRes.body.access_token;

    // Verify JWT Signature & Claims Alignment (Supabase compatibility)
    try {
      const decoded: any = jwt.verify(generatedToken, env.JWT_SECRET);
      assert(decoded.sub === testUserId, 'JWT Claim "sub" perfectly aligns with registered User ID');
      assert(decoded.email === testEmail, 'JWT Claim "email" matches user email');
      assert(decoded.role === 'authenticated', 'JWT Claim "role" matches "authenticated" for Supabase GoTrue gateway standard');
      assert(decoded.app_metadata?.provider === 'local', 'JWT app_metadata provider is set to "local"');
    } catch (e: any) {
      assert(false, `JWT verification failed: ${e.message}`);
    }

    // Verify Invalid Credentials Rejections
    const wrongPassReq: any = { body: { email: testEmail, password: 'WrongPassword' } };
    const wrongPassRes = mockResponse();
    await login(wrongPassReq, wrongPassRes);
    assert(wrongPassRes.statusCode === 401, 'Incorrect password returns 401 Unauthorized');
    assert(wrongPassRes.body.error === 'Access Denied: Invalid email or password.', 'Incorrect login returns generic secure warning');

    const wrongUserReq: any = { body: { email: 'nonexistent@test.com', password: testPassword } };
    const wrongUserRes = mockResponse();
    await login(wrongUserReq, wrongUserRes);
    assert(wrongUserRes.statusCode === 401, 'Nonexistent email returns 401 Unauthorized');

    // ----------------------------------------------------
    // TEST 4: Middleware Protection (authMiddleware)
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[TEST AREA 4] Route Protection & Middleware Parsing${RESET}`);
    
    // Test Case: Valid token
    const validMidReq: any = {
      headers: {
        authorization: `Bearer ${generatedToken}`,
      },
    };
    const validMidRes = mockResponse();
    let nextCalled: any = false;
    const nextMock = () => { nextCalled = true; };

    await authMiddleware(validMidReq, validMidRes, nextMock);
    assert(nextCalled === true, 'Valid Bearer token allows passage (calls next())');
    assert(validMidReq.user?.id === testUserId, 'Middleware correctly parses and injects user ID claim');
    assert(validMidReq.user?.email === testEmail, 'Middleware correctly parses and injects email claim');

    // Test Case: Missing token
    const missingMidReq: any = { headers: {} };
    const missingMidRes = mockResponse();
    let nextCalledMissing: any = false;
    await authMiddleware(missingMidReq, missingMidRes, () => { nextCalledMissing = true; });
    assert(nextCalledMissing === false, 'Missing authorization header blocks passage');
    assert(missingMidRes.statusCode === 401, 'Missing token yields 401 Unauthorized');

    // Test Case: Invalid/Fake token signature
    const badMidReq: any = { headers: { authorization: 'Bearer thisisafaketokenhere' } };
    const badMidRes = mockResponse();
    let nextCalledBad: any = false;
    await authMiddleware(badMidReq, badMidRes, () => { nextCalledBad = true; });
    assert(nextCalledBad === false, 'Invalid token blocks passage');
    assert(badMidRes.statusCode === 403, 'Invalid token signature yields 403 Forbidden');

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    console.log(`\n${YELLOW}🧹 Initiating database cleanup...${RESET}`);
    await dbService.client.user.delete({ where: { id: testUserId } });
    console.log(`${GREEN}✔ Cleanup finished. Removed test operator accounts.${RESET}`);

    // Disconnect
    await dbService.disconnect();

  } catch (error: any) {
    console.error(`\n${RED}💥 Critical test execution crash: ${error.message}${RESET}`);
    console.error(error);
    failedTests++;
  }

  // ----------------------------------------------------
  // TEST SUITE REPORT
  // ----------------------------------------------------
  console.log(`\n==================================================`);
  console.log(`📊 FINAL TEST REPORT`);
  console.log(`==================================================`);
  if (failedTests === 0) {
    console.log(`${GREEN}★ ALL TESTS PASSED SUCCESSFULLY! (0 failures)${RESET}`);
    process.exit(0);
  } else {
    console.log(`${RED}🚨 TEST SUITE COMPLETED WITH FAILURES (${failedTests} failures)${RESET}`);
    process.exit(1);
  }
}

runTests();
