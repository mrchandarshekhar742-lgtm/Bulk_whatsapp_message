package com.whatsapppro.bulksender.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface MessageLogDao {
    
    @Insert
    suspend fun insert(log: MessageLog)
    
    @Query("SELECT * FROM message_logs ORDER BY timestamp DESC LIMIT 100")
    fun getRecentLogs(): Flow<List<MessageLog>>
    
    @Query("SELECT * FROM message_logs WHERE status = :status ORDER BY timestamp DESC")
    fun getLogsByStatus(status: String): Flow<List<MessageLog>>
    
    @Query("SELECT COUNT(*) FROM message_logs WHERE status = 'SENT' AND timestamp >= :startTime")
    suspend fun getSentCountSince(startTime: Long): Int
    
    @Query("SELECT COUNT(*) FROM message_logs WHERE status = 'FAILED'")
    suspend fun getFailedCount(): Int
    
    @Query("DELETE FROM message_logs WHERE timestamp < :cutoffTime")
    suspend fun deleteOldLogs(cutoffTime: Long)
}
