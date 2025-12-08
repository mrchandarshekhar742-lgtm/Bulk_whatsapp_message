# Simplified API Documentation (Excel Only)

## Overview
This is now a simplified bulk messaging system with only Excel file management. All QR code, WhatsApp account, virtual number, and campaign functionality has been removed.

---

## API Routes

### 1. Health Check
**GET** `/health`
- No authentication required
- Returns: `{ status: 'ok', timestamp: '2025-12-03T...' }`

---

## 2. Auth Routes (`/api/auth`)

### Register User
**POST** `/api/auth/register`
- No authentication required
- Body:
  ```json
  {
    "first_name": "string (required)",
    "last_name": "string (required)",
    "email": "string (required, valid email)",
    "password": "string (required, min 8 chars)",
    "company_name": "string (optional)"
  }
  ```

### Login
**POST** `/api/auth/login`
- No authentication required
- Body:
  ```json
  {
    "email": "string (required)",
    "password": "string (required)"
  }
  ```
- Returns: `{ token: "jwt_token", refresh_token: "refresh_token" }`

### Refresh Token
**POST** `/api/auth/refresh-token`
- No authentication required
- Refreshes access token

### Logout
**POST** `/api/auth/logout`
- Requires: Authorization header with Bearer token
- Logs out current user

### Get Current User
**GET** `/api/auth/me`
- Requires: Authorization header with Bearer token
- Returns: Current user profile data

---

## 3. Excel Routes (`/api/excel`)
**All routes require authentication**

### Upload Excel File
**POST** `/api/excel/upload`
- Requires: Authorization header with Bearer token
- Form Data:
  - `file`: file upload (xlsx, xls, csv)
- Returns:
  ```json
  {
    "success": true,
    "record": {
      "id": 1,
      "user_id": 1,
      "file_name": "contacts.xlsx",
      "file_path": "/uploads/excel/...",
      "total_rows": 100,
      "rows": [...],
      "uploaded_at": "2025-12-03T..."
    }
  }
  ```

### Get All Excel Records
**GET** `/api/excel`
- Requires: Authorization header with Bearer token
- Returns all uploaded files for current user (sorted by upload date, newest first)
- Response:
  ```json
  {
    "success": true,
    "records": [...]
  }
  ```

### Get Single Excel Record
**GET** `/api/excel/:id`
- Requires: Authorization header with Bearer token
- Parameters:
  - `id`: integer (record ID)
- Returns:
  ```json
  {
    "success": true,
    "record": { ... }
  }
  ```

### Delete Excel Record
**DELETE** `/api/excel/:id`
- Requires: Authorization header with Bearer token
- Parameters:
  - `id`: integer (record ID)
- Deletes the file from disk and database
- Returns: `{ success: true }`

### Export Excel Record
**GET** `/api/excel/:id/export`
- Requires: Authorization header with Bearer token
- Parameters:
  - `id`: integer (record ID)
- Returns: Downloadable XLSX file with the original data

---

## Global Features

### Authentication
- Uses JWT tokens in Authorization header: `Bearer <token>`
- Refresh token stored in httpOnly cookies
- Token expiration handled via refresh endpoint

### Rate Limiting
- Global limit: 100 requests per 15 minutes (1000 in development)
- Applied to all endpoints

### Middleware
- **CORS**: Enabled (origin: CORS_ORIGIN env or http://localhost:5173)
- **Helmet**: Security headers enabled
- **Request logging**: All requests logged with IP and method
- **Error handling**: Global error handler catches all errors

### Error Responses
Standard error format:
```json
{
  "error": "Error message",
  "details": "Optional error details"
}
```

Validation errors:
```json
{
  "errors": [
    {
      "value": "actual value",
      "msg": "error message",
      "param": "parameter name",
      "location": "body|query|params"
    }
  ]
}
```

---

## Database Models

### User Model
- `id` - Primary key
- `first_name` - User's first name
- `last_name` - User's last name
- `email` - User's email (unique)
- `password` - Hashed password
- `company_name` - Optional company name
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

### ExcelRecord Model
- `id` - Primary key
- `user_id` - Foreign key to User
- `file_name` - Original file name
- `file_path` - Path to stored file
- `total_rows` - Number of rows in file
- `rows` - JSON data of parsed rows
- `uploaded_at` - Upload timestamp

---

## File Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── index.js          (Model definitions & associations)
│   │   ├── User.js
│   │   └── ExcelRecord.js
│   ├── routes/
│   │   ├── auth.routes.js    (User registration, login, logout)
│   │   └── excel.routes.js   (Excel file management)
│   ├── controllers/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   ├── config/
│   └── app.js                (Main Express app setup)
└── uploads/
    └── excel/                (Uploaded Excel files stored here)
```

---

## Getting Started

### Setup
1. Install dependencies: `npm install`
2. Configure `.env` file with database credentials
3. Run database migrations
4. Start server: `npm start`

### Usage Flow
1. User registers with `/api/auth/register`
2. User logs in with `/api/auth/login`
3. User uploads Excel file with `/api/excel/upload`
4. User can view, export, or delete Excel records

---

## Environment Variables
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - Secret for signing JWT tokens
- `REFRESH_TOKEN_SECRET` - Secret for refresh tokens
- `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:5173)
- `NODE_ENV` - Environment (development/production)
- `RATE_LIMIT_WINDOW` - Rate limit window in minutes (default: 15)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)
