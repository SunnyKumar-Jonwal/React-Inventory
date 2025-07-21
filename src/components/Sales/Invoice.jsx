import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api } from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { Download, Printer, ArrowLeft, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Invoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoiceRef = useRef();

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaleDetails();
  }, [id]);

  const fetchSaleDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sales/${id}`);
      setSale(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch sale details');
      navigate('/sales');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${sale.invoiceNumber}.pdf`);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Sale not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Actions */}
      <div className="mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={() => navigate('/sales')}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Sales
        </button>
        
        <div className="flex space-x-4">
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
          <button
            onClick={generatePDF}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div ref={invoiceRef} className="bg-white shadow-lg rounded-lg p-8 print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="border-b-2 border-gray-200 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
              <div className="flex items-center text-gray-600">
                <FileText className="h-5 w-5 mr-2" />
                <span className="text-lg font-semibold">{sale.invoiceNumber}</span>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">
                Book Stall & Electronics
              </h2>
              <p className="text-gray-600">
                123 Business Street<br />
                City, State 12345<br />
                Phone: (555) 123-4567<br />
                Email: info@bookelectronics.com
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
            <div className="text-gray-700">
              <p className="font-medium">{sale.customerName}</p>
              {sale.customerEmail && <p>{sale.customerEmail}</p>}
              {sale.customerPhone && <p>{sale.customerPhone}</p>}
              {sale.customerAddress && <p>{sale.customerAddress}</p>}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoice Details:</h3>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between">
                <span>Invoice Date:</span>
                <span>{formatDate(sale.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="capitalize">{sale.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                  sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Items:</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">
                    Item
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">
                    SKU
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-900">
                    Qty
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-right font-semibold text-gray-900">
                    Unit Price
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-right font-semibold text-gray-900">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{item.product.name}</p>
                        <p className="text-sm text-gray-600">{item.product.category}</p>
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
                      {item.product.sku}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-center text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-right text-gray-700">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Tax ({(sale.taxRate * 100).toFixed(1)}%):</span>
                <span>{formatCurrency(sale.taxAmount)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between text-xl font-bold text-gray-900">
                <span>Total:</span>
                <span>{formatCurrency(sale.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-600">
          <p className="mb-2">Thank you for your business!</p>
          <p className="text-sm">
            If you have any questions about this invoice, please contact us at info@bookelectronics.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
