const authorizeRole = (...allowedRoles) => {
  const options = typeof allowedRoles.at(-1) === 'object' ? allowedRoles.pop() : {};
  return (req, res, next) => {
    if (!req.user) {
      if (options.structured) {
        return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } });
      }
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      if (options.structured) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Administrator access is required.' } });
      }
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }

    next();
  };
};

export { authorizeRole };
