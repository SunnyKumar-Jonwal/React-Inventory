import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

const ProductListDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    token: null,
    apiCall: null,
    error: null,
    products: null
  });

  useEffect(() => {
    const runDebug = async () => {
      console.log('ProductListDebug: Starting debug...');
      
      // Check token
      const token = localStorage.getItem('token');
      setDebugInfo(prev => ({ ...prev, token: token ? 'Present' : 'Missing' }));
      
      // Try API call
      try {
        console.log('ProductListDebug: Making API call...');
        const response = await api.get('/products');
        console.log('ProductListDebug: API response:', response.data);
        setDebugInfo(prev => ({ 
          ...prev, 
          apiCall: 'Success',
          products: response.data?.length || 0
        }));
      } catch (error) {
        console.error('ProductListDebug: API error:', error);
        setDebugInfo(prev => ({ 
          ...prev, 
          apiCall: 'Failed',
          error: error.message
        }));
      }
    };

    runDebug();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Products Debug Page</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
        <div className="space-y-2">
          <p><strong>Auth Token:</strong> {debugInfo.token || 'Checking...'}</p>
          <p><strong>API Call:</strong> {debugInfo.apiCall || 'Running...'}</p>
          <p><strong>Products Count:</strong> {debugInfo.products !== null ? debugInfo.products : 'N/A'}</p>
          {debugInfo.error && <p className="text-red-600"><strong>Error:</strong> {debugInfo.error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ProductListDebug;
