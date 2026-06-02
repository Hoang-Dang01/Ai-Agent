"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.worldStateService = void 0;
const db_service_1 = require("./db.service");
const logger_1 = require("../config/logger");
class WorldStateService {
    /**
     * Đồng bộ hóa và ghi nhận một Frame trạng thái thế giới (screenshot + XML UI Tree) vào cơ sở dữ liệu.
     */
    async saveWorldStateFrame(data) {
        try {
            logger_1.logger.info({ taskId: data.taskId, toolExecutionId: data.toolExecutionId }, '[WorldState Service] Đang lưu trữ Frame trạng thái môi trường mới...');
            const frame = await db_service_1.dbService.client.worldStateFrame.create({
                data: {
                    taskId: data.taskId || null,
                    toolExecutionId: data.toolExecutionId || null,
                    screenshotUrl: data.screenshotUrl || null,
                    uiTreeXml: data.uiTreeXml || null,
                },
            });
            logger_1.logger.info({ frameId: frame.id }, '[WorldState Service] Đã lưu Frame thành công.');
            return frame;
        }
        catch (error) {
            logger_1.logger.error(error, '[WorldState Service] Thất bại khi ghi nhận Frame trạng thái thế giới:');
            throw error;
        }
    }
    /**
     * Truy xuất toàn bộ lịch sử biến chuyển trạng thái thế giới của một Task (để vẽ timeline trên Dashboard).
     */
    async getWorldStateHistory(taskId) {
        try {
            logger_1.logger.info({ taskId }, '[WorldState Service] Truy vấn lịch sử trạng thái thế giới cho Task...');
            const history = await db_service_1.dbService.client.worldStateFrame.findMany({
                where: { taskId },
                orderBy: { createdAt: 'asc' },
            });
            return history;
        }
        catch (error) {
            logger_1.logger.error(error, `[WorldState Service] Thất bại khi truy xuất lịch sử cho Task ${taskId}:`);
            throw error;
        }
    }
}
exports.worldStateService = new WorldStateService();
