const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Seller = require('../models/Seller');
const { customerAuth, sellerAuth } = require('../middleware/auth');

const router = express.Router();

// Create Order (Customer)
router.post('/create', customerAuth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0 || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const customer = await Customer.findOne({ id: req.user.id });
    let totalAmount = 0;

    // Group items by seller
    const ordersBySeller = {};

    for (const item of items) {
      const product = await Product.findOne({ id: item.productId });
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }

      const itemTotal = (product.discountPrice || product.price) * item.quantity;
      totalAmount += itemTotal;

      if (!ordersBySeller[product.sellerId]) {
        ordersBySeller[product.sellerId] = [];
      }

      ordersBySeller[product.sellerId].push({
        productId: product.id,
        productName: product.name,
        price: product.discountPrice || product.price,
        quantity: item.quantity,
        image: product.image
      });

      // Update product stock
      await Product.findOneAndUpdate(
        { id: product.id },
        { $inc: { stock: -item.quantity, totalSold: item.quantity } }
      );
    }

    // Create order for each seller
    const createdOrders = [];
    for (const [sellerId, sellerItems] of Object.entries(ordersBySeller)) {
      const seller = await Seller.findOne({ id: sellerId });
      const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const orderId = `ORD-${uuidv4().substring(0, 8).toUpperCase()}`;
      const order = await Order.create({
        id: orderId,
        customerId: req.user.id,
        customerName: customer.name,
        sellerId,
        sellerName: seller ? seller.storeName : 'Unknown',
        items: sellerItems,
        totalAmount: sellerTotal,
        shippingAddress,
        paymentMethod: paymentMethod || 'COD'
      });

      createdOrders.push(order);

      // Update seller metrics
      await Seller.findOneAndUpdate(
        { id: sellerId },
        {
          $inc: {
            totalRevenue: sellerTotal,
            totalOrders: 1,
            totalEarnings: sellerTotal * (1 - seller.commissionRate / 100)
          }
        }
      );
    }

    // Update customer metrics
    await Customer.findOneAndUpdate(
      { id: req.user.id },
      {
        $inc: {
          totalOrders: createdOrders.length,
          totalSpent: totalAmount
        },
        $push: { orders: { $each: createdOrders.map(o => o._id) } }
      }
    );

    res.status(201).json({
      success: true,
      message: 'Order(s) placed successfully',
      data: createdOrders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Order creation failed', error: error.message });
  }
});

// Get Seller's Orders
router.get('/seller-orders', sellerAuth, async (req, res) => {
  try {
    const orders = await Order.find({ sellerId: req.user.id }).sort({ placedAt: -1 });

    res.json({
      success: true,
      total: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
});

// Update Order Status (Seller)
router.put('/:orderId/status', sellerAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status required' });
    }

    const order = await Order.findOne({ id: req.params.orderId, sellerId: req.user.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const updateData = { status, updatedAt: Date.now() };
    if (status === 'Shipped') updateData.shippedAt = Date.now();
    if (status === 'Delivered') updateData.deliveredAt = Date.now();
    if (status === 'Cancelled') updateData.cancelledAt = Date.now();

    const updatedOrder = await Order.findOneAndUpdate(
      { id: req.params.orderId },
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: 'Order status updated',
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed', error: error.message });
  }
});

// Get Order Details
router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order', error: error.message });
  }
});

module.exports = router;
