/**
 * TypeScript Interfaces für Electron App 
 * Kopiert und angepasst von den extrahierten Python Calculation Contracts
 */

// ============================================================================
// Project Data (Input Contracts)
// ============================================================================

export interface CustomerData {
  customerName: string;
  street: string;
  city: string;
  zipCode: string;
  phone?: string;
  email?: string;
  isPowerBillAttached?: boolean;
  additionalNotes?: string;
}

export interface ProjectDetails {
  // Core PV System
  anlageKwp: number;
  moduleQuantity: number;
  selectedModule?: string;
  selectedInverter?: string;
  
  // Roof/Installation
  roofOrientation: number; // 0-360 degrees
  roofTilt: number; // 0-90 degrees
  roofArea?: number;
  installationType?: 'aufdach' | 'indach' | 'freifläche';
  shadowingFactor?: number; // 0-1
  
  // Storage
  storageCapacityKwh?: number;
  selectedStorage?: string;
  storageType?: 'AC' | 'DC';
  
  // Location/Weather
  latitude?: number;
  longitude?: number;
  weatherData?: string; // PVGIS source
  
  // Additional Components
  hasOptimizers?: boolean;
  hasWallbox?: boolean;
  wallboxCount?: number;
  additionalComponents?: string[];
}

// ============================================================================
// Accessory & Product Interfaces
// ============================================================================

export interface Accessory {
  id: string;
  name: string;
  category: 'wallbox' | 'monitoring' | 'energy_management' | 'optimizer' | 'safety' | 'installation';
  manufacturer: string;
  model: string;
  power: number; // kW or W
  price: number;
  features: string[];
  description: string;
  specifications?: Record<string, any>;
}

export interface AccessorySelectionProps {
  selectedAccessories: Accessory[];
  onAccessoriesChange: (accessories: Accessory[]) => void;
}

export interface EconomicData {
  // Energy Prices
  currentElectricityPrice: number; // €/kWh
  electricityPriceIncrease: number; // %/year
  
  // Einspeisevergütung
  einspeiseverguetung: number; // €/kWh
  einspeiseverguetungDuration: number; // years
  einspeiseverguetungPostPeriod?: number; // €/kWh after duration
  
  // Financial Parameters
  discountRate: number; // % for NPV calculations
  analysisHorizon: number; // years (typically 20-25)
  
  // Consumption
  annualConsumptionKwh: number;
  consumptionProfile?: number[]; // hourly or monthly profile
  
  // Financing
  financingType?: 'cash' | 'loan' | 'leasing';
  loanInterestRate?: number; // %
  loanDuration?: number; // years
  downPayment?: number; // €
  
  // Incentives
  subsidyAmount?: number; // €
  subsidyType?: 'direct' | 'tax_credit';
  
  // Maintenance
  annualMaintenanceCostPercent?: number; // % of investment
  insuranceCostAnnual?: number; // €/year
}

export interface ProjectData {
  customerData: CustomerData;
  projectDetails: ProjectDetails;
  economicData: EconomicData;
  companyInformation?: CompanyInfo;
}

// ============================================================================
// Company Data
// ============================================================================

export interface CompanyInfo {
  id?: string; // Optional for database operations
  name: string;
  street: string;
  city: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  logoBase64?: string;
  umsatzsteuerNr?: string;
  handelsregister?: string;
  geschaeftsfuehrer?: string;
  bankName?: string;
  iban?: string;
  bic?: string;
}

// ============================================================================
// Analysis Results (Output from perform_calculations)
// ============================================================================

export interface AnalysisResults {
  // System Specifications
  anlageKwp: number;
  moduleQuantity: number;
  
  // Production Data
  annualPvProductionKwh: number;
  monthlyProductionsSim: number[]; // 12 months
  annualProductionsSim: number[]; // multi-year array
  specificYieldKwhPerKwp: number;
  
  // Consumption & Self-Use
  annualConsumptionKwh: number;
  monthlyConsumptionSim: number[]; // 12 months
  selfConsumptionKwh: number;
  selfConsumptionPercent: number;
  gridFeedInKwh: number;
  gridPurchaseKwh: number;
  autarkyPercent: number;
  
