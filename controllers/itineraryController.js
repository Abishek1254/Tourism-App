const Itinerary = require('../models/Itinerary');
const Destination = require('../models/Destination');
const User = require('../models/User');
const geminiService = require('../services/geminiService');

// 1. Generate AI-powered itinerary
const generateItinerary = async (req, res) => {
  try {
    const startTime = Date.now();
    
    const {
      duration,
      startDate,
      groupSize,
      groupType,
      budget,
      interests = [],
      preferences = {},
      excludeDestinations = []
    } = req.body;

    // Input validation
    if (duration < 1 || duration > 30) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 1 and 30 days'
      });
    }

    if (budget.total < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Budget must be at least ₹1000'
      });
    }

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + duration - 1);

    // Validate start date
    if (start < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }

    // Get user profile for personalization
    const user = await User.findById(req.user._id);
    
    // Merge user preferences with request preferences
    const userTourismPrefs = user.tourismPreferences || {};
    const mergedInterests = [
      ...interests,
      ...(userTourismPrefs.interests?.primary || [])
    ];
    const uniqueInterests = [...new Set(mergedInterests)];

    // Build destination query for Jharkhand tourism
    const destinationQuery = {
      status: 'published',
      _id: { $nin: excludeDestinations }
    };

    // Filter by interests if specified
    if (uniqueInterests.length > 0) {
      destinationQuery.tags = { $in: uniqueInterests };
    }

    // Get suitable destinations from Jharkhand
    const destinations = await Destination.find(destinationQuery)
      .sort({ 'ratings.average': -1, featured: -1 })
      .limit(20);

    if (destinations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No suitable destinations found for your preferences in Jharkhand'
      });
    }

    console.log(`Found ${destinations.length} Jharkhand destinations for AI processing`);

    // Prepare parameters for Gemini AI service
    const aiParams = {
      destinations,
      userPreferences: {
        interests: {
          primary: uniqueInterests,
          secondary: preferences.secondaryInterests || []
        },
        budgetPreferences: {
          spendingStyle: budget.budgetType,
          prioritySpending: preferences.budgetPriorities || ['accommodation', 'activities']
        },
        socialPreferences: {
          groupSize: groupType,
          guidedVsIndependent: preferences.guidedVsIndependent || 'mixed'
        },
        accessibility: {
          dietaryRestrictions: userTourismPrefs.accessibility?.dietaryRestrictions || [],
          languagePreference: userTourismPrefs.accessibility?.languagePreference || ['english', 'hindi'],
          mobilityRequirements: userTourismPrefs.accessibility?.mobilityRequirements || {}
        }
      },
      tripDetails: {
        duration,
        startDate: start,
        endDate: end,
        groupSize,
        groupType
      },
      budget,
      userLocation: user.address?.city || null
    };

    let aiResponse;
    let generationMethod = 'gemini-ai';

    try {
      // Try Gemini AI generation
      console.log('Generating itinerary with Google Gemini AI...');
      aiResponse = await geminiService.generateItinerary(aiParams);
      console.log('Gemini AI generation successful');
    } catch (geminiError) {
      console.error('Gemini AI generation failed, using basic algorithm:', geminiError.message);
      
      // Fallback to basic generation
      aiResponse = await geminiService.generateBasicItinerary(aiParams);
      generationMethod = 'basic-algorithm';
    }

    const generationTime = Date.now() - startTime;

    // Create itinerary document
    const itinerary = new Itinerary({
      title: aiResponse.title,
      description: aiResponse.description,
      userId: req.user._id,
      tripDetails: {
        startDate: start,
        endDate: end,
        duration,
        groupSize,
        groupType
      },
      budget: {
        total: budget.total,
        currency: 'INR',
        budgetType: budget.budgetType,
        breakdown: aiResponse.budgetBreakdown
      },
      days: aiResponse.days || [],
      aiGeneration: {
        generatedBy: generationMethod === 'gemini-ai' ? 'ai' : 'basic',
        aiProvider: 'gemini',
        aiModel: process.env.AI_MODEL || 'gemini-1.5-flash',
        generationTime,
        confidence: generationMethod === 'gemini-ai' ? 0.9 : 0.6
      },
      generationPreferences: {
        interests: uniqueInterests,
        budgetPriorities: preferences.budgetPriorities || [],
        travelStyle: groupType,
        culturalPreferences: preferences.culturalPreferences || [],
        accessibilityNeeds: userTourismPrefs.accessibility || {}
      },
      culturalNotes: aiResponse.culturalNotes || [],
      travelTips: aiResponse.travelTips || [],
      emergencyInfo: aiResponse.emergencyInfo || {
        importantNumbers: ['Police: 100', 'Medical: 108', 'Tourist Helpline: 1363'],
        nearestHospitals: ['Contact local authorities for medical emergencies'],
        embassyContacts: 'Contact respective embassies for international tourists'
      },
      localExperiences: aiResponse.localExperiences || [],
      seasonalConsiderations: aiResponse.seasonalConsiderations || []
    });

    await itinerary.save();

    // Populate references for response
    await itinerary.populate('userId', 'name email');
    await itinerary.populate('days.activities.activity.destinationId', 'name images location category');

    console.log(`Itinerary generated successfully in ${generationTime}ms using ${generationMethod}`);

    res.status(201).json({
      success: true,
      message: `Personalized Jharkhand itinerary generated using ${generationMethod === 'gemini-ai' ? 'Google Gemini AI' : 'smart algorithm'}`,
      data: {
        itinerary,
        generationStats: {
          method: generationMethod,
          aiProvider: 'Google Gemini',
          model: process.env.AI_MODEL || 'gemini-1.5-flash',
          processingTime: generationTime,
          destinationsConsidered: destinations.length,
          confidence: generationMethod === 'gemini-ai' ? 0.9 : 0.6
        },
        localExperiences: aiResponse.localExperiences || [],
        seasonalConsiderations: aiResponse.seasonalConsiderations || []
      }
    });

  } catch (error) {
    console.error('Generate itinerary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating itinerary',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// 2. Get user's itineraries
const getUserItineraries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt'
    } = req.query;

    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const sort = {};
    switch (sortBy) {
      case 'startDate':
        sort['tripDetails.startDate'] = -1;
        break;
      case 'budget':
        sort['budget.total'] = -1;
        break;
      case 'views':
        sort['analytics.views'] = -1;
        break;
      default:
        sort.createdAt = -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const itineraries = await Itinerary.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'name email')
      .select('title description tripDetails budget status analytics createdAt aiGeneration.generatedBy aiGeneration.aiProvider version');

    const total = await Itinerary.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        itineraries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItineraries: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user itineraries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching itineraries'
    });
  }
};

