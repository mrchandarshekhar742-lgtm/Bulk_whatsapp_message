package com.whatsapppro.bulksender.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "message_logs")
data class MessageLog(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    
    val recipientNumber: String,
    val message: String,
    val status: String, // SENT, FAILED, PENDING
    val timestamp: Long,
    val errorMessage: String? = null,
    val deviceIp: String? = null,
    val networkType: String? = null
)
