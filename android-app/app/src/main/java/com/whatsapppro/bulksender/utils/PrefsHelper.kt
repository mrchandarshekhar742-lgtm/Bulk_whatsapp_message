package com.whatsapppro.bulksender.utils

import android.content.Context
import android.content.SharedPreferences

object PrefsHelper {
    private const val PREFS_NAME = "whatsapp_sender_prefs"
    
    private const val KEY_DEVICE_TOKEN = "device_token"
    private const val KEY_SERVER_URL = "server_url"
    private const val KEY_AUTO_START = "auto_start"
    private const val KEY_KEEP_SCREEN_ON = "keep_screen_on"
    private const val KEY_MESSAGES_SENT_TODAY = "messages_sent_today"
    private const val KEY_TOTAL_MESSAGES_SENT = "total_messages_sent"
    private const val KEY_TOTAL_MESSAGES_FAILED = "total_messages_failed"
    private const val KEY_LAST_RESET_DATE = "last_reset_date"
    
    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }
    
    // Device Token
    fun saveDeviceToken(context: Context, token: String) {
        getPrefs(context).edit().putString(KEY_DEVICE_TOKEN, token).apply()
    }
    
    fun getDeviceToken(context: Context): String? {
        return getPrefs(context).getString(KEY_DEVICE_TOKEN, null)
    }
    
    // Server URL
    fun saveServerUrl(context: Context, url: String) {
        // This function no longer does anything, but is kept to avoid breaking old code.
    }
    
    fun getServerUrl(context: Context): String {
        // Always return the one, correct, hardcoded URL.
        return "wss://www.wxon.in/ws/device"
    }
    
    // Auto Start
    fun setAutoStart(context: Context, enabled: Boolean) {
        getPrefs(context).edit().putBoolean(KEY_AUTO_START, enabled).apply()
    }
    
    fun isAutoStartEnabled(context: Context): Boolean {
        return getPrefs(context).getBoolean(KEY_AUTO_START, true)
    }
    
    // Keep Screen On
    fun setKeepScreenOn(context: Context, enabled: Boolean) {
        getPrefs(context).edit().putBoolean(KEY_KEEP_SCREEN_ON, enabled).apply()
    }
    
    fun isKeepScreenOnEnabled(context: Context): Boolean {
        return getPrefs(context).getBoolean(KEY_KEEP_SCREEN_ON, false)
    }
    
    // Message Statistics
    fun incrementMessagesSentToday(context: Context) {
        val current = getMessagesSentToday(context)
        getPrefs(context).edit().putInt(KEY_MESSAGES_SENT_TODAY, current + 1).apply()
        incrementTotalMessagesSent(context)
    }
    
    fun getMessagesSentToday(context: Context): Int {
        return getPrefs(context).getInt(KEY_MESSAGES_SENT_TODAY, 0)
    }
    
    fun resetMessagesSentToday(context: Context) {
        getPrefs(context).edit().putInt(KEY_MESSAGES_SENT_TODAY, 0).apply()
    }
    
    fun incrementTotalMessagesSent(context: Context) {
        val current = getTotalMessagesSent(context)
        getPrefs(context).edit().putInt(KEY_TOTAL_MESSAGES_SENT, current + 1).apply()
    }
    
    fun getTotalMessagesSent(context: Context): Int {
        return getPrefs(context).getInt(KEY_TOTAL_MESSAGES_SENT, 0)
    }
    
    fun incrementTotalMessagesFailed(context: Context) {
        val current = getTotalMessagesFailed(context)
        getPrefs(context).edit().putInt(KEY_TOTAL_MESSAGES_FAILED, current + 1).apply()
    }
    
    fun getTotalMessagesFailed(context: Context): Int {
        return getPrefs(context).getInt(KEY_TOTAL_MESSAGES_FAILED, 0)
    }
    
    // Last Reset Date
    fun saveLastResetDate(context: Context, date: String) {
        getPrefs(context).edit().putString(KEY_LAST_RESET_DATE, date).apply()
    }
    
    fun getLastResetDate(context: Context): String? {
        return getPrefs(context).getString(KEY_LAST_RESET_DATE, null)
    }
}
