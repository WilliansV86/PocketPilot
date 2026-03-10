# PowerShell script to sync local data to production
# Run this in PowerShell after the deployment is complete

# Step 1: Get local data
Write-Host "Exporting local data..."
$localData = Invoke-WebRequest -Uri "http://localhost:3000/api/export-local-data" -UseBasicParsing
$jsonContent = $localData.Content

Write-Host "Local data exported successfully"
Write-Host "Data summary:"
$jsonContent | ConvertFrom-Json | Select-Object -ExpandProperty counts | Format-List

# Step 2: Import to production (replace with your actual Vercel URL)
$productionUrl = "https://your-pocketpilot-url.vercel.app/api/import-local-data"

Write-Host "Importing to production..."
try {
    $response = Invoke-WebRequest -Uri $productionUrl -Method POST -Body $jsonContent -ContentType "application/json" -UseBasicParsing
    Write-Host "Import successful!"
    Write-Host "Response:"
    $response.Content | ConvertFrom-Json | Format-List
} catch {
    Write-Host "Import failed. Error:"
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "Please make sure:"
    Write-Host "1. The latest deployment is complete"
    Write-Host "2. Replace '$productionUrl' with your actual Vercel URL"
    Write-Host "3. The import endpoint is available"
}

Write-Host ""
Write-Host "Script completed."
