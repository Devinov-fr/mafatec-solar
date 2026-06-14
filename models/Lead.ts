import mongoose, { Schema, model, models } from 'mongoose';

const LeadSchema = new Schema({
  prenom: {
    type: String,
    required: [true, 'Prénom is required'],
  },
  nom: {
    type: String,
    required: [true, 'Nom is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
  },
  entreprise: {
    type: String,
    required: false,
  },
  universe: {
    type: String,
    enum: ['part', 'pro'],
    required: true,
  },
  studyData: {
    puissance: String,
    adresse: String,
    production: Number,
    irradiation: Number,
    variabilite: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Lead = models.Lead || model('Lead', LeadSchema);

export default Lead;
