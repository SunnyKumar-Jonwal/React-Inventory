import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Plus
} from 'lucide-react';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['super_admin', 'inventory_manager', 'sales_executive', 'accountant']
    },
    {
      name: 'Products',
      href: '/products',
      icon: Package,
      roles: ['super_admin', 'inventory_manager', 'sales_executive'],
      children: [
        {
          name: 'View Products',
          href: '/products'
        },
        {
          name: 'Add Product',
          href: '/products/add',
          roles: ['super_admin', 'inventory_manager']
        }
      ]
    },
    {
      name: 'Sales',
      href: '/sales',
      icon: ShoppingCart,
      roles: ['super_admin', 'inventory_manager', 'sales_executive'],
      children: [
        {
          name: 'View Sales',
          href: '/sales'
        },
        {
          name: 'Point of Sale',
          href: '/sales/pos',
          icon: Calculator
        },
        {
          name: 'New Sale',
          href: '/sales/add',
          icon: Plus
        }
      ]
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      roles: ['super_admin'],
      children: [
        {
          name: 'View Users',
          href: '/users'
        },
        {
          name: 'Add User',
          href: '/users/add'
        }
      ]
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3,
      roles: ['super_admin', 'accountant']
    }
  ];

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-semibold">Inventory Pro</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation
            .filter(item => hasRole(item.roles))
            .map((item) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              
              return (
                <div key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                    title={collapsed ? item.name : ''}
                  >
                    <Icon className={`h-5 w-5 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                  
                  {/* Sub-navigation */}
                  {!collapsed && hasChildren && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children
                        .filter(child => !child.roles || hasRole(child.roles))
                        .map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <Link
                              key={child.name}
                              to={child.href}
                              className={`flex items-center px-3 py-1 rounded-md text-xs transition-colors ${
                                isActive(child.href)
                                  ? 'bg-blue-500 text-white'
                                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                              }`}
                            >
                              {ChildIcon && <ChildIcon className="h-4 w-4 mr-2" />}
                              <span>{child.name}</span>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className={`flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Logout' : ''}
          >
            <LogOut className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
