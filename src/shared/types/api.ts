/**
 * API Interface Definitions für Python Bridge Communication
 * Basierend auf perform_calculations() und anderen Python APIs
 */

import { 
  ProjectData, 
  AnalysisResults, 
  ExtendedAnalysesResult,
  HeatpumpCalculationResult 
} from './calculations';

// ============================================================================
// Python Bridge API Endpoints
// ============================================================================

export interface PythonBridgeAPI {
  // Core Calculations
  performCalculations(request: CalculationRequest): Promise<CalculationResponse>;
  
  // Extended Analyses
  performExtendedAnalyses(request: ExtendedAnalysisRequest): Promise<ExtendedAnalysisResponse>;
  
  // Heatpump Calculations
  calculateHeatpump(request: HeatpumpRequest): Promise<HeatpumpResponse>;
  
  // Product Database
  getProducts(request: ProductRequest): Promise<ProductResponse>;
  
  // Price Matrix
  getPriceMatrix(request: PriceMatrixRequest): Promise<PriceMatrixResponse>;
  
  // Chart Generation
  generateCharts(request: ChartRequest): Promise<ChartResponse>;
  
  // PDF Generation
  generatePdf(request: PdfRequest): Promise<PdfResponse>;
  
  // PVGIS Integration
  fetchPvgisData(request: PvgisRequest): Promise<PvgisResponse>;
}

// ============================================================================
// Request Types
// ============================================================================

export interface CalculationRequest {
  projectData: ProjectData;
  options?: {
    includeCharts?: boolean;
    chartFormats?: ('png' | 'svg' | 'pdf')[];
    detailLevel?: 'basic' | 'standard' | 'detailed';
    skipValidation?: boolean;
  };
}

export interface ExtendedAnalysisRequest {
  offerData: {
    totalInvestment: number;
    annualSavings: number;
    annualProductionKwh: number;
    pvSizeKwp: number;
    totalEmbodiedEnergyKwh?: number;
  };
  options?: {
    discountRates?: number[]; // für multiple NPV calculations
    analysisHorizon?: number; // years
  };
}

export interface HeatpumpRequest {
  buildingData: {
    area: number;
    type: string;
    year: string;
    insulation: string;
    heatingSystem: string;
    hotWater: string;
    consumptionInputs: {
      oilL: number;
      gasKwh: number;
      woodSter: number;
      heatingHours: number;
      systemEfficiencyPct: number;
    };
    desiredTemp: number;
    heatingDays: number;
    outsideTemp: number;
    systemTemp: string;
  };
  heatpumpSpecs: {
    heatingPower: number;
    cop: number;
    scop: number;
    price: number;
    sizingFactor?: number;
    hotWaterStorage?: number;
    backupHeating?: boolean;
    smartControl?: boolean;
  };
  economics: {
    electricityPrice: number;
    subsidyAmount?: number;
    oldSystemCosts?: number;
  };
  pvIntegration?: {
    pvSystemSize: number;
    annualPvProduction: number;
    pvCoverageTarget?: number;
  };
}

