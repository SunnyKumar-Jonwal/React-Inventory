// Format currency in Indian Rupees
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount || 0);
};

// Format date
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(
    new Date(date)
  );
};

// Format date and time
export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// Get relative time
export const getRelativeTime = (date) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(date);
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone);
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return ((value / total) * 100).toFixed(2);
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Deep clone object
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const clonedObj = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
};

// Get role display name
export const getRoleDisplayName = (role) => {
  const roleNames = {
    super_admin: 'Super Admin',
    inventory_manager: 'Inventory Manager',
    sales_executive: 'Sales Executive',
    accountant: 'Accountant',
  };
  return roleNames[role] || role;
};

// Get status badge color
export const getStatusColor = (status) => {
  const colors = {
    active: 'green',
    inactive: 'gray',
    pending: 'yellow',
    completed: 'green',
    cancelled: 'red',
    refunded: 'orange',
    paid: 'green',
    partial: 'yellow',
    low: 'red',
    medium: 'yellow',
    high: 'green',
  };
  return colors[status?.toLowerCase()] || 'gray';
};

// Generate SKU
export const generateSKU = (category, name) => {
  // Define better category codes
  const categoryCodes = {
    'books': 'BOOK',
    'electronics': 'ELEC',
    'stationery': 'STAT',
    'electrical': 'ELCT',
    'festival_items': 'FEST',
    'study_guides': 'GUID'
  };
  
  const categoryCode = categoryCodes[category] || category?.slice(0, 4).toUpperCase() || 'GEN';
  const nameCode = name?.replace(/\s+/g, '').slice(0, 3).toUpperCase() || 'ITM';
  const timestamp = Date.now().toString().slice(-4);
  return `${categoryCode}-${nameCode}-${timestamp}`;
};

// Calculate profit margin
export const calculateProfitMargin = (costPrice, sellingPrice) => {
  if (!costPrice || costPrice === 0) return 0;
  return (((sellingPrice - costPrice) / costPrice) * 100).toFixed(2);
};

// Format number with commas
export const formatNumber = (num) => {
  if (!num) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Get date range options
export const getDateRangeOptions = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const lastYear = new Date(today);
  lastYear.setFullYear(lastYear.getFullYear() - 1);

  return {
    today: {
      label: 'Today',
      startDate: today.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    },
    yesterday: {
      label: 'Yesterday',
      startDate: yesterday.toISOString().split('T')[0],
      endDate: yesterday.toISOString().split('T')[0],
    },
    lastWeek: {
      label: 'Last 7 days',
      startDate: lastWeek.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    },
    lastMonth: {
      label: 'Last 30 days',
      startDate: lastMonth.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    },
    lastYear: {
      label: 'Last year',
      startDate: lastYear.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    },
  };
};
