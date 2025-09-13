import { ipcMain } from 'electron';
import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';
import { getDatabase } from './database';
import type { Module, Inverter, Storage, Accessory, CompanyInfo } from '../../shared/types';

export interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
}

export interface ImportOptions {
  clearExisting: boolean;
  skipDuplicates: boolean;
  validateData: boolean;
}

export class DataImporter {
  private db = getDatabase();

  // ============================================================================
  // EXCEL/CSV PARSING
  // ============================================================================

  async importFromFile(filePath: string, category: string, options: ImportOptions = {
    clearExisting: false,
    skipDuplicates: true,
    validateData: true
  }): Promise<ImportResult> {
    try {
      const fileExtension = filePath.toLowerCase().split('.').pop();
      let data: any[];

      if (fileExtension === 'csv') {
        data = await this.parseCSV(filePath);
      } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
        data = await this.parseExcel(filePath);
      } else {
        return {
          success: false,
          message: 'Unsupported file format. Only CSV, XLS, and XLSX are supported.',
          imported: 0,
          errors: []
        };
      }

      return await this.importByCategory(category, data, options);
    } catch (error) {
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async parseCSV(filePath: string): Promise<any[]> {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const workbook = XLSX.read(fileContent, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }

  private async parseExcel(filePath: string): Promise<any[]> {
    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }

  // ============================================================================
  // CATEGORY-SPECIFIC IMPORT
  // ============================================================================

  private async importByCategory(category: string, data: any[], options: ImportOptions): Promise<ImportResult> {
    if (options.clearExisting) {
      this.db.clearTable(this.getCategoryTable(category));
    }

    switch (category) {
      case 'modules':
        return await this.importModules(data, options);
      case 'inverters':
        return await this.importInverters(data, options);
      case 'storages':
        return await this.importStorages(data, options);
      case 'accessories':
        return await this.importAccessories(data, options);
      case 'companies':
        return await this.importCompanies(data, options);
      default:
        return {
          success: false,
          message: `Unknown category: ${category}`,
          imported: 0,
          errors: []
        };
    }
  }

  private getCategoryTable(category: string): string {
    const tableMap: { [key: string]: string } = {
      'modules': 'modules',
      'inverters': 'inverters',
      'storages': 'storages',
      'accessories': 'accessories',
      'companies': 'companies'
    };
    return tableMap[category] || category;
  }

  // ============================================================================
  // MODULE IMPORT
  // ============================================================================

  private async importModules(data: any[], options: ImportOptions): Promise<ImportResult> {
    const errors: string[] = [];
    const validModules: Omit<Module, 'id'>[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Excel row number (header is row 1)

      try {
        const module = this.mapRowToModule(row);
        
        if (options.validateData) {
          const validation = this.validateModule(module);
          if (!validation.isValid) {
            errors.push(`Row ${rowNum}: ${validation.errors.join(', ')}`);
            continue;
          }
        }

        validModules.push(module);
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Invalid data format'}`);
      }
    }

    if (validModules.length === 0) {
      return {
        success: false,
        message: 'No valid modules found to import',
        imported: 0,
        errors
      };
    }

    try {
      const ids = this.db.bulkInsertModules(validModules);
      return {
        success: true,
        message: `Successfully imported ${ids.length} modules`,
        imported: ids.length,
        errors
      };
    } catch (error) {
      return {
        success: false,
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        imported: 0,
        errors: [...errors, error instanceof Error ? error.message : 'Database error']
      };
    }
  }

  private mapRowToModule(row: any): Omit<Module, 'id'> {
    return {
      manufacturer: this.getString(row, 'manufacturer'),
      model: this.getString(row, 'model'),
      powerWp: this.getNumber(row, 'powerWp'),
      efficiency: this.getNumber(row, 'efficiency'),
      technology: this.getString(row, 'technology') as 'mono' | 'poly' | 'thin-film',
      dimensions: {
        length: this.getNumber(row, 'dimensions_length'),
        width: this.getNumber(row, 'dimensions_width'),
        thickness: this.getNumber(row, 'dimensions_thickness')
      },
      weight: this.getNumber(row, 'weight'),
      pricePerWp: this.getOptionalNumber(row, 'pricePerWp'),
      warranty: {
        product: this.getNumber(row, 'warranty_product'),
        performance: this.getNumber(row, 'warranty_performance')
      },
      temperatureCoefficient: this.getNumber(row, 'temperatureCoefficient'),
      maxSystemVoltage: this.getNumber(row, 'maxSystemVoltage'),
      shortCircuitCurrent: this.getNumber(row, 'shortCircuitCurrent'),
      openCircuitVoltage: this.getNumber(row, 'openCircuitVoltage')
    };
  }

  private validateModule(module: Omit<Module, 'id'>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!module.manufacturer) errors.push('Manufacturer is required');
    if (!module.model) errors.push('Model is required');
    if (module.powerWp <= 0) errors.push('PowerWp must be greater than 0');
    if (module.efficiency <= 0 || module.efficiency > 100) errors.push('Efficiency must be between 0 and 100');
    if (!['mono', 'poly', 'thin-film'].includes(module.technology)) errors.push('Technology must be mono, poly, or thin-film');
    if (module.dimensions.length <= 0) errors.push('Length must be greater than 0');
    if (module.dimensions.width <= 0) errors.push('Width must be greater than 0');
    if (module.dimensions.thickness <= 0) errors.push('Thickness must be greater than 0');
    if (module.weight <= 0) errors.push('Weight must be greater than 0');
    if (module.warranty.product <= 0) errors.push('Product warranty must be greater than 0');
    if (module.warranty.performance <= 0) errors.push('Performance warranty must be greater than 0');
    if (module.maxSystemVoltage <= 0) errors.push('Max system voltage must be greater than 0');
    if (module.shortCircuitCurrent <= 0) errors.push('Short circuit current must be greater than 0');
    if (module.openCircuitVoltage <= 0) errors.push('Open circuit voltage must be greater than 0');

    return { isValid: errors.length === 0, errors };
  }

  // ============================================================================
  // INVERTER IMPORT
  // ============================================================================

  private async importInverters(data: any[], options: ImportOptions): Promise<ImportResult> {
    const errors: string[] = [];
    const validInverters: Omit<Inverter, 'id'>[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      try {
        const inverter = this.mapRowToInverter(row);
        
        if (options.validateData) {
          const validation = this.validateInverter(inverter);
          if (!validation.isValid) {
            errors.push(`Row ${rowNum}: ${validation.errors.join(', ')}`);
            continue;
          }
        }

        validInverters.push(inverter);
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Invalid data format'}`);
      }
    }

    if (validInverters.length === 0) {
      return {
        success: false,
        message: 'No valid inverters found to import',
        imported: 0,
        errors
      };
    }

    try {
      const ids = this.db.bulkInsertInverters(validInverters);
      return {
        success: true,
        message: `Successfully imported ${ids.length} inverters`,
        imported: ids.length,
        errors
      };
    } catch (error) {
      return {
        success: false,
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        imported: 0,
        errors: [...errors, error instanceof Error ? error.message : 'Database error']
      };
    }
  }

  private mapRowToInverter(row: any): Omit<Inverter, 'id'> {
    return {
      manufacturer: this.getString(row, 'manufacturer'),
      model: this.getString(row, 'model'),
      type: this.getString(row, 'type') as 'string' | 'central' | 'micro' | 'power-optimizer',
      powerKw: this.getNumber(row, 'powerKw'),
      efficiency: this.getNumber(row, 'efficiency'),
      maxDcVoltage: this.getNumber(row, 'maxDcVoltage'),
      startupVoltage: this.getNumber(row, 'startupVoltage'),
      mpptChannels: this.getNumber(row, 'mpptChannels'),
      maxDcCurrent: this.getNumber(row, 'maxDcCurrent'),
      acVoltage: this.getNumber(row, 'acVoltage'),
      price: this.getOptionalNumber(row, 'price'),
      warranty: this.getNumber(row, 'warranty'),
      dimensions: {
        length: this.getNumber(row, 'dimensions_length'),
        width: this.getNumber(row, 'dimensions_width'),
        height: this.getNumber(row, 'dimensions_height')
      },
      weight: this.getNumber(row, 'weight'),
      protectionClass: this.getString(row, 'protectionClass'),
      features: this.getStringArray(row, 'features')
    };
  }

  private validateInverter(inverter: Omit<Inverter, 'id'>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!inverter.manufacturer) errors.push('Manufacturer is required');
    if (!inverter.model) errors.push('Model is required');
    if (!['string', 'central', 'micro', 'power-optimizer'].includes(inverter.type)) errors.push('Type must be string, central, micro, or power-optimizer');
    if (inverter.powerKw <= 0) errors.push('PowerKw must be greater than 0');
    if (inverter.efficiency <= 0 || inverter.efficiency > 100) errors.push('Efficiency must be between 0 and 100');
    if (inverter.maxDcVoltage <= 0) errors.push('Max DC voltage must be greater than 0');
    if (inverter.startupVoltage <= 0) errors.push('Startup voltage must be greater than 0');
    if (inverter.mpptChannels <= 0) errors.push('MPPT channels must be greater than 0');
    if (inverter.maxDcCurrent <= 0) errors.push('Max DC current must be greater than 0');
    if (inverter.acVoltage <= 0) errors.push('AC voltage must be greater than 0');
    if (inverter.warranty <= 0) errors.push('Warranty must be greater than 0');
    if (inverter.dimensions.length <= 0) errors.push('Length must be greater than 0');
    if (inverter.dimensions.width <= 0) errors.push('Width must be greater than 0');
    if (inverter.dimensions.height <= 0) errors.push('Height must be greater than 0');
    if (inverter.weight <= 0) errors.push('Weight must be greater than 0');
    if (!inverter.protectionClass) errors.push('Protection class is required');

    return { isValid: errors.length === 0, errors };
  }

