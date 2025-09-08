const User = require('../models/User');
const Destination = require('../models/Destination');

// Get complete user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('activityTracking.visitedDestinations.destinationId', 'name images category')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
};

// Update basic profile information
const updateProfile = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Remove sensitive fields that shouldn't be updated here
    delete updateData.password;
    delete updateData.email;
    delete updateData.role;
    delete updateData.verification;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// Update tourism preferences
const updateTourismPreferences = async (req, res) => {
  try {
    const { tourismPreferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        $set: { 
          tourismPreferences: {
            ...req.user.tourismPreferences,
            ...tourismPreferences
          }
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Tourism preferences updated successfully',
      data: { 
        user,
        preferences: user.tourismPreferences
      }
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences'
    });
  }
};

// Add visited destination
const addVisitedDestination = async (req, res) => {
  try {
    const { destinationId, visitDate, rating, review, photos } = req.body;

    // Verify destination exists
    const destination = await Destination.findById(destinationId);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    // Check if already visited (prevent duplicates)
    const user = await User.findById(req.user._id);
    const alreadyVisited = user.activityTracking.visitedDestinations.find(
      visit => visit.destinationId.toString() === destinationId
    );

    if (alreadyVisited) {
      return res.status(400).json({
        success: false,
        message: 'Destination already marked as visited'
      });
    }

    // Add to visited destinations
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          'activityTracking.visitedDestinations': {
            destinationId,
            visitDate,
            rating,
            review,
            photos
          }
        }
      },
      { new: true }
    ).populate('activityTracking.visitedDestinations.destinationId', 'name images');

    res.status(200).json({
      success: true,
      message: 'Destination added to visited list',
      data: { 
        visitedDestinations: updatedUser.activityTracking.visitedDestinations
      }
    });

  } catch (error) {
    console.error('Add visited destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding visited destination'
    });
  }
};

// Get personalized recommendations based on preferences
const getPersonalizedRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const preferences = user.tourismPreferences;

    // Build recommendation query based on user preferences
    let query = { status: 'published' };
    
    // Filter by primary interests
    if (preferences?.interests?.primary?.length > 0) {
      query.tags = { $in: preferences.interests.primary };
    }

    // Filter by district if user has location preference
    if (user.address?.state === 'Jharkhand' && user.address?.city) {
      // Prioritize nearby destinations
      const nearbyDistricts = getNearbyDistricts(user.address.city);
      query.$or = [
        { 'location.district': { $in: nearbyDistricts } },
        { featured: true }
      ];
    }

    // Exclude destinations user wants to avoid
    if (preferences?.interests?.avoid?.length > 0) {
      query.tags = { 
        $in: preferences.interests.primary,
        $nin: preferences.interests.avoid
      };
    }

    const recommendations = await Destination.find(query)
      .sort({ 'ratings.average': -1, featured: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: { 
        recommendations,
        basedOn: {
          interests: preferences?.interests?.primary || [],
          location: user.address?.city || null,
          preferences: 'tourism preferences'
        }
      }
    });

  } 
  catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting recommendations'
    });
  }
};

// Helper function to get nearby districts
const getNearbyDistricts = (city) => {
  const districtMap = {
    'ranchi': ['ranchi', 'khunti', 'gumla', 'simdega'],
    'jamshedpur': ['east-singhbhum', 'west-singhbhum', 'saraikela-kharsawan'],
    'dhanbad': ['dhanbad', 'bokaro', 'giridih'],
    'deoghar': ['deoghar', 'dumka', 'godda'],
    // Add more city-district mappings
  };
  
  return districtMap[city.toLowerCase()] || [city.toLowerCase()];
};

// Track user search behavior
const trackSearch = async (req, res) => {
  try {
    const { query, filters } = req.body;

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          'activityTracking.searchHistory': {
            query,
            filters,
            timestamp: new Date()
          }
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Search tracked successfully'
    });

  } catch (error) {
    console.error('Track search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking search'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateTourismPreferences,
  addVisitedDestination,
  getPersonalizedRecommendations,
  trackSearch
};
