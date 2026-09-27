import jwt from 'jsonwebtoken';

/**
 * generateToken — signs a JWT carrying the two things every protected
 * route needs to know: who the user is (their collegeId, which IS the
 * User._id) and what roles they hold, so roleMiddleware can check access
 * without a database lookup on every request.
 */
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    {
      userId: user._id, // collegeId
      roles: user.roles,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export default generateToken;