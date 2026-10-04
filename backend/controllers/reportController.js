import Report from '../models/Report.js';
import User from '../models/User.js';
import Ride from '../models/Ride.js';
import { recordReportFlag } from '../services/trustService.js';

/**
 * @desc    Submit a safety/misconduct report against a user
 * @route   POST /api/reports
 * @access  Private
 */
export const createReport = async (req, res, next) => {
  try {
    const { against, rideId, description } = req.body;
    const reportedBy = req.user._id;

    // 1. Validation
    if (!against) {
      return res.status(400).json({ message: 'User to report (against) is required' });
    }

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ message: 'Please provide a detailed description (at least 10 characters)' });
    }

    if (reportedBy === against) {
      return res.status(400).json({ message: 'You cannot report yourself' });
    }

    // 2. Ensure target user exists
    const targetUser = await User.findById(against);
    if (!targetUser) {
      return res.status(404).json({ message: 'User to report not found' });
    }

    // 3. Optional ride validation
    if (rideId) {
      const ride = await Ride.findById(rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Associated ride not found' });
      }
    }

    // 4. Create the report
    const report = await Report.create({
      reportedBy,
      against,
      rideId: rideId || null,
      description: description.trim(),
      status: 'open',
    });

    // 5. Automatically flag the trust edge between these two students
    await recordReportFlag(reportedBy, against);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Administrators will review it.',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reports filed by the logged-in user
 * @route   GET /api/reports/my
 * @access  Private
 */
export const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ reportedBy: req.user._id })
      .populate('against', 'name email collegeId')
      .populate('rideId', 'date departureTime origin destination')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reports (Admin Triage Queue)
 * @route   GET /api/reports
 * @access  Private (Admin only)
 */
export const getAllReports = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const reports = await Report.find(filter)
      .populate('reportedBy', 'name email collegeId')
      .populate('against', 'name email collegeId')
      .populate('rideId', 'date departureTime origin destination')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update report status / take action (Admin only)
 * @route   PUT /api/reports/:id/status
 * @access  Private (Admin only)
 */
export const updateReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['open', 'investigating', 'resolved', 'dismissed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    report.handledBy = req.user._id;
    await report.save();

    res.status(200).json({
      success: true,
      message: `Report marked as ${status}`,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};