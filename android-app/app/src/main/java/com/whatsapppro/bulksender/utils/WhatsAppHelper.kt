package com.whatsapppro.bulksender.utils

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.util.Log
import java.net.URLEncoder

object WhatsAppHelper {
    private const val TAG = "WhatsAppHelper"
    private const val WHATSAPP_PACKAGE = "com.whatsapp"
    
    /**
     * Check if WhatsApp is installed
     */
    fun isWhatsAppInstalled(context: Context): Boolean {
        return try {
            context.packageManager.getPackageInfo(WHATSAPP_PACKAGE, 0)
            true
        } catch (e: PackageManager.NameNotFoundException) {
            false
        }
    }
    
    /**
     * Send WhatsApp message using intent
     * @return true if intent was launched successfully
     */
    fun sendMessage(
        context: Context,
        phoneNumber: String,
        message: String
    ): Boolean {
        return try {
            if (!isWhatsAppInstalled(context)) {
                Log.e(TAG, "WhatsApp is not installed")
                return false
            }
            
            // Clean phone number to only contain digits
            var cleanNumber = phoneNumber.replace(Regex("[^0-9]"), "")
            
            // If the number is 10 digits long, assume it's an Indian number and add the country code
            if (cleanNumber.length == 10) {
                cleanNumber = "91$cleanNumber"
            }

            // Encode message
            val encodedMessage = URLEncoder.encode(message, "UTF-8")
            
            // Create WhatsApp intent
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("https://wa.me/$cleanNumber?text=$encodedMessage")
                setPackage(WHATSAPP_PACKAGE)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            context.startActivity(intent)
            Log.d(TAG, "WhatsApp intent launched for $cleanNumber")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Error sending WhatsApp message: ${e.message}", e)
            false
        }
    }
    
    /**
     * Format phone number for WhatsApp
     * Ensures it starts with country code
     */
    fun formatPhoneNumber(phoneNumber: String): String {
        var formatted = phoneNumber.replace(Regex("[^0-9]"), "")
        
        // If the number is 10 digits long, assume it's an Indian number and add the country code
        if (formatted.length == 10) {
            formatted = "91$formatted"
        }
        
        return formatted
    }
    
    /**
     * Validate phone number format
     */
    fun isValidPhoneNumber(phoneNumber: String): Boolean {
        val cleaned = phoneNumber.replace(Regex("[^0-9+]"), "")
        return cleaned.length >= 10 && cleaned.length <= 15
    }
}
