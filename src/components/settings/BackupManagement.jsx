import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from "@mui/material";
import { CloudUpload, Backup, Info } from "@mui/icons-material";

const { ipcRenderer } = window.require("electron");

const BackupManagement = () => {
  const [backupInfo, setBackupInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadBackupInfo();
  }, []);

  const loadBackupInfo = async () => {
    try {
      const info = await ipcRenderer.invoke("get-backup-info");
      setBackupInfo(info);
    } catch (error) {
      console.error("Error loading backup info:", error);
      setMessage({ type: "error", text: "Failed to load backup information" });
    }
  };

  const createManualBackup = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await ipcRenderer.invoke("create-manual-backup");
      
      if (result.success) {
        setMessage({ 
          type: "success", 
          text: `Backup created successfully at: ${result.backupPath}` 
        });
        loadBackupInfo(); // Refresh backup info
      } else {
        setMessage({ 
          type: "error", 
          text: `Backup failed: ${result.error}` 
        });
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      setMessage({ 
        type: "error", 
        text: "Failed to create backup" 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <CloudUpload sx={{ mr: 1 }} />
        <Typography variant="h6">Database Backup Management</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Your database is automatically backed up every 4 hours to OneDrive.
          Backups are kept for 30 days to protect against data loss.
          {backupInfo && !backupInfo.backupFolder.includes("OneDrive") && (
            <><br /><strong>Note:</strong> OneDrive not detected. Backups are being saved to: {backupInfo.backupFolder}</>
          )}
        </Typography>
      </Alert>

      {backupInfo && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Backup Status
          </Typography>
          
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Backup Location:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                {backupInfo.backupFolder}
              </Typography>
            </Box>
            
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Backups:
              </Typography>
              <Chip 
                label={backupInfo.backupCount} 
                size="small" 
                color={backupInfo.backupCount > 0 ? "success" : "default"}
              />
            </Box>
            
            {backupInfo.lastBackup && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Last Backup:
                </Typography>
                <Typography variant="body2">
                  {formatDate(backupInfo.lastBackup.date)}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <Backup />}
          onClick={createManualBackup}
          disabled={loading}
        >
          {loading ? "Creating Backup..." : "Create Manual Backup"}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Info />}
          onClick={loadBackupInfo}
        >
          Refresh Status
        </Button>
      </Box>

      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mt: 2 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}
    </Paper>
  );
};

export default BackupManagement;
