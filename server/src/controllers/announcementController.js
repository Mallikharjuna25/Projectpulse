import { AnnouncementService } from '../services/announcementService.js';

export const createAnnouncement = async (req, res, next) => {
  try {
    const announcement = await AnnouncementService.createAnnouncement({
      collegeId: req.collegeId,
      authorId: req.user._id,
      userRole: req.user.globalRole,
      data: req.body
    });

    res.status(201).json({
      success: true,
      message: 'Announcement posted successfully',
      data: { announcement },
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const listAnnouncements = async (req, res, next) => {
  try {
    const announcements = await AnnouncementService.listAnnouncements({
      collegeId: req.collegeId,
      projectId: req.query.projectId || null
    });

    res.status(200).json({
      success: true,
      message: 'Announcements fetched successfully',
      data: { announcements },
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const togglePin = async (req, res, next) => {
  try {
    const announcement = await AnnouncementService.togglePin({
      collegeId: req.collegeId,
      announcementId: req.params.id,
      userId: req.user._id,
      userRole: req.user.globalRole
    });

    res.status(200).json({
      success: true,
      message: 'Announcement pin status toggled',
      data: { announcement },
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    await AnnouncementService.deleteAnnouncement({
      collegeId: req.collegeId,
      announcementId: req.params.id,
      userId: req.user._id,
      userRole: req.user.globalRole
    });

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
      data: null,
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

