const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  sellerId: { type: String, required: true },
  sellerName: String,
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Processing', 'Completed', 'Failed'], default: 'Pending' },
  bankDetails: {
    accountHolder: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },
  transactionId: String,
  requestedAt: { type: Date, default: Date.now },
  processedAt: Date,
  completedAt: Date,
  notes: String
});

module.exports = mongoose.model('Payout', payoutSchema);
