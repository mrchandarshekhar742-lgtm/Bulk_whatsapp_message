# System Architecture & Complete Working

## Overview
This is a simplified Excel data management system built with React frontend and Node.js/Express backend. Users can upload, view, download, and delete Excel files.

---

## 1. Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **UI Components**: Custom components with Tailwind CSS
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Icons**: React Icons (Material Design)
- **State Management**: React Context API

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Sequelize ORM with relational database (MySQL/PostgreSQL)
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Disk-based (uploads/excel directory)
- **File Parsing**: XLSX library
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Logging**: Custom logger utility

---

## 2. Frontend Architecture

### Page Structure
```
Frontend/src/
├── pages/
│   ├── LoginPage.jsx          - Public: User login/register
│   ├── Dashboard.jsx          - Protected: Excel stats overview
│   ├── CampaignsPage.jsx      - Protected: List all Excel files
│   ├── ExcelPage.jsx          - Protected: Upload new Excel files
│   └── ProfilePage.jsx        - Protected: Edit user profile
├── components/
│   ├── DashboardLayout.jsx    - Main layout wrapper
│   ├── Sidebar.jsx            - Left navigation menu
│   ├── ProtectedRoute.jsx     - Auth guard for routes
│   ├── StatCard.jsx           - Dashboard stats display
│   └── DataTable.jsx          - Generic table for data
├── context/
│   └── AuthContext.jsx        - Global auth state
├── hooks/
│   └── useAuth.js             - Auth utility hook
├── api/
│   └── client.js              - Axios instance with auth headers
└── App.jsx                    - Route definitions
```

### Navigation Flow
```
Login Page (Public)
    ↓
Auth Success (token saved)
    ↓
Dashboard (Protected)
    ├── View statistics
    ├── See recent files
    └── Navigation menu
         ├── Excel Files (CampaignsPage) - View all files
         ├── Upload (ExcelPage) - Upload new files
         └── Profile - Edit user info
```

---

## 3. Backend Architecture

### Directory Structure
```
backend/src/
├── models/
│   ├── index.js               - Model definitions & associations
│   ├── User.js                - User model
│   └── ExcelRecord.js         - Uploaded file metadata
├── routes/
│   ├── auth.routes.js         - Auth endpoints
│   └── excel.routes.js        - Excel file endpoints
├── controllers/
│   ├── authController.js      - Auth logic
│   └── (API handlers)
├── middleware/
│   ├── auth.js                - JWT verification
│   └── errorHandler.js        - Global error handling
├── services/
│   └── (Business logic)
├── utils/
│   └── logger.js              - Logging utility
├── config/
│   └── database.js            - DB connection
├── app.js                     - Express setup
└── server.js                  - Entry point

uploads/excel/                 - File storage directory
```

### Database Models

**User Table**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255) (hashed),
  company_name VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**ExcelRecord Table**
```sql
CREATE TABLE excel_records (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  user_id INTEGER FOREIGN KEY,
  file_name VARCHAR(255),
  file_path VARCHAR(512),
  total_rows INTEGER,
  rows JSON (parsed data),
  uploaded_at TIMESTAMP
);
```

### Model Relationships
```
User (1) ──── has many ──── ExcelRecord (n)
User.id              ExcelRecord.user_id
```

---

## 4. Complete User Workflow

### Step 1: User Registration
```
Browser → LoginPage (register form)
       ↓
       POST /api/auth/register
       {
         first_name, last_name, email, password, company_name
       }
       ↓
Backend → Validate input
       ↓ Hash password
       ↓ Save to users table
       ↓ Return success/error
       ↓
Frontend → Show success message → Redirect to login
```

### Step 2: User Login
```
Browser → LoginPage (login form)
       ↓
       POST /api/auth/login
       {
         email, password
       }
       ↓
Backend → Find user by email
       ↓ Compare password with hash
       ↓ Generate JWT token + refresh token
       ↓ Return tokens
       ↓
Frontend → Store JWT in memory
       ↓ Store refresh token in httpOnly cookie
       ↓ Save user data in Context
       ↓ Redirect to /dashboard
```

