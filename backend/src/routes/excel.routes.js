const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { ExcelRecord } = require('../models');
const { verifyToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
router.use(verifyToken);

// Setup upload directory
const UPLOAD_DIR = path.join(__dirname, '../../uploads/excel');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  },
});

const upload = multer({ storage });

function parseWorkbook(filePath) {
  try {
    const wb = XLSX.readFile(filePath, { cellDates: true });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    let json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    // Normalize column names and validate data
    json = json.map(row => {
      const normalizedRow = {};
      
      // Normalize column names (case-insensitive mapping)
      Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase().trim();
        
        // Map common variations to standard names
        if (lowerKey.includes('name') || lowerKey === 'contact' || lowerKey === 'person') {
          normalizedRow.Name = row[key]?.toString().trim() || '';
        } else if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('number')) {
          let phone = row[key]?.toString().trim() || '';
          // Clean phone number
          phone = phone.replace(/[^\d+]/g, ''); // Remove all except digits and +
          if (phone && !phone.startsWith('+')) {
            // Add +91 for Indian numbers if no country code
            if (phone.length === 10) {
              phone = '+91' + phone;
            } else if (phone.length === 12 && phone.startsWith('91')) {
              phone = '+' + phone;
            }
          }
          normalizedRow.Phone = phone;
        } else if (lowerKey.includes('email') || lowerKey.includes('mail')) {
          normalizedRow.Email = row[key]?.toString().trim() || '';
        } else if (lowerKey.includes('company') || lowerKey.includes('organization')) {
          normalizedRow.Company = row[key]?.toString().trim() || '';
        } else if (lowerKey.includes('city') || lowerKey.includes('location')) {
          normalizedRow.City = row[key]?.toString().trim() || '';
        } else if (lowerKey.includes('product') || lowerKey.includes('item')) {
          normalizedRow.Product = row[key]?.toString().trim() || '';
        } else if (lowerKey.includes('amount') || lowerKey.includes('price') || lowerKey.includes('cost')) {
          normalizedRow.Amount = row[key]?.toString().trim() || '';
        } else {
          // Keep other columns as-is but capitalize first letter
          const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
          normalizedRow[capitalizedKey] = row[key]?.toString().trim() || '';
        }
      });
      
      return normalizedRow;
    });
    
    // Filter out rows without Name or Phone
    json = json.filter(row => row.Name && row.Phone);
    
    // Validate phone numbers
    json = json.filter(row => {
      const phone = row.Phone;
      return phone && phone.startsWith('+') && phone.length >= 10;
    });
    
    return json;
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

// POST /api/excel/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      // remove file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Parse rows
    const rows = parseWorkbook(req.file.path);
    
    if (rows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'No valid data found. Please ensure your Excel file has Name and Phone columns with valid data.' 
      });
    }

    // Validate required columns
    const firstRow = rows[0];
    if (!firstRow.Name || !firstRow.Phone) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'Required columns missing. Please ensure your Excel file has Name and Phone columns.' 
      });
    }

    const record = await ExcelRecord.create({
      user_id: userId,
      file_name: req.file.originalname,
      file_path: req.file.path,
      total_rows: rows.length,
      rows,
      uploaded_at: new Date(),
    });

    res.json({ 
      success: true, 
      record,
      message: `Successfully processed ${rows.length} contacts from ${req.file.originalname}`,
      sample_data: rows.slice(0, 3) // Show first 3 rows as sample
    });
  } catch (err) {
    logger.error('Excel upload failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/excel
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const records = await ExcelRecord.findAll({ where: { user_id: userId }, order: [['uploaded_at', 'DESC']] });
    res.json({ success: true, records });
  } catch (err) {
    logger.error('Get excel list failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/excel/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rec = await ExcelRecord.findByPk(id);
    if (!rec) return res.status(404).json({ error: 'Not found' });
    if (rec.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    res.json({ success: true, record: rec });
  } catch (err) {
    logger.error('Get excel failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/excel/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rec = await ExcelRecord.findByPk(id);
    if (!rec) return res.status(404).json({ error: 'Not found' });
    if (rec.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    // delete file if exists
    try { if (fs.existsSync(rec.file_path)) fs.unlinkSync(rec.file_path); } catch(e){}

    await rec.destroy();
    res.json({ success: true });
  } catch (err) {
    logger.error('Delete excel failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/excel/:id/export
router.get('/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const rec = await ExcelRecord.findByPk(id);
    if (!rec) return res.status(404).json({ error: 'Not found' });
    if (rec.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const ws = XLSX.utils.json_to_sheet(rec.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="${rec.file_name || 'export.xlsx'}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    logger.error('Export excel failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
