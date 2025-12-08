package com.whatsapppro.bulksender.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.view.Menu
import android.view.MenuItem
import android.view.WindowManager
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.whatsapppro.bulksender.R
import com.whatsapppro.bulksender.databinding.ActivityMainBinding
import com.whatsapppro.bulksender.service.WhatsAppSenderService
import com.whatsapppro.bulksender.utils.DeviceInfoCollector
import com.whatsapppro.bulksender.utils.PrefsHelper
import com.whatsapppro.bulksender.utils.WhatsAppHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private val PERMISSION_REQUEST_CODE = 100
    private var autoRefreshJob: Job? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setSupportActionBar(binding.toolbar)
        
        setupUI()
        checkPermissions()
        requestBatteryOptimizationExemption()
    }
    
    private fun setupUI() {
        // Load saved token
        val savedToken = PrefsHelper.getDeviceToken(this)
        if (!savedToken.isNullOrEmpty()) {
            binding.etDeviceToken.setText(savedToken)
        }
        
        // Load saved server URL
        binding.etServerUrl.setText(PrefsHelper.getServerUrl(this))
        
        // Save button
        binding.btnSave.setOnClickListener {
            saveConfiguration()
        }
        
        // Start service button
        binding.btnStartService.setOnClickListener {
            startService()
        }
        
        // Stop service button
        binding.btnStopService.setOnClickListener {
            stopService()
        }
        
        // Keep screen on toggle
        binding.switchKeepScreenOn.isChecked = PrefsHelper.isKeepScreenOnEnabled(this)
        binding.switchKeepScreenOn.setOnCheckedChangeListener { _, isChecked ->
            PrefsHelper.setKeepScreenOn(this, isChecked)
            updateKeepScreenOn()
        }
        
        // Auto-start toggle
        binding.switchAutoStart.isChecked = PrefsHelper.isAutoStartEnabled(this)
        binding.switchAutoStart.setOnCheckedChangeListener { _, isChecked ->
            PrefsHelper.setAutoStart(this, isChecked)
        }
        
        updateKeepScreenOn()
    }
    
    private fun saveConfiguration() {
        val token = binding.etDeviceToken.text.toString().trim()
        val serverUrl = binding.etServerUrl.text.toString().trim()
        
        if (token.isEmpty()) {
            AlertDialog.Builder(this)
                .setTitle("Error")
                .setMessage("Please enter device token")
                .setPositiveButton("OK", null)
                .show()
            return
        }
        
        if (serverUrl.isEmpty()) {
            AlertDialog.Builder(this)
                .setTitle("Error")
                .setMessage("Please enter server URL")
                .setPositiveButton("OK", null)
                .show()
            return
        }
        
        PrefsHelper.saveDeviceToken(this, token)
        PrefsHelper.saveServerUrl(this, serverUrl)
        
        AlertDialog.Builder(this)
            .setTitle("Success")
            .setMessage("Configuration saved successfully")
            .setPositiveButton("OK", null)
            .show()
    }
    
    private fun startService() {
        val token = PrefsHelper.getDeviceToken(this)
        if (token.isNullOrEmpty()) {
            AlertDialog.Builder(this)
                .setTitle("Error")
                .setMessage("Please save device token first")
                .setPositiveButton("OK", null)
                .show()
            return
        }
        
        if (!WhatsAppHelper.isWhatsAppInstalled(this)) {
            AlertDialog.Builder(this)
                .setTitle("Warning")
                .setMessage("WhatsApp is not installed. Please install WhatsApp to send messages.")
                .setPositiveButton("OK", null)
                .show()
        }
        
        val intent = Intent(this, WhatsAppSenderService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        
        binding.tvStatus.text = "Status: Starting..."
    }
    
    private fun stopService() {
        val intent = Intent(this, WhatsAppSenderService::class.java)
        stopService(intent)
        binding.tvStatus.text = "Status: Stopped"
    }
    
    private fun updateDeviceInfo() {
        lifecycleScope.launch(Dispatchers.IO) {
            val batteryLevel = DeviceInfoCollector.getBatteryLevel(this@MainActivity)
            val networkType = DeviceInfoCollector.getNetworkType(this@MainActivity)
            val deviceIp = DeviceInfoCollector.getDeviceIP()
            val phoneNumber = DeviceInfoCollector.getPhoneNumber(this@MainActivity)
            val messagesSentToday = PrefsHelper.getMessagesSentToday(this@MainActivity)
            val totalSent = PrefsHelper.getTotalMessagesSent(this@MainActivity)
            val totalFailed = PrefsHelper.getTotalMessagesFailed(this@MainActivity)

            withContext(Dispatchers.Main) {
                binding.tvBattery.text = "Battery: $batteryLevel%"
                binding.progressBattery.progress = batteryLevel
                binding.tvNetwork.text = "Network: $networkType"
                binding.tvIp.text = "IP: ${if (deviceIp.isEmpty()) "Not available" else deviceIp}"
                binding.tvPhoneNumber.text = "Phone: ${phoneNumber ?: "Not available"}"
                binding.tvMessagesSentToday.text = "Messages Sent Today: $messagesSentToday"
                binding.tvTotalSent.text = "Total Sent: $totalSent"
                binding.tvTotalFailed.text = "Failed: $totalFailed"
            }
        }
    }
    
    private fun startAutoRefresh() {
        autoRefreshJob?.cancel()
        autoRefreshJob = lifecycleScope.launch {
            while (isActive) {
                updateDeviceInfo()
                delay(5000) // Update every 5 seconds
            }
        }
    }
    
    private fun updateKeepScreenOn() {
        if (PrefsHelper.isKeepScreenOnEnabled(this)) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        } else {
            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }
    
    private fun checkPermissions() {
        val permissionsToRequest = mutableListOf<String>()
        val permissions = listOf(
            Manifest.permission.READ_PHONE_NUMBERS,
            Manifest.permission.READ_PHONE_STATE
        ).plus(
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                listOf(Manifest.permission.POST_NOTIFICATIONS)
            } else {
                emptyList()
            }
        )

        for (permission in permissions) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission)
            }
        }

        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsToRequest.toTypedArray(), PERMISSION_REQUEST_CODE)
        } else {
            onPermissionsGranted()
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                onPermissionsGranted()
            } else {
                AlertDialog.Builder(this)
                    .setTitle("Permissions Required")
                    .setMessage("This app requires certain permissions to function correctly. Please grant them from the app settings.")
                    .setPositiveButton("OK", null)
                    .show()
            }
        }
    }

    private fun onPermissionsGranted() {
        startAutoRefresh()
    }
    
    private fun requestBatteryOptimizationExemption() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val powerManager = getSystemService(POWER_SERVICE) as PowerManager
            val packageName = packageName
            
            if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
                AlertDialog.Builder(this)
                    .setTitle("Battery Optimization")
                    .setMessage("Please disable battery optimization for this app to ensure it runs continuously in the background.")
                    .setPositiveButton("Settings") { _, _ ->
                        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                            data = Uri.parse("package:$packageName")
                        }
                        startActivity(intent)
                    }
                    .setNegativeButton("Later", null)
                    .show()
            }
        }
    }
    
    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.menu_main, menu)
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_settings -> {
                startActivity(Intent(this, SettingsActivity::class.java))
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
}