### Step 3: Access Protected Route
```
Browser → Click "Dashboard"
       ↓
Frontend → ProtectedRoute component
       ↓ Check if user exists in AuthContext
       ↓ Yes? Render Dashboard : Redirect to /login
       ↓
Dashboard → Fetch Excel files
       ↓ GET /api/excel (with Authorization header)
       ↓
Backend → Verify JWT token
       ↓ If valid, extract user_id from token
       ↓ Query ExcelRecord WHERE user_id = token.user_id
       ↓ Return records sorted by date DESC
       ↓
Frontend → Display stats:
            - Total files
            - Total rows
            - Average rows per file
            - Last upload date
       ↓
Frontend → Display recent 5 files in table
```

### Step 4: Upload Excel File
```
Browser → ExcelPage
       ↓
User selects file (xlsx/xls/csv)
       ↓
       POST /api/excel/upload (multipart/form-data)
       {
         file: <binary data>
       }
       ↓
Backend → Verify auth token
       ↓ Extract user_id
       ↓ Validate file extension (.xlsx, .xls, .csv)
       ↓ Save file to disk: uploads/excel/{timestamp}-{filename}
       ↓ Parse file using XLSX library
       ↓ Extract rows as JSON
       ↓ Save to excel_records table:
           {
             user_id,
             file_name,
             file_path,
             total_rows: parsed.length,
             rows: [parsed data],
             uploaded_at: now()
           }
       ↓
Frontend → Show success message
       ↓ Auto-refresh file list
       ↓ Update dashboard stats
```

### Step 5: View Excel Files
```
Browser → CampaignsPage (Excel Files)
       ↓
       GET /api/excel
       ↓
Backend → Verify token
       ↓ Query all ExcelRecord where user_id = token.user_id
       ↓ Order by uploaded_at DESC
       ↓ Return full records with all data
       ↓
Frontend → Display DataTable with columns:
            - File Name
            - Total Rows
            - Upload Date
            - Actions (Download, Delete)
```

### Step 6: Download Excel File
```
Browser → Click "Download" button
       ↓
       GET /api/excel/{id}/export
       ↓
Backend → Verify auth
       ↓ Find ExcelRecord by id
       ↓ Check if user owns it (user_id match)
       ↓ Convert rows JSON back to XLSX format
       ↓ Return file as blob with attachment header
       ↓
Frontend → Browser downloads file
           Filename: original file_name
```

### Step 7: Delete Excel File
```
Browser → Click "Delete" button
       ↓ Confirm dialog
       ↓
       DELETE /api/excel/{id}
       ↓
Backend → Verify auth
       ↓ Find ExcelRecord by id
       ↓ Check user ownership
       ↓ Delete physical file from disk
       ↓ Delete database record
       ↓ Return success
       ↓
Frontend → Remove from table
       ↓ Update stats
       ↓ Show success message
```

### Step 8: Update Profile
```
Browser → ProfilePage
       ↓
User edits first_name, last_name, company
       ↓
       PUT /api/auth/profile
       {
         first_name, last_name, company
       }
       ↓
Backend → Verify auth
       ↓ Update user record
       ↓ Return updated user
       ↓
Frontend → Update AuthContext
       ↓ Show success message
```

---

## 5. API Endpoints Summary

### Authentication
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/register` | No | Create new user |
| POST | `/api/auth/login` | No | Login & get tokens |
| POST | `/api/auth/logout` | Yes | Logout |
| POST | `/api/auth/refresh-token` | No | Get new access token |
| GET | `/api/auth/me` | Yes | Get current user |
| PUT | `/api/auth/profile` | Yes | Update profile |

### Excel Management
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/excel/upload` | Yes | Upload file |
| GET | `/api/excel` | Yes | List all files |
| GET | `/api/excel/:id` | Yes | Get single file |
| GET | `/api/excel/:id/export` | Yes | Download file |
| DELETE | `/api/excel/:id` | Yes | Delete file |

