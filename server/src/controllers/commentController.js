import { CommentService } from '../services/commentService.js';

export const createComment = async (req, res, next) => {
  try {
    const comment = await CommentService.createComment({
      collegeId: req.collegeId,
      projectId: req.params.projectId,
      userId: req.user._id,
      data: req.body
    });

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      data: { comment },
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const listComments = async (req, res, next) => {
  try {
    const comments = await CommentService.listComments({
      collegeId: req.collegeId,
      projectId: req.params.projectId,
      entityType: req.query.entityType || 'DISCUSSION',
      entityId: req.query.entityId || req.params.projectId
    });

    res.status(200).json({
      success: true,
      message: 'Comments fetched successfully',
      data: { comments },
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    await CommentService.deleteComment({
      collegeId: req.collegeId,
      projectId: req.params.projectId,
      commentId: req.params.commentId,
      userId: req.user._id,
      userRole: req.user.globalRole,
      projectRole: req.projectRole
    });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      data: null,
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

