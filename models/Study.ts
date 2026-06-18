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
    type: Schema.Types.Mixed, // Inclinaison, azimut, pertes, ombrages, calepinage...
  },
  results: {
    type: Schema.Types.Mixed, // Production, irradiation, variabilité, mensuels...
  },
  reportUrl: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Study = models.Study || model('Study', StudySchema);

export default Study;
