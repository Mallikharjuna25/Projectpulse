import cron from 'node-cron';
import { Task } from '../models/Task.js';
import { Milestone } from '../models/Milestone.js';
import { Project } from '../models/Project.js';
import { logger } from '../utils/logger.js';

export class DeadlineJob {
  /**
   * Run the deadline and overdue audit check.
   */
  static async checkDeadlines() {
    try {
      const now = new Date();
      logger.info(`[DEADLINE JOB] Running deadline and overdue inspection at ${now.toISOString()}`);

      // 1. Inspect uncompleted milestones past due date
      const overdueMilestones = await Milestone.find({
        status: { $nin: ['COMPLETED', 'DELAYED'] },
        dueDate: { $lt: now }
      });

      for (const ms of overdueMilestones) {
        ms.status = 'DELAYED';
        await ms.save();
        logger.warn(`[DEADLINE JOB] Milestone "${ms.title}" (ID: ${ms._id}) marked as DELAYED`);
      }

      // 2. Count overdue tasks
      const overdueTasksCount = await Task.countDocuments({
        status: { $ne: 'COMPLETED' },
        dueDate: { $lt: now }
      });

      // 3. Inspect active projects health
      const activeProjects = await Project.find({
        status: { $in: ['PLANNING', 'ACTIVE'] },
        isDeleted: false
      });

      let updatedProjectsCount = 0;
      for (const proj of activeProjects) {
        const deadline = new Date(proj.deadline);
        const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        let newHealth = proj.health;

        if (diffDays < 0 && proj.progress < 100) {
          newHealth = 'DELAYED';
        } else if (diffDays <= 7 && proj.progress < 70) {
          newHealth = 'AT_RISK';
        }

        if (newHealth !== proj.health) {
          proj.health = newHealth;
          await proj.save();
          updatedProjectsCount += 1;
        }
      }

      logger.info(
        `[DEADLINE JOB] Completed: ${overdueMilestones.length} milestones marked delayed, ${overdueTasksCount} overdue tasks detected, ${updatedProjectsCount} project health statuses updated.`
      );

      return {
        overdueMilestonesCount: overdueMilestones.length,
        overdueTasksCount,
        updatedProjectsCount
      };
    } catch (err) {
      logger.error('[DEADLINE JOB] Execution failed:', err);
    }
  }

  /**
   * Initialize cron schedule (runs daily at midnight).
   */
  static initDeadlineCron() {
    // Run daily at midnight
    cron.schedule('0 0 * * *', async () => {
      await DeadlineJob.checkDeadlines();
    });
    logger.info('Deadline cron job scheduled: daily at midnight');
  }
}

