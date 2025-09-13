/**
 * Session State Types basierend auf Python session_state Contracts
 * Quelle: docs/contracts_reference.md - Session State Struktur
 */

import { 
  ProjectData, 
  AnalysisResults, 
  CompanyInfo, 
  LivePricingCalculations,
  PdfConfiguration,
  HeatpumpData,
  ExtendedAnalysesResult,
  BuildingData,
  HeatpumpEconomics,
  HeatpumpIntegration
} from './calculations';

// ============================================================================
// Core Session State
// ============================================================================

export interface SessionState {
  // Project Management
  currentProject?: ProjectData;
  analysisResults?: AnalysisResults;
  extendedAnalysisResults?: ExtendedAnalysesResult;
  
  // Company & User
  selectedCompany?: CompanyInfo;
  currentUser?: UserInfo;
  
  // Live Calculations
  livePricingCalculations?: LivePricingCalculations;
  calculationProgress?: CalculationProgress;
  
  // PDF Generation
  pdfConfiguration?: PdfConfiguration;
  lastGeneratedPdf?: {
    filename: string;
    timestamp: string;
    size: number;
    base64?: string;
  };
  
  // Heatpump Integration
  heatpumpData?: HeatpumpData;
  buildingData?: BuildingData;
  heatpumpEconomics?: HeatpumpEconomics;
  heatpumpIntegration?: HeatpumpIntegration;
  
  // UI State
  currentTab?: string;
  sidebarCollapsed?: boolean;
  theme?: ThemeSettings;
  
  // Data Cache
  productCache?: ProductCache;
  priceMatrixCache?: PriceMatrixCache;
  
  // Comparison & Multi-Offer
  comparisonProjects?: ProjectData[];
  multiOfferSettings?: MultiOfferSettings;
  
  // Advanced Features
  scenarioManager?: ScenarioManagerState;
  sensitivityAnalysis?: SensitivityAnalysisState;
}

// ============================================================================
// User & Authentication
// ============================================================================

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'readonly';
  preferences: UserPreferences;
  lastLogin: string;
}

export interface UserPreferences {
  defaultTheme: string;
  defaultCalculationHorizon: number;
  defaultDiscountRate: number;
  showAdvancedFeatures: boolean;
  autoSaveInterval: number; // minutes
  preferredChartTypes: string[];
  defaultCompany?: string;
}

// ============================================================================
// Theme & UI Settings
// ============================================================================

export interface ThemeSettings {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: string;
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

// ============================================================================
// Cache Types
// ============================================================================

export interface ProductCache {
  modules: { [id: string]: any };
  inverters: { [id: string]: any };
  storage: { [id: string]: any };
  lastUpdated: string;
  version: string;
}

export interface PriceMatrixCache {
  data: PriceMatrixEntry[];
  headers: string[];
  lastUpdated: string;
  source: string; // 'xlsx' | 'csv' | 'manual'
}

export interface PriceMatrixEntry {
  kwpRange: string;
  ohneSpeicer?: number;
  mitSpeicher5kwh?: number;
  mitSpeicher10kwh?: number;
  mitSpeicher15kwh?: number;
  mitSpeicher20kwh?: number;
  [key: string]: any; // dynamic columns
}

// ============================================================================
// Multi-Offer & Comparison
// ============================================================================

export interface MultiOfferSettings {
  baseProject: ProjectData;
  variants: OfferVariant[];
  comparisonCriteria: string[];
  outputFormat: 'combined_pdf' | 'separate_pdfs' | 'comparison_table';
  includeRecommendation: boolean;
}

export interface OfferVariant {
  id: string;
  name: string;
  description: string;
  modifications: ProjectModifications;
  analysisResults?: AnalysisResults;
  selected: boolean;
}

export interface ProjectModifications {
  systemSize?: number; // kWp
  moduleType?: string;
  inverterType?: string;
  storageCapacity?: number;
  additionalComponents?: string[];
  customPricing?: PricingModifications;
}

export interface PricingModifications {
  baseDiscount?: number; // %
  additionalCosts?: AdditionalCost[];
  customRates?: {
    electricityPrice?: number;
    feedInTariff?: number;
    discountRate?: number;
  };
}

export interface AdditionalCost {
  id: string;
  name: string;
  amount: number;
  type: 'fixed' | 'per_kwp' | 'per_module';
  category: 'installation' | 'component' | 'service' | 'other';
}

// ============================================================================
// Scenario Management
// ============================================================================

export interface ScenarioManagerState {
  scenarios: Scenario[];
  activeScenario?: string;
  comparisonMode: boolean;
  comparisonScenarios: string[];
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  modifiedAt: string;
  projectData: ProjectData;
  analysisResults?: AnalysisResults;
  tags: string[];
  isBaseline: boolean;
}

// ============================================================================
// Sensitivity Analysis
// ============================================================================

export interface SensitivityAnalysisState {
  parameters: SensitivityParameter[];
  results: SensitivityResult[];
  analysisType: 'one_way' | 'two_way' | 'monte_carlo';
  targetKpi: 'npv' | 'irr' | 'payback' | 'lcoe';
}

export interface SensitivityParameter {
  name: string;
  baseValue: number;
  minValue: number;
  maxValue: number;
  stepSize: number;
  unit: string;
  category: 'technical' | 'financial' | 'market';
}

export interface SensitivityResult {
  parameterValues: { [parameterName: string]: number };
  kpiValue: number;
  scenario: string;
}

// ============================================================================
// Calculation Progress & Status
// ============================================================================

export interface CalculationProgress {
  stage: CalculationStage;
  progress: number; // 0-100
  message: string;
  startTime: string;
  estimatedCompletion?: string;
  errors: CalculationError[];
  warnings: CalculationWarning[];
}

export type CalculationStage = 
  | 'initializing'
  | 'validating_input'
  | 'fetching_pvgis'
  | 'calculating_production'
  | 'calculating_consumption'
  | 'calculating_economics'
  | 'generating_charts'
  | 'finalizing'
  | 'completed'
  | 'error';

export interface CalculationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning' | 'info';
  timestamp: string;
}

