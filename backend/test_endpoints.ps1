# 🚀 FINAL ONBOARDING API TEST SUITE
# Uses fixed employee ID: 68f20015de5dfa993d6029af (Charlie)
# Tests all endpoints: Signup, Login, Tasks, Buddies, Admin Ops

Write-Host "🚀 Starting Final API Test Suite (Using Charlie: 68f20015de5dfa993d6029af)..." -ForegroundColor Cyan

# Configuration
$baseUrl = "http://localhost:5000"
$adminEmail = "admin@test.com"
$adminPassword = "Admin123"
$targetEmployeeId = "68f20015de5dfa993d6029af"  # 🔑 Charlie's ID (fixed)

# Step 1: ADMIN LOGIN
Write-Host "`n--- Step 1: ADMIN LOGIN ---" -ForegroundColor Yellow
$adminLoginBody = @{
    email = $adminEmail
    password = $adminPassword
} | ConvertTo-Json

try {
    $adminLoginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body $adminLoginBody
    
    $adminLoginData = $adminLoginResponse.Content | ConvertFrom-Json
    $adminToken = $adminLoginData.token
    Write-Host "✅ Admin login successful." -ForegroundColor Green
} catch {
    Write-Host "❌ Admin login failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: GET ALL EMPLOYEES (Verify Charlie exists)
Write-Host "`n--- Step 2: VERIFY CHARLIE EXISTS ---" -ForegroundColor Yellow
try {
    $employeesResponse = Invoke-WebRequest -Uri "$baseUrl/api/employees" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $adminToken" }
    
    $employees = $employeesResponse.Content | ConvertFrom-Json
    $charlie = $employees | Where-Object { $_._id -eq $targetEmployeeId }
    
    if ($charlie) {
        Write-Host "✅ Charlie found:" -ForegroundColor Green
        Write-Host "  Name: $($charlie.name)" -ForegroundColor Gray
        Write-Host "  Email: $($charlie.email)" -ForegroundColor Gray
        Write-Host "  Department: $($charlie.department)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Charlie (ID: $targetEmployeeId) not found!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed to get employees: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    exit 1
}

# Step 3: GET/CREATE BUDDY
Write-Host "`n--- Step 3: GET OR CREATE BUDDY ---" -ForegroundColor Yellow
try {
    $buddiesResponse = Invoke-WebRequest -Uri "$baseUrl/api/buddies" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $adminToken" }
    
    $buddies = $buddiesResponse.Content | ConvertFrom-Json
    
    if ($buddies.Count -eq 0) {
        Write-Host "⚠️ No buddies found. Creating Sarah Johnson..." -ForegroundColor Yellow
        $newBuddyBody = @{
            name = "Sarah Johnson"
            email = "sarah.j@company.com"
            department = "Engineering"
            available = $true
        } | ConvertTo-Json

        $createBuddyResponse = Invoke-WebRequest -Uri "$baseUrl/api/buddies" `
            -Method POST `
            -Headers @{ 
                "Authorization" = "Bearer $adminToken"
                "Content-Type" = "application/json"
            } `
            -Body $newBuddyBody
        
        $buddyId = ($createBuddyResponse.Content | ConvertFrom-Json)._id
        Write-Host "✅ Created buddy: Sarah Johnson ($buddyId)" -ForegroundColor Green
    } else {
        $buddyId = $buddies[0]._id
        Write-Host "✅ Using existing buddy: $($buddies[0].name) ($buddyId)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Buddy setup failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    exit 1
}

# Step 4: ADD TASK TO CHARLIE
Write-Host "`n--- Step 4: ADD TASK TO CHARLIE ---" -ForegroundColor Yellow
$taskBody = @{
    userId = $targetEmployeeId
    title = "Complete Security Training Module"
    type = "task"
} | ConvertTo-Json

try {
    $taskResponse = Invoke-WebRequest -Uri "$baseUrl/api/employees/task" `
        -Method POST `
        -Headers @{ 
            "Authorization" = "Bearer $adminToken"
            "Content-Type" = "application/json"
        } `
        -Body $taskBody
    
    $taskId = ($taskResponse.Content | ConvertFrom-Json)._id
    Write-Host "✅ Task added to Charlie (ID: $taskId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to add task: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    exit 1
}

# Step 5: TOGGLE TASK COMPLETION
Write-Host "`n--- Step 5: TOGGLE TASK COMPLETION ---" -ForegroundColor Yellow
try {
    $toggleResponse = Invoke-WebRequest -Uri "$baseUrl/api/employees/task/$taskId" `
        -Method PUT `
        -Headers @{ "Authorization" = "Bearer $adminToken" }
    
    $completed = ($toggleResponse.Content | ConvertFrom-Json).completed
    Write-Host "✅ Task completion toggled: $completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to toggle task: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    exit 1
}

# Step 6: ASSIGN BUDDY TO CHARLIE
Write-Host "`n--- Step 6: ASSIGN BUDDY TO CHARLIE ---" -ForegroundColor Yellow
$assignBody = @{
    userId = $targetEmployeeId
    buddyId = $buddyId
} | ConvertTo-Json

try {
    $assignResponse = Invoke-WebRequest -Uri "$baseUrl/api/employees/buddy" `
        -Method POST `
        -Headers @{ 
            "Authorization" = "Bearer $adminToken"
            "Content-Type" = "application/json"
        } `
        -Body $assignBody
    
    Write-Host "✅ Buddy assigned to Charlie successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to assign buddy: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    exit 1
}

# Step 7: FINAL VERIFICATION
Write-Host "`n--- Step 7: FINAL VERIFICATION ---" -ForegroundColor Yellow
try {
    $finalResponse = Invoke-WebRequest -Uri "$baseUrl/api/employees" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $adminToken" }
    
    $finalEmployees = $finalResponse.Content | ConvertFrom-Json
    $finalCharlie = $finalEmployees | Where-Object { $_._id -eq $targetEmployeeId }
    
    if ($finalCharlie.buddy -and $finalCharlie.tasks.Count -gt 0) {
        Write-Host "🎉 ALL OPERATIONS SUCCESSFUL!" -ForegroundColor Green
        Write-Host "  • Charlie has buddy: $($finalCharlie.buddy)" -ForegroundColor Gray
        Write-Host "  • Charlie has $($finalCharlie.tasks.Count) tasks" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ Partial success - check buddy/task assignment" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Final verification failed" -ForegroundColor Red
}

Write-Host "`n✅ TEST COMPLETE - Used employee ID: 68f20015de5dfa993d6029af" -ForegroundColor Cyan