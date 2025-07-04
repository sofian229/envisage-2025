// database/init.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const Patient = require('../models/Patient');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dementia_caretaker';

// Sample data
const samplePatients = [
  {
    name: "John Smith",
    age: 78,
    condition: "Mild Dementia",
    lastCheckup: new Date("2024-06-05"),
    emergencyContact: "Mary Smith - 555-0123",
    medications: [
      {
        name: "Donepezil",
        dosage: "10mg",
        times: { morning: true, lunch: false, dinner: false, emptyStomach: false },
        completedTimes: { morning: true, lunch: false, dinner: false, emptyStomach: false },
        dateAdded: new Date("2024-06-07")
      },
      {
        name: "Memantine",
        dosage: "20mg",
        times: { morning: true, lunch: false, dinner: true, emptyStomach: false },
        completedTimes: { morning: false, lunch: false, dinner: false, emptyStomach: false },
        dateAdded: new Date("2024-06-07")
      }
    ],
    activities: [
      { type: "Exercise", duration: "30 min", completed: true, date: new Date("2024-06-07") },
      { type: "Memory Games", duration: "15 min", completed: false, date: new Date("2024-06-07") }
    ]
  },
  {
    name: "Emma Johnson",
    age: 82,
    condition: "Moderate Dementia",
    lastCheckup: new Date("2024-06-03"),
    emergencyContact: "Robert Johnson - 555-0456",
    medications: [
      {
        name: "Galantamine",
        dosage: "8mg",
        times: { morning: false, lunch: true, dinner: true, emptyStomach: false },
        completedTimes: { morning: false, lunch: true, dinner: false, emptyStomach: false },
        dateAdded: new Date("2024-06-07")
      }
    ],
    activities: [
      { type: "Music Therapy", duration: "45 min", completed: true, date: new Date("2024-06-07") },
      { type: "Walking", duration: "20 min", completed: true, date: new Date("2024-06-07") }
    ]
  }
];

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Patient.deleteMany({});
    console.log('🗑️  Cleared existing patient data');

    // Insert sample data
    const patients = await Patient.insertMany(samplePatients);
    console.log(`✅ Inserted ${patients.length} sample patients`);

    // Display inserted patients
    console.log('\n📋 Sample Patients Created:');
    patients.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.name} (Age: ${patient.age})`);
      console.log(`   Medications: ${patient.medications.length}`);
      console.log(`   Activities: ${patient.activities.length}`);
    });

    console.log('\n🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
