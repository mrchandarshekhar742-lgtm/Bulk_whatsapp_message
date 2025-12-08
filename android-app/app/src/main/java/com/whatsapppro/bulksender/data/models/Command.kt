package com.whatsapppro.bulksender.data.models

import com.google.gson.annotations.SerializedName

/**
 * WebSocket message wrapper
 */
data class WebSocketMessage(
    @SerializedName("type")
    val type: String,
    
    @SerializedName("data")
    val data: Any? = null,
    
    @SerializedName("command_id")
    val commandId: Int? = null,
    
    @SerializedName("command_type")
    val commandType: String? = null,
    
    @SerializedName("payload")
    val payload: CommandPayload? = null,
    
    @SerializedName("message")
    val message: String? = null,
    
    @SerializedName("deviceId")
    val deviceId: Int? = null
)

/**
 * Command payload for SEND_MESSAGE
 */
data class CommandPayload(
    @SerializedName("recipient_number")
    val recipientNumber: String,
    
    @SerializedName("message")
    val message: String,
    
    @SerializedName("media_url")
    val mediaUrl: String? = null,
    
    @SerializedName("campaign_name")
    val campaignName: String? = null
)

/**
 * Status update data
 */
data class StatusUpdateData(
    @SerializedName("battery_level")
    val batteryLevel: Int,
    
    @SerializedName("network_type")
    val networkType: String,
    
    @SerializedName("android_version")
    val androidVersion: String,
    
    @SerializedName("app_version")
    val appVersion: String,
    
    @SerializedName("phone_number")
    val phoneNumber: String?
)

/**
 * Message sent data
 */
data class MessageSentData(
    @SerializedName("recipient_number")
    val recipientNumber: String,
    
    @SerializedName("device_ip")
    val deviceIp: String,
    
    @SerializedName("network_type")
    val networkType: String
)

/**
 * Message failed data
 */
data class MessageFailedData(
    @SerializedName("recipient_number")
    val recipientNumber: String,
    
    @SerializedName("error_message")
    val errorMessage: String
)

/**
 * Command acknowledgment data
 */
data class CommandAckData(
    @SerializedName("command_id")
    val commandId: Int
)

/**
 * Heartbeat data
 */
data class HeartbeatData(
    @SerializedName("battery_level")
    val batteryLevel: Int,
    
    @SerializedName("network_type")
    val networkType: String
)

/**
 * Message types
 */
object MessageType {
    const val CONNECTED = "CONNECTED"
    const val COMMAND = "COMMAND"
    const val STATUS_UPDATE = "STATUS_UPDATE"
    const val MESSAGE_SENT = "MESSAGE_SENT"
    const val MESSAGE_FAILED = "MESSAGE_FAILED"
    const val COMMAND_ACK = "COMMAND_ACK"
    const val HEARTBEAT = "HEARTBEAT"
}

/**
 * Command types
 */
object CommandType {
    const val SEND_MESSAGE = "SEND_MESSAGE"
    const val SEND_MEDIA = "SEND_MEDIA"
    const val SYNC_STATUS = "SYNC_STATUS"
    const val RESTART = "RESTART"
    const val UPDATE_CONFIG = "UPDATE_CONFIG"
}
