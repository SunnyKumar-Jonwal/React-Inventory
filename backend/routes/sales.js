const express = require('express');
const { body, validationResult } = require('express-validator');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { canMakeSales, canViewReports } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const saleValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items array is required and must have at least one item'),
  body('items.*.product')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('paymentMethod')
    .isIn(['cash', 'card', 'upi', 'bank_transfer', 'cheque'])
    .withMessage('Invalid payment method'),
  body('customer.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
];

// @route   GET /api/sales
// @desc    Get all sales with filtering and pagination
// @access  Private (Sales Executive and above)
router.get('/', canMakeSales, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      salesPerson,
      paymentStatus,
      status = 'completed',
      sortBy = 'saleDate',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (status !== 'all') query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (salesPerson) query.salesPerson = salesPerson;
    
    // Date range filter
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    // If user is not super_admin or accountant, only show their own sales
    if (!['super_admin', 'accountant'].includes(req.user.role)) {
      query.salesPerson = req.user._id;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const sales = await Sale.find(query)
      .populate('salesPerson', 'username fullName')
      .populate('items.product', 'name sku category')
      .populate('createdBy', 'username fullName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Sale.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    // Get summary statistics
    const totalRevenue = await Sale.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      sales,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      stats: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalSales: total
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Server error while fetching sales' });
  }
});

// @route   GET /api/sales/:id
// @desc    Get single sale by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('salesPerson', 'username fullName')
      .populate('items.product', 'name sku category brand')
      .populate('createdBy', 'username fullName')
      .populate('updatedBy', 'username fullName');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Check if user can view this sale
    if (!['super_admin', 'accountant'].includes(req.user.role) && 
        sale.salesPerson._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this sale' });
    }

    res.json({ sale });
  } catch (error) {
    console.error('Get sale error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.status(500).json({ message: 'Server error while fetching sale' });
  }
});

