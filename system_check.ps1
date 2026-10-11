## System verification script (PowerShell)
# Save this as `system_check.ps1` in the project root and run it from PowerShell.
# It checks Docker containers, backend HTTP endpoints, PostgreSQL connectivity, and launches the frontend.

# 1. Verify Docker containers are running
Write-Host "=== Docker containers status ==="
$containers = docker ps --format "{{.Names}}: {{.Status}}"
if ($containers) {
    $containers
} else {
    Write-Error "No containers are running. Run `docker-compose up -d` first."
    exit 1
}

# Helper to perform a simple HTTP GET and report status
# Helper to perform a simple HTTP GET and report status
function Test-Endpoint($url, $name, $auth = $true) {
    $hdr = if ($auth) { @{ "X-User-Email" = "pradnya.wakode23@pccoepune.org" } } else { @{} }
    try {
        $resp = Invoke-WebRequest -Uri $url -Headers $hdr -UseBasicParsing -Method GET -TimeoutSec 5
        if ($resp.StatusCode -eq 200) {
            Write-Host "[PASS] $name ($url) returned 200"
        } else {
            Write-Warning "[WARN] $name ($url) returned $($resp.StatusCode)"
        }
    } catch {
        Write-Error "[FAIL] $name ($url) could not be reached: $_"
    }
}

# 2. Public Health Endpoints (Beacon / Monitoring - Unauthenticated)
Write-Host "\n=== Microservices Public Health Checks (/health) ==="
Test-Endpoint "http://localhost:3001/health" "Resource Service Health" $false
Test-Endpoint "http://localhost:3002/health" "Timetable Service Health" $false
Test-Endpoint "http://localhost:3003/health" "Booking Service Health" $false
Test-Endpoint "http://localhost:3004/health" "Notification Service Health" $false

# 3. Authenticated Business API checks
Write-Host "\n=== Authenticated Business API checks ==="
Test-Endpoint "http://localhost:3001/resources" "Resource Service API"
Test-Endpoint "http://localhost:3002/timetables" "Timetable Service API"
Test-Endpoint "http://localhost:3003/bookings" "Booking Service API"
Test-Endpoint "http://localhost:3004/notifications/user/pradnya.wakode23@pccoepune.org" "Notification Service API"

# 3. PostgreSQL sanity checks
Write-Host "\n=== PostgreSQL checks ==="
$psqlOutput = docker exec distrbook-postgres psql -U postgres -d distribook --% -c "SELECT COUNT(*) AS resource_count FROM resource.\"Resource\";"
Write-Host $psqlOutput

# 4. Start the frontend (install deps if missing)
Write-Host "\n=== Frontend start ==="
Set-Location "frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing Node dependencies..."
    npm install
}
Write-Host "Launching Vite dev server..."
Start-Process "npm" "run dev" -WorkingDirectory (Get-Location)
Write-Host "Front‑end should be reachable at http://localhost:5173"

# End of script
