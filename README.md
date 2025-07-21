# Inventory Management System

A full-stack inventory and sales management system built with React (frontend) and Node.js/Express (backend), featuring role-based authentication and access control.

## Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Four user roles: Super Admin, Inventory Manager, Sales Executive, Accountant
- Secure password handling with bcrypt

### Product Management
- Books and Electronics categories
- SKU generation and management
- Stock level tracking with low stock alerts
- Supplier information management
- Product search and filtering

### Sales & POS System
- Modern point of sale interface
- Real-time inventory updates
- Multiple payment methods (Cash, Card, Mobile)
- Customer information tracking
- Invoice generation

### Reporting & Analytics
- Dashboard with key metrics and charts
- Sales reports (daily/monthly trends)
- Inventory reports with low stock alerts
- User performance tracking
- Export capabilities (CSV/PDF)

### User Management
- User creation and management (Super Admin only)
- Role assignment and permissions
- User activity tracking

## Tech Stack

### Frontend
- **React 18** with functional components and hooks
- **Vite** for fast development and building
- **TailwindCSS** for utility-first styling
- **SCSS** for custom component styles
- **React Router** for navigation
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Chart.js** with React wrapper for data visualization
- **jsPDF** for PDF generation
- **Lucide React** for modern icons

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** support
- **Express Validator** for input validation
- **Multer** for file uploads
- **CSV Parser** and **JSON2CSV** for data import/export
- **PDFKit** for PDF generation

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd React-Inventory
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Environment Setup**
   
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/inventory_db
   JWT_SECRET=your_super_secret_jwt_key_here
   NODE_ENV=development
   ```

5. **Start the development servers**
   
   **Backend (from backend directory):**
   ```bash
   npm start
   ```
   
   **Frontend (from root directory):**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### Default Demo Accounts

The application includes demo accounts for testing:

- **Super Admin**: admin@inventory.com / password123
- **Inventory Manager**: manager@inventory.com / password123
- **Sales Executive**: sales@inventory.com / password123
- **Accountant**: accountant@inventory.com / password123

## Project Structure

```
React-Inventory/
├── src/                          # Frontend source code
│   ├── components/              # React components
│   │   ├── Auth/               # Login/Register components
│   │   ├── Dashboard/          # Dashboard and analytics
│   │   ├── Products/           # Product management
│   │   ├── Sales/             # Sales and POS system
│   │   ├── Users/             # User management
│   │   ├── Reports/           # Reporting system
│   │   └── Layout/            # Layout components
│   ├── contexts/              # React contexts (Auth)
│   ├── utils/                 # Utility functions and API calls
│   └── styles/               # SCSS files
├── backend/                   # Backend source code
│   ├── models/               # MongoDB models
│   ├── routes/               # Express routes
│   ├── middleware/           # Custom middleware
│   └── server.js            # Express server setup
└── public/                   # Static assets
```

## User Roles & Permissions

### Super Admin
- Full system access
- User management (create, edit, delete users)
- All product and sales operations
- Access to all reports

### Inventory Manager
- Product management (create, edit, delete products)
- View sales data
- Inventory reports
- Dashboard access

### Sales Executive
- POS system access
- Create new sales
- View sales history
- Limited dashboard access

### Accountant
- Read-only access to sales data
- Financial reports
- Dashboard with revenue metrics
- No product or user management

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/:id` - Get product by ID

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale by ID
- `GET /api/sales/:id/invoice` - Generate invoice PDF

### Users (Super Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/inventory` - Inventory reports
- `GET /api/reports/users` - User performance reports

## Development

### Available Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Backend:**
- `npm start` - Start server with nodemon
- `npm run production` - Start server for production

### Code Standards

- Use functional React components with hooks
- Follow consistent naming conventions
- Implement proper error handling
- Use TypeScript types where applicable
- Write meaningful commit messages
- Follow ESLint and Prettier configurations

## Deployment

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider
3. Configure environment variables for API endpoints

### Backend (Heroku/Railway/VPS)
1. Set up environment variables
2. Configure MongoDB connection
3. Deploy with proper NODE_ENV=production
4. Set up process manager (PM2) for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository or contact the development team.
