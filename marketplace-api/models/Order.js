const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  customerId: { type: String, required: true },
  customerName: String,
  sellerId: { type: String, required: true },
  sellerName: String,
  items: [{
    productId: String,
    productName: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  totalAmount: { type: Number, required: true },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    phone: String
  },
  status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'], default: 'Pending' },
  paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['Credit Card', 'Debit Card', 'UPI', 'Wallet', 'COD'], default: 'COD' },
  trackingNumber: String,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  returnRequest: {
    status: String,
    reason: String,
    requestedAt: Date,
    approvedAt: Date
  },
  placedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
