# 📊 Excel File Format Guide for WhatsApp Pro

## ✅ **Correct Excel Format**

### **Required Columns:**
| Column Name | Description | Example | Required |
|-------------|-------------|---------|----------|
| `Name` | Contact name | John Doe | ✅ Yes |
| `Phone` | Phone number with country code | +919876543210 | ✅ Yes |

### **Optional Columns:**
| Column Name | Description | Example | Required |
|-------------|-------------|---------|----------|
| `Email` | Email address | john@example.com | ❌ No |
| `Company` | Company name | ABC Corp | ❌ No |
| `City` | City name | Mumbai | ❌ No |
| `Product` | Product name | iPhone 15 | ❌ No |
| `Amount` | Amount/Price | ₹50,000 | ❌ No |

## 📋 **Sample Excel File:**

```
Name        | Phone          | Email              | Company   | City      | Product    | Amount
------------|----------------|--------------------|-----------|-----------|-----------|---------
John Doe    | +919876543210  | john@example.com   | ABC Corp  | Mumbai    | iPhone 15 | ₹50,000
Jane Smith  | +919876543211  | jane@example.com   | XYZ Ltd   | Delhi     | Samsung   | ₹30,000
Mike Johnson| +919876543212  | mike@example.com   | Tech Inc  | Bangalore | OnePlus   | ₹25,000
Sarah Wilson| +919876543213  | sarah@example.com  | StartupCo | Pune      | Xiaomi    | ₹15,000
```

## 🎯 **Message Template Examples:**

### **Basic Template:**
```
Hello {{Name}}! Welcome to our service.
```

### **Advanced Template:**
```
Hi {{Name}},

Thank you for your interest in {{Product}}!

Company: {{Company}}
Location: {{City}}
Price: {{Amount}}

Contact us for more details.

Best regards,
Sales Team
```

## ⚠️ **Common Issues & Solutions:**

### **Issue 1: Phone Number Format**
❌ **Wrong:** `9876543210`, `919876543210`
✅ **Correct:** `+919876543210`

### **Issue 2: Column Names**
❌ **Wrong:** `phone_number`, `contact_name`, `PHONE`
✅ **Correct:** `Phone`, `Name` (exact case-sensitive)

### **Issue 3: Empty Rows**
❌ **Wrong:** Having empty rows between data
✅ **Correct:** Continuous data without empty rows

### **Issue 4: Special Characters**
❌ **Wrong:** Using special characters in phone numbers: `+91-98765-43210`
✅ **Correct:** Clean format: `+919876543210`

## 🔧 **Excel File Preparation Steps:**

1. **Open Excel/Google Sheets**
2. **Create headers in Row 1:** `Name`, `Phone`, `Email`, etc.
3. **Add data starting from Row 2**
4. **Ensure phone numbers have country code (+91 for India)**
5. **Remove any empty rows**
6. **Save as .xlsx or .csv format**
7. **Upload to WhatsApp Pro**

## 📱 **Phone Number Formats by Country:**

| Country | Format | Example |
|---------|--------|---------|
| India | +91XXXXXXXXXX | +919876543210 |
| USA | +1XXXXXXXXXX | +11234567890 |
| UK | +44XXXXXXXXXX | +441234567890 |
| UAE | +971XXXXXXXXX | +971501234567 |
| Saudi Arabia | +966XXXXXXXXX | +966501234567 |

## 🚀 **Pro Tips:**

1. **Keep it Simple:** Only use required columns if you don't need variables
2. **Test Small:** Upload 5-10 contacts first to test
3. **Clean Data:** Remove duplicates and invalid numbers
4. **Backup:** Keep a backup of your original file
5. **Validate:** Check phone numbers are working before bulk upload

## 🛠️ **Troubleshooting:**

### **Upload Fails:**
- Check file format (.xlsx or .csv)
- Ensure `Name` and `Phone` columns exist
- Remove empty rows
- Check file size (max 10MB)

### **Messages Not Sending:**
- Verify phone number format (+country code)
- Check if numbers are active
- Ensure message template uses correct variable names

### **Variables Not Working:**
- Use exact column names: `{{Name}}`, `{{Phone}}`
- Case-sensitive: `{{name}}` won't work if column is `Name`
- No spaces: `{{Name}}` not `{{ Name }}`