// @route   POST /api/sales
// @desc    Create new sale
// @access  Private (Sales Executive and above)
router.post('/', canMakeSales, saleValidation, async (req, res) => {
  try {
    console.log('Sale creation request body:', JSON.stringify(req.body, null, 2));
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { items, customer, paymentMethod, paymentStatus, taxPercentage = 0, notes } = req.body;
    console.log('Extracted fields:', { items, customer, paymentMethod, paymentStatus, taxPercentage, notes });

    // Validate and prepare sale items
    const saleItems = [];
    const productUpdates = [];

    for (const item of items) {
      console.log('Processing item:', item);
      const product = await Product.findById(item.product);
      if (!product) {
        console.log('Product not found:', item.product);
        return res.status(400).json({ 
          message: `Product not found: ${item.product}` 
        });
      }

      console.log('Found product:', product.name, 'Stock:', product.quantity);

      if (product.status !== 'active') {
        return res.status(400).json({ 
          message: `Product ${product.name} is not available for sale` 
        });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}` 
        });
      }

      // Calculate item total
      const unitPrice = item.unitPrice || product.sellingPrice;
      const discountPercentage = item.discountPercentage || product.discountPercentage || 0;
      const itemTotal = item.quantity * unitPrice;
      const discountAmount = itemTotal * (discountPercentage / 100);
      const totalPrice = itemTotal - discountAmount;

      saleItems.push({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice,
        discountPercentage,
        totalPrice
      });

      // Prepare stock update
      productUpdates.push({
        productId: product._id,
        newQuantity: product.quantity - item.quantity
      });
    }

    console.log('Sale items prepared:', saleItems);

    // Generate invoice number
    const invoiceNumber = await Sale.generateInvoiceNumber();
    console.log('Generated invoice number:', invoiceNumber);

    // Calculate totals
    const subtotal = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalDiscount = saleItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      return sum + (itemTotal * (item.discountPercentage / 100));
    }, 0);
    const taxAmount = subtotal * (taxPercentage / 100);
    const totalAmount = subtotal + taxAmount;

    console.log('Calculated totals:', { subtotal, totalDiscount, taxAmount, totalAmount });

    // Create sale
    const saleData = {
      invoiceNumber,
      items: saleItems,
      customer: customer || {},
      paymentMethod,
      paymentStatus: paymentStatus || 'paid',
      subtotal,
      totalDiscount,
      taxAmount,
      taxPercentage,
      totalAmount,
      notes,
      salesPerson: req.user._id,
      createdBy: req.user._id
    };

    // Set amountPaid based on payment status
    if (saleData.paymentStatus === 'paid') {
      saleData.amountPaid = totalAmount;
    } else {
      saleData.amountPaid = req.body.amountPaid || 0;
    }

    console.log('Sale data before save:', JSON.stringify(saleData, null, 2));

    const sale = new Sale(saleData);
    console.log('Sale instance created, attempting to save...');
    await sale.save();
    console.log('Sale saved successfully with ID:', sale._id);

    // Update product quantities
    for (const update of productUpdates) {
      await Product.findByIdAndUpdate(
        update.productId,
        { 
          quantity: update.newQuantity,
          updatedBy: req.user._id
        }
      );
    }

    // Populate and return sale
    const populatedSale = await Sale.findById(sale._id)
      .populate('salesPerson', 'username fullName')
      .populate('items.product', 'name sku category')
      .populate('createdBy', 'username fullName');

    res.status(201).json({
      message: 'Sale created successfully',
      sale: populatedSale
    });
  } catch (error) {
    console.error('Create sale error:', error);
    console.error('Error stack:', error.stack);
    if (error.name === 'ValidationError') {
      console.error('Validation error details:', error.errors);
      return res.status(400).json({ 
        message: 'Validation error', 
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    res.status(500).json({ message: 'Server error while creating sale' });
  }
});

// @route   PUT /api/sales/:id
// @desc    Update sale (limited fields)
// @access  Private (Sales Executive and above)
router.put('/:id', canMakeSales, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Check if user can update this sale
    if (!['super_admin'].includes(req.user.role) && 
        sale.salesPerson.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to update this sale' });
    }

    // Only allow updating certain fields
    const allowedUpdates = ['customer', 'paymentStatus', 'amountPaid', 'notes', 'status'];
    const updates = {};
    
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    updates.updatedBy = req.user._id;

    const updatedSale = await Sale.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('salesPerson', 'username fullName')
    .populate('items.product', 'name sku category')
    .populate('createdBy', 'username fullName')
    .populate('updatedBy', 'username fullName');

    res.json({
      message: 'Sale updated successfully',
      sale: updatedSale
    });
  } catch (error) {
    console.error('Update sale error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.status(500).json({ message: 'Server error while updating sale' });
  }
});

// @route   POST /api/sales/:id/refund
// @desc    Process sale refund
// @access  Private (Sales Executive and above)
router.post('/:id/refund', canMakeSales, [
  body('reason')
    .notEmpty()
    .withMessage('Refund reason is required'),
  body('refundItems')
    .optional()
    .isArray()
    .withMessage('Refund items must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { reason, refundItems } = req.body;
    const sale = await Sale.findById(req.params.id).populate('items.product');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    if (sale.status === 'refunded') {
      return res.status(400).json({ message: 'Sale is already refunded' });
    }

    // Process full or partial refund
    if (refundItems && refundItems.length > 0) {
      // Partial refund - update specific items
      for (const refundItem of refundItems) {
        const saleItem = sale.items.find(item => 
          item.product._id.toString() === refundItem.productId
        );
        
        if (saleItem && refundItem.quantity <= saleItem.quantity) {
          // Return stock
          await Product.findByIdAndUpdate(
            refundItem.productId,
            { $inc: { quantity: refundItem.quantity } }
          );
        }
      }
    } else {
      // Full refund - return all stock
      for (const item of sale.items) {
        await Product.findByIdAndUpdate(
          item.product._id,
          { $inc: { quantity: item.quantity } }
        );
      }
    }

    // Update sale status
    sale.status = 'refunded';
    sale.paymentStatus = 'refunded';
    sale.notes = `${sale.notes || ''}\nRefund processed: ${reason}`;
    sale.updatedBy = req.user._id;
    await sale.save();

    res.json({
      message: 'Refund processed successfully',
      sale
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ message: 'Server error while processing refund' });
  }
});

// @route   GET /api/sales/reports/daily
// @desc    Get daily sales report
// @access  Private (Accountant and above)
router.get('/reports/daily', canViewReports, async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dailySales = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startOfDay, $lte: endOfDay },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalDiscount: { $sum: '$totalDiscount' },
          totalTax: { $sum: '$taxAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    const paymentMethodBreakdown = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startOfDay, $lte: endOfDay },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.json({
      date,
      summary: dailySales[0] || {
        totalSales: 0,
        totalRevenue: 0,
        totalDiscount: 0,
        totalTax: 0,
        averageOrderValue: 0
      },
      paymentMethodBreakdown
    });
  } catch (error) {
    console.error('Daily sales report error:', error);
    res.status(500).json({ message: 'Server error while generating daily report' });
  }
});

module.exports = router;
