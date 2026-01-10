const { contextBridge, ipcRenderer } = require("electron");

// Expose a minimal, safe IPC bridge
contextBridge.exposeInMainWorld("api", {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  on: (channel, listener) => ipcRenderer.on(channel, listener),
  once: (channel, listener) => ipcRenderer.once(channel, listener),
  removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener),

  // Settings-specific convenience methods
  settings: {
    get: (key) => ipcRenderer.invoke('get-setting', key),
    set: (key, value) => ipcRenderer.invoke('set-setting', key, value),
    getAll: () => ipcRenderer.invoke('get-all-settings'),
    onChange: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('setting-changed', listener);
      return () => ipcRenderer.removeListener('setting-changed', listener);
    }
  }
});


