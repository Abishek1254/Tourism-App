const express = require('express');
const router = express.Router();

const {
  getAllDestinations,
  getNearbyDestinations,
  getDestination,
  createDestination
} = require('../controllers/destinationController');

const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllDestinations);
router.get('/nearby', getNearbyDestinations);
router.get('/:id', getDestination);

// Admin only routes
router.post('/', protect, authorize('admin'), createDestination);

module.exports = router;