export interface ProductRequest {
  type: 'modules' | 'inverters' | 'storage' | 'all';
  filters?: {
    manufacturer?: string;
    powerRange?: {
      min: number;
      max: number;
    };
    priceRange?: {
      min: number;
      max: number;
    };
    technology?: string;
    features?: string[];
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface PriceMatrixRequest {
  format?: 'json' | 'csv';
  includeMetadata?: boolean;
}

export interface ChartRequest {
  chartType: 'yearly_production' | 'break_even' | 'amortisation' | 'co2_savings' | 'consumption' | 'monthly_analysis';
  data: AnalysisResults;
  options?: {
    format: 'png' | 'svg' | 'pdf';
    width?: number;
    height?: number;
    dpi?: number;
    theme?: string;
    customization?: {
      colors?: string[];
      showGrid?: boolean;
      showLegend?: boolean;
      title?: string;
      xAxisLabel?: string;
      yAxisLabel?: string;
    };
  };
}

export interface PdfRequest {
  projectData: ProjectData;
  analysisResults: AnalysisResults;
  companyInfo: any;
  sections: string[];
  options: {
    includeCharts: boolean;
    selectedCharts: string[];
    includeCompanyLogo: boolean;
    customTexts?: { [key: string]: string };
    theme?: {
      selectedTheme: string;
      chartCustomizations?: any;
      layoutCustomizations?: any;
      effects?: any;
    };
  };
}

export interface PvgisRequest {
  latitude: number;
  longitude: number;
  systemParams: {
    peakpower: number; // kWp
    loss?: number; // system losses %
    angle?: number; // tilt angle
    aspect?: number; // azimuth angle
    technology?: 'crystSi' | 'CIS' | 'CdTe' | 'Unknown';
    tracking?: 0 | 1 | 2; // 0=fixed, 1=single axis, 2=dual axis
  };
  outputformat?: 'json' | 'csv';
  components?: boolean;
  browser?: boolean;
}

// ============================================================================
// Response Types
// ============================================================================

export interface CalculationResponse {
  success: boolean;
  data?: AnalysisResults;
  error?: APIError;
  metadata?: {
    calculationTime: number; // ms
    pythonVersion: string;
    moduleVersions: { [module: string]: string };
    warnings: string[];
  };
}

export interface ExtendedAnalysisResponse {
  success: boolean;
  data?: ExtendedAnalysesResult;
  error?: APIError;
  metadata?: {
    calculationTime: number;
    methodsUsed: string[];
  };
}

export interface HeatpumpResponse {
  success: boolean;
  data?: HeatpumpCalculationResult;
  error?: APIError;
  recommendations?: {
    sizing: string;
    integration: string;
    economic: string;
  };
}

export interface ProductResponse {
  success: boolean;
  data?: {
    products: any[];
    totalCount: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  error?: APIError;
}

export interface PriceMatrixResponse {
  success: boolean;
  data?: {
    headers: string[];
    rows: any[][];
    metadata: {
      source: string;
      lastUpdated: string;
      version: string;
    };
  };
  error?: APIError;
}

export interface ChartResponse {
  success: boolean;
  data?: {
    imageData: string; // base64 encoded
    format: string;
    dimensions: {
      width: number;
      height: number;
    };
  };
  error?: APIError;
}

export interface PdfResponse {
  success: boolean;
  data?: {
    pdfData: string; // base64 encoded
    filename: string;
    size: number;
    pageCount: number;
  };
  error?: APIError;
  validationWarnings?: string[];
}

export interface PvgisResponse {
  success: boolean;
  data?: {
    inputs: any;
    outputs: {
      monthly: Array<{
        month: number;
        E_d: number; // daily energy output kWh
        E_m: number; // monthly energy output kWh
        H_sun: number; // sun hours
        T2m: number; // temperature
      }>;
      totals: {
        E_d: number; // average daily
        E_m: number; // average monthly  
        E_y: number; // yearly total
        SD_m: number; // standard deviation
        SD_y: number; // standard deviation yearly
      };
    };
    meta: {
      location: {
        latitude: number;
        longitude: number;
        elevation: number;
      };
      radiation_db: string;
      meteo_db: string;
    };
  };
  error?: APIError;
}

// ============================================================================
// Error Types
// ============================================================================

export interface APIError {
  code: string;
  message: string;
  details?: any;
  field?: string;
  timestamp: string;
  requestId?: string;
}

export type APIErrorCode = 
  | 'VALIDATION_ERROR'
  | 'CALCULATION_ERROR'
  | 'PVGIS_ERROR'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'PERMISSION_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'INTERNAL_ERROR'
  | 'EXTERNAL_SERVICE_ERROR';

// ============================================================================
// Bridge Configuration
// ============================================================================

export interface PythonBridgeConfig {
  // Connection
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'ipc';
  
  // Authentication
  apiKey?: string;
  timeout: number; // ms
  
  // Retry Policy
  retries: number;
  retryDelay: number; // ms
  backoffFactor: number;
  
  // Caching
  enableCaching: boolean;
  cacheTimeout: number; // ms
  
  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logRequests: boolean;
  logResponses: boolean;
}

// ============================================================================
// Event Types für Bridge Communication
// ============================================================================

export interface BridgeEvent {
  type: BridgeEventType;
  requestId: string;
  timestamp: string;
  data?: any;
}

export type BridgeEventType =
  | 'connection_established'
  | 'connection_lost'
  | 'request_started'
  | 'request_completed'
  | 'request_failed'
  | 'calculation_progress'
  | 'python_process_started'
  | 'python_process_stopped'
  | 'cache_updated'
  | 'error_occurred';

export interface CalculationProgressEvent extends BridgeEvent {
  type: 'calculation_progress';
  data: {
    stage: string;
    progress: number; // 0-100
    message: string;
    estimatedTimeRemaining?: number; // ms
  };
}

// ============================================================================
// Batch Operations
// ============================================================================

export interface BatchCalculationRequest {
  projects: ProjectData[];
  options?: {
    parallel?: boolean;
    maxConcurrency?: number;
    stopOnError?: boolean;
    includeCharts?: boolean;
  };
}

export interface BatchCalculationResponse {
  success: boolean;
  results: Array<{
    projectIndex: number;
    success: boolean;
    data?: AnalysisResults;
    error?: APIError;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalTime: number; // ms
  };
}

// ============================================================================
// Health Check & Status
// ============================================================================

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    python: ServiceStatus;
    database: ServiceStatus;
    pvgis: ServiceStatus;
    cache: ServiceStatus;
  };
  uptime: number; // seconds
  version: string;
}

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number; // ms
  lastCheck: string;
  error?: string;
}

// ============================================================================
// File Upload Types
// ============================================================================

export interface FileUploadRequest {
  file: File | Buffer;
  type: 'price_matrix' | 'product_data' | 'company_logo' | 'consumption_profile';
  options?: {
    validate?: boolean;
    preview?: boolean;
    overwrite?: boolean;
  };
}

export interface FileUploadResponse {
  success: boolean;
  data?: {
    filename: string;
    size: number;
    format: string;
    preview?: any;
    validation?: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    };
  };
  error?: APIError;
}