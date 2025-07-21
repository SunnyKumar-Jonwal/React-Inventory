import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Package,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { api } from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const categories = ['books', 'electronics']; // Updated to match backend

  useEffect(() => {
    console.log('ProductList component mounted');
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      setLoading(true);
      setError(null);
      const response = await api.get('/products');
      console.log('Products response:', response.data);
      
      // Handle both direct array response and paginated response
      const productsData = response.data.products || response.data || [];
      setProducts(productsData);
      
      console.log('Products set:', productsData);
    } catch (error) {
      console.error('Fetch products error:', error);
      setError(error.message);
      
      // Set empty array as fallback
      setProducts([]);
      
      if (error.response) {
        toast.error('Failed to fetch products');
      } else {
        console.warn('Products API not available, showing empty list');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await api.delete(`/products/${productId}`);
      setProducts(products.filter(p => p._id !== productId));
      toast.success('Product deleted successfully');
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      toast.error('Failed to delete product');
      console.error('Delete product error:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const ProductModal = ({ product, onClose }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>
          
          {/* Product Image */}
          {product.image && (
            <div className="mb-6 text-center">
              <img
                src={`http://localhost:5000${product.image}`}
                alt={product.name}
                className="w-48 h-48 object-cover rounded-lg mx-auto border border-gray-200"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-600">Name</label>
              <p className="text-gray-900">{product.name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">SKU</label>
              <p className="text-gray-900">{product.sku}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Category</label>
              <p className="text-gray-900">{product.category?.charAt(0).toUpperCase() + product.category?.slice(1)}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Cost Price</label>
              <p className="text-gray-900">{formatCurrency(product.costPrice)}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Selling Price</label>
              <p className="text-gray-900">{formatCurrency(product.sellingPrice)}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Stock Quantity</label>
              <p className={`font-medium ${product.quantity < product.minStockLevel ? 'text-red-600' : 'text-gray-900'}`}>
                {product.quantity}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Min Stock Level</label>
              <p className="text-gray-900">{product.minStockLevel}</p>
            </div>
            
            {product.description && (
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900">{product.description}</p>
              </div>
            )}
            
            {product.supplier?.name && (
              <div>
                <label className="text-sm font-medium text-gray-600">Supplier</label>
                <div className="text-gray-900">
                  <p>{product.supplier.name}</p>
                  {product.supplier.contact && <p className="text-sm text-gray-600">{product.supplier.contact}</p>}
                  {product.supplier.email && <p className="text-sm text-gray-600">{product.supplier.email}</p>}
                </div>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-600">Created Date</label>
              <p className="text-gray-900">{formatDate(product.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const DeleteModal = ({ product, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Product</h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete "{product?.name}"? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(product._id)}
              className="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Add more debugging
  console.log('ProductList render - loading:', loading, 'error:', error, 'products:', products?.length || 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Products...</h1>
          <p className="text-gray-600">Please wait while we fetch your product data</p>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Always show something for debugging
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Products</h1>
          <p className="text-gray-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchProducts}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex gap-2">
          {error && (
            <div className="text-sm text-red-600 mr-4">
              API Error: {error}
            </div>
          )}
          <button
            onClick={fetchProducts}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2"
          >
            Refresh
          </button>
          <Link to="/products/add" className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or SKU..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {product.image ? (
                          <img
                            src={`http://localhost:5000${product.image}`}
                            alt={product.name}
                            className="h-10 w-10 rounded-full object-cover border border-gray-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ${product.image ? 'hidden' : ''}`}>
                          <Package className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.category?.charAt(0).toUpperCase() + product.category?.slice(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(product.sellingPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className={product.quantity < product.minStockLevel ? 'text-red-600 font-medium' : ''}>
                        {product.quantity}
                      </span>
                      {product.quantity < product.minStockLevel && (
                        <AlertTriangle className="h-4 w-4 text-red-500 ml-1" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.quantity > product.minStockLevel
                        ? 'bg-green-100 text-green-800'
                        : product.quantity > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.quantity > product.minStockLevel
                        ? 'In Stock'
                        : product.quantity > 0
                        ? 'Low Stock'
                        : 'Out of Stock'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <Link
                        to={`/products/edit/${product._id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit Product"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => {
                          setProductToDelete(product);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory ? 'Try adjusting your filters' : 'Get started by adding a new product.'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => {
            setShowModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {showDeleteModal && productToDelete && (
        <DeleteModal
          product={productToDelete}
          onConfirm={handleDeleteProduct}
          onCancel={() => {
            setShowDeleteModal(false);
            setProductToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default ProductList;
