# Test Frontend Website & Android App

Your network is working! Now test the actual website and app.

---

## 1. Test Frontend Website (React)

### Step 1: Start Frontend Server
```bash
cd Frontend
npm run dev -- --host 0.0.0.0
```

You should see:
```
Local:    http://localhost:5173
Network:  http://192.168.1.45:5173
```

### Step 2: Test from PC Browser
```
http://localhost:5173
```
Should show login page ✓

### Step 3: Test from Android Phone Browser
Connect phone to same Wi-Fi, then open:
```
http://192.168.1.45:5173
```
Should show login page on phone ✓

### Step 4: Register New User (from phone or PC)
1. Click "Sign up" or register link
2. Fill form:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Password: Password123
   - Company: My Company
3. Click Register
4. Should redirect to Login

### Step 5: Login
1. Email: test@example.com
2. Password: Password123
3. Click Login
4. Should show Dashboard ✓

### Step 6: Test Features
- **Dashboard**: See Excel file stats
- **Excel Files**: View uploaded files
- **Upload**: Upload an Excel file
  - Use any .xlsx or .csv file
  - Check "Recent Files" table
- **Profile**: Edit your name/company

---

## 2. Test Android App (If You Have One)

### If You Have Android Project

#### Update API Configuration
In your Android app code, set:
```kotlin
val API_BASE_URL = "http://192.168.1.45:5000"
// or from BuildConfig
const val BASE_URL = "http://192.168.1.45:5000"
```

#### Add Network Security Config (if using cleartext)
Create: `app/src/main/res/xml/network_security_config.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false" />
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">192.168.1.45</domain>
    </domain-config>
</network-security-config>
```

Update `AndroidManifest.xml`:
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

#### Build & Run
```bash
cd android-app
./gradlew build
./gradlew installDebug
# Or use Android Studio to run
```

#### Test in App
1. Register user
2. Login
3. Upload Excel file
4. View files
5. Download file

---

## 3. Quick Testing Checklist

### Backend Server ✓
```
✅ http://192.168.1.45:5000/health → {"status":"ok"}
```

### Frontend Website
```
⬜ http://localhost:5173 (PC)
⬜ http://192.168.1.45:5173 (Phone)
⬜ Register new user
⬜ Login
⬜ Dashboard loads
⬜ Upload Excel file
⬜ Download file
⬜ Delete file
```

### Android App (if available)
```
⬜ API base URL set to http://192.168.1.45:5000
⬜ Network security config added
⬜ App starts
⬜ Register user
⬜ Login works
⬜ Upload file
⬜ View files
⬜ Download file
```

---

## 4. Test Excel Upload

### Sample Excel File
Create test file or use this CSV:

**contacts.csv:**
```
Name,Email,Phone
John Doe,john@example.com,9876543210
Jane Smith,jane@example.com,9123456789
Bob Johnson,bob@example.com,9111111111
```

Save as `contacts.csv` or `contacts.xlsx`

### Upload Steps
1. Go to website: http://192.168.1.45:5173
2. Login with test account
3. Click "Upload" or "Excel" menu
4. Select your CSV/Excel file
5. Should show:
   - File name
   - Number of rows
   - Upload date
6. In "Excel Files" tab, see your uploaded file ✓

---

## 5. Full End-to-End Test (5 minutes)

### From Android Phone:
1. Open browser
2. Go to `http://192.168.1.45:5173`
3. Register: test@test.com / Pass123
4. Login
5. Click "Upload"
6. Select Excel file
7. See file in list
8. Download it back
9. Delete it

✅ All working = System is ready!

---

## 6. Troubleshooting

### Frontend Not Loading
```
Error: Cannot reach 192.168.1.45:5173
```
**Fix:**
1. Start frontend: `npm run dev -- --host 0.0.0.0`
2. Check .env.local has correct IP
3. Both PC and phone on same Wi-Fi
4. Wait 10 seconds for Vite to compile

### Login Failed
```
Error: 401 Unauthorized
```
**Fix:**
1. Check .env.local has: `VITE_API_URL=http://192.168.1.45:5000`
2. Verify backend is running: `npm start` in backend folder
3. Try registering new user first

### Cannot Upload File
```
Error: 413 Payload Too Large
```
**Fix:**
- File is too big
- Try with smaller Excel file (under 50MB)

### Android App Can't Connect
```
Error: Network unreachable
```
**Fix:**
1. Phone and PC on same Wi-Fi
2. Check API base URL: `http://192.168.1.45:5000` (not localhost)
3. Network security config added
4. Firewall rule is open

---

## What's Working Now

✅ Backend API server (0.0.0.0:5000)  
✅ Network accessible (192.168.1.45)  
✅ Firewall open  
✅ Ready for website testing  
✅ Ready for Android app testing  

**Next:** Test the actual website on your phone! 🎉
