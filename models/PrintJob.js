const mongoose = require('mongoose');

const printJobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  proxyUrl: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    required: true
  },
  pointsUsed: {
    type: Number,
    default: 0
  },
  printSettings: {
    copies: {
      type: Number,
      default: 1,
      min: 1,
      max: 100
    },
    pageRange: {
      type: String,
      default: 'all'
    },
    customPageRange: {
      type: String,
      default: ''
    },
    layout: {
      type: String,
      enum: ['portrait', 'landscape'],
      default: 'portrait'
    },
    printBothSides: {
      type: Boolean,
      default: false
    },
    paperSize: {
      type: String,
      enum: ['a4', 'a3', 'letter', 'legal'],
      default: 'a4'
    },
    colorMode: {
      type: String,
      enum: ['color', 'bw'],
      default: 'color'
    },
    totalPages: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  printedByBooth: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BoothManager',
    default: null
  },
  printedAt: {
    type: Date,
    default: null
  },
  paperUsed: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const PrintJob = mongoose.model('PrintJob', printJobSchema);

module.exports = PrintJob; 