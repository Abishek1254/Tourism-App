module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '1d',
  NODE_ENV: process.env.NODE_ENV || 'development',
  // User roles
  USER_ROLES: {
    TOURIST: 'tourist',
    GUIDE: 'guide', 
    VENDOR: 'vendor',
    ADMIN: 'admin'
  },

  // Account status
  ACCOUNT_STATUS: {
    PENDING: 'pending',
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    REJECTED: 'rejected'
  }
};