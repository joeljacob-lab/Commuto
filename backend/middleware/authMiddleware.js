import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * protect — verifies the JWT from the Authorization header, loads the
 * corresponding user, and attaches it to req.user for downstream
 * controllers/middleware. Rejects with 401 if the token is missing,
 * malformed, expired, or the user no longer exists.
 */
export const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded.userId is the collegeId; passwordHash excluded on purpose —
    // controllers should never need it once auth has already happened.
    const user = await User.findById(decoded.userId)
      .select('-passwordHash')
      .populate('deptId');

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
  }
};