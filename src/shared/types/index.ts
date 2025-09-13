// Re-export calculation types
export * from './calculations';

// Re-export API types (excluding conflicting names)
export type {
  PythonBridgeAPI,
  CalculationRequest,
  ExtendedAnalysisRequest,
  HeatpumpRequest,
  ProductRequest,
  PriceMatrixRequest,
  ChartRequest,
  PdfRequest,
  PvgisRequest,
  ProductResponse,
  PriceMatrixResponse,
  ChartResponse,
  PdfResponse,
  PvgisResponse,
  APIError,
  APIErrorCode,
  PythonBridgeConfig,
  BridgeEvent,
  BridgeEventType,
  CalculationProgressEvent,
  BatchCalculationRequest,
  BatchCalculationResponse,
  HealthCheckResponse,
  ServiceStatus,
  FileUploadRequest,
  FileUploadResponse
} from './api';

// Renamed API types to avoid conflicts
export type { 
  CalculationResponse as APICalculationResponse,
  ExtendedAnalysisResponse as APIExtendedAnalysisResponse,
  HeatpumpResponse as APIHeatpumpResponse
} from './api';

// Re-export session state types (excluding conflicting names)
export type {
  SessionState,
  UserInfo,
  UserPreferences,
  ThemeSettings,
  ProductCache,
  PriceMatrixCache,
  PriceMatrixEntry,
  MultiOfferSettings,
  OfferVariant,
  ProjectModifications,
  PricingModifications,
  AdditionalCost,
  ScenarioManagerState,
  Scenario,
  SensitivityAnalysisState,
  SensitivityParameter,
  SensitivityResult,
  CalculationStage,
  CalculationError,
  CalculationWarning,
  FormValidationState,
  FormFieldState,
  NavigationState,
  BreadcrumbItem,
  ModalInfo,
  SyncState,
  PendingChange,
  ConflictResolution,
  ExportImportState,
  ExportHistoryItem,
  ImportHistoryItem,
  SessionStateKey,
  SessionStateUpdate,
  SessionStatePatch,
  StateChangeEvent,
  StateChangeListener,
  PersistenceConfig
} from './sessionState';

// Renamed to avoid conflicts
export type { CalculationProgress as SessionCalculationProgress } from './sessionState';

// Utility type for all calculation-related data
export interface CalculationData {
  projectData: import('./calculations').ProjectData;
  analysisResults?: import('./calculations').AnalysisResults;
  companyInfo?: import('./calculations').CompanyInfo;
}

// Legacy exports for compatibility (mapped to new structure)
export type Project = import('./calculations').ProjectData;
export type Company = import('./calculations').CompanyInfo;
export type User = import('./sessionState').UserInfo;