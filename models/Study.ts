import mongoose, { Schema, model, models } from 'mongoose';

const StudySchema = new Schema({
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  puissance: {
    type: String,
    required: true,
  },
  adresse: {
    type: String,
    required: true,
  },
  lat: Number,
  lng: Number,
  params: {
    type: Schema.Types.Mixed, 
  },
  results: {
    type: Schema.Types.Mixed, 
  },
  reportUrl: {
    type: String,
  },
  // Public access field
  publicToken: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  publicTokenExpires: {
    type: Date,
    required: false,
  },
  pdfData: {
    type: Buffer,
    required: false,
  },
  pdfStored: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Study = models.Study || model('Study', StudySchema);

export default Study;