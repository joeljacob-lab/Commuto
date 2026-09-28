import mongoose from 'mongoose';
import Department from '../models/Department.js';
import User from '../models/User.js';

// Case-insensitive exact match, so "MCA" and "mca" count as the same program.
const findDuplicate = (deptName, programName, excludeId = null) => {
  const query = Department.findOne({
    deptName,
    programName,
    ...(excludeId && { _id: { $ne: excludeId } }),
  }).collation({ locale: 'en', strength: 2 });
  return query;
};

/**
 * @desc    List all departments (used by the registration dropdowns)
 * @route   GET /api/departments
 * @access  Public — must work BEFORE login, since registration needs it
 */
export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ deptName: 1, programName: 1 });
    return res.status(200).json({ departments });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a department (a deptName + programName pair)
 * @route   POST /api/departments
 * @access  Admin
 */
export const createDepartment = async (req, res, next) => {
  try {
    const deptName = req.body.deptName?.trim();
    const programName = req.body.programName?.trim();

    if (!deptName || !programName) {
      return res.status(400).json({ message: 'deptName and programName are required' });
    }

    if (await findDuplicate(deptName, programName)) {
      return res.status(409).json({ message: 'This department and program already exist' });
    }

    const department = await Department.create({ deptName, programName });
    return res.status(201).json({ department });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a department's names
 * @route   PUT /api/departments/:id
 * @access  Admin
 */
export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid department id format' });
    }

    const deptName = req.body.deptName?.trim();
    const programName = req.body.programName?.trim();
    if (!deptName || !programName) {
      return res.status(400).json({ message: 'deptName and programName are required' });
    }

    if (await findDuplicate(deptName, programName, id)) {
      return res.status(409).json({ message: 'This department and program already exist' });
    }

    const department = await Department.findByIdAndUpdate(
      id,
      { deptName, programName },
      { new: true, runValidators: true }
    );
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    return res.status(200).json({ department });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a department — blocked if any user still belongs to it
 * @route   DELETE /api/departments/:id
 * @access  Admin
 */
export const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid department id format' });
    }

    // Deleting a department that users point to would leave them with a
    // dangling deptId, so refuse instead.
    const usersInDept = await User.countDocuments({ deptId: id });
    if (usersInDept > 0) {
      return res.status(409).json({
        message: `Cannot delete — ${usersInDept} user(s) belong to this department`,
      });
    }

    const department = await Department.findByIdAndDelete(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    return res.status(200).json({ message: 'Department deleted' });
  } catch (error) {
    next(error);
  }
};