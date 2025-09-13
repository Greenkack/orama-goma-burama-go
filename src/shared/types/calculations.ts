/**
 * TypeScript Interfaces basierend auf extrahierten Python Calculation Contracts
 * Quelle: docs/calculations_logic_extraction.md, docs/contracts_reference.md
 * Mapping: Python snake_case → TypeScript camelCase
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
  
  // Advanced Calculations (from calculations_extended)
  dynamicPayback3Percent?: number;
  dynamicPayback5Percent?: number;
  netPresentValue?: number;
  internalRateOfReturn?: number;
  energyPaybackTime?: number;
  co2PaybackTime?: number;
  totalRoiPercent?: number;
  annualEquityReturnPercent?: number;
  profitAfter10Years?: number;
  profitAfter20Years?: number;
}

// ============================================================================
// Extended Analyses Results
// ============================================================================

export interface ExtendedAnalysesResult {
  dynamicPayback3Percent: number; // Jahre
  dynamicPayback5Percent: number; // Jahre
  netPresentValue: number; // €
  internalRateOfReturn: number; // %
  profitabilityIndex: number; // ratio
  lcoe: number; // ct/kWh (convert to €/kWh by /100)
  co2AvoidancePerYearTons: number; // t/a
  energyPaybackTime: number; // Jahre
  co2PaybackTime: number; // Jahre
  totalRoiPercent: number; // %
  annualEquityReturnPercent: number; // %
  profitAfter10Years: number; // €
  profitAfter20Years: number; // €
}

export interface LcoeAdvancedResult {
  lcoeSimple: number; // €/kWh
  lcoeDiscounted: number; // €/kWh
  yearlyLcoe: number[];
  gridComparison: number; // ratio
  savingsPotential: number; // €/kWh
}

export interface IrrAdvancedResult {
  irr: number; // %
  mirr: number; // %
  profitabilityIndex: number;
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
    chartCustomizations?: ChartCustomizations;
    layoutCustomizations?: LayoutCustomizations;
    effects?: EffectSettings;
  };
}

export interface ChartCustomizations {
  grid: boolean;
  gridAlpha: number;
  lineWidth: number;
  markerSize: number;
  shadow: boolean;
  gradient: boolean;
}

export interface LayoutCustomizations {
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  headerHeight: number;
  footerHeight: number;
  sectionSpacing: number;
  elementSpacing: number;
}

export interface EffectSettings {
  watermark: boolean;
  pageNumbers: boolean;
  headerLine: boolean;
  footerLine: boolean;
  sectionBorders: boolean;
  highlightImportant: boolean;
  useIcons: boolean;
  roundedCorners: boolean;
  watermarkSettings?: {
    text: string;
    opacity: number;
    rotation: number;
  };
}

// ============================================================================
// Heatpump Integration
// ============================================================================

export interface BuildingData {
  // Grunddaten
  area: number;
  type: string;
  year: string;
  insulation: string;
  heatingSystem: string;
  hotWater: string;
  
  // Verbrauch
  consumptionInputs: {
    oilL: number;
    gasKwh: number;
    woodSter: number;
    heatingHours: number;
    systemEfficiencyPct: number;
  };
  
  // Parameter
  desiredTemp: number;
  heatingDays: number;
  outsideTemp: number;
  systemTemp: string;
  
  // Ergebnisse
  heatLoadKw: number;
  heatLoadSource: 'verbrauchsbasiert' | 'gebäudedaten';
  calculatedAt: string; // ISO date
}

export interface SelectedHeatpump {
  manufacturer: string;
  model: string;
  type: string;
  heatingPower: number;
  cop: number;
  scop: number;
  price: number;
  [key: string]: any; // additional properties
}

export interface HeatpumpData {
  selectedHeatpump: SelectedHeatpump;
  alternatives: SelectedHeatpump[];
  sizingFactor: number;
  hotWaterStorage: number;
  backupHeating: boolean;
  smartControl: boolean;
  buildingData: BuildingData;
}

export interface HeatpumpEconomics {
  totalInvestment: number;
  annualSavings: number;
  paybackTime: number | null; // can be infinite
  hpElectricityConsumption: number;
  annualHpCost: number;
  annualOldCost: number;
  heatDemandKwh: number;
  electricityPrice: number;
  subsidyAmount: number;
}

export interface HeatpumpIntegration {
  pvCoverageHp: number; // 0..1
  annualPvSavingsHp: number;
  totalAnnualSavings: number;
  smartControlEnabled: boolean;
  thermalStorageSize: number;
}

export interface HeatpumpCalculationResult {
  heatingDemandKwh: number;
  electricityConsumptionKwh: number;
  annualElectricityCost: number;
  annualAlternativeCost: number;
  annualSavings: number;
  paybackPeriodYears: number | null;
  totalSavings20y: number;
  investmentCost: number;
  cop: number;
  recommendation: string;
}

// ============================================================================
// Financial Tools Results
// ============================================================================

export interface AnnuityResult {
  monatlicheRate: number;
  gesamtzinsen: number;
  gesamtkosten: number;
  effectiveRate: number;
  tilgungsplan: Array<{
    monat: number;
    rate: number;
    zinsen: number;
    tilgung: number;
    restschuld: number;
  }>;
  laufzeitMonate: number;
}

export interface LeasingResult {
  monatlicheRate: number;
  gesamtkosten: number;
  restwert: number;
  effektivkosten: number;
}

export interface DepreciationResult {
  annualDepreciation: number;
  depreciationPlan: Array<{
    year: number;
    depreciation: number;
    bookValue: number;
  }>;
}

export interface FinancingComparison {
  kredit: {
    gesamtkosten: number;
    monatlicheRate: number;
    zinslast: number;
  };
  leasing: {
    gesamtkosten: number;
    monatlicheRate: number;
    restwert: number;
  };
  cashKauf: {
    sofortkosten: number;
    opportunitaetskosten: number;
  };
  empfehlung: string;
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
// API Response Types
// ============================================================================

export interface CalculationResponse {
  success: boolean;
  data?: AnalysisResults;
  error?: string;
  timestamp: string;
}

export interface ExtendedAnalysisResponse {
  success: boolean;
  data?: ExtendedAnalysesResult;
  error?: string;
}

export interface HeatpumpAnalysisResponse {
  success: boolean;
  data?: HeatpumpCalculationResult;
  error?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type CalculationStatus = 'pending' | 'calculating' | 'completed' | 'error';

export interface CalculationProgress {
  status: CalculationStatus;
  step?: string;
  progress?: number; // 0-100
  message?: string;
}

// ============================================================================
// Chart Data Types
// ============================================================================

export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area';
}

export interface ChartConfig {
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  series: ChartSeries[];
  showLegend?: boolean;
  showGrid?: boolean;
  height?: number;
}