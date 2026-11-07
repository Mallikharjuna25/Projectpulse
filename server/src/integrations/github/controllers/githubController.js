import { GithubService } from '../services/githubService.js';

export const connectRepository = async (req, res, next) => {
  try {
    const integration = await GithubService.connectRepository({
      collegeId: req.collegeId,
      projectId: req.params.projectId,
      userId: req.user._id,
      data: req.body
    });

    res.status(200).json({
      success: true,
      message: 'GitHub repository connected successfully',
      data: { integration },
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const disconnectRepository = async (req, res, next) => {
  try {
    const result = await GithubService.disconnectRepository({
      collegeId: req.collegeId,
      projectId: req.params.projectId,
      userId: req.user._id
    });

    res.status(200).json({
      success: true,
      message: 'GitHub repository disconnected successfully',
      data: result,
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const getIntegrationStatus = async (req, res, next) => {
  try {
    const integration = await GithubService.getIntegrationStatus({
      collegeId: req.collegeId,
      projectId: req.params.projectId
    });

    res.status(200).json({
      success: true,
      message: 'GitHub integration status retrieved',
      data: { integration },
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const listEvents = async (req, res, next) => {
  try {
    const events = await GithubService.listEvents({
      collegeId: req.collegeId,
      projectId: req.params.projectId,
      query: req.query
    });

    res.status(200).json({
      success: true,
      message: 'GitHub events retrieved successfully',
      data: { events },
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const handleWebhook = async (req, res, next) => {
  try {
    const result = await GithubService.processWebhook({
      collegeId: req.collegeId || req.project?.collegeId,
      projectId: req.params.projectId,
      headers: req.headers,
      payload: req.body
    });

    res.status(200).json({
      success: true,
      message: 'GitHub webhook processed successfully',
      data: result,
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const simulatePush = async (req, res, next) => {
  try {
    const result = await GithubService.simulatePush({
      collegeId: req.collegeId,
      projectId: req.params.projectId,
      userId: req.user._id,
      data: req.body
    });

    res.status(200).json({
      success: true,
      message: 'Git commit simulated and processed successfully',
      data: result,
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

