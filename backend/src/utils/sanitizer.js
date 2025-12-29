const validator = require('validator');

/**
 * Sanitize and validate phone number - More lenient for testing
 */
function sanitizePhoneNumber(phone) {
  if (!phone) return null;
  
  // Convert to string and trim
  let sanitized = phone.toString().trim();
  
  // Remove all non-digit characters except +
  sanitized = sanitized.replace(/[^\d+]/g, '');
  
  // More lenient validation - accept shorter numbers for testing
  if (!sanitized || sanitized.length < 8) {
    return null;
  }
  
  // Add country code if missing
  if (!sanitized.startsWith('+')) {
    if (sanitized.length === 10) {
      sanitized = '+91' + sanitized; // Default to India
    } else if (sanitized.length === 11 && sanitized.startsWith('0')) {
      // Remove leading 0 and add +91
      sanitized = '+91' + sanitized.substring(1);
    } else if (sanitized.length === 12 && sanitized.startsWith('91')) {
      sanitized = '+' + sanitized;
    } else if (sanitized.length >= 8) {
      // For testing - accept any number with 8+ digits
      sanitized = '+91' + sanitized;
    }
  }
  
  return sanitized;
}

/**
 * Sanitize message content
 */
function sanitizeMessage(message) {
  if (!message) return '';
  
  // Convert to string and trim
  let sanitized = message.toString().trim();
  
  // Remove potential XSS content
  sanitized = validator.escape(sanitized);
  
  // Limit length
  if (sanitized.length > 4096) {
    sanitized = sanitized.substring(0, 4096);
  }
  
  return sanitized;
}

/**
 * Sanitize device label
 */
function sanitizeDeviceLabel(label) {
  if (!label) return '';
  
  let sanitized = label.toString().trim();
  
  // Remove special characters except spaces, hyphens, underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_]/g, '');
  
  // Limit length
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  
  return sanitized;
}

/**
 * Sanitize email
 */
function sanitizeEmail(email) {
  if (!email) return null;
  
  const sanitized = email.toString().trim().toLowerCase();
  
  if (!validator.isEmail(sanitized)) {
    return null;
  }
  
  return sanitized;
}

/**
 * Sanitize name fields
 */
function sanitizeName(name) {
  if (!name) return '';
  
  let sanitized = name.toString().trim();
  
  // Remove numbers and special characters except spaces, hyphens, apostrophes
  sanitized = sanitized.replace(/[^a-zA-Z\s\-']/g, '');
  
  // Limit length
  if (sanitized.length > 50) {
    sanitized = sanitized.substring(0, 50);
  }
  
  return sanitized;
}

/**
 * Validate and sanitize integer
 */
function sanitizeInteger(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed) || parsed < min || parsed > max) {
    return null;
  }
  
  return parsed;
}

/**
 * Validate and sanitize boolean
 */
function sanitizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return false;
}

module.exports = {
  sanitizePhoneNumber,
  sanitizeMessage,
  sanitizeDeviceLabel,
  sanitizeEmail,
  sanitizeName,
  sanitizeInteger,
  sanitizeBoolean,
};