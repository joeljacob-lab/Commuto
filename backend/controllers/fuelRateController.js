import FuelRate from '../models/FuelRate.js';

// @desc    Get the current active fuel rate
// @route   GET /api/fuelrates/current
// @access  Protected (All authenticated users can see the current fuel price)
export const getCurrentFuelRate = async (req, res, next) => {
  try {
    const currentRate = await FuelRate.findOne().sort({ effectiveDate: -1 });

    if (!currentRate) {
      // Default fallback if no rate has been configured yet
      return res.status(200).json({
        fuelRate: {
          pricePerLitre: 105.0,
          effectiveDate: new Date(),
          isDefault: true,
        },
      });
    }

    res.status(200).json({ fuelRate: currentRate });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete fuel rate history (audit log)
// @route   GET /api/fuelrates/history
// @access  Admin
export const getFuelRateHistory = async (req, res, next) => {
  try {
    const history = await FuelRate.find()
      .sort({ effectiveDate: -1 })
      .populate('setBy', 'name email');

    res.status(200).json({ history });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a new fuel rate (Append-only)
// @route   POST /api/fuelrates
// @access  Admin
export const setFuelRate = async (req, res, next) => {
  try {
    const { pricePerLitre, effectiveDate } = req.body;

    const parsedPrice = Number(pricePerLitre);
    if (!parsedPrice || parsedPrice <= 0) {
      return res.status(400).json({ message: 'Valid fuel price per litre is required' });
    }

    // Always create a new document — never update old records
    const newRate = await FuelRate.create({
      pricePerLitre: parsedPrice,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      setBy: req.user._id,
    });

    res.status(201).json({
      message: 'Fuel rate updated successfully',
      fuelRate: newRate,
    });
  } catch (error) {
    next(error);
  }
};