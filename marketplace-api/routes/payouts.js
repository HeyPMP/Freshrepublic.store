const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Payout = require('../models/Payout');
const Seller = require('../models/Seller');
const Order = require('../models/Order');
const { adminAuth, sellerAuth } = require('../middleware/auth');

const router = express.Router();

// Request Payout (Seller)
router.post('/request', sellerAuth, async (req, res) => {
  try {
    const seller = await Seller.findOne({ id: req.user.id });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    if (!seller.bankDetails || !seller.bankDetails.accountNumber) {
      return res.status(400).json({ success: false, message: 'Bank details not configured' });
    }

    const payoutId = `PAYOUT-${uuidv4().substring(0, 8).toUpperCase()}`;
    const payout = await Payout.create({
      id: payoutId,
      sellerId: req.user.id,
      sellerName: seller.storeName,
      amount: seller.totalEarnings,
      bankDetails: seller.bankDetails
    });

    res.status(201).json({
      success: true,
      message: 'Payout request created',
      data: payout
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Payout request failed', error: error.message });
  }
});

// Get Payouts (Seller)
router.get('/my-payouts', sellerAuth, async (req, res) => {
  try {
    const payouts = await Payout.find({ sellerId: req.user.id }).sort({ requestedAt: -1 });

    res.json({
      success: true,
      total: payouts.length,
      data: payouts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payouts', error: error.message });
  }
});

// Get All Payouts (Admin)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const payouts = await Payout.find().sort({ requestedAt: -1 });

    res.json({
      success: true,
      total: payouts.length,
      data: payouts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payouts', error: error.message });
  }
});

// Approve Payout (Admin)
router.put('/:payoutId/approve', adminAuth, async (req, res) => {
  try {
    const payout = await Payout.findOneAndUpdate(
      { id: req.params.payoutId },
      {
        status: 'Completed',
        processedAt: Date.now(),
        completedAt: Date.now(),
        transactionId: `TXN-${uuidv4().substring(0, 12).toUpperCase()}`
      },
      { new: true }
    );

    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout not found' });
    }

    // Reset seller earnings
    await Seller.findOneAndUpdate(
      { id: payout.sellerId },
      { totalEarnings: 0 }
    );

    res.json({
      success: true,
      message: 'Payout approved and processed',
      data: payout
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Approval failed', error: error.message });
  }
});

module.exports = router;
