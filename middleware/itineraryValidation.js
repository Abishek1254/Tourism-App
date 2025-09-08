const { body, param, validationResult } = require('express-validator');

// Validation rules for generating new itinerary
const itineraryGenerationValidation = [
  body('duration')
    .isInt({ min: 1, max: 30 })
    .withMessage('Duration must be between 1 and 30 days'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO8601 date')
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (inputDate < today) {
        throw new Error('Start date cannot be in the past');
      }
      
      // Check if date is too far in future (2 years)
      const twoYearsFromNow = new Date();
      twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
      
      if (inputDate > twoYearsFromNow) {
        throw new Error('Start date cannot be more than 2 years in the future');
      }
      
      return true;
    }),
  
  body('groupSize')
    .isInt({ min: 1, max: 50 })
    .withMessage('Group size must be between 1 and 50 people'),
  
  body('groupType')
    .isIn(['solo', 'couple', 'family', 'friends', 'corporate'])
    .withMessage('Group type must be one of: solo, couple, family, friends, corporate'),
  
  body('budget.total')
    .isNumeric()
    .withMessage('Budget total must be a number')
    .custom((value, { req }) => {
      if (value < 1000) {
        throw new Error('Budget must be at least ₹1000');
      }
      
      // Check reasonable budget based on duration
      const duration = req.body.duration;
      const minPerDay = 500;
      
      if (value < (duration * minPerDay)) {
        throw new Error(`Budget too low. Minimum ₹${duration * minPerDay} required for ${duration} days`);
      }
      
      return true;
    }),
  
  body('budget.budgetType')
    .isIn(['budget', 'mid-range', 'luxury'])
    .withMessage('Budget type must be one of: budget, mid-range, luxury'),
  
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array')
    .custom((interests) => {
      const validInterests = [
        'adventure-sports', 'cultural-heritage', 'nature-wildlife',
        'religious-spiritual', 'tribal-culture', 'food-cuisine',
        'photography', 'trekking', 'waterfalls', 'caves',
        'historical-sites', 'festivals', 'handicrafts', 'meditation'
      ];
      
      const invalidInterests = interests.filter(interest => !validInterests.includes(interest));
      if (invalidInterests.length > 0) {
        throw new Error(`Invalid interests: ${invalidInterests.join(', ')}`);
      }
      return true;
    }),
  
  body('excludeDestinations')
    .optional()
    .isArray()
    .withMessage('Exclude destinations must be an array')
    .custom((destinations) => {
      // Validate MongoDB ObjectIds
      const mongoose = require('mongoose');
      const invalidIds = destinations.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        throw new Error('Invalid destination IDs provided');
      }
      return true;
    }),
  
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object')
];

// Validation rules for updating itinerary
const itineraryUpdateValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid itinerary ID format'),
  
  body('title')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Title must be between 1 and 150 characters'),
  
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('status')
    .optional()
    .isIn(['draft', 'generated', 'customized', 'finalized', 'archived'])
    .withMessage('Invalid status. Must be one of: draft, generated, customized, finalized, archived'),
  
  body('days')
    .optional()
    .isArray()
    .withMessage('Days must be an array')
    .custom((days) => {
      // Basic validation for days structure
      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        if (!day.dayNumber || !day.date || !day.title) {
          throw new Error(`Day ${i + 1} is missing required fields (dayNumber, date, title)`);
        }
        if (!Array.isArray(day.activities)) {
          throw new Error(`Day ${i + 1} activities must be an array`);
        }
      }
      return true;
    })
];

// Validation rules for submitting feedback
const feedbackValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid itinerary ID format'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('review')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Review must be between 1 and 1000 characters'),
  
  body('usedItinerary')
    .optional()
    .isBoolean()
    .withMessage('Used itinerary must be true or false'),
  
  body('suggestions')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Suggestions cannot exceed 500 characters')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

module.exports = {
  itineraryGenerationValidation,
  itineraryUpdateValidation,
  feedbackValidation,
  handleValidationErrors
};
