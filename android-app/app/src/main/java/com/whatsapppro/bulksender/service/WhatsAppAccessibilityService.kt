package com.whatsapppro.bulksender.service

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.util.Log
import kotlinx.coroutines.*

class WhatsAppAccessibilityService : AccessibilityService() {
    
    private val tag = "WhatsAppAccessibility"
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.packageName == "com.whatsapp") {
            when (event.eventType) {
                AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> {
                    // Check if we're in chat window and auto-send
                    scope.launch {
                        // Generate random delay between 800-2000ms
                        val randomDelay = (800..2000).random()
                        delay(randomDelay.toLong())
                        autoClickSendButton()
                    }
                }
            }
        }
    }
    
    private fun autoClickSendButton() {
        try {
            val rootNode = rootInActiveWindow ?: return
            
            // Find send button (multiple possible IDs)
            val sendButton = findSendButton(rootNode)
            
            if (sendButton != null && sendButton.isClickable) {
                sendButton.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                Log.d(tag, "Send button clicked automatically")
            } else {
                Log.d(tag, "Send button not found or not clickable")
            }
            
        } catch (e: Exception) {
            Log.e(tag, "Error auto-clicking send button: ${e.message}")
        }
    }
    
    private fun findSendButton(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        // Try different possible send button identifiers
        val sendButtonIds = listOf(
            "com.whatsapp:id/send",
            "com.whatsapp:id/conversation_entry_action_button",
            "send"
        )
        
        for (id in sendButtonIds) {
            val buttons = node.findAccessibilityNodeInfosByViewId(id)
            if (buttons.isNotEmpty()) {
                return buttons[0]
            }
        }
        
        // Fallback: search by content description
        return findNodeByContentDescription(node, "Send")
    }
    
    private fun findNodeByContentDescription(
        node: AccessibilityNodeInfo, 
        description: String
    ): AccessibilityNodeInfo? {
        if (node.contentDescription?.contains(description, true) == true) {
            return node
        }
        
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val result = findNodeByContentDescription(child, description)
            if (result != null) return result
        }
        
        return null
    }
    
    override fun onInterrupt() {
        Log.d(tag, "Accessibility service interrupted")
    }
    
    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }
}