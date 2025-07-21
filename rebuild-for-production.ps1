# PowerShell script to rebuild for production
Write-Host "🚀 Rebuilding for production..." -ForegroundColor Green

Write-Host "📝 Make sure to update .env.production with your actual backend URL" -ForegroundColor Yellow
Write-Host "   VITE_API_URL=https://your-actual-render-url.onrender.com/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Enter when you've updated .env.production..." -ForegroundColor Yellow
Read-Host

Write-Host "🔨 Building frontend..." -ForegroundColor Blue
npm run build

Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host "📁 Upload the 'dist' folder to Netlify" -ForegroundColor Cyan
Write-Host "🌐 Your app will be live in minutes!" -ForegroundColor Magenta
