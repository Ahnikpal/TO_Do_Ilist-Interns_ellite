# TaskMaster Automation Script
# This script installs dependencies, initializes the database, and starts the server.

Write-Host "🚀 Starting TaskMaster Setup..." -ForegroundColor Cyan

# 1. Check for Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
}

# 2. Install Backend Dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Failed to install dependencies."
    exit 1
}

# 3. Initialize Database
Write-Host "🗄️ Initializing Database..." -ForegroundColor Yellow
npm run init-db
if ($LASTEXITCODE -ne 0) {
    Write-Warning "⚠️ Database initialization failed. Check your MySQL connection and .env file."
    Write-Host "Press any key to continue if the database is already set up..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# 4. Start Server
Write-Host "✅ Setup Complete! Starting server..." -ForegroundColor Green
Write-Host "🌐 Once started, open frontend/index.html in your browser." -ForegroundColor Cyan
node server.js
