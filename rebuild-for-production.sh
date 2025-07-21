#!/bin/bash
# Quick rebuild script for production

echo "🚀 Rebuilding for production..."

# Step 1: Update environment
echo "📝 Make sure to update .env.production with your actual backend URL"
echo "   VITE_API_URL=https://your-actual-render-url.onrender.com/api"
echo ""
echo "Press Enter when you've updated .env.production..."
read -p ""

# Step 2: Build
echo "🔨 Building frontend..."
npm run build

echo "✅ Build complete!"
echo "📁 Upload the 'dist' folder to Netlify"
echo "🌐 Your app will be live in minutes!"