  // ============================================================================
  // STORAGE IMPORT
  // ============================================================================

  private async importStorages(data: any[], options: ImportOptions): Promise<ImportResult> {
    const errors: string[] = [];
    const validStorages: Omit<Storage, 'id'>[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      try {
        const storage = this.mapRowToStorage(row);
        
        if (options.validateData) {
          const validation = this.validateStorage(storage);
          if (!validation.isValid) {
            errors.push(`Row ${rowNum}: ${validation.errors.join(', ')}`);
            continue;
          }
        }

        validStorages.push(storage);
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Invalid data format'}`);
      }
    }

    if (validStorages.length === 0) {
      return {
        success: false,
        message: 'No valid storages found to import',
        imported: 0,
        errors
      };
    }

    try {
      const ids = this.db.bulkInsertStorages(validStorages);
      return {
        success: true,
        message: `Successfully imported ${ids.length} storages`,
        imported: ids.length,
        errors
      };
    } catch (error) {
      return {
        success: false,
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        imported: 0,
        errors: [...errors, error instanceof Error ? error.message : 'Database error']
      };
    }
  }

  private mapRowToStorage(row: any): Omit<Storage, 'id'> {
    return {
      manufacturer: this.getString(row, 'manufacturer'),
      model: this.getString(row, 'model'),
      type: this.getString(row, 'type') as 'AC' | 'DC',
      capacity: this.getNumber(row, 'capacity'),
      usableCapacity: this.getNumber(row, 'usableCapacity'),
      powerKw: this.getNumber(row, 'powerKw'),
      efficiency: this.getNumber(row, 'efficiency'),
      cycleLife: this.getNumber(row, 'cycleLife'),
      voltage: this.getNumber(row, 'voltage'),
      technology: this.getString(row, 'technology') as 'LiFePO4' | 'Li-Ion' | 'Lead-Acid',
      price: this.getOptionalNumber(row, 'price'),
      warranty: {
        product: this.getNumber(row, 'warranty_product'),
        cycles: this.getNumber(row, 'warranty_cycles')
      },
      dimensions: {
        length: this.getNumber(row, 'dimensions_length'),
        width: this.getNumber(row, 'dimensions_width'),
        height: this.getNumber(row, 'dimensions_height')
      },
      weight: this.getNumber(row, 'weight'),
      temperatureRange: {
        min: this.getNumber(row, 'temperatureRange_min'),
        max: this.getNumber(row, 'temperatureRange_max')
      },
      features: this.getStringArray(row, 'features')
    };
  }

