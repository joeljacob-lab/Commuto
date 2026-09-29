import Vehicle from '../models/Vehicle.js';
import cloudinary from '../config/cloudinary.js';
import normalizeRegNo from '../utils/normalizeRegNo.js';

// @desc    Add a new vehicle (Driver)
// @route   POST /api/vehicles
export const addVehicle = async (req, res, next) => {
  try {
    const { registrationNumber, model, type, color, seats, mileageKmpl, documents } = req.body;

    if (!registrationNumber || !documents || documents.length === 0) {
      return res.status(400).json({ message: 'Registration number and at least 1 document are required' });
    }

    // Check if vehicle already exists
    const normalizedId = normalizeRegNo(registrationNumber);
    const existing = await Vehicle.findById(normalizedId);
    if (existing) {
      return res.status(409).json({ message: 'This vehicle is already registered' });
    }

    // Upload base64 documents to Cloudinary
    const uploadedUrls = [];
    for (const doc of documents) {
      const isPdf = typeof doc === 'string' && doc.startsWith('data:application/pdf');

      // Explicitly use resource_type: 'image' and pass format
      const uploadRes = await cloudinary.uploader.upload(doc, {
        folder: 'commuto/vehicles',
        resource_type: 'image',
        format: isPdf ? 'pdf' : undefined,
      });

      console.log("🔗 GENERATED URL:", uploadRes.secure_url);
      
      // Just push the exact URL Cloudinary gave us! No replacements!
      uploadedUrls.push(uploadRes.secure_url);
    }

    const vehicle = await Vehicle.create({
      _id: registrationNumber, // Pre-save hook will normalize this
      ownerId: req.user._id,
      model,
      type,
      color,
      seats: Number(seats),
      mileageKmpl: Number(mileageKmpl),
      documentUrls: uploadedUrls,
    });

    res.status(201).json({ vehicle });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my vehicles (Driver)
// @route   GET /api/vehicles/me
export const getMyVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ ownerId: req.user._id });
    res.status(200).json({ vehicles });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending vehicles (Admin)
// @route   GET /api/vehicles/pending
export const getPendingVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ verificationStatus: 'pending' }).populate('ownerId', 'name email phone');
    res.status(200).json({ vehicles });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vehicle status (Admin)
// @route   PUT /api/vehicles/:id/status
export const updateVehicleStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const vehicleId = normalizeRegNo(req.params.id);
    const vehicle = await Vehicle.findByIdAndUpdate(
      vehicleId,
      { verificationStatus: status, verifiedBy: req.user._id },
      { new: true }
    );

    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.status(200).json({ vehicle });
  } catch (error) {
    next(error);
  }
};