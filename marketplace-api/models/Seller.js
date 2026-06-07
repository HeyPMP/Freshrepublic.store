const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  storeName: { type: String, required: true },
  storeDescription: String,
  phone: String,
  status: { type: String, enum: ['Active', 'Pending', 'Suspended', 'Rejected'], default: 'Pending' },
  kycStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
  kycDocuments: {
    aadhar: String,
    pan: String,
    bankAccount: String,
    businessLicense: String
  },
  bankDetails: {
    accountHolder: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },
  commissionRate: { type: Number, default: 14 },
  totalRevenue: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  rating: { type: Number, default: 4.5 },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Seller', sellerSchema);
