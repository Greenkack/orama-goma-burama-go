// Re-export all types from calculations module
export * from './calculations';

// Utility type for all calculation-related data using imported types
export interface CalculationData {
  projectData: import('./calculations').ProjectData;
  analysisResults?: import('./calculations').AnalysisResults;
  companyInfo?: import('./calculations').CompanyInfo;
}

// Legacy exports for backward compatibility
export type Project = import('./calculations').ProjectData;
export type Company = import('./calculations').CompanyInfo;

// Simulation settings interface
export interface SimulationSettings {
  duration_years: number;
  strompreissteigerung_prozent: number;
}

// Product selection aggregation interface
export interface ProductSelection {
  module?: import('./calculations').Module;
  moduleQuantity: number;
  inverter?: import('./calculations').Inverter;
  storage?: import('./calculations').Storage | null;
  storageEnabled: boolean;
  accessories: import('./calculations').Accessory[];
}