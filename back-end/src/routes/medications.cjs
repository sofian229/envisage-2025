const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/database.cjs');

const router = express.Router();
const db = database.getDB();

// Get medications for a patient
router.get('/patient/:patientId', (req, res) => {
  const { patientId } = req.params;
  
  db.all('SELECT * FROM medications WHERE patient_id = ?', [patientId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Add medication
router.post('/', [
  body('patientId').isInt().withMessage('Valid patient ID is required'),
  body('name').notEmpty().withMessage('Medication name is required'),
  body('dosage').notEmpty().withMessage('Dosage is required'),
  body('frequency').notEmpty().withMessage('Frequency is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { patientId, name, dosage, frequency, lastTaken } = req.body;
  
  const query = `
    INSERT INTO medications (patient_id, name, dosage, frequency, last_taken)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(query, [patientId, name, dosage, frequency, lastTaken], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({
      id: this.lastID,
      patientId,
      name,
      dosage,
      frequency,
      lastTaken
    });
  });
});

// Update medication
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { lastTaken } = req.body;
  
  const query = 'UPDATE medications SET last_taken = ? WHERE id = ?';
  
  db.run(query, [lastTaken, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    res.json({ message: 'Medication updated successfully' });
  });
});

// Delete medication
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM medications WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    res.json({ message: 'Medication deleted successfully' });
  });
});

const express = require('express');
const Medication = require('../models/Medication');

// GET all medications for a patient
router.get('/:patientId', async (req, res) => {
try {
const meds = await Medication.find({ patientId: req.params.patientId });
res.json(meds);
} catch (err) {
res.status(500).json({ message: err.message });
}
});




module.exports = router;                