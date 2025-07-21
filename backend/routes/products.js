const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const { canManageInventory, canViewReports } = require('../middleware/auth');
const { uploadProductImage } = require('../middleware/upload');

const router = express.Router();

// Validation rules
const productValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters')
    .trim(),
  body('category')
    .isIn(['books', 'electronics'])
    .withMessage('Category must be either books or electronics'),
  body('sku')
    .isLength({ min: 1, max: 50 })
    .withMessage('SKU is required and must be less than 50 characters')
    .trim(),
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  body('minStockLevel')
    .isInt({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative integer'),
  body('costPrice')
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number'),
  body('sellingPrice')
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a positive number'),
  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100')
];

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Private (Inventory Manager and above)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status = 'active',
      search,
      lowStock,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (category) query.category = category;
    if (status !== 'all') query.status = status;
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$minStockLevel'] };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const products = await Product.find(query)
      .populate('createdBy', 'username fullName')
      .populate('updatedBy', 'username fullName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    // Get low stock count
    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ['$quantity', '$minStockLevel'] },
      status: 'active'
    });

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      stats: {
        lowStockCount,
        totalActiveProducts: await Product.countDocuments({ status: 'active' })
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'username fullName')
      .populate('updatedBy', 'username fullName');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server error while fetching product' });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Inventory Manager and above)
router.post('/', canManageInventory, productValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: req.body.sku.toUpperCase() });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }

    // Create product
    const productData = {
      ...req.body,
      sku: req.body.sku.toUpperCase(),
      createdBy: req.user._id
    };

    const product = new Product(productData);
    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate('createdBy', 'username fullName');

    res.status(201).json({
      message: 'Product created successfully',
      product: populatedProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }
    res.status(500).json({ message: 'Server error while creating product' });
  }
});

// @route   POST /api/products/with-image
// @desc    Create new product with image upload
// @access  Private (Inventory Manager and above)
router.post('/with-image', canManageInventory, uploadProductImage, async (req, res) => {
  try {
    // Parse JSON data from form data
    let productData;
    try {
      productData = JSON.parse(req.body.productData);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid product data format' });
    }

    // Validate required fields manually since we're using form data
    if (!productData.name || !productData.category || !productData.sku || 
        productData.quantity === undefined || productData.costPrice === undefined || 
        productData.sellingPrice === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: productData.sku.toUpperCase() });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }

    // Add image URL if file was uploaded
    if (req.file) {
      productData.image = `/uploads/${req.file.filename}`;
    }

    // Create product
    const finalProductData = {
      ...productData,
      sku: productData.sku.toUpperCase(),
      createdBy: req.user._id
    };

    const product = new Product(finalProductData);
    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate('createdBy', 'username fullName');

    res.status(201).json({
      message: 'Product created successfully',
      product: populatedProduct
    });
  } catch (error) {
    console.error('Create product with image error:', error);
    res.status(500).json({ message: 'Server error while creating product' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Inventory Manager and above)
router.put('/:id', canManageInventory, productValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if SKU already exists (excluding current product)
    if (req.body.sku && req.body.sku.toUpperCase() !== product.sku) {
      const existingProduct = await Product.findOne({ 
        sku: req.body.sku.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (existingProduct) {
        return res.status(400).json({ message: 'Product with this SKU already exists' });
      }
    }

    // Update product
    const updateData = {
      ...req.body,
      sku: req.body.sku ? req.body.sku.toUpperCase() : product.sku,
      updatedBy: req.user._id
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'username fullName')
    .populate('updatedBy', 'username fullName');

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }
    res.status(500).json({ message: 'Server error while updating product' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (soft delete by setting status to inactive)
// @access  Private (Inventory Manager and above)
router.delete('/:id', canManageInventory, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Soft delete by updating status
    product.status = 'inactive';
    product.updatedBy = req.user._id;
    await product.save();

    res.json({
      message: 'Product deleted successfully',
      product
    });
  } catch (error) {
    console.error('Delete product error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server error while deleting product' });
  }
});

// @route   PATCH /api/products/:id/stock
// @desc    Update product stock quantity
// @access  Private (Inventory Manager and above)
router.patch('/:id/stock', canManageInventory, [
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  body('operation')
    .isIn(['set', 'add', 'subtract'])
    .withMessage('Operation must be set, add, or subtract')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { quantity, operation = 'set', reason } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let newQuantity;
    switch (operation) {
      case 'add':
        newQuantity = product.quantity + quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, product.quantity - quantity);
        break;
      case 'set':
      default:
        newQuantity = quantity;
        break;
    }

    product.quantity = newQuantity;
    product.updatedBy = req.user._id;
    await product.save();

    res.json({
      message: 'Stock updated successfully',
      product,
      previousQuantity: operation === 'set' ? null : 
        (operation === 'add' ? product.quantity - quantity : product.quantity + quantity),
      newQuantity
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ message: 'Server error while updating stock' });
  }
});

// @route   GET /api/products/low-stock
// @desc    Get products with low stock
// @access  Private
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$quantity', '$minStockLevel'] },
      status: 'active'
    })
    .populate('createdBy', 'username fullName')
    .sort({ quantity: 1 });

    res.json({
      message: 'Low stock products retrieved successfully',
      count: lowStockProducts.length,
      products: lowStockProducts
    });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ message: 'Server error while fetching low stock products' });
  }
});

// @route   PUT /api/products/:id/image
// @desc    Update product image
// @access  Private (Inventory Manager and above)
router.put('/:id/image', canManageInventory, uploadProductImage, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.file) {
      product.image = `/uploads/${req.file.filename}`;
      product.updatedBy = req.user._id;
      await product.save();

      const populatedProduct = await Product.findById(product._id)
        .populate('createdBy', 'username fullName')
        .populate('updatedBy', 'username fullName');

      res.json({
        message: 'Product image updated successfully',
        product: populatedProduct
      });
    } else {
      res.status(400).json({ message: 'No image file provided' });
    }
  } catch (error) {
    console.error('Update product image error:', error);
    res.status(500).json({ message: 'Server error while updating product image' });
  }
});

module.exports = router;
