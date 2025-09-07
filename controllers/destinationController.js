const Destination = require('../models/Destination');

// Get all destinations with filtering
const getAllDestinations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      district,
      tags,
      featured,
      sortBy = 'name'
    } = req.query;

    // Build filter object
    const filter = { status: 'published' };
    
    if (category) filter.category = category;
    if (district) filter['location.district'] = district;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (featured) filter.featured = featured === 'true';

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case 'rating':
        sort = { 'ratings.average': -1, name: 1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      default:
        sort = { name: 1 };
    }

    const destinations = await Destination.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Destination.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        destinations,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalDestinations: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get destinations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching destinations'
    });
  }
};

// Get nearby destinations
const getNearbyDestinations = async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const destinations = await Destination.find({
      status: 'published',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    }).limit(20);

    res.status(200).json({
      success: true,
      data: { destinations }
    });

  } catch (error) {
    console.error('Get nearby destinations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby destinations'
    });
  }
};

// Get single destination
const getDestination = async (req, res) => {
  try {
    const { id } = req.params;

    const destination = await Destination.findOne({
      $or: [{ _id: id }, { slug: id }],
      status: 'published'
    });

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { destination }
    });

  } catch (error) {
    console.error('Get destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching destination'
    });
  }
};

// Create destination (Admin only)
const createDestination = async (req, res) => {
  try {
    const destinationData = {
      ...req.body,
      createdBy: req.user._id
    };

    const destination = await Destination.create(destinationData);

    res.status(201).json({
      success: true,
      message: 'Destination created successfully',
      data: { destination }
    });

  } catch (error) {
    console.error('Create destination error:', error);
    
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
      message: 'Error creating destination'
    });
  }
};

module.exports = {
  getAllDestinations,
  getNearbyDestinations,
  getDestination,
  createDestination
};
