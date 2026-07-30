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

  // Settings persistence
  readSettings: () => ipcRenderer.invoke('read-settings'),
  writeSettings: (data) => ipcRenderer.send('write-settings', data),

  // App launching & file opening
  launchApp: (cmd) => ipcRenderer.send('launch-app', cmd),
  openPath: (filePath) => ipcRenderer.send('open-path', filePath),
});
