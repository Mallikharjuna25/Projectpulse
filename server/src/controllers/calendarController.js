import { MilestoneService } from '../services/milestoneService.js';

export class CalendarController {
  static async getEvents(req, res, next) {
    try {
      const data = await MilestoneService.getCalendarEvents(
        req.user,
        req.collegeId,
        req.query
      );
      res.json({
        success: true,
        message: 'Calendar events retrieved successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }
}

