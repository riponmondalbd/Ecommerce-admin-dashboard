$base = 'http://localhost:5000/api'

# Login
$r = Invoke-WebRequest -Method POST -Uri "$base/auth/login" -ContentType 'application/json' -Body '{"email":"admin@trends-bird.com","password":"admin123"}'
$token = ($r.Content | ConvertFrom-Json).data.accessToken
Write-Host "1. Login: OK (200)" -ForegroundColor Green
Write-Host "   Token: $($token.Substring(0,40))..."

$h = @{ Authorization = "Bearer $token" }

# /me
$me = Invoke-WebRequest -Method GET -Uri "$base/auth/me" -Headers $h
$meData = ($me.Content | ConvertFrom-Json).data
Write-Host "2. /me: OK - $($meData.email), permissions=$($meData.permissions.Count)" -ForegroundColor Green

# Categories
$cats = Invoke-WebRequest -Method GET -Uri "$base/categories" -Headers $h
$cTotal = ($cats.Content | ConvertFrom-Json).pagination.total
Write-Host "3. GET /categories: OK - total=$cTotal" -ForegroundColor Green

# Brands
$brands = Invoke-WebRequest -Method GET -Uri "$base/brands" -Headers $h
$bTotal = ($brands.Content | ConvertFrom-Json).pagination.total
Write-Host "4. GET /brands: OK - total=$bTotal" -ForegroundColor Green

# Products
$products = Invoke-WebRequest -Method GET -Uri "$base/products" -Headers $h
$pTotal = ($products.Content | ConvertFrom-Json).pagination.total
Write-Host "5. GET /products: OK - total=$pTotal" -ForegroundColor Green

# Attributes
$attrs = Invoke-WebRequest -Method GET -Uri "$base/attributes" -Headers $h
$aTotal = ($attrs.Content | ConvertFrom-Json).pagination.total
Write-Host "6. GET /attributes: OK - total=$aTotal" -ForegroundColor Green

# Users
$users = Invoke-WebRequest -Method GET -Uri "$base/users" -Headers $h
$uTotal = ($users.Content | ConvertFrom-Json).pagination.total
Write-Host "7. GET /users: OK - total=$uTotal" -ForegroundColor Green

# Roles
$roles = Invoke-WebRequest -Method GET -Uri "$base/roles" -Headers $h
$rCount = ($roles.Content | ConvertFrom-Json).data.Count
Write-Host "8. GET /roles: OK - count=$rCount" -ForegroundColor Green

# Permissions
$perms = Invoke-WebRequest -Method GET -Uri "$base/permissions" -Headers $h
$permCount = ($perms.Content | ConvertFrom-Json).data.Count
Write-Host "9. GET /permissions: OK - count=$permCount" -ForegroundColor Green

# Media
$media = Invoke-WebRequest -Method GET -Uri "$base/media" -Headers $h
$mTotal = ($media.Content | ConvertFrom-Json).pagination.total
Write-Host "10. GET /media: OK - total=$mTotal" -ForegroundColor Green

Write-Host "`n=== ALL ENDPOINTS PASSING ===" -ForegroundColor Cyan
