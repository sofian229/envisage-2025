class Activity {
  constructor(data) {
    this.id = data.id;
    this.patientId = data.patient_id;
    this.type = data.type;
    this.duration = data.duration;
    this.completed = data.completed;
    this.activityDate = data.activity_date;
    this.notes = data.notes;
    this.createdAt = data.created_at;
  }

  static validate(data) {
    const errors = [];
    
    if (!data.type || data.type.trim().length === 0) {
      errors.push('Activity type is required');
    }
    
    if (!data.activityDate) {
      errors.push('Activity date is required');
    }
    
    return errors;
  }

  static getActivityTypes() {
    return [
      'Exercise',
      'Memory Games',
      'Music Therapy',
      'Walking',
      'Reading',
      'Social Interaction',
      'Art Therapy',
      'Cooking',
      'Gardening',
      'Meditation'
    ];
  }
}

module.exports = Activity;