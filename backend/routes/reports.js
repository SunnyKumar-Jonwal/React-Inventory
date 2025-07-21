const express = require('express');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const User = require('../models/User');
const { canViewReports, canMakeSales, authMiddleware } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

const router = express.Router();

// @route   GET /api/reports/dashboard
// @desc    Get dashboard statistics
// @access  Private (Sales Executive and above)
router.get('/dashboard', canMakeSales, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Daily stats
    const dailyStats = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startOfDay },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalDiscount: { $sum: '$totalDiscount' }
        }
      }
    ]);

    // Monthly stats
    const monthlyStats = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startOfMonth },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalDiscount: { $sum: '$totalDiscount' }
        }
      }
    ]);

    // Product stats
    const productStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          lowStockProducts: {
            $sum: { $cond: [{ $lte: ['$quantity', '$minStockLevel'] }, 1, 0] }
          },
          totalValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } }
        }
      }
    ]);

    // Top selling products (last 30 days)
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const topProducts = await Sale.aggregate([
      { $match: { saleDate: { $gte: last30Days }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    // Recent sales
    const recentSales = await Sale.find({ status: { $ne: 'cancelled' } })
      .populate('salesPerson', 'username fullName')
      .sort({ saleDate: -1 })
      .limit(5)
      .select('invoiceNumber totalAmount saleDate customer salesPerson');

    // User stats
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      daily: dailyStats[0] || { totalSales: 0, totalRevenue: 0, totalDiscount: 0 },
      monthly: monthlyStats[0] || { totalSales: 0, totalRevenue: 0, totalDiscount: 0 },
      products: productStats[0] || { 
        totalProducts: 0, 
        activeProducts: 0, 
        lowStockProducts: 0, 
        totalValue: 0 
      },
      users: userStats[0] || { totalUsers: 0, activeUsers: 0 },
      topProducts,
      recentSales
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard stats' });
  }
});

// @route   GET /api/reports/sales
// @desc    Get sales reports with date range and grouping
// @access  Private (Sales Executive can see own sales, others need canViewReports)
router.get('/sales', authMiddleware, async (req, res) => {
  try {
    console.log('=== Sales Report Route Started ===');
    const { startDate, endDate, groupBy = 'day', category, salesPerson } = req.query;
    
    console.log('Sales report request params:', { startDate, endDate, groupBy, category, salesPerson });
    console.log('User role:', req.user.role);
    console.log('User ID:', req.user._id);

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      // Set end date to end of day (23:59:59.999)
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      dateFilter.$lte = endDateTime;
    }

    // Build match stage
    const matchStage = {
      status: { $ne: 'cancelled' }
    };
    if (startDate || endDate) matchStage.saleDate = dateFilter;
    if (salesPerson) matchStage.salesPerson = salesPerson;
    
    // If user is sales_executive, only show their own sales
    if (req.user.role === 'sales_executive') {
      matchStage.salesPerson = req.user._id;
    }

    console.log('Final match stage:', JSON.stringify(matchStage, null, 2));
    console.log('Date filter:', JSON.stringify(dateFilter, null, 2));

    // Define grouping format based on groupBy parameter
    let groupFormat;
    switch (groupBy) {
      case 'week':
        groupFormat = { $dateToString: { format: '%Y-W%U', date: '$saleDate' } };
        break;
      case 'month':
        groupFormat = { $dateToString: { format: '%Y-%m', date: '$saleDate' } };
        break;
      case 'year':
        groupFormat = { $dateToString: { format: '%Y', date: '$saleDate' } };
        break;
      case 'day':
      default:
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } };
        break;
    }

    console.log('Starting sales over time aggregation...');
    // Sales over time
    const salesOverTime = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalDiscount: { $sum: '$totalDiscount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('Sales over time result:', salesOverTime);

    console.log('Starting category breakdown aggregation...');
    // Category breakdown
    const categoryBreakdown = await Sale.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      ...(category ? [{ $match: { 'productInfo.category': category } }] : []),
      {
        $group: {
          _id: '$productInfo.category',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          totalSales: { $sum: 1 }
        }
      }
    ]);

    console.log('Category breakdown result:', categoryBreakdown);

    console.log('Starting payment method breakdown aggregation...');
    // Payment method breakdown
    const paymentMethodBreakdown = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    console.log('Payment method breakdown result:', paymentMethodBreakdown);

    console.log('Starting sales person performance aggregation...');
    // Sales person performance
    const salesPersonPerformance = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$salesPerson',
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'salesPerson'
        }
      },
      { $unwind: '$salesPerson' },
      {
        $project: {
          salesPersonName: '$salesPerson.fullName',
          totalSales: 1,
          totalRevenue: 1,
          averageOrderValue: 1
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    console.log('Sales person performance result:', salesPersonPerformance);

    console.log('Preparing response...');
    const response = {
      salesOverTime,
      categoryBreakdown,
      paymentMethodBreakdown,
      salesPersonPerformance,
      summary: {
        totalSales: salesOverTime.reduce((sum, item) => sum + item.totalSales, 0),
        totalRevenue: salesOverTime.reduce((sum, item) => sum + item.totalRevenue, 0),
        totalDiscount: salesOverTime.reduce((sum, item) => sum + item.totalDiscount, 0)
      }
    };

    console.log('Response summary:', response.summary);
    console.log('Sending response...');
    res.json(response);
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ message: 'Server error while generating sales report' });
  }
});

