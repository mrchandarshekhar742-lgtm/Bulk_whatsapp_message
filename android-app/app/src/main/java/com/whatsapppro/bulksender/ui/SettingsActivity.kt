package com.whatsapppro.bulksender.ui

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.whatsapppro.bulksender.R
import com.whatsapppro.bulksender.databinding.ActivitySettingsBinding
import com.whatsapppro.bulksender.utils.PrefsHelper

class SettingsActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivitySettingsBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupToolbar()
        setupUI()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.apply {
            setDisplayHomeAsUpEnabled(true)
            setDisplayShowHomeEnabled(true)
            title = getString(R.string.settings)
        }
    }
    
    private fun setupUI() {
        // Load current settings
        binding.switchAutoStart.isChecked = PrefsHelper.isAutoStartEnabled(this)
        binding.switchKeepScreenOn.isChecked = PrefsHelper.isKeepScreenOnEnabled(this)
        
        // Auto-start toggle
        binding.switchAutoStart.setOnCheckedChangeListener { _, isChecked ->
            PrefsHelper.setAutoStart(this, isChecked)
        }
        
        // Keep screen on toggle
        binding.switchKeepScreenOn.setOnCheckedChangeListener { _, isChecked ->
            PrefsHelper.setKeepScreenOn(this, isChecked)
        }
        
        // Accessibility settings button
        binding.btnAccessibilitySettings.setOnClickListener {
            openAccessibilitySettings()
        }
        
        // Battery optimization button
        binding.btnBatterySettings.setOnClickListener {
            openBatteryOptimizationSettings()
        }
        
        // App info button
        binding.btnAppInfo.setOnClickListener {
            openAppInfo()
        }
        
        // About button
        binding.btnAbout.setOnClickListener {
            showAboutDialog()
        }
    }
    
    private fun openAccessibilitySettings() {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
        } catch (e: Exception) {
            AlertDialog.Builder(this)
                .setTitle("Error")
                .setMessage("Could not open accessibility settings")
                .setPositiveButton("OK", null)
                .show()
        }
    }
    
    private fun openBatteryOptimizationSettings() {
        try {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:$packageName")
            }
            startActivity(intent)
        } catch (e: Exception) {
            try {
                val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                startActivity(intent)
            } catch (e2: Exception) {
                AlertDialog.Builder(this)
                    .setTitle("Error")
                    .setMessage("Could not open battery optimization settings")
                    .setPositiveButton("OK", null)
                    .show()
            }
        }
    }
    
    private fun openAppInfo() {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:$packageName")
            }
            startActivity(intent)
        } catch (e: Exception) {
            AlertDialog.Builder(this)
                .setTitle("Error")
                .setMessage("Could not open app info")
                .setPositiveButton("OK", null)
                .show()
        }
    }
    
    private fun showAboutDialog() {
        val version = try {
            packageManager.getPackageInfo(packageName, 0).versionName
        } catch (e: Exception) {
            "Unknown"
        }
        
        AlertDialog.Builder(this)
            .setTitle(getString(R.string.about_app))
            .setMessage(getString(R.string.about_description) + "\n\n" + 
                       getString(R.string.about_version, version) + "\n\n" +
                       getString(R.string.about_features))
            .setPositiveButton("OK", null)
            .show()
    }
    
    override fun onSupportNavigateUp(): Boolean {
        onBackPressed()
        return true
    }
}