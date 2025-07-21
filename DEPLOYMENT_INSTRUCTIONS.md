# Deployment Instructions - Full Stack Inventory Management System

This guide covers deploying your React + Node.js inventory management system to production.

## 📋 Prerequisites

- Git repository (GitHub/GitLab)
- MongoDB Atlas account (free)
- Netlify account (free)
- Render/Railway account (free tier available)

## 🏗️ Architecture Overview

```
Frontend (React) → Netlify
Backend (Node.js) → Render/Railway  
Database → MongoDB Atlas
```

## 🎯 Step 1: Prepare for Production

### 1.1 Environment Configuration

Create production environment files:

**Frontend (.env.production):**
```env
VITE_API_URL=https://your-backend-url.onrender.com/api
VITE_NODE_ENV=production
```

**Backend (.env):**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/inventory_prod
JWT_SECRET=your-super-secure-jwt-secret-here
PORT=5000
CORS_ORIGIN=https://your-netlify-app.netlify.app
```

### 1.2 Update API Base URL

Update `src/utils/api.js` to use environment variable:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

### 1.3 Build Scripts

Ensure your `package.json` files have proper build scripts:

**Frontend package.json:**
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Backend package.json:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

## 🗄️ Step 2: Setup MongoDB Atlas

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Create free account and cluster

2. **Configure Database**
   - Create database user
   - Whitelist IP addresses (0.0.0.0/0 for production)
   - Get connection string

3. **Import Data (Optional)**
   ```bash
   # Export local data
   mongodump --uri="mongodb://localhost:27017/inventory_management"
   
   # Import to Atlas
   mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/inventory_prod" dump/
   ```

## 🚀 Step 3: Deploy Backend

### Option A: Render (Recommended)

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Connect GitHub account

2. **Create Web Service**
   - New → Web Service
   - Connect your repository
   - Select backend folder (if monorepo)

3. **Configure Service**
   ```yaml
   Name: inventory-backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

4. **Environment Variables**
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secret
   PORT=5000
   CORS_ORIGIN=https://your-app.netlify.app
   ```

### Option B: Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Connect GitHub

2. **Deploy Service**
   - New Project → Deploy from GitHub
   - Select repository

3. **Configure Environment**
   - Add environment variables
   - Set root directory if needed

## 🌐 Step 4: Deploy Frontend

### 4.1 Prepare Build

1. **Update Environment**
   ```bash
   # In frontend directory
   echo "VITE_API_URL=https://your-backend-url.onrender.com/api" > .env.production
   ```

2. **Build for Production**
   ```bash
   npm run build
   ```

### 4.2 Deploy to Netlify

**Method 1: Drag & Drop**
1. Run `npm run build`
2. Go to [netlify.com](https://netlify.com)
3. Drag `dist` folder to Netlify dashboard

**Method 2: Git Integration (Recommended)**
1. **Connect Repository**
   - New site from Git
   - Choose GitHub/GitLab
   - Select repository

2. **Configure Build**
   ```yaml
   Build command: npm run build
   Publish directory: dist
   Base directory: (leave empty or specify frontend folder)
   ```

3. **Environment Variables**
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   VITE_NODE_ENV=production
   ```

4. **Redirects Configuration**
   Create `public/_redirects` file:
   ```
   /*    /index.html   200
   ```

## 🔧 Step 5: Configure CORS and Security

### 5.1 Update Backend CORS

```javascript
// server.js
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### 5.2 Security Headers

```javascript
// Add security middleware
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});
```

## 📱 Step 6: Testing Production Build

### 6.1 Local Production Test

```bash
# Frontend
npm run build
npm run preview

# Backend
NODE_ENV=production npm start
```

### 6.2 Test Deployment

1. **Test API Endpoints**
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```

2. **Test Frontend**
   - Open your Netlify URL
   - Test login functionality
   - Verify all features work

## 🔍 Step 7: Monitoring and Maintenance

### 7.1 Health Checks

Add health check endpoint:

```javascript
// server.js
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### 7.2 Error Logging

```javascript
// Add error logging
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ message: 'Internal server error' });
});
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS_ORIGIN environment variable
   - Verify frontend URL matches CORS setting

2. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json

3. **API Connection Issues**
   - Verify VITE_API_URL is correct
   - Check network requests in browser dev tools

4. **Database Connection**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist settings

### Logs and Debugging

```bash
# Render logs
# Go to Render dashboard → Your service → Logs

# Netlify logs
# Go to Netlify dashboard → Your site → Functions/Deploy logs
```

## 📋 Deployment Checklist

- [ ] MongoDB Atlas setup complete
- [ ] Backend deployed to Render/Railway
- [ ] Environment variables configured
- [ ] CORS properly set
- [ ] Frontend built successfully
- [ ] Frontend deployed to Netlify
- [ ] API endpoints working
- [ ] Authentication working
- [ ] File uploads working (if applicable)
- [ ] All features tested in production

## 🔐 Security Best Practices

1. **Environment Variables**
   - Never commit .env files
   - Use strong JWT secrets
   - Rotate secrets regularly

2. **Database Security**
   - Use strong database passwords
   - Enable MongoDB Atlas network security
   - Regular backups

3. **API Security**
   - Implement rate limiting
   - Validate all inputs
   - Use HTTPS only

## 📈 Performance Optimization

1. **Frontend**
   ```bash
   # Analyze bundle size
   npm run build -- --analyze
   ```

2. **Backend**
   - Enable gzip compression
   - Implement caching
   - Optimize database queries

3. **Database**
   - Add proper indexes
   - Monitor query performance
   - Use connection pooling

## 🔄 CI/CD Setup (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install and Build Frontend
        working-directory: ./frontend
        run: |
          npm install
          npm run build
          
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v1.2
        with:
          publish-dir: './frontend/dist'
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 📞 Support

- **Frontend Issues**: Check browser console and Netlify deploy logs
- **Backend Issues**: Check Render/Railway application logs
- **Database Issues**: Check MongoDB Atlas logs and connection

---

**Happy Deploying! 🚀**

For questions or issues, check the deployment platform documentation or community forums.