// 3. Get single itinerary with full details
const getItinerary = async (req, res) => {
  try {
    const { id } = req.params;

    const itinerary = await Itinerary.findById(id)
      .populate('userId', 'name email profilePicture')
      .populate('days.activities.activity.destinationId', 'name images location category tags ratings');

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    // Check if user owns this itinerary
    if (itinerary.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own itineraries.'
      });
    }

    // Increment view count using model method
    await itinerary.incrementViews();

    res.status(200).json({
      success: true,
      data: { 
        itinerary,
        summary: itinerary.tripSummary,
        aiInfo: itinerary.aiSummary
      }
    });

  } 
  catch (error) {
    console.error('Get itinerary error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid itinerary ID1'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching itinerary'
    });
  }
};

// 4. Update itinerary
const updateItinerary = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const itinerary = await Itinerary.findById(id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    // Check ownership
    if (itinerary.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own itineraries.'
      });
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.userId;
    delete updateData.aiGeneration;
    delete updateData.analytics;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData._id;
    delete updateData.__v;

    // If user is modifying AI-generated content, update status
    if (itinerary.aiGeneration.generatedBy === 'ai' && updateData.days) {
      updateData.status = 'customized';
    }

    // Update version number
    updateData.version = itinerary.version + 1;

    const updatedItinerary = await Itinerary.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('userId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Itinerary updated successfully',
      data: { 
        itinerary: updatedItinerary,
        changes: {
          version: updatedItinerary.version,
          status: updatedItinerary.status,
          modifiedAt: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Update itinerary error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid itinerary ID2'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating itinerary'
    });
  }
};

// 5. Delete itinerary
const deleteItinerary = async (req, res) => {
  try {
    const { id } = req.params;

    const itinerary = await Itinerary.findById(id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    // Check ownership
    if (itinerary.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own itineraries.'
      });
    }

    // Store itinerary info before deletion for response
    const deletedInfo = {
      title: itinerary.title,
      duration: itinerary.tripDetails.duration,
      generatedBy: itinerary.aiGeneration.generatedBy
    };

    await Itinerary.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Itinerary deleted successfully',
      data: {
        deletedItinerary: deletedInfo,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Delete itinerary error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid itinerary ID3'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error deleting itinerary'
    });
  }
};

// 6. Submit feedback on itinerary
const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review, usedItinerary, suggestions } = req.body;

    const itinerary = await Itinerary.findById(id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    // Check ownership
    if (itinerary.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only provide feedback on your own itineraries.'
      });
    }

    // Use model method to add feedback
    const feedbackData = {
      rating,
      review,
      usedItinerary,
      suggestions
    };

    await itinerary.addFeedback(feedbackData);

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { 
        feedback: itinerary.userFeedback,
        itinerary: {
          title: itinerary.title,
          generatedBy: itinerary.aiGeneration.generatedBy
        }
      }
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid itinerary ID4'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error submitting feedback'
    });
  }
};

module.exports = {
  generateItinerary,
  getUserItineraries,
  getItinerary,
  updateItinerary,
  deleteItinerary,
  submitFeedback
};
