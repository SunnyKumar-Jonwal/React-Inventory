<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Full Stack Inventory Management System

This is a comprehensive inventory management system built with React (frontend) and Node.js/Express (backend), featuring role-based authentication and access control.

## Project Structure

### Frontend (React + Vite + TailwindCSS + SCSS)
- **React 18** with modern hooks and functional components
- **Vite** for fast development and building
- **TailwindCSS** for utility-first styling
- **SCSS** for custom component styles
- **React Router** for navigation
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Chart.js** for data visualization
- **jsPDF** for PDF generation

### Backend (Node.js + Express + MongoDB)
- **Express.js** REST API
- **MongoDB** with Mongoose ODM
- **JWT** authentication
- **bcryptjs** for password hashing
- **Role-based access control** (RBAC)
- **Input validation** with express-validator
- **CORS** support
- **File upload** capabilities

## User Roles & Permissions

1. **Super Admin**: Full system access, user management
2. **Inventory Manager**: Product management, inventory tracking
3. **Sales Executive**: POS system, sales transactions
4. **Accountant**: Reports, financial data access

## Key Features

### Authentication & Authorization
- JWT-based authentication
- Role-based route protection
- Secure password handling
- Session management

### Product Management
- Books and Electronics categories
- SKU generation and management
- Stock level tracking
- Low stock alerts
- Supplier information

### Sales & POS System
- Point of sale interface
- Invoice generation
- Payment method tracking
- Customer information
- Sales reporting

### Reporting & Analytics
- Dashboard with key metrics
- Sales reports (daily/monthly/yearly)
- Inventory reports
- User performance tracking
- Export capabilities (CSV/PDF)

## Code Standards

### React Components
- Use functional components with hooks
- Implement proper error boundaries
- Follow component composition patterns
- Use proper TypeScript types where applicable
- Implement loading states and error handling

### API Design
- RESTful endpoints
- Consistent response formats
- Proper HTTP status codes
- Request validation
- Error handling middleware

### Styling
- TailwindCSS utility classes for layout and common styles
- SCSS for complex component-specific styles
- Mobile-responsive design
- Consistent color scheme and typography
- Accessibility considerations

### State Management
- React Context for global state (auth, theme)
- Local component state for UI state
- Proper state normalization
- Efficient re-rendering optimization

## Security Considerations
- Input sanitization and validation
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure file uploads
- Rate limiting
- Proper error handling without information leakage

## Performance Optimization
- Code splitting and lazy loading
- Image optimization
- Database query optimization
- Caching strategies
- Bundle size optimization
- Efficient re-rendering

## Development Guidelines
- Write clean, readable, and maintainable code
- Follow consistent naming conventions
- Implement proper error handling
- Write meaningful commit messages
- Use proper logging
- Implement proper testing strategies