---

## 6. Authentication Flow

### Token Management
```
User logs in
    ↓
Server generates:
  - accessToken (JWT, short-lived: 15min)
  - refreshToken (httpOnly cookie, long-lived: 7 days)
    ↓
Frontend stores:
  - accessToken in memory (cleared on refresh)
  - refreshToken auto-managed in cookies
    ↓
Every API request:
  - Include Authorization: Bearer <accessToken>
  - Axios interceptor adds header
    ↓
Backend verifies:
  - Check JWT signature
  - Verify token not expired
  - Extract user_id from payload
    ↓
Token expired?
  - Frontend detects 401 response
  - Calls POST /api/auth/refresh-token
  - Gets new accessToken
  - Retries original request
```

### Middleware Flow
```
Request → CORS check
        → Rate limit check
        → Body parser
        → Request logger
        → Route handler
           ├─ (if protected route)
           │  └─ verifyToken middleware
           │     ├─ Check Authorization header
           │     ├─ Verify JWT signature
           │     ├─ Attach user to req.user
           │     └─ Next handler
           └─ Handler executes
        → Response sent
        → Error handler (if error)
```

---

## 7. File Storage & Management

### File Structure on Disk
```
backend/
└── uploads/
    └── excel/
        ├── 1701234567890-filename1.xlsx
        ├── 1701234568900-filename2.csv
        └── 1701234569910-filename3.xls
```

### Upload Process
```
User selects file
    ↓
Multer middleware:
  - Save to disk with unique name
  - Generate timestamp + random suffix
  - Preserve original extension
    ↓
File: {timestamp}-{randomNum}-{originalname}
    ↓
XLSX parses file:
  - Read first sheet
  - Convert to JSON array
  - Each row = object with column headers as keys
    ↓
Save to database:
  - Store file_path (disk location)
  - Store file_name (original name)
  - Store total_rows (count)
  - Store rows (JSON array)
```

### File Export
```
User clicks Download
    ↓
Backend retrieves rows JSON
    ↓
XLSX creates workbook:
  - Convert JSON back to sheet
  - Create new Excel file in memory
    ↓
Send as blob:
  - Content-Type: application/vnd.openxmlformats...
  - Content-Disposition: attachment; filename="..."
    ↓
Browser downloads file
```

---

## 8. Error Handling

### Global Error Handler
```
Error occurs in any route
    ↓
Try-catch block
    ↓ Catch error
    ↓ Log to console/file
    ↓ Format error response
    ↓
Return JSON:
{
  error: "User-friendly message",
  details: "Technical details (dev only)"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (not owner)
- `404` - Not found
- `429` - Rate limit exceeded
- `500` - Server error

### Validation Errors
```
Request body invalid
    ↓
Express-validator checks rules
    ↓
Validation fails
    ↓
Return 400:
{
  errors: [
    {
      value: "actual value",
      msg: "First name is required",
      param: "first_name",
      location: "body"
    }
  ]
}
```

---

## 9. Security Features

### 1. JWT Authentication
- Tokens signed with secret key
- Expiration prevents indefinite access
- Refresh mechanism for UX

### 2. Rate Limiting
- 100 requests per 15 minutes (per IP)
- 1000 requests in development
- Prevents brute force & DoS

### 3. CORS
- Whitelist specific origins
- Default: http://localhost:5173 (frontend)
- Prevents cross-origin attacks

### 4. Helmet Security Headers
- Prevents clickjacking
- XSS protection
- HSTS enforcement

### 5. Password Hashing
- bcrypt hashing (one-way)
- Salt rounds: 10
- Passwords never stored in plain text

### 6. File Upload Validation
- Extension whitelist (.xlsx, .xls, .csv)
- File size limits (50MB)
- User ownership verification

---

## 10. Data Flow Diagrams

### Login Sequence
```
┌─────────┐              ┌──────────────┐
│ Browser │              │ Backend      │
└────┬────┘              └──────┬───────┘
     │                          │
     │─── POST /auth/login ────→│
     │   {email, password}      │
     │                          │
     │◄────── JWT Token ────────│
     │        (in response)     │
     │                          │
  Store in memory               │
     │                          │
     │◄────── Refresh Token ────│
     │   (httpOnly cookie)      │
     │                          │
  Auto-managed by browser       │
