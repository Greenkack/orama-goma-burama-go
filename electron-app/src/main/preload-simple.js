const { contextBridge, ipcRenderer } = require('electron');

console.log('Enhanced preload script loading with Python Bridge support...');

// Enhanced API with Python Bridge integration
const electronAPI = {
  // Legacy compatibility
  ping: () => ipcRenderer.invoke('ping'),
  
  // Database operations (updated naming)
  database: {
    getStats: () => ipcRenderer.invoke('database:getStats'),
    getProducts: (category) => ipcRenderer.invoke('database:getProducts', category),
    getProductById: (table, id) => ipcRenderer.invoke('database:getProductById', table, id),
    createProduct: (table, data) => ipcRenderer.invoke('database:createProduct', table, data),
    updateProduct: (table, id, data) => ipcRenderer.invoke('database:updateProduct', table, id, data),
    deleteProduct: (table, id) => ipcRenderer.invoke('database:deleteProduct', table, id)
  },

  // Legacy database operations (for backward compatibility)
  uploadFile: (data) => ipcRenderer.invoke('file:upload', data),
  getProducts: (category) => ipcRenderer.invoke('database:getProducts', category),
  addProduct: (productData) => ipcRenderer.invoke('database:createProduct', 'modules', productData),
  updateProduct: (id, productData) => ipcRenderer.invoke('database:updateProduct', 'modules', id, productData),
  deleteProduct: (id) => ipcRenderer.invoke('database:deleteProduct', 'modules', id),
  getStats: () => ipcRenderer.invoke('database:getStats'),

  // File operations
  file: {
    upload: (uploadData) => ipcRenderer.invoke('file:upload', uploadData)
  },

  // Python calculation engine
  python: {
    calculate: (projectData) => ipcRenderer.invoke('python:calculate', projectData),
    kill: () => ipcRenderer.invoke('python:kill')
  },

  // Project management
  project: {
    save: (projectData) => ipcRenderer.invoke('project:save', projectData),
    load: (projectId) => ipcRenderer.invoke('project:load', projectId),
    list: () => ipcRenderer.invoke('project:list')
  },

  // System information
  system: {
    getInfo: () => ({
      platform: process.platform,
      arch: process.arch,
      versions: process.versions,
      timestamp: new Date().toISOString()
    })
  },

  // Utility functions
  utils: {
    formatCurrency: (value, currency = 'EUR') => {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: currency
      }).format(value);
    },
    
    formatNumber: (value, decimals = 2) => {
      return new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value);
    },

    formatPercentage: (value, decimals = 1) => {
      return new Intl.NumberFormat('de-DE', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value / 100);
    }
  }
};

// Expose the enhanced API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

console.log('Enhanced preload script loaded successfully with Python Bridge');
console.log('Available API methods:', Object.keys(electronAPI));