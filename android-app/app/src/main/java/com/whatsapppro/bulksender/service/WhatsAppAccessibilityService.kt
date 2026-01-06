package com.whatsapppro.bulksender.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import kotlinx.coroutines.*

class WhatsAppAccessibilityService : AccessibilityService() {
    
    companion object {
        private const val TAG = "WhatsAppAccessibility"
        private const val WHATSAPP_PACKAGE = "com.whatsapp"
        private const val WHATSAPP_BUSINESS_PACKAGE = "com.whatsapp.w4b"
        
        // WhatsApp UI element IDs (may change with WhatsApp updates)
        private val SEND_BUTTON_IDS = arrayOf(
            "com.whatsapp:id/send",
            "com.whatsapp:id/conversation_entry_action_button",
            "send",
            "Send"
        )
        
        private val MESSAGE_INPUT_IDS = arrayOf(
            "com.whatsapp:id/entry",
            "com.whatsapp:id/input_message",
            "entry",
            "Type a message"
        )
    }
    
    private var isServiceEnabled = false
    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    
    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d(TAG, "✅ WhatsApp Accessibility Service connected")
        
        // Configure service info
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
                        AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED or
                        AccessibilityEvent.TYPE_VIEW_CLICKED or
                        AccessibilityEvent.TYPE_VIEW_FOCUSED
            
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                   AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
            
            packageNames = arrayOf(WHATSAPP_PACKAGE, WHATSAPP_BUSINESS_PACKAGE)
            notificationTimeout = 100
        }
        
        serviceInfo = info
        isServiceEnabled = true
        
        // Notify other components that accessibility service is ready
        sendBroadcast(Intent("com.whatsapppro.ACCESSIBILITY_SERVICE_CONNECTED"))
    }
    
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (!isServiceEnabled || event == null) return
        
        try {
            when (event.eventType) {
                AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                    handleWindowStateChanged(event)
                }
                AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> {
                    handleWindowContentChanged(event)
                }
                AccessibilityEvent.TYPE_VIEW_CLICKED -> {
                    handleViewClicked(event)
                }
                AccessibilityEvent.TYPE_VIEW_FOCUSED -> {
                    handleViewFocused(event)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling accessibility event: ${e.message}", e)
        }
    }
    
    private fun handleWindowStateChanged(event: AccessibilityEvent) {
        val packageName = event.packageName?.toString()
        val className = event.className?.toString()
        
        Log.d(TAG, "Window state changed: $packageName - $className")
        
        if (isWhatsAppPackage(packageName)) {
            // WhatsApp window opened, prepare for potential message sending
            serviceScope.launch {
                delay(1000) // Wait for UI to stabilize
                checkForAutoSendOpportunity()
            }
        }
    }
    
    private fun handleWindowContentChanged(event: AccessibilityEvent) {
        val packageName = event.packageName?.toString()
        
        if (isWhatsAppPackage(packageName)) {
            // Content changed in WhatsApp, check if we need to auto-send
            serviceScope.launch {
                delay(500) // Brief delay for UI stability
                checkForAutoSendOpportunity()
            }
        }
    }
    
    private fun handleViewClicked(event: AccessibilityEvent) {
        Log.d(TAG, "View clicked in ${event.packageName}")
    }
    
    private fun handleViewFocused(event: AccessibilityEvent) {
        val packageName = event.packageName?.toString()
        
        if (isWhatsAppPackage(packageName)) {
            Log.d(TAG, "View focused in WhatsApp: ${event.className}")
        }
    }
    
    private fun checkForAutoSendOpportunity() {
        try {
            val rootNode = rootInActiveWindow ?: return
            
            // Look for send button
            val sendButton = findSendButton(rootNode)
            if (sendButton != null && sendButton.isEnabled) {
                Log.d(TAG, "🎯 Send button found and enabled")
                
                // Check if there's text in the message input
                val messageInput = findMessageInput(rootNode)
                if (messageInput != null && !messageInput.text.isNullOrEmpty()) {
                    Log.d(TAG, "📝 Message text found: ${messageInput.text}")
                    
                    // Auto-click send button after a brief delay
                    serviceScope.launch {
                        delay(1000) // Wait 1 second before auto-send
                        performAutoSend(sendButton)
                    }
                }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error checking for auto-send opportunity: ${e.message}", e)
        }
    }
    
    private fun findSendButton(rootNode: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        // Try multiple methods to find send button
        for (buttonId in SEND_BUTTON_IDS) {
            val nodes = rootNode.findAccessibilityNodeInfosByViewId(buttonId)
            if (nodes.isNotEmpty()) {
                Log.d(TAG, "Found send button by ID: $buttonId")
                return nodes[0]
            }
        }
        
        // Try finding by text content
        val sendNodes = rootNode.findAccessibilityNodeInfosByText("Send")
        if (sendNodes.isNotEmpty()) {
            Log.d(TAG, "Found send button by text")
            return sendNodes[0]
        }
        
        // Try finding by content description
        return findNodeByContentDescription(rootNode, "Send")
    }
    
    private fun findMessageInput(rootNode: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        // Try multiple methods to find message input
        for (inputId in MESSAGE_INPUT_IDS) {
            val nodes = rootNode.findAccessibilityNodeInfosByViewId(inputId)
            if (nodes.isNotEmpty()) {
                Log.d(TAG, "Found message input by ID: $inputId")
                return nodes[0]
            }
        }
        
        // Try finding by hint text
        val inputNodes = rootNode.findAccessibilityNodeInfosByText("Type a message")
        if (inputNodes.isNotEmpty()) {
            Log.d(TAG, "Found message input by hint text")
            return inputNodes[0]
        }
        
        return null
    }
    
    private fun findNodeByContentDescription(
        rootNode: AccessibilityNodeInfo, 
        description: String
    ): AccessibilityNodeInfo? {
        if (rootNode.contentDescription?.toString()?.contains(description, ignoreCase = true) == true) {
            return rootNode
        }
        
        for (i in 0 until rootNode.childCount) {
            val child = rootNode.getChild(i) ?: continue
            val result = findNodeByContentDescription(child, description)
            if (result != null) {
                return result
            }
        }
        
        return null
    }
    
    private fun performAutoSend(sendButton: AccessibilityNodeInfo) {
        try {
            Log.d(TAG, "🚀 Attempting to auto-click send button")
            
            val success = sendButton.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            if (success) {
                Log.d(TAG, "✅ Send button clicked successfully")
                
                // Notify that message was sent
                sendBroadcast(Intent("com.whatsapppro.MESSAGE_AUTO_SENT"))
            } else {
                Log.w(TAG, "❌ Failed to click send button")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error performing auto-send: ${e.message}", e)
        }
    }
    
    private fun isWhatsAppPackage(packageName: String?): Boolean {
        return packageName == WHATSAPP_PACKAGE || packageName == WHATSAPP_BUSINESS_PACKAGE
    }
    
    override fun onInterrupt() {
        Log.d(TAG, "⚠️ WhatsApp Accessibility Service interrupted")
        isServiceEnabled = false
    }
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "🔴 WhatsApp Accessibility Service destroyed")
        isServiceEnabled = false
        serviceScope.cancel()
    }
    
    // Public method to check if service is running
    fun isServiceRunning(): Boolean {
        return isServiceEnabled
    }
}