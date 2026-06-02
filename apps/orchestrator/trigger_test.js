const { dbService } = require('./dist/src/services/db.service');
const { enqueueTask } = require('./dist/src/queue/taskQueue');
const { logger } = require('./dist/src/config/logger');

async function run() {
  try {
    logger.info('==================================================');
    logger.info('🚀 TRIGGERING PHYSICAL E2E INTEGRATION TEST');
    logger.info('==================================================');

    // 1. Initialize Prisma Database Connection
    await dbService.initialize();

    // 2. Ensure a test User exists
    let user = await dbService.client.user.findFirst();
    if (!user) {
      logger.info('Creating test user...');
      user = await dbService.client.user.create({
        data: {
          email: 'test@turinghub.io',
          password: 'password123',
        },
      });
    }

    // 3. Create a UserGoal for the test run
    logger.info('Creating User Goal: "Automate Notepad writing Vibe-Agent 2026"...');
    const goal = await dbService.client.userGoal.create({
      data: {
        userId: user.id,
        goal: 'Mở Notepad và gõ chữ Vibe-Agent 2026',
        status: 'ACTIVE',
      },
    });

    logger.info(`Goal created successfully with ID: ${goal.id}`);

    // 4. Enqueue the C# DAG Workflow tasks using taskQueue
    logger.info('Enqueueing Task 1: Open Notepad...');
    const task1 = await enqueueTask(
      goal.id,
      'Mở ứng dụng Notepad',
      {
        toolName: 'OpenApplicationTool',
        arguments: { exePath: 'notepad.exe' },
      }
    );

    logger.info('Enqueueing Task 2: Type Text...');
    const task2 = await enqueueTask(
      goal.id,
      'Gõ chữ vào Notepad',
      {
        toolName: 'TypeTextTool',
        arguments: { text: 'Vibe-Agent 2026 - Tự hành Cục bộ 100%.' },
      },
      [task1.id] // Depends on Task 1
    );

    logger.info('Enqueueing Task 3: Read Verify...');
    await enqueueTask(
      goal.id,
      'Đọc xác minh văn bản',
      {
        toolName: 'ReadWindowTool',
        arguments: {},
      },
      [task2.id] // Depends on Task 2
    );

    logger.info('==================================================');
    logger.info('✅ SUCCESS: WORKFLOW ENQUEUED IN BULLMQ!');
    logger.info('Watch your Windows screen and Turing Hub dashboard live stream!');
    logger.info('==================================================');

  } catch (error) {
    logger.error(error, 'Test trigger failed:');
  } finally {
    await dbService.disconnect();
  }
}

run();
