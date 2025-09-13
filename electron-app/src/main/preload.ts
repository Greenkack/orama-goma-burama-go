import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('ding', {
  ping: () => ipcRenderer.invoke('ping')
});

export {}; 
