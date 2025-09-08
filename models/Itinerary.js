const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Itinerary title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Trip Details
  tripDetails: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 30
    },
    groupSize: {
      type: Number,
      required: true,
      min: 1,
      max: 50
    },
    groupType: {
      type: String,
      enum: ['solo', 'couple', 'family', 'friends', 'corporate'],
      required: true
    }
  },
  
  // Budget Information
  budget: {
    total: {
      type: Number,
      required: true,
      min: 1000
    },
    currency: {
      type: String,
      default: 'INR'
    },
    budgetType: {
      type: String,
      enum: ['budget', 'mid-range', 'luxury'],
      required: true
    },
    breakdown: {
      accommodation: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      miscellaneous: { type: Number, default: 0 }
    }
  },
  
  // Daily Itinerary Structure
  days: [{
    dayNumber: {
      type: Number,
      required: true,
      min: 1
    },
    date: {
      type: Date,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    location: String,
    weather: String,
    
    // Activities for each day
    activities: [{
      timeSlot: {
        type: String,
        enum: ['early-morning', 'morning', 'afternoon', 'evening', 'night'],
        required: true
      },
      startTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      endTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      activity: {
        type: {
          type: String,
          enum: ['destination', 'transport', 'meal', 'accommodation', 'activity'],
          required: true
        },
        destinationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Destination'
        },
        title: {
          type: String,
          required: true
        },
        description: String,
        location: {
          name: String,
          coordinates: {
            type: [Number],
            validate: {
              validator: function(v) {
                return v.length === 2;
              },
              message: 'Coordinates must be [longitude, latitude]'
            }
          },
          district: String
        },
        estimatedCost: {
          type: Number,
          min: 0,
          default: 0
        },
        estimatedDuration: {
          type: Number,
          min: 0,
          default: 60
        },
        bookingRequired: {
          type: Boolean,
          default: false
        },
        culturalTips: String,
        tribalInteraction: String,
        alternatives: [String]
      },
      notes: String
    }],
    
    // Accommodation for the day
    accommodation: {
      type: {
        type: String,
        enum: ['hotel', 'homestay', 'guesthouse', 'resort', 'camping']
      },
      name: String,
      location: String,
      estimatedCost: Number,
      description: String,
      culturalExperience: String,
      bookingRequired: {
        type: Boolean,
        default: true
      }
    },
    
    // Meals for the day
    meals: [{
      type: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack']
      },
      cuisine: String,
      estimatedCost: Number,
      recommendations: String,
      location: String
    }],
    
    // Transport for the day
    transport: {
      mode: String,
      estimatedCost: Number,
      duration: String,
      notes: String
    },
    
    totalDayCost: {
      type: Number,
      default: 0
    }
  }],
  
  // AI Generation Metadata
  aiGeneration: {
    generatedBy: {
      type: String,
      enum: ['user', 'ai', 'hybrid', 'basic'],
      default: 'ai'
    },
    aiProvider: {
      type: String,
      enum: ['gemini'],
      default: 'gemini'
    },
    aiModel: {
      type: String,
      default: 'gemini-1.5-flash'
    },
    generationTime: {
      type: Number,
      default: 0
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8
    },
    promptTokens: Number,
    completionTokens: Number
  },
  
  // User Preferences Used for Generation
  generationPreferences: {
    interests: [String],
    budgetPriorities: [String],
    travelStyle: String,
    culturalPreferences: [String],
    accessibilityNeeds: mongoose.Schema.Types.Mixed
  },
  
  // Status and Management
  status: {
    type: String,
    enum: ['draft', 'generated', 'customized', 'finalized', 'archived'],
    default: 'generated'
  },
  
  version: {
    type: Number,
    default: 1
  },
  
  // Cultural and Travel Information
  culturalNotes: [String],
  travelTips: [String],
  
  emergencyInfo: {
    importantNumbers: [String],
    nearestHospitals: [String],
    embassyContacts: String
  },
  
  localExperiences: [String],
  seasonalConsiderations: [String],
  
  // Analytics
  analytics: {
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    implementations: { type: Number, default: 0 }
  },
  
  // User Feedback
  userFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    usedItinerary: Boolean,
    suggestions: String,
    submittedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for Performance
