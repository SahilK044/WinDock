const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore, forward) => {
    ipcRenderer.invoke('set-ignore-mouse-events', ignore, forward);
  },
  getSystemMedia: () => ipcRenderer.invoke('get-system-media'),
  getBluetoothStatus: () => ipcRenderer.invoke('get-bluetooth-status'),
  getCameraStatus: () => ipcRenderer.invoke('get-camera-status'),
  getMicrophoneStatus: () => ipcRenderer.invoke('get-microphone-status'),
  controlSystemMedia: (command) => ipcRenderer.invoke('control-system-media', command),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  launchApp: (appName) => ipcRenderer.invoke('launch-app', appName),
  buildAppCache: () => ipcRenderer.invoke('build-app-cache'),
  searchApps: (query) => ipcRenderer.invoke('search-apps', query),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  setDisplay: (displayId) => ipcRenderer.invoke('set-display', displayId),
  updateWindowPosition: (xPerc, yPx) => ipcRenderer.invoke('update-window-position', xPerc, yPx),
  setAutoLaunch: (enable) => process.platform !== 'darwin' ? ipcRenderer.invoke('set-auto-launch', enable) : Promise.resolve(),
  focusWindow: () => ipcRenderer.invoke('focus-window'),
  platform: process.platform,
  audio: {
    // Starts WASAPI loopback capture (Windows only). Resolves
    // { started: boolean, reason?: string } — reason is 'unsupported-platform'
    // when the native addon isn't available, so the renderer can fall back.
    start: () => ipcRenderer.invoke('audio-viz-start'),
    stop: () => ipcRenderer.invoke('audio-viz-stop'),
    // Subscribes to live band-level updates (Array<number> 0..1, length 24).
    // Returns an unsubscribe function.
    onBands: (callback) => {
      const listener = (_event, bands) => callback(bands);
      ipcRenderer.on('audio-bands', listener);
      return () => ipcRenderer.removeListener('audio-bands', listener);
    }
  }
});
