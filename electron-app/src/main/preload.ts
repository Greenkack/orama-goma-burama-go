import { contextBridge, ipcRenderer } from 'electron';

// Basic ping test
contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  
  // Database operations - simplified
  uploadFile: (data: any) => ipcRenderer.invoke('db:uploadFile', data),
  getProducts: (category: string) => ipcRenderer.invoke('db:getProducts', category),
  addProduct: (productData: any) => ipcRenderer.invoke('db:addProduct', productData),
  updateProduct: (id: number, productData: any) => ipcRenderer.invoke('db:updateProduct', id, productData),
  deleteProduct: (id: number) => ipcRenderer.invoke('db:deleteProduct', id),
  getStats: () => ipcRenderer.invoke('db:getStats')
});

export {}; 
