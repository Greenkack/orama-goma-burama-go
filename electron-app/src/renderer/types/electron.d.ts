// Global type definitions for Electron API in renderer process

interface ElectronAPI {
  ping: () => Promise<string>;
  uploadFile: (data: any) => Promise<{ success: boolean; message?: string; error?: string }>;
  getProducts: (category: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
  addProduct: (productData: any) => Promise<{ success: boolean; id?: number; error?: string }>;
  updateProduct: (id: number, productData: any) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (id: number) => Promise<{ success: boolean; error?: string }>;
  getStats: () => Promise<{ success: boolean; data?: any; error?: string }>;
  
  // Database operations
  database: {
    getStats: () => Promise<{ success: boolean; data?: any; error?: string }>;
    getProducts: (category: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getProductById: (table: string, id: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    createProduct: (table: string, data: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    updateProduct: (table: string, id: number, data: any) => Promise<{ success: boolean; error?: string }>;
    deleteProduct: (table: string, id: number) => Promise<{ success: boolean; error?: string }>;
  };
  
  // File operations
  file: {
    upload: (uploadData: any) => Promise<{ success: boolean; message?: string; error?: string }>;
  };
  
  // Python calculation engine
  python: {
    calculate: (projectData: any) => Promise<{ success: boolean; data?: any; error?: string; errors?: string[] }>;
    kill: () => Promise<{ success: boolean; error?: string }>;
  };
  
  // Project management
  project: {
    save: (projectData: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    load: (projectId: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    list: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
  };
  
  // System information
  system: {
    getInfo: () => {
      platform: string;
      arch: string;
      nodeVersion: string;
      electronVersion: string;
    };
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};