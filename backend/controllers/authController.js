import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Department from '../models/Department.js';
import generateToken from '../utils/generateToken.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { collegeId, name, email, password, phone, deptId, year, roles } = req.body;

    // --- Basic required-field check ---
    if (!collegeId || !name || !email || !password || !phone || !deptId || !year) {
      return res.status(400).json({
        message: 'collegeId, name, email, password, phone, deptId and year are all required',
      });
    }

    // --- College-domain email enforcement ---
    // Set COLLEGE_EMAIL_DOMAIN in .env, e.g. "college.edu" (no @, no www).
    // If it's not set, this check is skipped — fine for early local dev,
    // but set it before demoing the "verified college community" feature.
    const allowedDomain = process.env.COLLEGE_EMAIL_DOMAIN;
    if (allowedDomain && !email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)) {
      return res.status(400).json({
        message: `Registration is restricted to @${allowedDomain} email addresses`,
      });
    }

    // --- Uniqueness checks (collegeId is the _id, email and phone are unique fields) ---
    const existingById = await User.findById(collegeId);
    if (existingById) {
      return res.status(409).json({ message: 'A user with this college ID already exists' });
    }

    const existingByEmailOrPhone = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });
    if (existingByEmailOrPhone) {
      return res.status(409).json({ message: 'A user with this email or phone already exists' });
    }

    // --- Department must exist ---
    // Check the ID is even shaped like a valid ObjectId BEFORE querying —
    // otherwise Mongoose throws a CastError on a malformed ID (wrong length,
    // non-hex characters) and it falls through as an unhandled 500 instead
    // of a clean 400. This check turns that crash into an intentional response.
    if (!mongoose.isValidObjectId(deptId)) {
      return res.status(400).json({ message: 'Invalid deptId format' });
    }

    const department = await Department.findById(deptId);
    if (!department) {
      return res.status(400).json({ message: 'Invalid deptId — department not found' });
    }

    // --- Hash password, create user with _id = collegeId ---
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Users may only self-assign rider/driver. 'admin' can never come from
    // the request body, or anyone could register as an admin. Admins are
    // promoted manually (see seed/makeAdmin.js). Everyone is a rider first.
    const selfAssignable = ['rider', 'driver'];
    const requestedRoles = Array.isArray(roles)
      ? roles.filter((r) => selfAssignable.includes(r))
      : [];
    const finalRoles = [...new Set(['rider', ...requestedRoles])];

    const user = await User.create({
      _id: collegeId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      deptId,
      year,
      roles: finalRoles,
    });

    const token = generateToken(user);

    return res.status(201).json({
      user: {
        collegeId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        deptId: user.deptId,
        year: user.year,
        roles: user.roles,
        walletBalance: user.walletBalance,
      },
      token,
    });
  } catch (error) {
    next(error); // handed to errorMiddleware
  }
};

/**
 * @desc    Log in an existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate('deptId');
    if (!user) {
      // Deliberately vague — don't reveal whether it was the email or
      // password that was wrong, standard practice against enumeration.
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      user: {
        collegeId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        deptId: user.deptId,
        year: user.year,
        roles: user.roles,
        walletBalance: user.walletBalance,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private (requires valid JWT)
 */
export const getMe = async (req, res) => {
  // req.user is already set by the `protect` middleware, with
  // passwordHash excluded — safe to return as-is.
  return res.status(200).json({ user: req.user });
};