package com.whatsapppro.bulksender.network

import android.util.Log
import com.google.gson.Gson
import com.whatsapppro.bulksender.data.models.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import okhttp3.*
import java.util.concurrent.TimeUnit

class WebSocketManager(
    private val serverUrl: String,
    private val deviceToken: String,
    private val onCommandReceived: (WebSocketMessage) -> Unit
) {
    private val TAG = "WebSocketManager"
    private val gson = Gson()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    private var webSocket: WebSocket? = null
    private var reconnectJob: Job? = null
    private var heartbeatJob: Job? = null
    
    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState
    
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.SECONDS) // No timeout for WebSocket
        .writeTimeout(10, TimeUnit.SECONDS)
        .pingInterval(30, TimeUnit.SECONDS)
        .build()
    
    fun connect() {
        if (_connectionState.value == ConnectionState.CONNECTED || 
            _connectionState.value == ConnectionState.CONNECTING) {
            Log.d(TAG, "Already connected or connecting")
            return
        }
        
        _connectionState.value = ConnectionState.CONNECTING
        
        val url = "$serverUrl?token=$deviceToken"
        val request = Request.Builder()
            .url(url)
            .build()
        
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "WebSocket connected")
                _connectionState.value = ConnectionState.CONNECTED
                startHeartbeat()
            }
            
            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.d(TAG, "Message received: $text")
                handleMessage(text)
            }
            
            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closing: $code - $reason")
                webSocket.close(1000, null)
            }
            
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closed: $code - $reason")
                _connectionState.value = ConnectionState.DISCONNECTED
                stopHeartbeat()
                scheduleReconnect()
            }
            
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket error: ${t.message}", t)
                _connectionState.value = ConnectionState.ERROR
                stopHeartbeat()
                scheduleReconnect()
            }
        })
    }
    
    fun disconnect() {
        reconnectJob?.cancel()
        stopHeartbeat()
        webSocket?.close(1000, "User disconnected")
        webSocket = null
        _connectionState.value = ConnectionState.DISCONNECTED
    }
    
    fun sendMessage(message: WebSocketMessage) {
        val json = gson.toJson(message)
        val sent = webSocket?.send(json) ?: false
        if (sent) {
            Log.d(TAG, "Message sent: ${message.type}")
        } else {
            Log.e(TAG, "Failed to send message: ${message.type}")
        }
    }
    
    private fun handleMessage(text: String) {
        try {
            val message = gson.fromJson(text, WebSocketMessage::class.java)
            
            when (message.type) {
                MessageType.CONNECTED -> {
                    Log.d(TAG, "Connected to server, deviceId: ${message.deviceId}")
                }
                
                MessageType.COMMAND -> {
                    Log.d(TAG, "Command received: ${message.commandType}")
                    onCommandReceived(message)
                }
                
                else -> {
                    Log.d(TAG, "Unknown message type: ${message.type}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing message: ${e.message}", e)
        }
    }
    
    private fun startHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = scope.launch {
            while (isActive && _connectionState.value == ConnectionState.CONNECTED) {
                delay(30000) // 30 seconds
                sendHeartbeat()
            }
        }
    }
    
    private fun stopHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = null
    }
    
    private fun sendHeartbeat() {
        // Heartbeat will be sent by service with device info
        Log.d(TAG, "Heartbeat interval")
    }
    
    private fun scheduleReconnect() {
        reconnectJob?.cancel()
        reconnectJob = scope.launch {
            var delay = 1000L
            while (isActive && _connectionState.value != ConnectionState.CONNECTED) {
                Log.d(TAG, "Reconnecting in ${delay}ms...")
                delay(delay)
                connect()
                delay = (delay * 2).coerceAtMost(30000) // Max 30 seconds
            }
        }
    }
    
    fun cleanup() {
        scope.cancel()
        disconnect()
    }
    
    enum class ConnectionState {
        DISCONNECTED,
        CONNECTING,
        CONNECTED,
        ERROR
    }
}
