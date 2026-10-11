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
function Test-Endpoint($url, $name) {
    $hdr = @{ "X-User-Email" = "pradnya.wakode23@pccoepune.org" }
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

# 2. Backend health checks (or simple endpoints)
Write-Host "\n=== Backend API checks ==="
# Resource Service – list resources (auth header needed)
Test-Endpoint "http://localhost:3001/resources" "Resource Service"
# Timetable Service – list timetables (auth header needed)
Test-Endpoint "http://localhost:3002/timetables" "Timetable Service"
# Booking Service – list bookings (auth header needed)
Test-Endpoint "http://localhost:3003/bookings" "Booking Service"
# Notification Service – list notifications for known user (auth header needed)
Test-Endpoint "http://localhost:3004/notifications/user/pradnya.wakode23@pccoepune.org" "Notification Service"

# 3. PostgreSQL sanity checks
Write-Host "\n=== PostgreSQL checks ==="
$psqlOutput = docker exec distrbook-postgres psql -U postgres -d distribook -c 'SET search_path TO resource; SELECT COUNT(*) AS resource_count FROM "Resource";'
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
