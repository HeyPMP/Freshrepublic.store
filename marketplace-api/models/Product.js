const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  sellerId: { type: String, required: true },
  sellerName: String,
  name: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  brand: String,
  price: { type: Number, required: true },
  discountPrice: Number,
  image: String,
  images: [String],
  sizes: [String],
  colors: [Array],
  stock: { type: Number, default: 0 },
  status: { type: String, enum: ['Draft', 'Pending Approval', 'Active', 'Rejected', 'Out of Stock'], default: 'Draft' },
  gender: String,
  fabric: String,
  fit: String,
  occasion: String,
  sleeveType: String,
  neckType: String,
  styleHighlights: String,
  sku: String,
  totalSold: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
