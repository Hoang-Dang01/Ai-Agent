"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGoalPlan = createGoalPlan;
exports.approveGoalPlan = approveGoalPlan;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const db_service_1 = require("../services/db.service");
const logger_1 = require("../config/logger");
const taskQueue_1 = require("../queue/taskQueue");
/**
 * Helper to ensure a default local user exists for offline/local testing convenience.
 */
async function getOrCreatePlaceholderUserId() {
    const existingUser = await db_service_1.dbService.client.user.findFirst();
    if (existingUser) {
        return existingUser.id;
    }
    logger_1.logger.info('[Goal Controller] Creating failsafe placeholder user in database...');
    const defaultUser = await db_service_1.dbService.client.user.create({
        data: {
            email: 'operator@antigravity.ai',
            password: 'offline_failsafe_password_hash_unusable',
        },
    });
    return defaultUser.id;
}
/**
 * 1. Creates a structured task DAG from a user goal, registers UserGoal and AITasks
 * in the database under PENDING_APPROVAL state, and returns the graph with database UUIDs.
 */
async function createGoalPlan(req, res) {
    const { goal } = req.body;
    if (!goal || !goal.trim()) {
        res.status(400).json({ error: 'Goal statement cannot be empty' });
        return;
    }
    try {
        const backendUrl = process.env.BACKEND_AI_URL || 'http://localhost:8000';
        logger_1.logger.info(`[Goal Controller] Querying Python Cognitive Planner for goal: "${goal}"`);
        // Call Python Planner API
        const response = await axios_1.default.post(`${backendUrl}/api/plan/generate`, { goal });
        const planData = response.data; // Expected format: { goal: string, tasks: Array<...> }
        // Pre-create or fetch active userId
        const userId = req.user?.id || await getOrCreatePlaceholderUserId();
        // Create Goal in database with PENDING_APPROVAL status
        const userGoal = await db_service_1.dbService.client.userGoal.create({
            data: {
                userId,
                goal,
                status: 'PENDING_APPROVAL',
            },
        });
        logger_1.logger.info(`[Goal Controller] Created UserGoal ${userGoal.id} in PENDING_APPROVAL status.`);
        // Map Python planner string IDs (e.g. "task_0") to newly generated native UUIDs
        const idMap = {};
        for (const task of planData.tasks) {
            idMap[task.id] = (0, crypto_1.randomUUID)();
        }
        // Insert all task nodes in PENDING_APPROVAL status
        for (const task of planData.tasks) {
            const dbId = idMap[task.id];
            await db_service_1.dbService.client.aITask.create({
                data: {
                    id: dbId,
                    goalId: userGoal.id,
                    title: task.title,
                    status: 'PENDING_APPROVAL',
                    payload: {
                        toolName: task.toolName,
                        arguments: task.args,
                    },
                },
            });
        }
        // Connect task dependencies using the mapped UUIDs
        for (const task of planData.tasks) {
            if (task.dependencies && task.dependencies.length > 0) {
                const dbId = idMap[task.id];
                const connectIds = task.dependencies
                    .map((depId) => ({ id: idMap[depId] }))
                    .filter((c) => c.id !== undefined);
                if (connectIds.length > 0) {
                    await db_service_1.dbService.client.aITask.update({
                        where: { id: dbId },
                        data: {
                            dependencies: {
                                connect: connectIds,
                            },
                        },
                    });
                }
            }
        }
        // Fetch the fully populated Goal and Tasks graph to return to the client
        const populatedGoal = await db_service_1.dbService.client.userGoal.findUnique({
            where: { id: userGoal.id },
            include: {
                tasks: {
                    include: {
                        dependencies: true,
                    },
                },
            },
        });
        res.status(201).json({
            status: 'OK',
            goal: populatedGoal,
        });
    }
    catch (error) {
        logger_1.logger.error(error, '[Goal Controller] Planning request failed:');
        res.status(500).json({ error: error.message || 'Failed to generate goal plan.' });
    }
}
/**
 * 2. Approves the UserGoal, shifts its status to ACTIVE, tasks status to PENDING,
 * and enqueues the root triggers into BullMQ to start execution.
 */
async function approveGoalPlan(req, res) {
    const goalId = req.params.goalId;
    try {
        logger_1.logger.info(`[Goal Controller] Approving Goal Plan for ID: ${goalId}...`);
        const userGoal = await db_service_1.dbService.client.userGoal.findUnique({
            where: { id: goalId },
            include: {
                tasks: {
                    include: {
                        dependencies: true,
                    },
                },
            },
        });
        if (!userGoal) {
            res.status(404).json({ error: 'Goal not found' });
            return;
        }
        if (userGoal.status !== 'PENDING_APPROVAL') {
            res.status(400).json({ error: `Goal cannot be approved in its current status: ${userGoal.status}` });
            return;
        }
        // 1. Shift UserGoal status to ACTIVE
        await db_service_1.dbService.client.userGoal.update({
            where: { id: goalId },
            data: { status: 'ACTIVE' },
        });
        // 2. Shift all associated PENDING_APPROVAL tasks to PENDING
        await db_service_1.dbService.client.aITask.updateMany({
            where: { goalId, status: 'PENDING_APPROVAL' },
            data: { status: 'PENDING' },
        });
        // 3. Find root tasks (those with zero parent dependencies) to trigger queue execution
        const allTasks = (await db_service_1.dbService.client.aITask.findMany({
            where: { goalId },
            include: {
                dependencies: true,
            },
        }));
        const rootTasks = allTasks.filter(t => t.dependencies.length === 0);
        const triggerTask = rootTasks[0] || allTasks[0];
        if (!triggerTask) {
            res.status(400).json({ error: 'No tasks found in the approved workflow plan' });
            return;
        }
        logger_1.logger.info(`[Goal Controller] Plan approved. Enqueueing trigger task "${triggerTask.title}" (ID: ${triggerTask.id}) into BullMQ...`);
        // 4. Add the initial trigger job to BullMQ queue
        await taskQueue_1.aiTasksQueue.add('execute-task', {
            taskId: triggerTask.id,
            goalId: userGoal.id,
            title: triggerTask.title,
            payload: triggerTask.payload,
        }, {
            jobId: triggerTask.id, // Align BullMQ Job ID with Database Task ID
        });
        res.json({
            status: 'OK',
            message: 'Plan approved. Workflow started successfully.',
            triggerTaskId: triggerTask.id,
        });
    }
    catch (error) {
        logger_1.logger.error(error, '[Goal Controller] Plan approval failed:');
        res.status(500).json({ error: error.message || 'Failed to approve goal plan.' });
    }
}
