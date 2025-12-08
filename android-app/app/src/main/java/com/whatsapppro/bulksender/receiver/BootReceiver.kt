package com.whatsapppro.bulksender.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.whatsapppro.bulksender.service.WhatsAppSenderService
import com.whatsapppro.bulksender.utils.PrefsHelper

class BootReceiver : BroadcastReceiver() {
    
    private val TAG = "BootReceiver"
    
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED || 
            intent.action == "android.intent.action.QUICKBOOT_POWERON") {
            
            Log.d(TAG, "Boot completed, checking auto-start")
            
            // Check if auto-start is enabled
            if (PrefsHelper.isAutoStartEnabled(context)) {
                Log.d(TAG, "Auto-start enabled, starting service")
                
                val serviceIntent = Intent(context, WhatsAppSenderService::class.java)
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            } else {
                Log.d(TAG, "Auto-start disabled")
            }
        }
    }
}