export interface CalculationWarning {
  code: string;
  message: string;
  field?: string;
  recommendation?: string;
  timestamp: string;
}

// ============================================================================
// Forms & Validation
// ============================================================================

export interface FormValidationState {
  isValid: boolean;
  errors: { [fieldName: string]: string[] };
  warnings: { [fieldName: string]: string[] };
  touchedFields: Set<string>;
  submissionAttempted: boolean;
}

export interface FormFieldState {
  value: any;
  error?: string;
  warning?: string;
  touched: boolean;
  validated: boolean;
}

// ============================================================================
// Navigation & UI State
// ============================================================================

export interface NavigationState {
  currentRoute: string;
  previousRoute?: string;
  breadcrumbs: BreadcrumbItem[];
  sidebarOpen: boolean;
  modalStack: ModalInfo[];
}

export interface BreadcrumbItem {
  label: string;
  route: string;
  icon?: string;
}

export interface ModalInfo {
  id: string;
  component: string;
  props: any;
  dismissible: boolean;
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// ============================================================================
// Data Synchronization
// ============================================================================

export interface SyncState {
  lastSync: string;
  pendingChanges: PendingChange[];
  conflictResolution: ConflictResolution[];
  syncInProgress: boolean;
  autoSyncEnabled: boolean;
}

export interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'project' | 'company' | 'product';
  entityId: string;
  changes: any;
  timestamp: string;
}

export interface ConflictResolution {
  changeId: string;
  localVersion: any;
  remoteVersion: any;
  resolution: 'local' | 'remote' | 'merge' | 'manual';
  resolvedValue?: any;
}

// ============================================================================
// Export/Import State
// ============================================================================

export interface ExportImportState {
  exportProgress?: {
    stage: string;
    progress: number;
    filename: string;
  };
  importProgress?: {
    stage: string;
    progress: number;
    filename: string;
    preview?: any;
  };
  exportHistory: ExportHistoryItem[];
  importHistory: ImportHistoryItem[];
}

export interface ExportHistoryItem {
  id: string;
  filename: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  timestamp: string;
  size: number;
  projectIds: string[];
}

export interface ImportHistoryItem {
  id: string;
  filename: string;
  format: 'excel' | 'csv' | 'json';
  timestamp: string;
  recordsImported: number;
  errors: number;
  warnings: number;
}

// ============================================================================
// Utility Types for Session Management
// ============================================================================

export type SessionStateKey = keyof SessionState;

export interface SessionStateUpdate<K extends SessionStateKey> {
  key: K;
  value: SessionState[K];
  merge?: boolean; // whether to merge with existing or replace
}

export type SessionStatePatch = {
  [K in SessionStateKey]?: Partial<SessionState[K]>;
};

// ============================================================================
// Event Types for State Changes
// ============================================================================

export interface StateChangeEvent<T = any> {
  type: string;
  key: string;
  oldValue: T;
  newValue: T;
  timestamp: string;
  source: 'user' | 'system' | 'sync';
}

export type StateChangeListener<T = any> = (event: StateChangeEvent<T>) => void;

// ============================================================================
// Persistence Configuration
// ============================================================================

export interface PersistenceConfig {
  enabled: boolean;
  storageType: 'localStorage' | 'sessionStorage' | 'indexedDB';
  encryptionEnabled: boolean;
  syncWithServer: boolean;
  autoSaveInterval: number; // milliseconds
  includeKeys: SessionStateKey[];
  excludeKeys: SessionStateKey[];
}