// routes/patients.js
const express = require('express');
const Patient = require('../models/Patient'); // Make sure the path is correct

const router = express.Router();

// GET all patients (if needed, this route was in your server.js snippet)
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET specific patient by ID
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (err) {
    console.error('Error fetching patient:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add a new medication to a patient
router.post('/:id/medications', async (req, res) => {
  const { name, dosage, frequency } = req.body;
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    // Add the new medication with default taken: false
    patient.medications.push({ name, dosage, frequency, taken: false });
    await patient.save();
    res.status(201).json(patient.medications[patient.medications.length - 1]); // Return the newly added medication
  } catch (err) {
    console.error('Error adding medication:', err);
    res.status(500).json({ error: err.message });
  }
});


// Update medication taken status
router.put('/:patientId/medications/:medicationId', async (req, res) => {
  const { patientId, medicationId } = req.params;
  const { taken } = req.body; // 'taken' will be true or false

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).send('Patient not found');
    }

    // Find the specific medication by its _id within the patient's medications array
    const medication = patient.medications.id(medicationId);
    if (!medication) {
      return res.status(404).send('Medication not found');
    }

    medication.taken = taken;
    if (taken) {
      medication.lastTaken = new Date(); // Update lastTaken when marked as taken
    }

    await patient.save();
    res.json(patient); // Return the updated patient object
  } catch (err) {
    console.error('Error updating medication:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a medication from a patient
router.delete('/:patientId/medications/:medicationId', async (req, res) => {
  const { patientId, medicationId } = req.params;

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).send('Patient not found');
    }

    // Remove the medication from the array by its _id
    patient.medications.id(medicationId).deleteOne(); // Use deleteOne for subdocuments
    await patient.save();
    res.status(200).json({ message: 'Medication deleted successfully', patient });
  } catch (err) {
    console.error('Error deleting medication:', err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;