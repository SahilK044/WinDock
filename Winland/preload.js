const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Spotify now-playing updates
  onSystemMediaUpdate: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('system-media-update', handler);
    return () => ipcRenderer.removeListener('system-media-update', handler);
  },

  // Fullscreen app state updates (macOS Tahoe auto-hide)
  onFullscreenState: (callback) => {
    const handler = (_event, isFullscreen) => callback(isFullscreen);
    ipcRenderer.on('fullscreen-state', handler);
    return () => ipcRenderer.removeListener('fullscreen-state', handler);
  },

  // Media transport controls
  sendMediaControl: (action) => {
    ipcRenderer.send('media-control', action);
  },

  // Dynamic window resizing & mouse passthrough
  resizeWindow: (width, height) => {
    ipcRenderer.send('resize-window', { width, height });
  },
  setIgnoreMouseEvents: (ignore) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore);
  },

  // Real-time battery status
  onBatteryUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('battery-update', handler);
    return () => ipcRenderer.removeListener('battery-update', handler);
  },

  // System volume OSD
  onVolumeUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('volume-update', handler);
    return () => ipcRenderer.removeListener('volume-update', handler);
  },

  // Bluetooth connect/disconnect updates & test triggers
  getBluetoothState: () => ipcRenderer.invoke('get-bluetooth-state'),
  requestBluetoothStatus: () => ipcRenderer.send('request-bluetooth-status'),
  triggerPhoneNotification: () => ipcRenderer.send('trigger-phone-notification'),
  onBluetoothUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('bluetooth-update', handler);
    return () => ipcRenderer.removeListener('bluetooth-update', handler);
  },

  // Settings persistence
  readSettings: () => ipcRenderer.invoke('read-settings'),
  writeSettings: (data) => ipcRenderer.send('write-settings', data),

  // Chosen devices / animation styles, relayed from Settings to the island
  sendDevicePrefs: (prefs) => ipcRenderer.send('device-prefs-changed', prefs),
  onDevicePrefsUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('device-prefs-update', handler);
    return () => ipcRenderer.removeListener('device-prefs-update', handler);
  },

  // WinDock config sync (theme, weather, island preferences)
  getInitialConfig: () => ipcRenderer.invoke('get-initial-config'),
  onConfigUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('config-update', handler);
    return () => ipcRenderer.removeListener('config-update', handler);
  },
  onThemeUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('theme-update', handler);
    return () => ipcRenderer.removeListener('theme-update', handler);
  },

  // App launching & file opening
  launchApp: (cmd) => ipcRenderer.send('launch-app', cmd),
  openPath: (filePath) => ipcRenderer.send('open-path', filePath),
  openSettingsWindow: () => ipcRenderer.send('open-settings-window'),
  closeSettingsWindow: () => ipcRenderer.send('close-settings-window'),
});
