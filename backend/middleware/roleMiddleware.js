/**
 * requireRole — restricts a route to users holding at least one of the
 * given roles. Must run AFTER `protect` (authMiddleware), since it reads
 * req.user.roles, which protect is what sets.
 *
 * A user can hold multiple roles at once (e.g. ['rider', 'driver']), so
 * this checks for ANY overlap, not an exact match.
 *
 * Usage: router.post('/routepools', protect, requireRole('driver'), createRoutePool)
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      // Should never happen if `protect` ran first — guards against
      // someone using this middleware without it by mistake.
      return res.status(401).json({ message: 'Not authorized, no user on request' });
    }

    const hasAccess = req.user.roles.some((role) => allowedRoles.includes(role));

    if (!hasAccess) {
      return res.status(403).json({
        message: `Access denied — requires one of these roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};