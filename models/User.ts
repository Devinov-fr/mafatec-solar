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
});

const User = models.User || model('User', UserSchema);

export default User;
