# Test Backend Server

Write-Host "🧪 Testing Sopan Wallet Backend Server..." -ForegroundColor Cyan
Write-Host ""

# Test health endpoint
Write-Host "1️⃣ Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Server is healthy!" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   Timestamp: $($response.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Server not responding. Make sure to start it with 'npm start'" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Backend server is running correctly!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Deploy to Railway: railway up" -ForegroundColor White
Write-Host "  2. Update mobile/.env with your Railway URL" -ForegroundColor White
Write-Host "  3. Test deployment from mobile app" -ForegroundColor White
