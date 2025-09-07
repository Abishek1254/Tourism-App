const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Destination name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    required: true,
    lowercase: true
  },
  
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  shortDescription: {
    type: String,
    required: true,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  
  // Location Information
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    },
    address: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true,
      enum: [
        'ranchi', 'dhanbad', 'jamshedpur', 'bokaro', 'deoghar', 
        'hazaribagh', 'giridih', 'ramgarh', 'dumka', 'godda', 
        'sahibganj', 'pakur', 'jamtara', 'koderma', 'chatra', 
        'gumla', 'simdega', 'khunti', 'west-singhbhum', 
        'east-singhbhum', 'saraikela-kharsawan', 'palamu', 
        'latehar', 'garwa'
      ]
    },
    nearestCity: String,
    accessibility: {
      roadCondition: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
        default: 'good'
      },
      publicTransport: Boolean,
      parkingAvailable: Boolean
    }
  },
  
  // Categories and Tags
  category: {
    type: String,
    required: true,
    enum: [
      'waterfall', 'hill-station', 'temple', 'wildlife', 'cave', 
      'dam', 'tribal-village', 'historical-site', 'adventure-sports', 
      'cultural-site', 'eco-tourism', 'pilgrimage'
    ]
  },
  
  tags: [{
    type: String,
    enum: [
      'adventure', 'culture', 'nature', 'religious', 'historical', 
      'wildlife', 'tribal-culture', 'food', 'photography', 'trekking',
      'boating', 'camping', 'meditation', 'festival', 'handicrafts'
    ]
  }],
  
  // Media
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Visitor Information
  visitInfo: {
    bestTimeToVisit: [{
      type: String,
      enum: ['winter', 'summer', 'monsoon', 'post-monsoon']
    }],
    idealDuration: {
      type: String,
      enum: ['half-day', 'full-day', '2-days', '3-days', 'week']
    },
    difficulty: {
      type: String,
      enum: ['easy', 'moderate', 'difficult'],
      default: 'easy'
    },
    entryFee: {
      indian: { type: Number, default: 0 },
      foreigner: { type: Number, default: 0 },
      camera: { type: Number, default: 0 }
    },
    timings: {
      opens: String,
      closes: String,
      isAlwaysOpen: {
        type: Boolean,
        default: false
      }
    }
  },
  
  // Facilities
  facilities: [{
    type: String,
    enum: [
      'parking', 'restroom', 'food-stall', 'restaurant', 'guide-service',
      'first-aid', 'wifi', 'atm', 'accommodation', 'souvenir-shop',
      'drinking-water', 'wheelchair-access'
    ]
  }],
  
  // Cultural Information (Important for Jharkhand)
  culturalInfo: {
    tribalSignificance: String,
    localFestivals: [String],
    localCuisine: [String],
    languages: [String],
    culturalEtiquette: [String]
  },
  
  // Ratings and Reviews
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  
  // Admin Information
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  verified: {
    type: Boolean,
    default: false
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
destinationSchema.index({ location: '2dsphere' });
destinationSchema.index({ category: 1, status: 1 });
destinationSchema.index({ tags: 1 });
destinationSchema.index({ district: 1 });
destinationSchema.index({ 'ratings.average': -1 });
destinationSchema.index({ featured: -1, 'ratings.average': -1 });

// Create slug before saving
destinationSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

module.exports = mongoose.model('Destination', destinationSchema);
