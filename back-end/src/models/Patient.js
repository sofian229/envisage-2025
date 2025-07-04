// models/Patient.js
const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  times: {
    morning: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },
    emptyStomach: { type: Boolean, default: false }
  },
  completedTimes: {
    morning: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },
    emptyStomach: { type: Boolean, default: false }
  },
  dateAdded: { type: Date, default: Date.now }
}, { _id: true });

const ActivitySchema = new mongoose.Schema({
  type: { type: String, required: true },
  duration: { type: String, required: true },
  notes: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  date: { type: Date, default: Date.now }
}, { _id: true });

const PatientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  condition: { type: String, default: '' },
  lastCheckup: { type: Date },
  emergencyContact: { type: String, default: '' },
  medications: [MedicationSchema],
  activities: [ActivitySchema]
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Patient', PatientSchema);