  // Cost Structure (Netto)
  baseMatrixPriceNetto: number;
  costModulesAufpreisNetto: number;
  costInverterAufpreisNetto: number;
  costStorageAufpreisProductDbNetto: number;
  costOptimizersNetto?: number;
  costWallboxNetto?: number;
  costInstallationNetto: number;
  totalAdditionalCostsNetto: number;
  subtotalNetto: number;
  mwstAmount: number;
  totalInvestmentNetto: number;
  totalInvestmentBrutto: number;
  
  // Einspeisevergütung
  einspeiseverguetungTotal: number;
  einspeiseverguetungAnnual: number;
  einspeiseverguetungMonthly: number;
  einspeiseverguetungPerKwh: number;
  
  // Savings & Economics
  annualElectricitySavings: number;
  monthlyElectricitySavings: number;
  totalSavings20Years: number;
  
  // Financial KPIs
  npvValue: number; // Net Present Value
  irrPercent: number; // Internal Rate of Return
  lcoeEuroPerKwh: number; // Levelized Cost of Energy
  amortizationTimeYears: number;
  profitabilityIndex: number;
  
  // Simulation Arrays (20+ years)
  annualSavingsSim: number[];
  cumulativeSavingsSim: number[];
  cumulativeCashFlowsSim: number[];
  gridPurchaseCostsSim: number[];
  feedInRevenuesSim: number[];
  maintenanceCostsSim: number[];
  
  // Storage Calculations
  storageCapacityKwh?: number;
  storageCyclesPerYear?: number;
  storageEfficiency?: number;
  storageAdditionalSelfConsumption?: number;
  storageAnnualSavings?: number;
  
  // CO2 & Environment
  co2AvoidancePerYearTons: number;
  co2AvoidanceTotal20Years: number;
  co2CostSavingsAnnual: number;
  co2PricePerTon: number;
  
  // Charts (Base64 PNG bytes or null)
  yearlyProductionChartBytes?: string | null;
  breakEvenChartBytes?: string | null;
  amortisationChartBytes?: string | null;
  co2SavingsChartBytes?: string | null;
  consumptionChartBytes?: string | null;
  monthlyAnalysisChartBytes?: string | null;
  
  // Additional Metadata
  calculationTimestamp: string;
  pvgisDataSource?: string;
  weatherDataQuality?: string;
  systemLossPercent?: number;
  degradationRatePerYear?: number;
  
  // Final Pricing (from live pricing calculations)
  finalPrice?: number;
  totalRabatteNachlaesse?: number;
  totalAufpreiseZuschlaege?: number;
}

// ============================================================================
// Product Database Interfaces
// ============================================================================

export interface Module {
  id: string;
  manufacturer: string;
  model: string;
  powerWp: number;
  efficiency: number;
  technology: 'mono' | 'poly' | 'thin-film';
  dimensions: {
    length: number;
    width: number;
    thickness: number;
  };
  weight: number;
  pricePerWp?: number;
  warranty: {
    product: number; // years
    performance: number; // years
  };
  temperatureCoefficient: number; // %/°C
  maxSystemVoltage: number; // V
  shortCircuitCurrent: number; // A
  openCircuitVoltage: number; // V
}

export interface Inverter {
  id: string;
  manufacturer: string;
  model: string;
  type: 'string' | 'central' | 'micro' | 'power-optimizer';
  powerKw: number;
  efficiency: number;
  maxDcVoltage: number; // V
  startupVoltage: number; // V
  mpptChannels: number;
  maxDcCurrent: number; // A
  acVoltage: number; // V
  price?: number;
  warranty: number; // years
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: number;
  protectionClass: string; // IP rating
  features: string[];
}

export interface Storage {
  id: string;
  manufacturer: string;
  model: string;
  type: 'AC' | 'DC';
  capacity: number; // kWh
  usableCapacity: number; // kWh
  powerKw: number;
  efficiency: number; // round-trip %
  cycleLife: number;
  voltage: number; // V
  technology: 'LiFePO4' | 'Li-Ion' | 'Lead-Acid';
  price?: number;
  warranty: {
    product: number; // years
    cycles: number;
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: number;
  temperatureRange: {
    min: number; // °C
    max: number; // °C
  };
  features: string[];
}

// ============================================================================
// Session State & Live Pricing
// ============================================================================

export interface LivePricingCalculations {
  baseCost: number;
  totalRabatteNachlaesse: number;
  totalAufpreiseZuschlaege: number;
  finalPrice: number;
}

export interface PdfConfiguration {
  sectionsToInclude: string[];
  selectedChartsForPdf: string[];
  includeCompanyLogo: boolean;
  customTexts?: { [key: string]: string };
  theme?: {
    selectedTheme: string;
    chartCustomizations?: any;
    layoutCustomizations?: any;
    effects?: any;
  };
}

// ============================================================================
// Legacy Product Selection for Components
// ============================================================================

export interface ProductSelection {
  // PV Module
  pv_module_count: number;
  pv_module_hersteller: string;
  pv_module_modell: string;
  pv_module_leistung_wp: number;
  
