package com.whatsapppro.bulksender.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.whatsapppro.bulksender.R
import com.whatsapppro.bulksender.WhatsAppProApplication
// Temporarily commented out Room database imports
// import com.whatsapppro.bulksender.data.local.AppDatabase
// import com.whatsapppro.bulksender.data.local.MessageLog
import com.whatsapppro.bulksender.data.models.*
import com.whatsapppro.bulksender.network.WebSocketManager
import com.whatsapppro.bulksender.ui.MainActivity
import com.whatsapppro.bulksender.utils.DeviceInfoCollector
import com.whatsapppro.bulksender.utils.PrefsHelper
import com.whatsapppro.bulksender.utils.WhatsAppHelper
import kotlinx.coroutines.*

class WhatsAppSenderService : Service() {
    
    private val tag = "WhatsAppSenderService"
    private val notificationId = 1001
    
    private var webSocketManager: WebSocketManager? = null
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var statusUpdateJob: Job? = null
    
    // Temporarily commented out database
    // private lateinit var database: AppDatabase
    
    override fun onCreate() {
        super.onCreate()
        Log.d(tag, "Service created")
        // database = AppDatabase.getDatabase(this)
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(tag, "Service started")
        
        // Start foreground service
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(notificationId, createNotification("Initializing..."), ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(notificationId, createNotification("Initializing..."))
        }
        
        serviceScope.launch {
            initializeWebSocket()
            startStatusUpdates()
        }
        
        return START_STICKY
    }
    
    private fun initializeWebSocket() {
        val serverUrl = PrefsHelper.getServerUrl(this)
        val deviceToken = PrefsHelper.getDeviceToken(this)
        
        if (deviceToken.isNullOrEmpty()) {
            Log.e(tag, "No device token found")
            updateNotification("Error: No device token")
            return
        }
        
        webSocketManager = WebSocketManager(
            serverUrl = serverUrl,
            deviceToken = deviceToken,
            onCommandReceived = { message ->
                handleCommand(message)
            }
        )
        
        // Observe connection state
        serviceScope.launch {
            webSocketManager?.connectionState?.collect { state ->
                withContext(Dispatchers.Main) {
                    when (state) {
                        WebSocketManager.ConnectionState.CONNECTED -> {
                            updateNotification("Connected")
                            sendStatusUpdate()
                        }
                        WebSocketManager.ConnectionState.CONNECTING -> {
                            updateNotification("Connecting...")
                        }
                        WebSocketManager.ConnectionState.DISCONNECTED -> {
                            updateNotification("Disconnected")
                        }
                        WebSocketManager.ConnectionState.ERROR -> {
                            updateNotification("Connection Error")
                        }
                    }
                }
            }
        }
        
        webSocketManager?.connect()
    }
    
    private fun handleCommand(message: WebSocketMessage) {
        Log.d(tag, "Handling command: ${message.commandType}")
        
        // Send acknowledgment
        message.commandId?.let { commandId ->
            sendCommandAck(commandId)
        }
        
        when (message.commandType) {
            CommandType.SEND_MESSAGE -> {
                message.payload?.let { payload ->
                    sendWhatsAppMessage(payload)
                }
            }
            
            CommandType.SEND_MEDIA -> {
                message.payload?.let { _ ->
                    // TODO: Implement media sending
                    Log.d(tag, "Media sending not yet implemented")
                }
            }
            
            CommandType.SYNC_STATUS -> {
                sendStatusUpdate()
            }
            
            CommandType.RESTART -> {
                restartConnection()
            }
            
            else -> {
                Log.w(tag, "Unknown command type: ${message.commandType}")
            }
        }
    }
    