  private validateStorage(storage: Omit<Storage, 'id'>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!storage.manufacturer) errors.push('Manufacturer is required');
    if (!storage.model) errors.push('Model is required');
    if (!['AC', 'DC'].includes(storage.type)) errors.push('Type must be AC or DC');
    if (storage.capacity <= 0) errors.push('Capacity must be greater than 0');
    if (storage.usableCapacity <= 0) errors.push('Usable capacity must be greater than 0');
    if (storage.usableCapacity > storage.capacity) errors.push('Usable capacity cannot be greater than total capacity');
    if (storage.powerKw <= 0) errors.push('PowerKw must be greater than 0');
    if (storage.efficiency <= 0 || storage.efficiency > 100) errors.push('Efficiency must be between 0 and 100');
    if (storage.cycleLife <= 0) errors.push('Cycle life must be greater than 0');
    if (storage.voltage <= 0) errors.push('Voltage must be greater than 0');
    if (!['LiFePO4', 'Li-Ion', 'Lead-Acid'].includes(storage.technology)) errors.push('Technology must be LiFePO4, Li-Ion, or Lead-Acid');
    if (storage.warranty.product <= 0) errors.push('Product warranty must be greater than 0');
    if (storage.warranty.cycles <= 0) errors.push('Cycles warranty must be greater than 0');
    if (storage.dimensions.length <= 0) errors.push('Length must be greater than 0');
    if (storage.dimensions.width <= 0) errors.push('Width must be greater than 0');
    if (storage.dimensions.height <= 0) errors.push('Height must be greater than 0');
    if (storage.weight <= 0) errors.push('Weight must be greater than 0');
    if (storage.temperatureRange.min >= storage.temperatureRange.max) errors.push('Min temperature must be less than max temperature');