```

### Protected Route Access
```
┌─────────┐              ┌──────────────┐
│ Browser │              │ Backend      │
└────┬────┘              └──────┬───────┘
     │                          │
  GET /api/excel                │
  Authorization: Bearer {token} │
     │─────────────────────────→│
     │                          │
     │              Verify JWT  │
     │              Extract ID  │
     │              Query DB    │
     │                          │
     │◄─ {excel_records} ──────│
     │                          │
  Render table                  │
```

### File Upload Flow
```
┌─────────┐     ┌──────────────┐     ┌─────────────┐
│ Browser │     │ Backend      │     │   Disk      │
└────┬────┘     └──────┬───────┘     └──────┬──────┘
     │                 │                    │
  Select file          │                    │
     │                 │                    │
  POST /excel/upload   │                    │
  {file}               │                    │
     │────────────────→│                    │
     │                 │                    │
     │                 │ Save file ────────→│
     │                 │                    │
     │                 │ Parse with XLSX   │
     │                 │                    │
     │                 │ Save to DB        │
     │                 │                    │
     │◄──── success────│                    │
     │                 │                    │
  Refresh list         │                    │
```

---

## 11. State Management

### Frontend State (React Context)
```
AuthContext
├── user: {id, email, first_name, last_name, company_name}
├── token: JWT string
├── isAuthenticated: boolean
├── isLoading: boolean
├── login(email, password): Promise
├── register(data): Promise
├── logout(): void
└── updateUser(data): void
```

### Local Component State
```
Dashboard
├── stats: {totalFiles, totalRows, averageRowsPerFile, lastUploadTime}
├── excelRecords: []
└── loading: boolean

ExcelPage
├── file: File | null
└── uploading: boolean

CampaignsPage
├── excelRecords: []
└── loading: boolean
```

---

## 12. Request/Response Examples

### Login Request
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response 200:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Upload Excel
```javascript
POST /api/excel/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form data:
  file: [binary file data]

Response 200:
{
  "success": true,
  "record": {
    "id": 5,
    "user_id": 1,
    "file_name": "contacts.xlsx",
    "file_path": "/uploads/excel/1701234567-contacts.xlsx",
    "total_rows": 150,
    "rows": [
      {"Name": "John", "Phone": "1234567890"},
      {"Name": "Jane", "Phone": "0987654321"}
    ],
    "uploaded_at": "2025-12-03T10:30:00Z"
  }
}
```

### List Excel Files
```javascript
GET /api/excel
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "records": [
    {
      "id": 5,
      "file_name": "contacts.xlsx",
      "total_rows": 150,
      "uploaded_at": "2025-12-03T10:30:00Z"
    },
    {
      "id": 4,
      "file_name": "leads.csv",
      "total_rows": 200,
      "uploaded_at": "2025-12-02T15:45:00Z"
    }
  ]
}
```

---

## 13. Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=mysql://user:password@localhost:3306/bulk_messaging
JWT_SECRET=your_secret_key_here
REFRESH_TOKEN_SECRET=your_refresh_secret
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

---

## Summary

**What the system does:**
1. Users register and login securely using JWT
2. Dashboard shows Excel file statistics
3. Users can upload Excel files (xlsx, xls, csv)
4. System parses files and stores data
5. Users can view all their files
6. Users can download files back
7. Users can delete files
8. Users can manage their profile

**Key components:**
- React frontend with protected routes
- Express backend with middleware security
- Sequelize ORM for data management
- JWT for stateless authentication
- File system for storage
- Excel parsing with XLSX library

**Security:**
- Password hashing
- JWT tokens
- Rate limiting
- CORS validation
- Input validation
- Error handling
