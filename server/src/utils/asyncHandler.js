/**
 * Async handler wrapper to catch unhandled promise rejections
 * and forward them cleanly to Express error handling middleware.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

