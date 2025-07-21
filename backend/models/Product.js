const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: [
      'books', 
      'electronics', 
      'stationery', 
      'electrical', 
      'festival_items',
      'study_guides'
    ],
    required: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  barcode: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  // Book-specific fields
  author: {
    type: String,
    trim: true
  },
  publisher: {
    type: String,
    trim: true
  },
  isbn: {
    type: String,
    trim: true
  },
  genre: {
    type: String,
    trim: true
  },
  // Electronics-specific fields
  specifications: {
    type: Map,
    of: String
  },
  warranty: {
    period: {
      type: Number, // in months
      default: 0
    },
    description: {
      type: String,
      trim: true
    }
  },
  // Inventory fields
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minStockLevel: {
    type: Number,
    required: true,
    min: 0,
    default: 5
  },
  maxStockLevel: {
    type: Number,
    min: 0
  },
  // Pricing fields
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Supplier information
  supplier: {
    name: {
      type: String,
      trim: true
    },
    contact: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  // Product status
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  // Images
  images: [{
    url: String,
    alt: String
  }],
  // Product image
  image: {
    type: String,
    trim: true,
    default: null // URL to the product image
  },
  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
productSchema.index({ category: 1, status: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ sku: 1 });
productSchema.index({ quantity: 1 });

// Virtual for low stock check
productSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.minStockLevel;
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  return ((this.sellingPrice - this.costPrice) / this.costPrice * 100).toFixed(2);
});

// Virtual for final price after discount
productSchema.virtual('finalPrice').get(function() {
  return this.sellingPrice * (1 - this.discountPercentage / 100);
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
