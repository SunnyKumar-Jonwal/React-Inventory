import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

const ProductsDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    token: null,
    apiCall: 'Not attempted',
    productsCount: 0,
    response: null,
    error: null
  });

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setDebugInfo(prev => ({ ...prev, token: token ? 'Present' : 'Missing' }));
    };

    const fetchProducts = async () => {
      try {
        setDebugInfo(prev => ({ ...prev, apiCall: 'Attempting...' }));
        const response = await api.get('/products');
        console.log('Full API Response:', response.data);
        
        const productsData = response.data.products || response.data || [];
        setDebugInfo(prev => ({
          ...prev,
          apiCall: 'Success',
          productsCount: productsData.length,
          response: response.data,
          error: null
        }));
      } catch (error) {
        console.error('API Error:', error);
        setDebugInfo(prev => ({
          ...prev,
          apiCall: 'Failed',
          productsCount: 0,
          response: null,
          error: error.message
        }));
      }
    };

    checkAuth();
    fetchProducts();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Products Debug Page</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
        
        <div className="space-y-2">
          <p><strong>Auth Token:</strong> {debugInfo.token}</p>
          <p><strong>API Call:</strong> {debugInfo.apiCall}</p>
          <p><strong>Products Count:</strong> {debugInfo.productsCount}</p>
          {debugInfo.error && (
            <p><strong>Error:</strong> <span className="text-red-600">{debugInfo.error}</span></p>
          )}
        </div>
        
        {debugInfo.response && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">API Response Structure:</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
              {JSON.stringify(debugInfo.response, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {debugInfo.response?.products && debugInfo.response.products.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Products List</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {debugInfo.response.products.map(product => (
                  <tr key={product._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.sellingPrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsDebug;
