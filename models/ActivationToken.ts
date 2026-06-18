import mongoose, { Schema, model, models } from 'mongoose';

const ActivationTokenSchema = new Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  usedAt: {
    type: Date,
  },
});

const ActivationToken = models.ActivationToken || model('ActivationToken', ActivationTokenSchema);

export default ActivationToken;
