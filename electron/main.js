const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let store;

// Initialize electron-store with dynamic import
async function initStore() {
  const { default: Store } = await import('electron-store');
  store = new Store();
}

let mainWindow;

// Logging functions
function writeAuditLog(entry) {
  const logPath = path.join(app.getPath('userData'), 'audit.log');
  const desktopLogPath = path.join(app.getPath('desktop'), 'Sample-Buddy-Log.txt');
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${JSON.stringify(entry)}\n`;
  
  try {
    // Write to app data directory
    fs.appendFileSync(logPath, logEntry, 'utf8');
    
    // Write to desktop file
    const logs = store.get('logs', []);
    const formattedLogs = logs.map(log => 
      `[${new Date(log.timestamp).toLocaleString('it-IT')}] ${log.operator} - ${log.action}: ${log.details} (${log.itemType}: ${log.itemCode})`
    ).join('\n');
    
    const desktopLogContent = [
      `SAMPLE BUDDY - LOG DELLE AZIONI\n`,
      `=================================\n\n`,
      `Ultimo aggiornamento: ${new Date().toLocaleString('it-IT')}\n\n`,
      formattedLogs
    ].join('');
    
    fs.writeFileSync(desktopLogPath, desktopLogContent, 'utf8');
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

// Password hashing
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(inputPassword, storedSalt, storedHash) {
  const hash = crypto.pbkdf2Sync(inputPassword, storedSalt, 10000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(async () => {
  await initStore();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for database operations
ipcMain.handle('db-get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('db-set', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('db-push-log', (event, logEntry) => {
  // Add to in-memory logs
  const logs = store.get('logs', []);
  logs.push(logEntry);
  store.set('logs', logs);
  
  // Write to audit file
  writeAuditLog(logEntry);
  return true;
});

ipcMain.handle('db-export', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Esporta Database',
      defaultPath: `sample-buddy-backup-${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ]
    });

    if (!result.canceled) {
      const data = store.store;
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
      return { success: true, path: result.filePath };
    }
    return { success: false, cancelled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-import', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Importa Database',
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const data = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8'));
      
      // Backup current data
      const backupPath = path.join(app.getPath('userData'), `backup-${Date.now()}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(store.store, null, 2));
      
      // Import new data
      store.clear();
      Object.keys(data).forEach(key => {
        store.set(key, data[key]);
      });
      
      return { success: true, path: result.filePaths[0] };
    }
    return { success: false, cancelled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Password management
ipcMain.handle('verify-password', (event, inputPassword) => {
  const passwordData = store.get('deletePassword');
  
  if (!passwordData) {
    // First time setup - set default password
    const defaultPassword = 'Francimicrob';
    const { salt, hash } = hashPassword(defaultPassword);
    store.set('deletePassword', { salt, hash });
    return verifyPassword(inputPassword, salt, hash);
  }
  
  return verifyPassword(inputPassword, passwordData.salt, passwordData.hash);
});

ipcMain.handle('change-password', (event, oldPassword, newPassword) => {
  const passwordData = store.get('deletePassword');
  
  if (!passwordData || !verifyPassword(oldPassword, passwordData.salt, passwordData.hash)) {
    return { success: false, error: 'Password attuale non corretta' };
  }
  
  const { salt, hash } = hashPassword(newPassword);
  store.set('deletePassword', { salt, hash });
  return { success: true };
});

// Printer management
ipcMain.handle('get-printers', async () => {
  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    return printers.map(printer => ({
      name: printer.name,
      displayName: printer.displayName,
      description: printer.description,
      status: printer.status,
      isDefault: printer.isDefault
    }));
  } catch (error) {
    console.error('Error getting printers:', error);
    return [];
  }
});

ipcMain.handle('print', async (event, options) => {
  try {
    const { html, printerName, silent = true } = options;
    
    // Create a hidden window for printing
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    
    await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    
    const printOptions = {
      silent: silent,
      deviceName: printerName,
      copies: 1,
      pageSize: 'A4'
    };
    
    await printWindow.webContents.print(printOptions);
    printWindow.close();
    
    return { success: true };
  } catch (error) {
    console.error('Print error:', error);
    return { success: false, error: error.message };
  }
});