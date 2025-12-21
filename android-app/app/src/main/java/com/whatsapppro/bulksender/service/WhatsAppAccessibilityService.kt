package com.whatsapppro.bulksender.service

import android.accessibilityservice.AccessibilityService
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import kotlinx.coroutines.*

class WhatsAppAccessibilityService : AccessibilityService() {

    private val tag = "WhatsAppAccessibility"
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var lastClickTime = 0L

    companion object {
        // Cooldown period in milliseconds to prevent rapid-fire clicks
        private const val CLICK_COOLDOWN = 2000L 
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.packageName != "com.whatsapp") return

        // We are only interested in content changes, as they indicate the UI has been updated
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) {
            // Debounce the click event to avoid multiple clicks for a single UI update
            val currentTime = System.currentTimeMillis()
            if (currentTime - lastClickTime < CLICK_COOLDOWN) {
                return // Still in cooldown
            }

            scope.launch {
                // A short, random delay to make the interaction seem more human
                val randomDelay = (500..1500).random()
                delay(randomDelay.toLong())

                val rootNode = rootInActiveWindow ?: return@launch
                val sendButton = findSendButton(rootNode)

                if (sendButton != null && sendButton.isClickable) {
                    sendButton.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    lastClickTime = System.currentTimeMillis() // Update the last click time
                    Log.d(tag, "Send button clicked automatically.")
                } else {
                    // This log is now less important, as it will fire often.
                    // Log.d(tag, "Send button not found or not clickable this time.")
                }
                rootNode.recycle()
            }
        }
    }

    private fun findSendButton(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        // WhatsApp often uses the 'send' description for its button
        val sendButton = node.findAccessibilityNodeInfosByText("Send")
        if (sendButton.isNotEmpty() && sendButton[0] != null) {
            return sendButton[0]
        }

        // Fallback to searching by the resource ID, which can change
        val sendButtonIds = listOf(
            "com.whatsapp:id/send",
            "com.whatsapp:id/conversation_entry_action_button"
        )
        for (id in sendButtonIds) {
            val buttons = node.findAccessibilityNodeInfosByViewId(id)
            if (buttons.isNotEmpty()) {
                return buttons[0]
            }
        }

        return null
    }

    override fun onInterrupt() {
        Log.d(tag, "Accessibility service was interrupted.")
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
        Log.d(tag, "Accessibility service destroyed.")
    }
}