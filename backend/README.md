# Backend development notes

## Dev-only convenience endpoints and scripts

- `POST /api/settings/whatsapp-reinit-dev` (dev only)
  - Triggers `reinitializeWhatsApp({ force })` without requiring an access token.
  - Guarded with `process.env.NODE_ENV === 'development'` to avoid exposure in production.
  - Use this route during dev to force re-initialization when Baileys is not connected.

- `backend/scripts/reinit.js`
  - Script that logs in with the dev seed user (`test@example.com`) and calls the auth-protected reinit endpoint.
  - This is useful if you want to test reinit with an authenticated call.

## Recommended env settings during development

- `ENABLE_DB_ALTER=false` (default) — prevent `sequelize.sync({ alter: true })` from running automatically; set to true only when intentionally altering schemas.
- `INIT_WHATSAPP_ON_START=false` — avoid Baileys auto-initialization in dev. Use `reinit` route or set `INIT_WHATSAPP_ON_START=true` to start it on boot.
- `MOCK_WHATSAPP=true` for a mocked WhatsApp flow without connecting to real WhatsApp (for unit tests and dev).

## Sample flow to reinitialize Baileys (dev)

1. Start the server:

```powershell
cd backend
$env:ENABLE_DB_ALTER='false'
$env:INIT_WHATSAPP_ON_START='false'
npm run dev
```

2. Call the dev endpoint to reinitialize (no token required):

```powershell
Invoke-RestMethod -Uri 'http://localhost:5000/api/settings/whatsapp-reinit-dev' -Method Post -Body (@{ force = $true } | ConvertTo-Json) -ContentType 'application/json'
```

3. To run the auth-protected reinit instead (preferred in integration tests):

```powershell
# Login
$body = @{ email = 'test@example.com'; password = 'password123' } | ConvertTo-Json
$login = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
$token = $login.access_token

# Reinit (auth required)
$headers = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }
Invoke-RestMethod -Uri 'http://localhost:5000/api/settings/whatsapp-reinit' -Method Post -Headers $headers -Body (@{ force = $true } | ConvertTo-Json)
```

4. Watch server logs for the QR code generation messages or 'Device logged out' if there are connection failures.

## Per-account initialization

- `POST /api/whatsapp-accounts/:id/init` (authenticated)
  - Trigger a per-account initialization (calls the Baileys connection flow for the specified account).
  - Useful for starting a specific socket when an account is marked as disconnected.
  - Example (PowerShell):

```powershell
$headers = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }
Invoke-RestMethod -Uri "http://localhost:5000/api/whatsapp-accounts/$accountId/init" -Method Post -Headers $headers
```

### Reinitialize a single account (force)

- `POST /api/whatsapp-accounts/:id/reinit` (authenticated)
  - This will disconnect the account (logout, remove auth files) and reinitialize the Baileys connection for that account.
  - Useful for recovering a single account if its auth files or socket are problematic.
  - Example (PowerShell):

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/whatsapp-accounts/$accountId/reinit" -Method Post -Headers $headers
```
