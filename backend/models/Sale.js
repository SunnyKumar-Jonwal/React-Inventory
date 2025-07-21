const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
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
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
});

const saleSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  items: [saleItemSchema],
  // Customer information
  customer: {
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  // Payment information
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque'],
    required: true,
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'partial', 'pending', 'refunded'],
    default: 'paid'
  },
  // Financial fields
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  totalDiscount: {
    type: Number,
    min: 0,
    default: 0
  },
  taxAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  taxPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  amountPaid: {
    type: Number,
    min: 0,
    default: 0
  },
  amountDue: {
    type: Number,
    min: 0,
    default: 0
  },
  // Sale metadata
  saleDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled', 'refunded'],
    default: 'completed'
  },
  // Tracking
  salesPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
saleSchema.index({ invoiceNumber: 1 });
saleSchema.index({ saleDate: -1 });
saleSchema.index({ salesPerson: 1, saleDate: -1 });
saleSchema.index({ 'customer.email': 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ paymentStatus: 1 });

// Pre-save middleware to calculate totals
saleSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    const discountAmount = itemTotal * (item.discountPercentage / 100);
    return sum + (itemTotal - discountAmount);
  }, 0);

  // Calculate total discount
  this.totalDiscount = this.items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    return sum + (itemTotal * (item.discountPercentage / 100));
  }, 0);

  // Calculate tax amount
  this.taxAmount = this.subtotal * (this.taxPercentage / 100);

  // Calculate total amount
  this.totalAmount = this.subtotal + this.taxAmount;

  // Calculate amount due
  this.amountDue = this.totalAmount - this.amountPaid;

  next();
});

// Static method to generate invoice number
saleSchema.statics.generateInvoiceNumber = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const prefix = `INV-${year}${month}${day}`;
  
  // Find the last invoice of the day
  const lastSale = await this.findOne({
    invoiceNumber: { $regex: `^${prefix}` }
  }).sort({ invoiceNumber: -1 });

  let sequence = 1;
  if (lastSale) {
    const lastSequence = parseInt(lastSale.invoiceNumber.split('-').pop());
    sequence = lastSequence + 1;
  }

  return `${prefix}-${String(sequence).padStart(3, '0')}`;
};

module.exports = mongoose.model('Sale', saleSchema);