  // Wechselrichter
  wechselrichter_hersteller: string;
  wechselrichter_modell: string;
  wechselrichter_count: number;
  wechselrichter_leistung_kw: number;
  
  // Speicher (optional)
  speicher_enabled: boolean;
  speicher_hersteller?: string;
  speicher_modell?: string;
  speicher_kapazitaet_kwh?: number;
  
  // Zubehör (optional)
  wallbox_enabled: boolean;
  wallbox_hersteller?: string;
  wallbox_modell?: string;
  
  energiemanagement_enabled: boolean;
  energiemanagement_hersteller?: string;
  energiemanagement_modell?: string;
  
  notstrom_enabled: boolean;
  notstrom_hersteller?: string;
  notstrom_modell?: string;
  
  leistungsoptimierung_enabled: boolean;
  leistungsoptimierung_hersteller?: string;
  leistungsoptimierung_modell?: string;
  
  carport_enabled: boolean;
  carport_hersteller?: string;
  carport_modell?: string;
  
  tierabwehr_enabled: boolean;
  tierabwehr_hersteller?: string;
  tierabwehr_modell?: string;
}

// ============================================================================
// UI-specific types for the Electron app
// ============================================================================

export interface AppState {
  projectData: ProjectData | null;
  analysisResults: AnalysisResults | null;
  productSelection: ProductSelection;
  currentCompany: CompanyInfo | null;
  livePricing: LivePricingCalculations | null;
  pdfConfig: PdfConfiguration | null;
}

export interface CalculationProgress {
  stage: string;
  progress: number; // 0-100
  message: string;
  estimatedTime?: number; // ms
}

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Component Props Types
export interface SolarCalculatorProps {
  onProjectDataChange?: (data: Partial<ProjectData>) => void;
  onSelectionChange?: (selection: ProductSelection) => void;
  initialData?: Partial<ProjectData>;
  initialSelection?: Partial<ProductSelection>;
}

export interface ModuleSelectionProps {
  selectedModule?: Module;
  onModuleSelect: (module: Module) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export interface InverterSelectionProps {
  selectedInverter?: Inverter;
  onInverterSelect: (inverter: Inverter) => void;
  systemSize: number; // kWp to help filter compatible inverters
}

export interface StorageSelectionProps {
  selectedStorage: Storage | null;
  onStorageSelect: (storage: Storage | null) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  systemSize: number; // kWp for sizing recommendations
}

// Form validation types
export interface FormErrors {
  [fieldName: string]: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormErrors;
  warnings: FormErrors;
}

// Chart configuration for live preview
export interface ChartConfig {
  type: 'production' | 'consumption' | 'savings' | 'co2';
  timespan: 'monthly' | 'yearly' | 'lifetime';
  showGrid: boolean;
  showLegend: boolean;
  height: number;
}

// Table configuration for results display
export interface TableConfig {
  columns: Array<{
    field: string;
    header: string;
    sortable?: boolean;
    format?: 'currency' | 'percentage' | 'number' | 'energy';
  }>;
  exportEnabled: boolean;
  selectionMode?: 'single' | 'multiple' | 'none';
}

// Navigation types
export interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  command?: () => void;
  items?: MenuItem[];
  disabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  route?: string;
  icon?: string;
}

// File handling types
export interface FileUpload {
  name: string;
  size: number;
  type: string;
  data: ArrayBuffer;
  progress?: number;
}

export interface ExportConfig {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  filename: string;
  sections: string[];
  includeCharts: boolean;
  includeRawData: boolean;
}

// API Response Types for Python Bridge
export interface CalculationResponse {
  success: boolean;
  data?: AnalysisResults;
  error?: string;
  timestamp: string;
}