    private fun sendWhatsAppMessage(payload: CommandPayload) {
        val recipientNumber = payload.recipientNumber
        val messageText = payload.message
        
        Log.d(tag, "Sending message to $recipientNumber")
        
        // Validate phone number
        if (!WhatsAppHelper.isValidPhoneNumber(recipientNumber)) {
            Log.e(tag, "Invalid phone number: $recipientNumber")
            reportMessageFailed(recipientNumber, "Invalid phone number format")
            return
        }
        
        // Check if WhatsApp is installed
        if (!WhatsAppHelper.isWhatsAppInstalled(this)) {
            Log.e(tag, "WhatsApp not installed")
            reportMessageFailed(recipientNumber, "WhatsApp not installed")
            return
        }
        
        // Send message (opens WhatsApp with typed message)
        val success = WhatsAppHelper.sendMessage(this, recipientNumber, messageText)
        
        if (success) {
            // Show notification to user to press send
            updateNotification("WhatsApp opened - Please press SEND button")
            // Wait a bit for WhatsApp to process, then report success
            serviceScope.launch {
                delay(3000)
                reportMessageSent(recipientNumber)
                PrefsHelper.incrementMessagesSentToday(this@WhatsAppSenderService)
                
                // Save to local database (temporarily commented out)
                /*
                database.messageLogDao().insert(
                    MessageLog(
                        recipientNumber = recipientNumber,
                        message = messageText,
                        status = "SENT",
                        timestamp = System.currentTimeMillis(),
                        deviceIp = DeviceInfoCollector.getDeviceIP(),
                        networkType = DeviceInfoCollector.getNetworkType(this@WhatsAppSenderService)
                    )
                )
                */
                
                withContext(Dispatchers.Main) {
                    updateNotification("Sent: ${PrefsHelper.getMessagesSentToday(this@WhatsAppSenderService)} today")
                }
            }
        } else {
            reportMessageFailed(recipientNumber, "Failed to launch WhatsApp")
            PrefsHelper.incrementTotalMessagesFailed(this)
            
            // Save to local database (temporarily commented out)
            /*
            serviceScope.launch {
                database.messageLogDao().insert(
                    MessageLog(
                        recipientNumber = recipientNumber,
                        message = messageText,
                        status = "FAILED",
                        timestamp = System.currentTimeMillis(),
                        errorMessage = "Failed to launch WhatsApp"
                    )
                )
            }
            */
        }
    }
    
    private fun sendStatusUpdate() {
        serviceScope.launch {
            val statusData = StatusUpdateData(
                batteryLevel = DeviceInfoCollector.getBatteryLevel(this@WhatsAppSenderService),
                networkType = DeviceInfoCollector.getNetworkType(this@WhatsAppSenderService),
                androidVersion = DeviceInfoCollector.getAndroidVersion(),
                appVersion = DeviceInfoCollector.getAppVersion(this@WhatsAppSenderService),
                phoneNumber = DeviceInfoCollector.getPhoneNumber(this@WhatsAppSenderService)
            )
            
            val message = WebSocketMessage(
                type = MessageType.STATUS_UPDATE,
                data = statusData
            )
            
            webSocketManager?.sendMessage(message)
            Log.d(tag, "Status update sent")
        }
    }
    
    private fun sendCommandAck(commandId: Int) {
        val ackData = CommandAckData(commandId = commandId)
        val message = WebSocketMessage(
            type = MessageType.COMMAND_ACK,
            data = ackData
        )
        webSocketManager?.sendMessage(message)
    }
    
    private fun reportMessageSent(recipientNumber: String) {
        serviceScope.launch {
            val sentData = MessageSentData(
                recipientNumber = recipientNumber,
                deviceIp = DeviceInfoCollector.getDeviceIP(),
                networkType = DeviceInfoCollector.getNetworkType(this@WhatsAppSenderService)
            )
            
            val message = WebSocketMessage(
                type = MessageType.MESSAGE_SENT,
                data = sentData
            )
            
            webSocketManager?.sendMessage(message)
            Log.d(tag, "Message sent report: $recipientNumber")
        }
    }
    
    private fun reportMessageFailed(recipientNumber: String, errorMessage: String) {
        serviceScope.launch {
            val failedData = MessageFailedData(
                recipientNumber = recipientNumber,
                errorMessage = errorMessage
            )
            
            val message = WebSocketMessage(
                type = MessageType.MESSAGE_FAILED,
                data = failedData
            )
            
            webSocketManager?.sendMessage(message)
            Log.e(tag, "Message failed report: $recipientNumber - $errorMessage")
        }
    }
    
    private fun startStatusUpdates() {
        statusUpdateJob?.cancel()
        statusUpdateJob = serviceScope.launch {
            while (isActive) {
                delay(300000) // 5 minutes
                sendStatusUpdate()
            }
        }
    }
    
    private fun restartConnection() {
        webSocketManager?.disconnect()
        serviceScope.launch {
            delay(2000)
            webSocketManager?.connect()
        }
    }
    
    private fun createNotification(contentText: String): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        
        return NotificationCompat.Builder(this, WhatsAppProApplication.CHANNEL_ID)
            .setContentTitle("WhatsApp Bulk Sender")
            .setContentText(contentText)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }
    
    private fun updateNotification(contentText: String) {
        val notification = createNotification(contentText)
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
        notificationManager.notify(notificationId, notification)
    }
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d(tag, "Service destroyed")
        statusUpdateJob?.cancel()
        webSocketManager?.cleanup()
        serviceScope.cancel()
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
}
