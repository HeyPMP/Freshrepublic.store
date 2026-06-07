const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const { sellerAuth } = require('../middleware/auth');

const router = express.Router();

// Create Product (Seller)
router.post('/create', sellerAuth, async (req, res) => {
  try {
    const { name, description, category, brand, price, discountPrice, stock, sizes, colors, images } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const seller = await Seller.findOne({ id: req.user.id });
    const productId = `PRD-${uuidv4().substring(0, 8).toUpperCase()}`;

    const product = await Product.create({
      id: productId,
      sellerId: req.user.id,
      sellerName: seller.storeName,
      name,
      description,
      category,
      brand,
      price,
      discountPrice: discountPrice || price,
      stock: stock || 0,
      sizes: sizes || [],
      colors: colors || [],
      images: images || [],
      image: images && images[0] ? images[0] : ''
    });

    await Seller.findOneAndUpdate(
      { id: req.user.id },
      { $push: { products: product._id } }
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Product creation failed', error: error.message });
  }
});

// Get Seller's Products
router.get('/my-products', sellerAuth, async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user.id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      total: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
});

// Update Product
router.put('/:productId', sellerAuth, async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.productId, sellerId: req.user.id });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { id: req.params.productId },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Product updated',
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed', error: error.message });
  }
});

// Delete Product
router.delete('/:productId', sellerAuth, async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.productId, sellerId: req.user.id });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(product._id);
    await Seller.findOneAndUpdate(
      { id: req.user.id },
      { $pull: { products: product._id } }
    );

    res.json({
      success: true,
      message: 'Product deleted'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed', error: error.message });
  }
});

// Get Product Details
router.get('/:productId', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.productId });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch product', error: error.message });
  }
});

// Get All Products (Public - for storefront)
router.get('/', async (req, res) => {
  try {
    const { category, seller, search } = req.query;
    let query = { status: 'Active', stock: { $gt: 0 } };

    if (category) query.category = category;
    if (seller) query.sellerId = seller;
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await Product.find(query).limit(50);

    res.json({
      success: true,
      total: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
});

module.exports = router;