// @route   GET /api/reports/inventory
// @desc    Get inventory reports
// @access  Private (Accountant and above)
router.get('/inventory', canViewReports, async (req, res) => {
  try {
    const { category, status = 'active' } = req.query;

    // Build query
    const query = {};
    if (category) query.category = category;
    if (status !== 'all') query.status = status;

    // Stock level distribution
    const stockLevels = await Product.aggregate([
      { $match: query },
      {
        $bucket: {
          groupBy: '$quantity',
          boundaries: [0, 1, 10, 50, 100, 500],
          default: '500+',
          output: {
            count: { $sum: 1 },
            products: { $push: { name: '$name', quantity: '$quantity', sku: '$sku' } }
          }
        }
      }
    ]);

    // Low stock products
    const lowStockProducts = await Product.find({
      ...query,
      $expr: { $lte: ['$quantity', '$minStockLevel'] }
    })
    .select('name sku quantity minStockLevel category costPrice sellingPrice')
    .sort({ quantity: 1 });

    // Category-wise inventory value
    const categoryValue = await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalCostValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
          totalSellingValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } },
          averageCostPrice: { $avg: '$costPrice' },
          averageSellingPrice: { $avg: '$sellingPrice' }
        }
      }
    ]);

    // Top valuable products
    const topValueProducts = await Product.aggregate([
      { $match: query },
      {
        $addFields: {
          totalValue: { $multiply: ['$quantity', '$costPrice'] }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: 1,
          sku: 1,
          quantity: 1,
          costPrice: 1,
          sellingPrice: 1,
          totalValue: 1,
          category: 1
        }
      }
    ]);

    // Overall inventory summary
    const inventorySummary = await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalCostValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
          totalSellingValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } },
          lowStockCount: {
            $sum: { $cond: [{ $lte: ['$quantity', '$minStockLevel'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      summary: inventorySummary[0] || {
        totalProducts: 0,
        totalQuantity: 0,
        totalCostValue: 0,
        totalSellingValue: 0,
        lowStockCount: 0
      },
      stockLevels,
      lowStockProducts,
      categoryValue,
      topValueProducts
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({ message: 'Server error while generating inventory report' });
  }
});

// @route   GET /api/reports/export
// @desc    Export reports to CSV or PDF
// @access  Private (Sales Executive can export sales, others need canViewReports)
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const { type, format = 'csv', startDate, endDate } = req.query;

    if (!['sales', 'inventory', 'users'].includes(type)) {
      return res.status(400).json({ message: 'Invalid report type' });
    }

    if (!['csv', 'pdf'].includes(format)) {
      return res.status(400).json({ message: 'Invalid format. Supported formats: csv, pdf' });
    }

    // Check permissions - sales executives can only export sales, others need canViewReports
    if (type !== 'sales' && !['super_admin', 'inventory_manager', 'accountant'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        requiredRoles: ['super_admin', 'inventory_manager', 'accountant'],
        userRole: req.user.role
      });
    }

    let data = [];
    let filename = '';

    switch (type) {
      case 'sales':
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        const salesQuery = {
          ...(startDate || endDate ? { saleDate: dateFilter } : {}),
          status: { $ne: 'cancelled' }
        };

        // If user is sales_executive, only show their own sales
        if (req.user.role === 'sales_executive') {
          salesQuery.salesPerson = req.user._id;
        }

        const sales = await Sale.find(salesQuery)
        .populate('salesPerson', 'fullName')
        .populate('items.product', 'name sku category');

        data = sales.map(sale => ({
          invoiceNumber: sale.invoiceNumber,
          saleDate: sale.saleDate.toISOString().split('T')[0],
          customerName: sale.customer?.name || 'Walk-in Customer',
          salesPerson: sale.salesPerson?.fullName || '',
          totalAmount: sale.totalAmount,
          paymentMethod: sale.paymentMethod,
          paymentStatus: sale.paymentStatus,
          status: sale.status
        }));
        filename = `sales_report_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'inventory':
        const products = await Product.find({ status: 'active' });
        data = products.map(product => ({
          name: product.name,
          sku: product.sku,
          category: product.category,
          quantity: product.quantity,
          minStockLevel: product.minStockLevel,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          totalValue: product.quantity * product.costPrice,
          status: product.status,
          isLowStock: product.quantity <= product.minStockLevel
        }));
        filename = `inventory_report_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'users':
        const users = await User.find({});
        data = users.map(user => ({
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin ? user.lastLogin.toISOString().split('T')[0] : '',
          createdAt: user.createdAt.toISOString().split('T')[0]
        }));
        filename = `users_report_${new Date().toISOString().split('T')[0]}`;
        break;
    }

    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else if (format === 'pdf') {
      const pdf = await generatePDF(data, filename, type);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      pdf.pipe(res);
      pdf.end();
    } else {
      res.json({ data, filename });
    }
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ message: 'Server error while exporting report' });
  }
});

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      let value = row[header];
      if (value === null || value === undefined) value = '';
      if (typeof value === 'string' && value.includes(',')) {
        value = `"${value}"`;
      }
      return value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

