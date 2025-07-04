const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/database.cjs');

const router = express.Router();
const db = database.getDB();

// Get activities for a patient
router.get('/patient/:patientId', (req, res) => {
  const { patientId } = req.params;
  
  db.all('SELECT * FROM activities WHERE patient_id = ? ORDER BY activity_date DESC', [patientId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Add activity
router.post('/', [
  body('patientId').isInt().withMessage('Valid patient ID is required'),
  body('type').notEmpty().withMessage('Activity type is required'),
  body('activityDate').isISO8601().withMessage('Valid date is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { patientId, type, duration, activityDate, notes } = req.body;
  
  const query = `
    INSERT INTO activities (patient_id, type, duration, activity_date, notes)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(query, [patientId, type, duration, activityDate, notes], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({
      id: this.lastID,
      patientId,
      type,
      duration,
      activityDate,
      notes,
      completed: false
    });
  });
});

// Update activity completion
router.put('/:id/complete', (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  
  const query = 'UPDATE activities SET completed = ? WHERE id = ?';
  
  db.run(query, [completed, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    res.json({ message: 'Activity updated successfully' });
  });
});

module.exports = router;