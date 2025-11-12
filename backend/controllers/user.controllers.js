import User from '../models/user.model.js';

// Centralized error handler
const handleError = (res, message, error = null, status = 500) => {
  if (error) console.error('[USER CONTROLLER ERROR]', message, error);
  return res.status(status).json({ message });
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return handleError(res, 'User not found', null, 404);
    res.status(200).json(user);
  } catch (error) {
    return handleError(res, 'Failed to fetch current user', error);
  }
};

// Update user location
export const updateUserLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return handleError(res, 'Latitude and longitude are required', null, 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { location: { lat, lng } },
      { new: true }
    ).select('-password');

    if (!user) return handleError(res, 'User not found', null, 404);
    res.status(200).json(user);
  } catch (error) {
    return handleError(res, 'Failed to update location', error);
  }
};

// Update user active status
export const updateActiveStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return handleError(res, 'isActive must be a boolean', null, 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) return handleError(res, 'User not found', null, 404);
    res.status(200).json(user);
  } catch (error) {
    return handleError(res, 'Failed to update active status', error);
  }
};
