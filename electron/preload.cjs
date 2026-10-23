const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('athena', {
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
});