    return { isValid: errors.length === 0, errors };
  }

  // ============================================================================
  // ACCESSORY IMPORT
  // ============================================================================

  private async importAccessories(data: any[], options: ImportOptions): Promise<ImportResult> {
    const errors: string[] = [];
    const validAccessories: Omit<Accessory, 'id'>[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      try {
        const accessory = this.mapRowToAccessory(row);
        
        if (options.validateData) {
          const validation = this.validateAccessory(accessory);
          if (!validation.isValid) {
            errors.push(`Row ${rowNum}: ${validation.errors.join(', ')}`);
            continue;
          }
        }

        validAccessories.push(accessory);
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Invalid data format'}`);
      }
    }

    if (validAccessories.length === 0) {
      return {
        success: false,
        message: 'No valid accessories found to import',
        imported: 0,
        errors
      };
    }

    try {
      const ids = this.db.bulkInsertAccessories(validAccessories);
      return {
        success: true,
        message: `Successfully imported ${ids.length} accessories`,
        imported: ids.length,
        errors
      };
    } catch (error) {
      return {
        success: false,
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        imported: 0,
        errors: [...errors, error instanceof Error ? error.message : 'Database error']
      };
    }
  }

  private mapRowToAccessory(row: any): Omit<Accessory, 'id'> {
    return {
      name: this.getString(row, 'name'),
      category: this.getString(row, 'category') as 'wallbox' | 'monitoring' | 'energy_management' | 'optimizer' | 'safety' | 'installation',
      manufacturer: this.getString(row, 'manufacturer'),
      model: this.getString(row, 'model'),
      power: this.getNumber(row, 'power'),
      price: this.getNumber(row, 'price'),
      features: this.getStringArray(row, 'features'),
      description: this.getString(row, 'description'),
      specifications: this.getOptionalObject(row, 'specifications')
    };
  }

  private validateAccessory(accessory: Omit<Accessory, 'id'>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!accessory.name) errors.push('Name is required');
    if (!['wallbox', 'monitoring', 'energy_management', 'optimizer', 'safety', 'installation'].includes(accessory.category)) {
      errors.push('Category must be wallbox, monitoring, energy_management, optimizer, safety, or installation');
    }
    if (!accessory.manufacturer) errors.push('Manufacturer is required');
    if (!accessory.model) errors.push('Model is required');
    if (accessory.power < 0) errors.push('Power cannot be negative');
    if (accessory.price <= 0) errors.push('Price must be greater than 0');
    if (!accessory.description) errors.push('Description is required');

    return { isValid: errors.length === 0, errors };
  }

  // ============================================================================
  // COMPANY IMPORT
  // ============================================================================

  private async importCompanies(data: any[], options: ImportOptions): Promise<ImportResult> {
    const errors: string[] = [];
    const validCompanies: Omit<CompanyInfo, 'id'>[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      try {
        const company = this.mapRowToCompany(row);
        
        if (options.validateData) {
          const validation = this.validateCompany(company);
          if (!validation.isValid) {
            errors.push(`Row ${rowNum}: ${validation.errors.join(', ')}`);
            continue;
          }
        }

        validCompanies.push(company);
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Invalid data format'}`);
      }
    }

    if (validCompanies.length === 0) {
      return {
        success: false,
        message: 'No valid companies found to import',
        imported: 0,
        errors
      };
    }

    try {
      const ids: string[] = [];
      for (const company of validCompanies) {
        ids.push(this.db.insertCompany(company));
      }
      return {
        success: true,
        message: `Successfully imported ${ids.length} companies`,
        imported: ids.length,
        errors
      };
    } catch (error) {
      return {
        success: false,
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        imported: 0,
        errors: [...errors, error instanceof Error ? error.message : 'Database error']
      };
    }
  }

  private mapRowToCompany(row: any): Omit<CompanyInfo, 'id'> {
    return {
      name: this.getString(row, 'name'),
      street: this.getString(row, 'street'),
      city: this.getString(row, 'city'),
      zipCode: this.getString(row, 'zipCode'),
      phone: this.getString(row, 'phone'),
      email: this.getString(row, 'email'),
      website: this.getOptionalString(row, 'website'),
      logoBase64: this.getOptionalString(row, 'logoBase64'),
      umsatzsteuerNr: this.getOptionalString(row, 'umsatzsteuerNr'),
      handelsregister: this.getOptionalString(row, 'handelsregister'),
      geschaeftsfuehrer: this.getOptionalString(row, 'geschaeftsfuehrer'),
      bankName: this.getOptionalString(row, 'bankName'),
      iban: this.getOptionalString(row, 'iban'),
      bic: this.getOptionalString(row, 'bic')
    };
  }

  private validateCompany(company: Omit<CompanyInfo, 'id'>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!company.name) errors.push('Name is required');
    if (!company.street) errors.push('Street is required');
    if (!company.city) errors.push('City is required');
    if (!company.zipCode) errors.push('ZIP code is required');
    if (!company.phone) errors.push('Phone is required');
    if (!company.email) errors.push('Email is required');
    if (company.email && !this.isValidEmail(company.email)) errors.push('Invalid email format');

    return { isValid: errors.length === 0, errors };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getString(row: any, key: string): string {
    const value = row[key];
    if (value === undefined || value === null || value === '') {
      throw new Error(`Missing required field: ${key}`);
    }
    return String(value).trim();
  }

  private getOptionalString(row: any, key: string): string | undefined {
    const value = row[key];
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return String(value).trim();
  }

  private getNumber(row: any, key: string): number {
    const value = row[key];
    if (value === undefined || value === null || value === '') {
      throw new Error(`Missing required field: ${key}`);
    }
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`Invalid number format for field: ${key}`);
    }
    return num;
  }

  private getOptionalNumber(row: any, key: string): number | undefined {
    const value = row[key];
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`Invalid number format for field: ${key}`);
    }
    return num;
  }

  private getStringArray(row: any, key: string): string[] {
    const value = row[key];
    if (value === undefined || value === null || value === '') {
      return [];
    }
    return String(value).split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  private getOptionalObject(row: any, key: string): any | undefined {
    const value = row[key];
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    try {
      return JSON.parse(String(value));
    } catch {
      return undefined;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// ============================================================================
// IPC HANDLERS FOR ELECTRON
// ============================================================================

export function setupImportIPC() {
  const importer = new DataImporter();

  ipcMain.handle('import-products', async (event, filePath: string, category: string, options?: ImportOptions) => {
    return await importer.importFromFile(filePath, category, options);
  });

  ipcMain.handle('get-database-stats', async () => {
    const db = getDatabase();
    return db.getStats();
  });

  ipcMain.handle('clear-category', async (event, category: string) => {
    const db = getDatabase();
    try {
      const importer = new DataImporter();
      const tableName = (importer as any).getCategoryTable(category);
      db.clearTable(tableName);
      return { success: true, message: `Cleared ${category} table` };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to clear ${category}: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  });

  // Product CRUD operations
  ipcMain.handle('get-all-modules', async () => {
    const db = getDatabase();
    return db.getAllModules();
  });

  ipcMain.handle('get-all-inverters', async () => {
    const db = getDatabase();
    return db.getAllInverters();
  });

  ipcMain.handle('get-all-storages', async () => {
    const db = getDatabase();
    return db.getAllStorages();
  });

  ipcMain.handle('get-all-accessories', async () => {
    const db = getDatabase();
    return db.getAllAccessories();
  });

  ipcMain.handle('get-all-companies', async () => {
    const db = getDatabase();
    return db.getAllCompanies();
  });
}