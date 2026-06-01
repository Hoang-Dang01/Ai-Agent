import { dbService } from './db.service';
import { logger } from '../config/logger';

class WorldStateService {
  /**
   * Đồng bộ hóa và ghi nhận một Frame trạng thái thế giới (screenshot + XML UI Tree) vào cơ sở dữ liệu.
   */
  public async saveWorldStateFrame(data: {
    taskId?: string;
    toolExecutionId?: string;
    screenshotUrl?: string;
    uiTreeXml?: string;
  }) {
    try {
      logger.info(
        { taskId: data.taskId, toolExecutionId: data.toolExecutionId },
        '[WorldState Service] Đang lưu trữ Frame trạng thái môi trường mới...'
      );

      const frame = await dbService.client.worldStateFrame.create({
        data: {
          taskId: data.taskId || null,
          toolExecutionId: data.toolExecutionId || null,
          screenshotUrl: data.screenshotUrl || null,
          uiTreeXml: data.uiTreeXml || null,
        },
      });

      logger.info({ frameId: frame.id }, '[WorldState Service] Đã lưu Frame thành công.');
      return frame;
    } catch (error) {
      logger.error(error, '[WorldState Service] Thất bại khi ghi nhận Frame trạng thái thế giới:');
      throw error;
    }
  }

  /**
   * Truy xuất toàn bộ lịch sử biến chuyển trạng thái thế giới của một Task (để vẽ timeline trên Dashboard).
   */
  public async getWorldStateHistory(taskId: string) {
    try {
      logger.info({ taskId }, '[WorldState Service] Truy vấn lịch sử trạng thái thế giới cho Task...');
      const history = await dbService.client.worldStateFrame.findMany({
        where: { taskId },
        orderBy: { createdAt: 'asc' },
      });
      return history;
    } catch (error) {
      logger.error(error, `[WorldState Service] Thất bại khi truy xuất lịch sử cho Task ${taskId}:`);
      throw error;
    }
  }
}

export const worldStateService = new WorldStateService();
