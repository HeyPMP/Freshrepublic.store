const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { customerAuth } = require('../middleware/auth');

const router = express.Router();

// Register Customer
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const customerId = `CUST-${uuidv4().substring(0, 8).toUpperCase()}`;

    const customer = await Customer.create({
      id: customerId,
      name,
      email,
      password: hashedPassword,
      phone
    });

    const token = jwt.sign(
      { id: customer.id, email: customer.email, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email
      },
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
});

// Login Customer
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: customer.id, email: customer.email, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: 'Login successful',
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        status: customer.status,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent
      },
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

// Get Customer Profile
router.get('/profile', customerAuth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ id: req.user.id });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
});

// Get Customer Orders
router.get('/orders', customerAuth, async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.id }).sort({ placedAt: -1 });

    res.json({
      success: true,
      total: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
});

module.exports = router;
