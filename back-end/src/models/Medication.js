class Medication {
  constructor(data) {
    this.id = data.id;
    this.patientId = data.patient_id;
    this.name = data.name;
    this.dosage = data.dosage;
    this.frequency = data.frequency;
    this.lastTaken = data.last_taken;
    this.createdAt = data.created_at;
  }

  static validate(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Medication name is required');
    }
    
    if (!data.dosage || data.dosage.trim().length === 0) {
      errors.push('Dosage is required');
    }
    
    if (!data.frequency || data.frequency.trim().length === 0) {
      errors.push('Frequency is required');
    }
    
    return errors;
  }

  isDue() {
    if (!this.lastTaken) return true;
    
    const lastTakenDate = new Date(this.lastTaken);
    const now = new Date();
    const hoursSinceLastTaken = (now - lastTakenDate) / (1000 * 60 * 60);
    
    // Simple logic - can be enhanced based on frequency
    if (this.frequency.toLowerCase().includes('daily')) {
      return hoursSinceLastTaken >= 24;
    } else if (this.frequency.toLowerCase().includes('twice')) {
      return hoursSinceLastTaken >= 12;
    }
    
    return hoursSinceLastTaken >= 8; // Default
  }
}

module.exports = Medication;



