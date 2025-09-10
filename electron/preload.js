const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  dbGet: (key) => ipcRenderer.invoke('db-get', key),
  dbSet: (key, value) => ipcRenderer.invoke('db-set', key, value),
  dbPushLog: (logEntry) => ipcRenderer.invoke('db-push-log', logEntry),
  dbExport: () => ipcRenderer.invoke('db-export'),
  dbImport: () => ipcRenderer.invoke('db-import'),
  
  // Password management
  verifyPassword: (password) => ipcRenderer.invoke('verify-password', password),
  changePassword: (oldPassword, newPassword) => ipcRenderer.invoke('change-password', oldPassword, newPassword),
  
  // Printer operations
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  print: (options) => ipcRenderer.invoke('print', options),
  
  // Check if running in Electron
  isElectron: true
});