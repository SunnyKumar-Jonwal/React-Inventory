import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import Layout from './components/Layout/Layout';
import ProductList from './components/Products/ProductList';
import ProductForm from './components/Products/ProductForm';
import SalesList from './components/Sales/SalesList';
import SalesForm from './components/Sales/SalesForm';
import POS from './components/Sales/POS';
import Invoice from './components/Sales/Invoice';
import UsersList from './components/Users/UsersList';
import UserForm from './components/Users/UserForm';
import Reports from './components/Reports/Reports';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: 'green',
                secondary: 'black',
              },
            },
          }}
        />
        
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Products */}
            <Route path="products" element={<ProductList />} />
            <Route 
              path="products/add" 
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'inventory_manager']}>
                  <ProductForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="products/edit/:id" 
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'inventory_manager']}>
                  <ProductForm />
                </ProtectedRoute>
              } 
            />

            {/* Sales */}
            <Route path="sales" element={<SalesList />} />
            <Route 
              path="sales/add" 
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'inventory_manager', 'sales_executive']}>
                  <SalesForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="sales/pos" 
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'inventory_manager', 'sales_executive']}>
                  <POS />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="sales/invoice/:id" 
              element={<Invoice />} 
            />

            {/* Users */}
            <Route 
              path="users" 
              element={
                <ProtectedRoute requiredRoles={['super_admin']}>
                  <UsersList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="users/add" 
              element={
                <ProtectedRoute requiredRoles={['super_admin']}>
                  <UserForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="users/edit/:id" 
              element={
                <ProtectedRoute requiredRoles={['super_admin']}>
                  <UserForm />
                </ProtectedRoute>
              } 
            />

            {/* Reports */}
            <Route 
              path="reports" 
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'accountant']}>
                  <Reports />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
