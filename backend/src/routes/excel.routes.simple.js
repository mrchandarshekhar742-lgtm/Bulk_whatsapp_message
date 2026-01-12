const express = require('express');
const { ExcelRecord } = require('../models');
const { verifyToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

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

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Excel routes working!' });
});

module.exports = router;