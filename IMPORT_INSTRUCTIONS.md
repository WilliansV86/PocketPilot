# PocketPilot - Import Your Local Data to Production

## Your Local Data Has Been Exported! ✅

**Data Summary:**
- Accounts: 6
- Transactions: 6  
- Categories: 20
- Debts: 9
- Money Owed: 6
- Goals: 2

## Quick Import Commands

Once you know your Vercel URL, run one of these:

### Option 1: PowerShell (Windows)
```powershell
$data = Get-Content "exported-data.json" -Raw
$response = Invoke-WebRequest -Uri "YOUR_VERCEL_URL/api/import-local-data" -Method POST -Body $data -ContentType "application/json" -UseBasicParsing
$response.Content
```

### Option 2: curl (Mac/Linux/Windows)
```bash
curl -X POST YOUR_VERCEL_URL/api/import-local-data \
  -H "Content-Type: application/json" \
  -d @exported-data.json
```

### Option 3: Use the Sync Tool
1. Open `sync-tool.html` in your browser
2. Enter your Vercel URL
3. Click Export → Import

## What Your URL Might Be:
- https://pocketpilot.vercel.app
- https://pocketpilot-[random].vercel.app
- https://[project-name].vercel.app

Check your Vercel dashboard to find the exact URL!
