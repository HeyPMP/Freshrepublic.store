require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✓ MongoDB connected'))
.catch(err => console.error('✗ MongoDB connection failed:', err.message));

// Routes
app.use('/api/sellers', require('./routes/sellers'));
app.use('/api/products', require('./routes/products'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payouts', require('./routes/payouts'));
app.use('/api/admin', require('./routes/admin'));

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/sellers.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'sellers.html'));
});

app.get('/admin-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin-dashboard.html'));
});

app.get('/seller-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'seller-dashboard.html'));
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Start Server
const PORT = process.env.PORT || 4170;
app.listen(PORT, () => {
  console.log(`\n🚀 Fresh Republic API Server Running on http://localhost:${PORT}`);
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin-dashboard.html`);
  console.log(`🏪 Seller Dashboard: http://localhost:${PORT}/seller-dashboard.html`);
  console.log(`🛍️  Customer Website: http://localhost:${PORT}`);
  console.log(`\n📝 API Endpoints:`);
  console.log(`   POST /api/sellers/register - Register seller`);
  console.log(`   POST /api/sellers/login - Seller login`);
  console.log(`   POST /api/customers/register - Register customer`);
  console.log(`   POST /api/customers/login - Customer login`);
  console.log(`   POST /api/admin/login - Admin login`);
  console.log(`   GET /api/products - Get all products`);
  console.log(`   GET /api/health - Health check\n`);
});
