import { spawn } from 'child_process';

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

// Global activeProcesses stash
(global as any).activeProcesses = (global as any).activeProcesses || new Map();

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock HITL emitter logic in server.ts
function simulateSocketHitlResponse(goalId: string, approved: boolean) {
  const active = (global as any).activeProcesses?.get(goalId);
  if (active && active.child) {
    if (active.clearHitlTimeout) {
      active.clearHitlTimeout();
    }
    const answer = approved ? 'y\n' : 'n\n';
    try {
      if (active.child.stdin && active.child.stdin.writable) {
        active.child.stdin.write(answer);
        return { success: true, written: true };
      } else {
        return { success: true, written: false, reason: 'NOT_WRITABLE' };
      }
    } catch (err: any) {
      // Should handle EPIPE without throwing
      return { success: false, error: err.message };
    }
  }
  return { success: false, reason: 'NO_PROCESS' };
}

// Simulated Graceful Shutdown child process cleanup logic
function simulateShutdownCleanup() {
  const activeProcs = (global as any).activeProcesses;
  let killCount = 0;
  if (activeProcs && activeProcs.size > 0) {
    for (const [goalId, active] of activeProcs.entries()) {
      try {
        if (active.clearHitlTimeout) {
          active.clearHitlTimeout();
        }
        if (active.child) {
          active.child.kill('SIGKILL');
          killCount++;
        }
      } catch (killErr: any) {
        // ignore
      }
    }
    activeProcs.clear();
  }
  return killCount;
}

async function runHardeningTests() {
  console.log(`\n==================================================`);
  console.log(`🧪 STARTING AUTOMATED HITL & PROCESS HARDENING TEST SUITE`);
  console.log(`==================================================\n`);

  try {
    // ----------------------------------------------------
    // TEST 1: EPIPE Safety on Stdin Write to Exited Process
    // ----------------------------------------------------
    console.log(`${YELLOW}[TEST AREA 1] EPIPE Write Crash Protection on Exited Child Process${RESET}`);

    // Spawn a quick short-lived process
    const childShort = spawn('node', ['-e', 'process.stdin.resume(); setTimeout(() => process.exit(0), 50);']);
    
    let stdinErrTriggered: boolean = false;
    childShort.stdin.on('error', (err: any) => {
      stdinErrTriggered = true;
    });

    (global as any).activeProcesses.set('goal_test_1', { child: childShort });

    // Wait until process exits
    await new Promise<void>((resolve) => {
      childShort.on('close', () => resolve());
    });

    // Process is exited now. childShort.stdin is no longer writable.
    // Try to trigger HITL approval write to see if it catches error/does not crash
    const res1 = simulateSocketHitlResponse('goal_test_1', true);
    
    assert(res1.success === true, 'Late HITL write did not throw a crash exception.');
    assert(res1.written === false, 'Late HITL write recognized stdin was not writable.');
    assert(res1.reason === 'NOT_WRITABLE', 'Late HITL write reason is NOT_WRITABLE.');

    (global as any).activeProcesses.delete('goal_test_1');

    // ----------------------------------------------------
    // TEST 2: Active Processes Terminated Cleanly on Shutdown (No leaks)
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[TEST AREA 2] Graceful Shutdown Process Cleanup${RESET}`);

    // Spawn a long-lived process representing C# runner
    const childLong = spawn('node', ['-e', 'setInterval(() => {}, 1000);']);
    
    let isKilled: boolean = false;
    childLong.on('close', (code, signal) => {
      if (signal === 'SIGKILL') {
        isKilled = true;
      }
    });

    (global as any).activeProcesses.set('goal_test_2', { child: childLong });

    // Simulate Shutdown cleanup
    const kills = simulateShutdownCleanup();
    assert(kills === 1, `Cleaned up exactly 1 active running process on shutdown.`);
    
    // Wait slightly to let close event fire
    await delay(100);
    assert(isKilled as boolean, 'Spawned C# process was successfully terminated with SIGKILL.');

    // Verify map is cleared
    assert((global as any).activeProcesses.size === 0, 'activeProcesses global map is cleared successfully.');

  } catch (error: any) {
    console.error(`\n${RED}💥 Critical test execution crash: ${error.message}${RESET}`);
    failedTests++;
  }

  // ----------------------------------------------------
  // TEST SUITE REPORT
  // ----------------------------------------------------
  console.log(`\n==================================================`);
  console.log(`📊 FINAL HITL HARDENING TEST REPORT`);
  console.log(`==================================================`);
  if (failedTests === 0) {
    console.log(`${GREEN}★ ALL HARDENING TESTS PASSED SUCCESSFULLY! (0 failures)${RESET}`);
    process.exit(0);
  } else {
    console.log(`${RED}🚨 HARDENING TESTS FAILED WITH ${failedTests} FAILURE(S)${RESET}`);
    process.exit(1);
  }
}

runHardeningTests();
