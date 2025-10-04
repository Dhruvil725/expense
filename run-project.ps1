# PowerShell script to run the Expense Management System

Write-Host "Setting up Expense Management System..." -ForegroundColor Green

# Navigate to backend directory and install dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
cd backend
npm install

# Navigate back to root
cd ..

# Navigate to frontend directory and install dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
cd frontend
npm install

# Start backend server in background
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Job -ScriptBlock {
    cd backend
    npm start
} | Out-Null

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend development server
Write-Host "Starting frontend development server..." -ForegroundColor Yellow
npm start

Write-Host "Project is now running!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
