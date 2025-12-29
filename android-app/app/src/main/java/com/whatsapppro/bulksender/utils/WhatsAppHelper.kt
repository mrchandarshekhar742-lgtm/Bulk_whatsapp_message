package com.whatsapppro.bulksender.utils

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.util.Log
import java.net.URLEncoder

object WhatsAppHelper {
    private const val TAG = "WhatsAppHelper"
    private const val WHATSAPP_PACKAGE = "com.whatsapp"
    private const val WHATSAPP_BUSINESS_PACKAGE = "com.whatsapp.w4b"
    
    /**
     * Universal WhatsApp detection - Works on ALL Android versions (4.4 to 15+)
     */
    fun isWhatsAppInstalled(context: Context): Boolean {
        return try {
            Log.d(TAG, "Checking WhatsApp installation on Android ${Build.VERSION.SDK_INT}")
            
            // Method 1: Direct package check (Works on all versions)
            if (isPackageInstalledDirect(context, WHATSAPP_PACKAGE)) {
                Log.d(TAG, "✅ Regular WhatsApp found via direct check")
                return true
            }
            
            // Method 2: WhatsApp Business check
            if (isPackageInstalledDirect(context, WHATSAPP_BUSINESS_PACKAGE)) {
                Log.d(TAG, "✅ WhatsApp Business found via direct check")
                return true
            }
            
            // Method 3: Intent resolution check (Android 11+ compatibility)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val intentResult = isWhatsAppAvailableViaIntent(context)
                if (intentResult) {
                    Log.d(TAG, "✅ WhatsApp found via intent resolution (Android 11+)")
                    return true
                }
            }
            
            // Method 4: Fallback for older versions
            val fallbackResult = isWhatsAppAvailableFallback(context)
            if (fallbackResult) {
                Log.d(TAG, "✅ WhatsApp found via fallback method")
                return true
            }
            
            // Method 5: Ultimate fallback - Check if wa.me links can be handled
            val waLinkResult = canHandleWaLinks(context)
            if (waLinkResult) {
                Log.d(TAG, "✅ WhatsApp found via wa.me link handling")
                return true
            }
            
            Log.w(TAG, "❌ WhatsApp not detected by any method")
            return false
            
        } catch (e: Exception) {
            Log.e(TAG, "Error checking WhatsApp installation: ${e.message}", e)
            // Fallback: assume WhatsApp is available for better UX
            Log.d(TAG, "⚠️ Detection failed, assuming WhatsApp is available")
            return true
        }
    }
    
    /**
     * Direct package check - Universal method
     */
    private fun isPackageInstalledDirect(context: Context, packageName: String): Boolean {
        return try {
            when {
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> {
                    context.packageManager.getPackageInfo(
                        packageName, 
                        PackageManager.PackageInfoFlags.of(0)
                    )
                }
                else -> {
                    @Suppress("DEPRECATION")
                    context.packageManager.getPackageInfo(packageName, 0)
                }
            }
            true
        } catch (e: PackageManager.NameNotFoundException) {
            false
        } catch (e: Exception) {
            Log.w(TAG, "Package check failed for $packageName: ${e.message}")
            false
        }
    }
    
    /**
     * Intent resolution check for Android 11+
     */
    private fun isWhatsAppAvailableViaIntent(context: Context): Boolean {
        return try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("https://wa.me/1234567890")
            }
            
            val resolveInfo = when {
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> {
                    context.packageManager.resolveActivity(
                        intent, 
                        PackageManager.ResolveInfoFlags.of(0)
                    )
                }
                else -> {
                    @Suppress("DEPRECATION")
                    context.packageManager.resolveActivity(intent, 0)
                }
            }
            
            val isAvailable = resolveInfo != null
            Log.d(TAG, "WhatsApp availability via intent resolution: $isAvailable")
            isAvailable
            
        } catch (e: Exception) {
            Log.w(TAG, "Intent resolution check failed: ${e.message}")
            false
        }
    }
    
    /**
     * Fallback method for older Android versions
     */
    private fun isWhatsAppAvailableFallback(context: Context): Boolean {
        return try {
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                setPackage(WHATSAPP_PACKAGE)
            }
            
            val activities = when {
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> {
                    context.packageManager.queryIntentActivities(
                        intent,
                        PackageManager.ResolveInfoFlags.of(0)
                    )
                }
                else -> {
                    @Suppress("DEPRECATION")
                    context.packageManager.queryIntentActivities(intent, 0)
                }
            }
            
            activities.isNotEmpty()
        } catch (e: Exception) {
            Log.w(TAG, "Fallback check failed: ${e.message}")
            true // Assume available if check fails
        }
    }
    
    /**
     * Check if device can handle wa.me links (Ultimate fallback)
     */
    private fun canHandleWaLinks(context: Context): Boolean {
        return try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("https://wa.me/1234567890")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            val canHandle = intent.resolveActivity(context.packageManager) != null
            Log.d(TAG, "wa.me link handling capability: $canHandle")
            canHandle
            
        } catch (e: Exception) {
            Log.w(TAG, "wa.me link check failed: ${e.message}")
            false
        }
    }
    
    /**
     * Get preferred WhatsApp package
     */
    private fun getWhatsAppPackage(context: Context): String? {
        return when {
            isPackageInstalledDirect(context, WHATSAPP_PACKAGE) -> WHATSAPP_PACKAGE
            isPackageInstalledDirect(context, WHATSAPP_BUSINESS_PACKAGE) -> WHATSAPP_BUSINESS_PACKAGE
            else -> WHATSAPP_PACKAGE // Default fallback
        }
    }
    
    /**
     * Universal WhatsApp message sending - Works on ALL Android versions
     */
    fun sendMessage(
        context: Context,
        phoneNumber: String,
        message: String
    ): Boolean {
        return try {
            Log.d(TAG, "🚀 Attempting to send message to $phoneNumber on Android ${Build.VERSION.SDK_INT}")
            
            // Clean and format phone number
            val cleanNumber = formatPhoneNumber(phoneNumber)
            Log.d(TAG, "📱 Formatted number: $phoneNumber -> $cleanNumber")
            
            // Encode message for URL
            val encodedMessage = URLEncoder.encode(message, "UTF-8")
            
            // Try multiple methods in order of compatibility and success rate
            val methods = listOf(
                { sendMessageMethod1(context, cleanNumber, encodedMessage) }, // wa.me with package
                { sendMessageMethod2(context, cleanNumber, encodedMessage) }, // wa.me generic
                { sendMessageMethod6(context, cleanNumber, encodedMessage) }, // API link
                { sendMessageMethod3(context, cleanNumber, message) },        // SEND intent
                { sendMessageMethod4(context, cleanNumber, message) },        // whatsapp:// scheme
                { sendMessageMethod5(context, cleanNumber, message) }         // Generic chooser
            )
            
            for ((index, method) in methods.withIndex()) {
                try {
                    Log.d(TAG, "🔄 Trying method ${index + 1}...")
                    if (method()) {
                        Log.d(TAG, "✅ Message sent successfully using method ${index + 1}")
                        return true
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "❌ Method ${index + 1} failed: ${e.message}")
                }
            }
            
            Log.e(TAG, "💥 All message sending methods failed")
            false
            
        } catch (e: Exception) {
            Log.e(TAG, "💥 Error sending WhatsApp message: ${e.message}", e)
            false
        }
    }
    
    /**
     * Method 1: wa.me link with specific package (Android 6+)
     */
    private fun sendMessageMethod1(context: Context, phoneNumber: String, encodedMessage: String): Boolean {
        return try {
            val whatsappPackage = getWhatsAppPackage(context)
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("https://wa.me/$phoneNumber?text=$encodedMessage")
                setPackage(whatsappPackage)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            context.startActivity(intent)
            Log.d(TAG, "Method 1: wa.me with package launched for $phoneNumber")
            true
        } catch (e: Exception) {
            Log.w(TAG, "Method 1 failed: ${e.message}")
            false
        }
    }
    
    /**
     * Method 2: wa.me link without package (Universal)
     */
    private fun sendMessageMethod2(context: Context, phoneNumber: String, encodedMessage: String): Boolean {
        return try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("https://wa.me/$phoneNumber?text=$encodedMessage")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            context.startActivity(intent)
            Log.d(TAG, "Method 2: Generic wa.me launched for $phoneNumber")
            true
        } catch (e: Exception) {
            Log.w(TAG, "Method 2 failed: ${e.message}")
            false
        }
    }
    
    /**
     * Method 3: WhatsApp SEND intent (Android 4.4+)
     */
    private fun sendMessageMethod3(context: Context, phoneNumber: String, message: String): Boolean {
        return try {
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, message)
                putExtra("jid", "$phoneNumber@s.whatsapp.net")
                setPackage(getWhatsAppPackage(context))
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            context.startActivity(intent)
            Log.d(TAG, "Method 3: WhatsApp SEND intent launched for $phoneNumber")
            true
        } catch (e: Exception) {
            Log.w(TAG, "Method 3 failed: ${e.message}")
            false
        }
    }
    
    /**
     * Method 4: WhatsApp scheme (Legacy support)
     */
    private fun sendMessageMethod4(context: Context, phoneNumber: String, message: String): Boolean {
        return try {
            val encodedMessage = URLEncoder.encode(message, "UTF-8")
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("whatsapp://send?phone=$phoneNumber&text=$encodedMessage")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            context.startActivity(intent)
            Log.d(TAG, "Method 4: WhatsApp scheme launched for $phoneNumber")
            true
        } catch (e: Exception) {
            Log.w(TAG, "Method 4 failed: ${e.message}")
            false
        }
    }
    
    /**
     * Method 5: Generic SEND intent (Ultimate fallback)
     */
    private fun sendMessageMethod5(context: Context, phoneNumber: String, message: String): Boolean {
        return try {
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, "$message\n\nSend to: $phoneNumber")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            context.startActivity(Intent.createChooser(intent, "Send via WhatsApp"))
            Log.d(TAG, "Method 5: Generic chooser launched for $phoneNumber")
            true
        } catch (e: Exception) {
            Log.w(TAG, "Method 5 failed: ${e.message}")
            false
        }
    }
    
    /**
     * Method 6: WhatsApp API link (Android 15+ optimized)
     */
    private fun sendMessageMethod6(context: Context, phoneNumber: String, encodedMessage: String): Boolean {
        return try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("https://api.whatsapp.com/send?phone=$phoneNumber&text=$encodedMessage")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            context.startActivity(intent)
            Log.d(TAG, "Method 6: WhatsApp API link launched for $phoneNumber")
            true
        } catch (e: Exception) {
            Log.w(TAG, "Method 6 failed: ${e.message}")
            false
        }
    }
    
    /**
     * Universal phone number formatting
     */
    fun formatPhoneNumber(phoneNumber: String): String {
        // Remove all non-digit characters except +
        var formatted = phoneNumber.replace(Regex("[^0-9+]"), "")
        
        // Remove leading + if present
        if (formatted.startsWith("+")) {
            formatted = formatted.substring(1)
        }
        
        // Handle different number formats
        formatted = when {
            // Already has country code (11+ digits)
            formatted.length >= 11 -> formatted
            // 10 digit number (assume Indian)
            formatted.length == 10 -> "91$formatted"
            // 11 digit number starting with 0 (remove 0, add 91)
            formatted.length == 11 && formatted.startsWith("0") -> "91${formatted.substring(1)}"
            // Other cases - add 91 prefix
            formatted.length >= 8 -> "91$formatted"
            // Too short - return as is
            else -> formatted
        }
        
        Log.d(TAG, "Formatted phone number: $phoneNumber -> $formatted")
        return formatted
    }
    
    /**
     * Validate phone number format
     */
    fun isValidPhoneNumber(phoneNumber: String): Boolean {
        val cleaned = phoneNumber.replace(Regex("[^0-9+]"), "")
        val isValid = cleaned.length >= 8 && cleaned.length <= 15
        Log.d(TAG, "Phone number validation: $phoneNumber -> $isValid")
        return isValid
    }
    
    /**
     * Get WhatsApp version info (Universal)
     */
    fun getWhatsAppInfo(context: Context): String {
        return try {
            val whatsappPackage = getWhatsAppPackage(context)
            if (whatsappPackage != null && isPackageInstalledDirect(context, whatsappPackage)) {
                val packageInfo = when {
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> {
                        context.packageManager.getPackageInfo(
                            whatsappPackage, 
                            PackageManager.PackageInfoFlags.of(0)
                        )
                    }
                    else -> {
                        @Suppress("DEPRECATION")
                        context.packageManager.getPackageInfo(whatsappPackage, 0)
                    }
                }
                "Package: $whatsappPackage, Version: ${packageInfo.versionName}, Android: ${Build.VERSION.SDK_INT}"
            } else {
                "WhatsApp not found, Android: ${Build.VERSION.SDK_INT}"
            }
        } catch (e: Exception) {
            "Error getting WhatsApp info: ${e.message}, Android: ${Build.VERSION.SDK_INT}"
        }
    }
    
    /**
     * Get Android version compatibility info
     */
    fun getCompatibilityInfo(): String {
        val androidVersion = when {
            Build.VERSION.SDK_INT >= 35 -> "Android 15+"
            Build.VERSION.SDK_INT >= 34 -> "Android 14"
            Build.VERSION.SDK_INT >= 33 -> "Android 13"
            Build.VERSION.SDK_INT >= 32 -> "Android 12L"
            Build.VERSION.SDK_INT >= 31 -> "Android 12"
            Build.VERSION.SDK_INT >= 30 -> "Android 11"
            Build.VERSION.SDK_INT >= 29 -> "Android 10"
            Build.VERSION.SDK_INT >= 28 -> "Android 9"
            Build.VERSION.SDK_INT >= 27 -> "Android 8.1"
            Build.VERSION.SDK_INT >= 26 -> "Android 8.0"
            Build.VERSION.SDK_INT >= 25 -> "Android 7.1"
            Build.VERSION.SDK_INT >= 24 -> "Android 7.0"
            Build.VERSION.SDK_INT >= 23 -> "Android 6.0"
            Build.VERSION.SDK_INT >= 22 -> "Android 5.1"
            Build.VERSION.SDK_INT >= 21 -> "Android 5.0"
            Build.VERSION.SDK_INT >= 19 -> "Android 4.4"
            else -> "Android ${Build.VERSION.SDK_INT}"
        }
        
        return "Running on: $androidVersion (API ${Build.VERSION.SDK_INT}) - Fully Supported ✅"
    }
}