// Helper function to generate PDF
function generatePDF(data, filename, reportType) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({
      margin: 40,
      size: 'A4'
    });
    
    // Header with proper spacing
    doc.fontSize(20).text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 40, 40);
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 40, 70);
    doc.text(`Total Records: ${data.length}`, 40, 90);
    
    // Add a line separator
    doc.moveTo(40, 110).lineTo(555, 110).stroke();
    
    let yPosition = 130;
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const pageWidth = 555 - 40; // A4 width minus margins
      
      // Dynamic column widths based on content type
      const getColumnWidth = (header) => {
        const headerLower = header.toLowerCase();
        if (headerLower.includes('name') || headerLower.includes('description')) {
          return Math.min(120, pageWidth * 0.25); // 25% of page width for names
        } else if (headerLower.includes('sku') || headerLower.includes('category')) {
          return Math.min(80, pageWidth * 0.15); // 15% for SKU/category
        } else if (headerLower.includes('price') || headerLower.includes('amount') || headerLower.includes('value')) {
          return Math.min(90, pageWidth * 0.15); // 15% for prices
        } else if (headerLower.includes('quantity') || headerLower.includes('stock')) {
          return Math.min(70, pageWidth * 0.1); // 10% for quantities
        } else {
          return Math.min(80, pageWidth * 0.12); // 12% for other fields
        }
      };
      
      const columnWidths = headers.map(header => getColumnWidth(header));
      const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      
      // Adjust widths if they exceed page width
      if (totalWidth > pageWidth) {
        const scale = pageWidth / totalWidth;
        columnWidths.forEach((width, index) => {
          columnWidths[index] = width * scale;
        });
      }
      
      // Table headers with background
      doc.fontSize(10).font('Helvetica-Bold');
      
      // Draw header background
      doc.rect(40, yPosition - 5, pageWidth, 22).fill('#f0f0f0');
      doc.fillColor('#000000');
      
      let xPos = 40;
      headers.forEach((header, index) => {
        const colWidth = columnWidths[index];
        doc.text(
          header.charAt(0).toUpperCase() + header.slice(1).replace(/([A-Z])/g, ' $1'),
          xPos + 3, 
          yPosition + 3, 
          {
            width: colWidth - 6,
            ellipsis: true,
            align: 'left'
          }
        );
        xPos += colWidth;
      });
      
      yPosition += 27;
      
      // Table rows with alternating background
      doc.font('Helvetica').fontSize(9);
      
      data.slice(0, 25).forEach((row, rowIndex) => { // Limit to 25 rows for better fit
        if (yPosition > 720) { // Start new page if needed
          doc.addPage();
          yPosition = 50;
          
          // Repeat headers on new page
          doc.fontSize(10).font('Helvetica-Bold');
          doc.rect(40, yPosition - 5, pageWidth, 22).fill('#f0f0f0');
          doc.fillColor('#000000');
          
          let xPos = 40;
          headers.forEach((header, index) => {
            const colWidth = columnWidths[index];
            doc.text(
              header.charAt(0).toUpperCase() + header.slice(1).replace(/([A-Z])/g, ' $1'),
              xPos + 3, 
              yPosition + 3, 
              {
                width: colWidth - 6,
                ellipsis: true,
                align: 'left'
              }
            );
            xPos += colWidth;
          });
          
          yPosition += 27;
          doc.font('Helvetica').fontSize(9);
        }
        
        // Alternating row background
        if (rowIndex % 2 === 0) {
          doc.rect(40, yPosition - 2, pageWidth, 20).fill('#f9f9f9');
          doc.fillColor('#000000');
        }
        
        let xPos = 40;
        headers.forEach((header, index) => {
          let value = row[header];
          const colWidth = columnWidths[index];
          
          if (value === null || value === undefined) value = '';
          
          // Format specific values
          if (typeof value === 'number') {
            if (header.toLowerCase().includes('price') || header.toLowerCase().includes('amount') || header.toLowerCase().includes('value')) {
              value = `₹${value.toLocaleString('en-IN')}`;
            } else {
              value = value.toLocaleString('en-IN');
            }
          } else if (typeof value === 'boolean') {
            value = value ? 'Yes' : 'No';
          } else if (typeof value === 'string') {
            // Smart truncation based on column width
            const maxChars = Math.floor(colWidth / 6); // Approximate chars per width
            if (value.length > maxChars) {
              value = value.substring(0, maxChars - 3) + '...';
            }
          }
          
          doc.text(String(value), xPos + 3, yPosition + 3, {
            width: colWidth - 6,
            ellipsis: true,
            align: 'left'
          });
          
          xPos += colWidth;
        });
        
        yPosition += 20;
      });
      
      // Footer with record count if truncated
      if (data.length > 25) {
        yPosition += 25;
        doc.fontSize(10).fillColor('#666666');
        doc.text(`... and ${data.length - 25} more records (truncated for display)`, 40, yPosition);
        yPosition += 15;
        doc.text(`For complete data, please export as CSV format.`, 40, yPosition);
      }
      
      // Add footer
      const footerY = 750;
      doc.fontSize(8).fillColor('#888888');
      doc.text(`Generated by Inventory Management System`, 40, footerY);
      doc.text(`Page 1`, 500, footerY);
      
    } else {
      // No data message with better formatting
      doc.fontSize(14).fillColor('#666666');
      doc.text('No data available for this report.', 40, yPosition);
      yPosition += 30;
      doc.fontSize(12);
      doc.text('Please check your filters or date range and try again.', 40, yPosition);
    }
    
    resolve(doc);
  });
}

module.exports = router;
