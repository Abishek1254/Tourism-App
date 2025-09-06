const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config.js');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian mobile number']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  
  // User Role and Status
  role: {
    type: String,
    enum: Object.values(config.USER_ROLES),
    default: config.USER_ROLES.TOURIST
  },
  
  accountStatus: {
    type: String,
    enum: Object.values(config.ACCOUNT_STATUS),
    default: config.ACCOUNT_STATUS.PENDING
  },
  
  // Profile Information
  profilePicture: {
    type: String,
    default: null
  },
  
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(v) {
        return v < new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  
  // Location Information
  address: {
    street: String,
    city: String,
    state: String,
    pincode: {
      type: String,
      match: [/^\d{6}$/, 'Please provide a valid 6-digit pincode']
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  
  // Preferences (for tourists)
  preferences: {
    interests: [{
      type: String,
      enum: ['adventure', 'culture', 'nature', 'religious', 'historical', 'wildlife', 'tribal-culture', 'food', 'photography']
    }],
    languages: [{
      type: String,
      enum: ['english', 'hindi', 'odia', 'santhali', 'mundari', 'kurukh', 'kharia', 'ho']
    }],
    budgetRange: {
      type: String,
      enum: ['budget', 'mid-range', 'luxury'],
      default: 'mid-range'
    },
    travelStyle: {
      type: String,
      enum: ['solo', 'couple', 'family', 'group'],
      default: 'solo'
    }
  },
  
  // Professional Information (for guides/vendors)
  professionalInfo: {
    experience: {
      type: Number,
      min: 0
    },
    specializations: [String],
    certifications: [{
      name: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      certificateUrl: String
    }],
    languages: [String],
    serviceAreas: [String], // Districts/cities they serve
    businessLicense: String,
    panCard: String,
    aadharCard: String
  },
  
  // Verification Status
  verification: {
    email: {
      isVerified: {
        type: Boolean,
        default: false
      },
      verificationToken: String,
      verificationExpires: Date
    },
    phone: {
      isVerified: {
        type: Boolean,
        default: false
      },
      otp: String,
      otpExpires: Date
    },
    documents: {
      isVerified: {
        type: Boolean,
        default: false
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      verifiedAt: Date,
      rejectionReason: String
    }
  },
  
  // Security
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Activity Tracking
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ accountStatus: 1 });
userSchema.index({ 'verification.email.isVerified': 1 });
userSchema.index({ 'verification.phone.isVerified': 1 });


// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with salt of 12
    this.password = await bcrypt.hash(this.password, 12);
    
    // Set password changed timestamp
    if (!this.isNew) {
      this.passwordChangedAt = new Date();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      userId: this._id,
      email: this.email,
      role: this.role 
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRE }
  );
};

// Check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        lockUntil: 1
      },
      $set: {
        loginAttempts: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we have max attempts and not locked, lock the account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

module.exports = mongoose.model('User', userSchema);