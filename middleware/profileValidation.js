const { body, validationResult } = require('express-validator');

const tourismPreferencesValidation = [
  body('tourismPreferences.interests.primary')
    .optional()
    .isArray()
    .withMessage('Primary interests must be an array'),
  
  body('tourismPreferences.budgetPreferences.dailyBudget.min')
    .optional()
    .isNumeric()
    .withMessage('Minimum budget must be a number'),
  
  body('tourismPreferences.budgetPreferences.dailyBudget.max')
    .optional()
    .isNumeric()
    .withMessage('Maximum budget must be a number')
    .custom((value, { req }) => {
      if (req.body.tourismPreferences?.budgetPreferences?.dailyBudget?.min && 
          value < req.body.tourismPreferences.budgetPreferences.dailyBudget.min) {
        throw new Error('Maximum budget must be greater than minimum budget');
      }
      return true;
    }),
  
  body('tourismPreferences.accessibility.dietaryRestrictions')
    .optional()
    .isArray()
    .withMessage('Dietary restrictions must be an array')
];

const visitedDestinationValidation = [
  body('destinationId')
    .notEmpty()
    .withMessage('Destination ID is required')
    .isMongoId()
    .withMessage('Invalid destination ID'),
  
  body('visitDate')
    .optional()
    .isISO8601()
    .withMessage('Visit date must be a valid date'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg
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
  tourismPreferencesValidation,
  visitedDestinationValidation,
  handleValidationErrors
};