itinerarySchema.index({ userId: 1, status: 1 });
itinerarySchema.index({ 'tripDetails.startDate': 1 });
itinerarySchema.index({ 'budget.budgetType': 1 });
itinerarySchema.index({ 'days.activities.activity.destinationId': 1 });
itinerarySchema.index({ createdAt: -1 });
itinerarySchema.index({ 'analytics.views': -1 });
itinerarySchema.index({ 'userFeedback.rating': -1 });

// Virtual for Total Estimated Cost
itinerarySchema.virtual('totalEstimatedCost').get(function() {
  return this.days.reduce((total, day) => total + (day.totalDayCost || 0), 0);
});

// Virtual for Trip Summary
itinerarySchema.virtual('tripSummary').get(function() {
  const destinations = [...new Set(this.days.map(day => day.location).filter(Boolean))];
  const activities = this.days.reduce((total, day) => total + day.activities.length, 0);
  
  return {
    destinations: destinations,
    totalDays: this.days.length,
    totalActivities: activities,
    totalCost: this.totalEstimatedCost,
    avgDailyCost: Math.floor(this.totalEstimatedCost / this.days.length)
  };
});

// Virtual for AI Generation Summary
itinerarySchema.virtual('aiSummary').get(function() {
  return {
    provider: this.aiGeneration.aiProvider,
    model: this.aiGeneration.aiModel,
    generatedBy: this.aiGeneration.generatedBy,
    confidence: this.aiGeneration.confidence,
    processingTime: this.aiGeneration.generationTime + 'ms'
  };
});

// Pre-save Middleware to Calculate Day Costs
itinerarySchema.pre('save', function(next) {
  this.days.forEach(day => {
    let dayCost = 0;
    
    // Add activity costs
    day.activities.forEach(activity => {
      dayCost += activity.activity.estimatedCost || 0;
    });
    
    // Add accommodation cost
    dayCost += day.accommodation?.estimatedCost || 0;
    
    // Add meal costs
    day.meals.forEach(meal => {
      dayCost += meal.estimatedCost || 0;
    });
    
    // Add transport cost
    dayCost += day.transport?.estimatedCost || 0;
    
    day.totalDayCost = dayCost;
  });
  
  next();
});

// Pre-save Middleware to Update Budget Breakdown Total
itinerarySchema.pre('save', function(next) {
  if (this.budget && this.budget.breakdown) {
    const breakdown = this.budget.breakdown;
    const calculatedTotal = breakdown.accommodation + breakdown.transport + 
                          breakdown.food + breakdown.activities + breakdown.miscellaneous;
    
    // If breakdown total doesn't match budget total, adjust miscellaneous
    if (calculatedTotal !== this.budget.total) {
      breakdown.miscellaneous = this.budget.total - 
        (breakdown.accommodation + breakdown.transport + breakdown.food + breakdown.activities);
    }
  }
  next();
});

// Methods
itinerarySchema.methods.incrementViews = function() {
  this.analytics.views += 1;
  return this.save();
};

itinerarySchema.methods.addFeedback = function(feedbackData) {
  this.userFeedback = {
    ...feedbackData,
    submittedAt: new Date()
  };
  return this.save();
};

itinerarySchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  this.version += 1;
  return this.save();
};

// Static Methods
itinerarySchema.statics.findByUser = function(userId, options = {}) {
  const { status, limit = 10, skip = 0, sortBy = 'createdAt' } = options;
  
  let query = this.find({ userId });
  
  if (status) {
    query = query.where({ status });
  }
  
  const sort = {};
  sort[sortBy] = sortBy === 'createdAt' ? -1 : 1;
  
  return query
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .populate('userId', 'name email')
    .select('title description tripDetails budget status analytics createdAt aiGeneration.generatedBy totalEstimatedCost');
};

itinerarySchema.statics.getPopularItineraries = function(limit = 10) {
  return this.find({ status: { $in: ['generated', 'customized', 'finalized'] } })
    .sort({ 'analytics.views': -1, 'userFeedback.rating': -1 })
    .limit(limit)
    .populate('userId', 'name')
    .select('title description tripDetails analytics userFeedback.rating');
};

module.exports = mongoose.model('Itinerary', itinerarySchema);
