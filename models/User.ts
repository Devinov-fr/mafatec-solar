// models/user.ts
import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
  },
  prenom: {
    type: String,
    required: [true, 'Prénom is required'],
  },
  nom: {
    type: String,
    required: [true, 'Nom is required'],
  },
  entreprise: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    enum: ['part', 'pro'],
    default: 'part',
  },
  passwordHash: {
    type: String,
    required: false, // Null until activated
  },
  activated: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  activatedAt: {
    type: Date,
  },
  // Activation token fields (for email verification)
  activationToken: {
    type: String,
    default: null,
  },
  activationTokenExpires: {
    type: Date,
    default: null,
  },
  // Password reset token fields
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  // Keep track of last password reset request
  lastPasswordResetRequest: {
    type: Date,
    default: null,
  },
  // For password reset rate limiting
  passwordResetAttempts: {
    type: Number,
    default: 0,
  },
  lastPasswordResetAttempt: {
    type: Date,
    default: null,
  },
});

// Add indexes for better query performance
UserSchema.index({ resetPasswordToken: 1 });
UserSchema.index({ activationToken: 1 });
UserSchema.index({ email: 1 });

// ============================================
// HELPER METHODS - Defined on the schema
// ============================================

// Check if reset token is valid and not expired
UserSchema.methods.isValidResetToken = function(token: string) {
  return this.resetPasswordToken === token && 
         this.resetPasswordExpires && 
         this.resetPasswordExpires > new Date();
};

// Check if activation token is valid and not expired
UserSchema.methods.isValidActivationToken = function(token: string) {
  return this.activationToken === token && 
         this.activationTokenExpires && 
         this.activationTokenExpires > new Date();
};

// Clear reset token after use
UserSchema.methods.clearResetToken = function() {
  this.resetPasswordToken = null;
  this.resetPasswordExpires = null;
  return this;
};

// Clear activation token after use
UserSchema.methods.clearActivationToken = function() {
  this.activationToken = null;
  this.activationTokenExpires = null;
  return this;
};

// Generate a new reset token
UserSchema.methods.generateResetToken = function() {
  const { nanoid } = require('nanoid');
  const token = nanoid(32);
  this.resetPasswordToken = token;
  this.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
  return token;
};

// Generate a new activation token
UserSchema.methods.generateActivationToken = function() {
  const { nanoid } = require('nanoid');
  const token = nanoid(32);
  this.activationToken = token;
  this.activationTokenExpires = new Date(Date.now() + 259200000); // 3 days
  return token;
};

// Check if user can request another password reset (rate limiting)
UserSchema.methods.canRequestPasswordReset = function() {
  if (!this.lastPasswordResetAttempt) return true;
  
  const now = new Date();
  const timeSinceLastAttempt = now.getTime() - this.lastPasswordResetAttempt.getTime();
  const minutesSinceLastAttempt = timeSinceLastAttempt / (1000 * 60);
  
  // Allow if more than 15 minutes have passed since last attempt
  // Or if less than 3 attempts in the last hour
  if (minutesSinceLastAttempt > 15) {
    this.passwordResetAttempts = 0;
    return true;
  }
  
  if (this.passwordResetAttempts < 3) {
    return true;
  }
  
  return false;
};

// Record a password reset attempt
UserSchema.methods.recordResetAttempt = function() {
  this.lastPasswordResetAttempt = new Date();
  this.passwordResetAttempts = (this.passwordResetAttempts || 0) + 1;
  return this;
};

// Activate the user account
UserSchema.methods.activateAccount = function() {
  this.activated = true;
  this.activatedAt = new Date();
  this.activationToken = null;
  this.activationTokenExpires = null;
  return this;
};

// Set password hash
UserSchema.methods.setPassword = function(passwordHash: string) {
  this.passwordHash = passwordHash;
  return this;
};

// Check if account is fully active
UserSchema.methods.isActive = function() {
  return this.activated === true && this.passwordHash !== null;
};

// Create the model
const User = models.User || model('User', UserSchema);

export default User;