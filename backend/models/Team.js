const mongoose = require('mongoose');

// Selected Teams Schema
const selectedTeamSchema = new mongoose.Schema({
  
teamId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  teamName: {
    type: String,
    required: true,
    trim: true
  },
  college: {
    type: String,
    default: 'Malnad College of Engineering'
  },
  members: {
    type: [String],
    default: []
  },
  contactNumber: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  isCheckedIn: {
    type: Boolean,
    default: false
  },
  checkInTime: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Registration Done Schema
const registrationDoneSchema = new mongoose.Schema({
  teamId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  teamName: {
    type: String,
    required: true
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    default: 'present'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
selectedTeamSchema.index({ teamId: 1 });
selectedTeamSchema.index({ isCheckedIn: 1 });
registrationDoneSchema.index({ teamId: 1 });

// Models
const SelectedTeam = mongoose.model('SelectedTeam', selectedTeamSchema);
const RegistrationDone = mongoose.model('RegistrationDone', registrationDoneSchema);

module.exports = {
  SelectedTeam,
  RegistrationDone
};