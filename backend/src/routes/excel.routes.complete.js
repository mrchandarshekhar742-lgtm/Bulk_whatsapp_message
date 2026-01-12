const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const csv = require('csv-parse');
const { ExcelRecord, ExcelRow } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { sanitizeInput } = require('../utils/sanitizer');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'));
    }
  }
});

// Upload and process Excel/CSV file with enhanced format support
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { defaultDuration = 30, defaultMessage = '' } = req.body;
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    logger.info(`Processing uploaded file: ${req.file.originalname}`, {
      userId: req.user.id,
      fileSize: req.file.size,
      fileType: fileExt
    });

    // Parse the file based on its type
    let data = [];
    let headers = [];

    if (fileExt === '.csv') {
      // Parse CSV
      const csvContent = fs.readFileSync(filePath, 'utf8');
      const records = await new Promise((resolve, reject) => {
        csv.parse(csvContent, { 
          columns: true, 
          skip_empty_lines: true,
          trim: true 
        }, (err, records) => {
          if (err) reject(err);
          else resolve(records);
        });
      });
      
      data = records;
      headers = Object.keys(records[0] || {});
    } else {
      // Parse Excel
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        throw new Error('File must contain at least a header row and one data row');
      }

      headers = jsonData[0].map(h => String(h).trim());
      data = jsonData.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });
    }

    // Detect column structure
    const phoneColumns = ['phone', 'number', 'mobile', 'contact', 'phone_number', 'phonenumber'];
    const durationColumns = ['duration', 'delay', 'wait', 'gap', 'time', 'seconds'];
    const messageColumns = ['message', 'text', 'content', 'msg', 'body'];

    const phoneColumn = headers.find(h => 
      phoneColumns.some(pc => h.toLowerCase().includes(pc.toLowerCase()))
    );
    const durationColumn = headers.find(h => 
      durationColumns.some(dc => h.toLowerCase().includes(dc.toLowerCase()))
    );
    const messageColumn = headers.find(h => 
      messageColumns.some(mc => h.toLowerCase().includes(mc.toLowerCase()))
    );

    if (!phoneColumn) {
      throw new Error('No phone number column found. Expected columns: ' + phoneColumns.join(', '));
    }

    // Create Excel record
    const excelRecord = await ExcelRecord.create({
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_path: filePath,
      total_records: data.length,
      user_id: req.user.id,
      has_duration_column: !!durationColumn,
      has_message_column: !!messageColumn,
      default_duration: parseInt(defaultDuration) || 30,
      default_message: sanitizeInput(defaultMessage) || ''
    });

    // Process and save individual rows
    const validRows = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const phoneNumber = String(row[phoneColumn] || '').trim();
      
      // Validate phone number
      if (!phoneNumber || phoneNumber.length < 10) {
        errors.push(`Row ${i + 2}: Invalid phone number "${phoneNumber}"`);
        continue;
      }

      // Clean phone number (remove non-digits)
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        errors.push(`Row ${i + 2}: Phone number too short "${phoneNumber}"`);
        continue;
      }

      // Get duration (in seconds)
      let duration = parseInt(defaultDuration) || 30;
      if (durationColumn && row[durationColumn]) {
        const customDuration = parseInt(row[durationColumn]);
        if (!isNaN(customDuration) && customDuration > 0) {
          duration = customDuration;
        }
      }

      // Get message
      let message = sanitizeInput(defaultMessage) || '';
      if (messageColumn && row[messageColumn]) {
        message = sanitizeInput(String(row[messageColumn]).trim()) || message;
      }

      validRows.push({
        excel_record_id: excelRecord.id,
        phone_number: cleanPhone,
        duration: duration,
        message: message,
        row_number: i + 2,
        status: 'PENDING'
      });
    }

    // Bulk insert valid rows
    if (validRows.length > 0) {
      await ExcelRow.bulkCreate(validRows);
    }

    // Update record with processed count
    await excelRecord.update({
      processed_records: validRows.length,
      status: validRows.length > 0 ? 'COMPLETED' : 'FAILED'
    });

    logger.info(`Excel processing completed`, {
      userId: req.user.id,
      recordId: excelRecord.id,
      totalRows: data.length,
      validRows: validRows.length,
      errors: errors.length
    });

    res.json({
      success: true,
      record: {
        id: excelRecord.id,
        filename: excelRecord.original_name,
        total_records: data.length,
        valid_records: validRows.length,
        has_duration_column: !!durationColumn,
        has_message_column: !!messageColumn,
        detected_columns: {
          phone: phoneColumn,
          duration: durationColumn,
          message: messageColumn
        }
      },
      errors: errors.slice(0, 10), // Limit errors shown
      message: `Successfully processed ${validRows.length} out of ${data.length} records`
    });

  } catch (error) {
    logger.error('Excel upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: error.message || 'Failed to process file',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all Excel records for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const records = await ExcelRecord.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      records: records
    });
  } catch (error) {
    logger.error('Error fetching Excel records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// Get specific Excel record with rows
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const record = await ExcelRecord.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id 
      }
    });

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Get first 10 rows as preview
    const rows = await ExcelRow.findAll({
      where: { excel_record_id: record.id },
      limit: 10,
      order: [['row_number', 'ASC']]
    });

    res.json({
      success: true,
      record: {
        ...record.toJSON(),
        preview_rows: rows
      }
    });
  } catch (error) {
    logger.error('Error fetching Excel record:', error);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Excel routes working!' });
});

module.exports = router;