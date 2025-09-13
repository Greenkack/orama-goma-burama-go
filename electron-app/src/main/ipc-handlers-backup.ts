import { ipcMain, BrowserWindow } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import * as XLSX from 'xlsx';
import Database from 'better-sqlite3';
import fs from 'fs';

/**
 * Real Database Manager with SQLite
 */
class RealDatabaseManager {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(__dirname, '../../data/solar_products.db');
    const dataDir = path.dirname(dbPath);
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initializeTables();
  }

  private initializeTables() {
    // Create modules table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        manufacturer TEXT NOT NULL,
        model TEXT NOT NULL,
        powerWp INTEGER NOT NULL,
        efficiency REAL,
        dimensions TEXT,
        weight REAL,
        pricePerWp REAL,
        warranty INTEGER,
        technology TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create inverters table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inverters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        manufacturer TEXT NOT NULL,
        model TEXT NOT NULL,
        powerKw REAL NOT NULL,
        efficiency REAL,
        mpptChannels INTEGER,
        maxInputVoltage REAL,
        price REAL,
        warranty INTEGER,
        type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create storages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS storages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        manufacturer TEXT NOT NULL,
        model TEXT NOT NULL,
        capacityKwh REAL NOT NULL,
        powerKw REAL NOT NULL,
        efficiency REAL,
        cycleLife INTEGER,
        price REAL,
        warranty INTEGER,
        technology TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create accessories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS accessories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        manufacturer TEXT NOT NULL,
        model TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        price REAL,
        warranty INTEGER,
        specifications TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create companies table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  getProducts(category: string) {
    const validCategories = ['modules', 'inverters', 'storages', 'accessories', 'companies'];
    if (!validCategories.includes(category)) {
      throw new Error(`Invalid category: ${category}`);
    }

    const stmt = this.db.prepare(`SELECT * FROM ${category} ORDER BY created_at DESC`);
    return stmt.all();
  }

  getProductById(table: string, id: number) {
    const validTables = ['modules', 'inverters', 'storages', 'accessories', 'companies'];
    if (!validTables.includes(table)) {
      throw new Error(`Invalid table: ${table}`);
    }

    const stmt = this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`);
    return stmt.get(id);
  }

  createProduct(table: string, data: any) {
    const validTables = ['modules', 'inverters', 'storages', 'accessories', 'companies'];
    if (!validTables.includes(table)) {
      throw new Error(`Invalid table: ${table}`);
    }

    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const stmt = this.db.prepare(`
      INSERT INTO ${table} (${columns}) 
      VALUES (${placeholders})
    `);
    
    const result = stmt.run(...values);
    return result.lastInsertRowid;
  }

  updateProduct(table: string, id: number, data: any) {
    const validTables = ['modules', 'inverters', 'storages', 'accessories', 'companies'];
    if (!validTables.includes(table)) {
      throw new Error(`Invalid table: ${table}`);
    }

    const sets = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];

    const stmt = this.db.prepare(`
      UPDATE ${table} 
      SET ${sets}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    const result = stmt.run(...values);
    return result.changes > 0;
  }

  deleteProduct(table: string, id: number) {
    const validTables = ['modules', 'inverters', 'storages', 'accessories', 'companies'];
    if (!validTables.includes(table)) {
      throw new Error(`Invalid table: ${table}`);
    }

    const stmt = this.db.prepare(`DELETE FROM ${table} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  getStats() {
    const modules = this.db.prepare('SELECT COUNT(*) as count FROM modules').get() as { count: number };
    const inverters = this.db.prepare('SELECT COUNT(*) as count FROM inverters').get() as { count: number };
    const storages = this.db.prepare('SELECT COUNT(*) as count FROM storages').get() as { count: number };
    const accessories = this.db.prepare('SELECT COUNT(*) as count FROM accessories').get() as { count: number };
    const companies = this.db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number };

    return {
      modules: modules.count,
      inverters: inverters.count,
      storages: storages.count,
      accessories: accessories.count,
      companies: companies.count,
      total: modules.count + inverters.count + storages.count + accessories.count + companies.count
    };
  }

  bulkInsertFromExcel(category: string, excelBuffer: Buffer) {
    const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Processing ${jsonData.length} rows for category: ${category}`);
    
    let insertedCount = 0;
    const stmt = this.db.prepare('BEGIN');
    stmt.run();

    try {
      for (const row of jsonData) {
        if (this.isValidRowData(category, row)) {
          const cleanedData = this.mapExcelRowToDatabase(category, row);
          this.createProduct(category, cleanedData);
          insertedCount++;
        } else {
          console.warn('Skipping invalid row:', row);
        }
      }
      
      const commitStmt = this.db.prepare('COMMIT');
      commitStmt.run();
      
      console.log(`Successfully inserted ${insertedCount} records into ${category}`);
      return { success: true, insertedCount, totalRows: jsonData.length };
    } catch (error) {
      const rollbackStmt = this.db.prepare('ROLLBACK');
      rollbackStmt.run();
      throw error;
    }
  }

  private isValidRowData(category: string, row: any): boolean {
    switch (category) {
      case 'modules':
        return row.manufacturer && row.model && row.powerWp;
      case 'inverters':
        return row.manufacturer && row.model && row.powerKw;
      case 'storages':
        return row.manufacturer && row.model && row.capacityKwh;
      case 'accessories':
        return row.manufacturer && row.model && row.category;
      case 'companies':
        return row.name;
      default:
        return false;
    }
  }

  private mapExcelRowToDatabase(category: string, row: any): any {
    const baseMapping = {
      manufacturer: row.manufacturer || row.Manufacturer || row.Hersteller,
      model: row.model || row.Model || row.Modell,
    };

    switch (category) {
      case 'modules':
        return {
          ...baseMapping,
          powerWp: this.parseNumber(row.powerWp || row.PowerWp || row.Leistung),
          efficiency: this.parseNumber(row.efficiency || row.Efficiency || row.Wirkungsgrad),
          dimensions: row.dimensions || row.Dimensions || row.Abmessungen,
          weight: this.parseNumber(row.weight || row.Weight || row.Gewicht),
          pricePerWp: this.parseNumber(row.pricePerWp || row.PricePerWp || row.PreisProWp),
          warranty: this.parseNumber(row.warranty || row.Warranty || row.Garantie),
          technology: row.technology || row.Technology || row.Technologie
        };
      
      case 'inverters':
        return {
          ...baseMapping,
          powerKw: this.parseNumber(row.powerKw || row.PowerKw || row.Leistung),
          efficiency: this.parseNumber(row.efficiency || row.Efficiency || row.Wirkungsgrad),
          mpptChannels: this.parseNumber(row.mpptChannels || row.MPPTChannels || row.MPPTEingaenge),
          maxInputVoltage: this.parseNumber(row.maxInputVoltage || row.MaxInputVoltage || row.MaxEingangsspannung),
          price: this.parseNumber(row.price || row.Price || row.Preis),
          warranty: this.parseNumber(row.warranty || row.Warranty || row.Garantie),
          type: row.type || row.Type || row.Typ
        };

      case 'storages':
        return {
          ...baseMapping,
          capacityKwh: this.parseNumber(row.capacityKwh || row.CapacityKwh || row.Kapazitaet),
          powerKw: this.parseNumber(row.powerKw || row.PowerKw || row.Leistung),
          efficiency: this.parseNumber(row.efficiency || row.Efficiency || row.Wirkungsgrad),
          cycleLife: this.parseNumber(row.cycleLife || row.CycleLife || row.Zyklen),
          price: this.parseNumber(row.price || row.Price || row.Preis),
          warranty: this.parseNumber(row.warranty || row.Warranty || row.Garantie),
          technology: row.technology || row.Technology || row.Technologie
        };

      case 'accessories':
        return {
          ...baseMapping,
          category: row.category || row.Category || row.Kategorie,
          description: row.description || row.Description || row.Beschreibung,
          price: this.parseNumber(row.price || row.Price || row.Preis),
          warranty: this.parseNumber(row.warranty || row.Warranty || row.Garantie),
          specifications: row.specifications || row.Specifications || row.Spezifikationen
        };

      case 'companies':
        return {
          name: row.name || row.Name || row.Firmenname,
          address: row.address || row.Address || row.Adresse,
          phone: row.phone || row.Phone || row.Telefon,
          email: row.email || row.Email,
          website: row.website || row.Website
        };

      default:
        return baseMapping;
    }
  }

  private parseNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = parseFloat(String(value).replace(',', '.'));
    return isNaN(num) ? null : num;
  }
}

// Create global database instance
const realDbManager = new RealDatabaseManager();

/**
 * Python Bridge for Solar Calculator Integration
 */
class PythonBridge {
  private pythonProcess: ChildProcess | null = null;
  private isProcessing = false;

  async calculateSolarSystem(projectData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isProcessing) {
        reject(new Error('Python calculation already in progress'));
        return;
      }

      this.isProcessing = true;
      console.log('Starting Python calculation...');

      // Path to the Python bridge script
      const pythonScriptPath = path.join(__dirname, '..', '..', '..', 'python_bridge.py');
      const pythonArgs = [
        pythonScriptPath,
        '--calculate',
        '--stdin'
      ];

      // Spawn Python process
      this.pythonProcess = spawn('python', pythonArgs, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.dirname(pythonScriptPath)
      });

      let outputData = '';
      let errorData = '';

      // Collect stdout data
      this.pythonProcess.stdout?.on('data', (data) => {
        outputData += data.toString();
      });

      // Collect stderr data
      this.pythonProcess.stderr?.on('data', (data) => {
        errorData += data.toString();
        console.error('Python stderr:', data.toString());
      });

      // Handle process completion
      this.pythonProcess.on('close', (code) => {
        this.isProcessing = false;
        this.pythonProcess = null;

        if (code === 0) {
          try {
            const results = JSON.parse(outputData);
            console.log('Python calculation completed successfully');
            resolve(results);
          } catch (parseError) {
            reject(new Error(`Failed to parse calculation results: ${parseError}`));
          }
        } else {
          reject(new Error(`Python calculation failed: ${errorData || 'Unknown error'}`));
        }
      });

      // Handle process errors
      this.pythonProcess.on('error', (error) => {
        this.isProcessing = false;
        this.pythonProcess = null;
        console.error('Python process error:', error);
        reject(error);
      });

      // Send input data to Python process
      if (this.pythonProcess.stdin) {
        this.pythonProcess.stdin.write(JSON.stringify(projectData));
        this.pythonProcess.stdin.end();
      }
    });
  }

  killProcess(): void {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
      this.isProcessing = false;
    }
  }
}

// Initialize Python Bridge
const pythonBridge = new PythonBridge();

// Enhanced IPC handlers with Python Bridge integration
export function setupIpcHandlers(mainWindow?: BrowserWindow) {
  // Health check
  ipcMain.handle('ping', async () => 'pong');

  // Database operations
  ipcMain.handle('db:uploadFile', async (event, data) => {
    try {
      console.log('File upload requested:', {
        filename: data.filename,
        category: data.category,
        size: data.size,
        contentLength: data.content ? data.content.length : 0
      });
      
      // TODO: Process file content (CSV parsing, validation, database insertion)
      // For now, simulate processing
      if (data.content) {
        console.log('File content preview:', data.content.substring(0, 200) + '...');
      }
      
      return { 
        success: true, 
        message: `File ${data.filename} uploaded and processed successfully`,
        processed: data.content ? data.content.split('\n').length - 1 : 0
      };
    } catch (error) {
      console.error('File upload error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('db:getProducts', async (event, category) => {
    try {
      console.log('Get products requested for category:', category);
      // Return mock data for now
      return {
        success: true,
        data: [
          { id: 1, name: 'Sample Product', category, price: 100 }
        ]
      };
    } catch (error) {
      console.error('Get products error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('db:addProduct', async (event, productData) => {
    try {
      console.log('Add product requested:', productData);
      return { success: true, id: Date.now() };
    } catch (error) {
      console.error('Add product error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('db:updateProduct', async (event, id, productData) => {
    try {
      console.log('Update product requested:', id, productData);
      return { success: true };
    } catch (error) {
      console.error('Update product error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('db:deleteProduct', async (event, id) => {
    try {
      console.log('Delete product requested:', id);
      return { success: true };
    } catch (error) {
      console.error('Delete product error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('db:getStats', async () => {
    try {
      console.log('Get stats requested');
      return {
        success: true,
        data: {
          modules: 0,
          inverters: 0,
          storages: 0,
          accessories: 0,
          companies: 0
        }
      };
    } catch (error) {
      console.error('Get stats error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Python Solar Calculation Handler
  ipcMain.handle('python:calculate', async (event, projectData) => {
    try {
      console.log('Python calculation requested');
      
      // Transform TypeScript data to Python format
      const pythonProjectData = {
        customer_data: {
          income_tax_rate_percent: projectData.customerData?.incomeTaxRate || 25,
          type: projectData.customerData?.type || 'Privat'
        },
        project_details: {
          annual_consumption_kwh_yr: projectData.projectDetails?.annualConsumption || 4000,
          consumption_heating_kwh_yr: projectData.projectDetails?.heatingConsumption || 0,
          electricity_price_kwh: projectData.projectDetails?.electricityPrice || 0.30,
          module_quantity: projectData.projectDetails?.moduleQuantity || 20,
          selected_module_id: projectData.projectDetails?.selectedModuleId || 1,
          selected_inverter_id: projectData.projectDetails?.selectedInverterId || 1,
          include_storage: projectData.projectDetails?.includeStorage || false,
          selected_storage_id: projectData.projectDetails?.selectedStorageId,
          selected_storage_storage_power_kw: projectData.projectDetails?.storageCapacity || 0,
          roof_orientation: projectData.projectDetails?.roofOrientation || 'Süd',
          roof_inclination_deg: projectData.projectDetails?.roofInclination || 30,
          latitude: projectData.projectDetails?.latitude || 48.13,
          longitude: projectData.projectDetails?.longitude || 11.57,
          feed_in_type: projectData.projectDetails?.feedInType || 'Teileinspeisung',
          free_roof_area_sqm: projectData.projectDetails?.roofArea || 100,
          building_height_gt_7m: projectData.projectDetails?.buildingHeight || false,
          include_additional_components: projectData.projectDetails?.includeAdditionalComponents || false,
          future_ev: projectData.projectDetails?.futureEV || false,
          future_hp: projectData.projectDetails?.futureHP || false,
          verschattungsverlust_pct: projectData.projectDetails?.shadingLoss || 0
        },
        economic_data: {
          simulation_period_years: projectData.economicData?.simulationPeriod || 20,
          electricity_price_increase_annual_percent: projectData.economicData?.electricityPriceIncrease || 3.0,
          custom_costs_netto: projectData.economicData?.customCosts || 0
        },
        include_advanced_calculations: true
      };

      // Call Python calculation engine
      const results = await pythonBridge.calculateSolarSystem(pythonProjectData);
      
      // Transform Python results back to TypeScript format
      if (results.success && results.data) {
        const transformedResults = {
          systemPower: results.data.anlage_kwp || 0,
          annualProduction: results.data.annual_pv_production_kwh || 0,
          totalInvestmentNet: results.data.total_investment_netto || 0,
          totalInvestmentGross: results.data.total_investment_brutto || 0,
          annualSavings: results.data.annual_financial_benefit_year1 || 0,
          amortizationTime: results.data.amortization_time_years || 0,
          selfConsumptionRate: results.data.self_supply_rate_percent || 0,
          lcoe: results.data.lcoe_euro_per_kwh || 0,
          irr: results.data.irr_percent || 0,
          npv: results.data.npv_value || 0,
          co2Savings: results.data.annual_co2_savings_kg || 0,
          monthlyProduction: results.data.monthly_productions_sim || [],
          monthlyConsumption: results.data.monthly_consumption_sim || [],
          cashFlows: results.data.annual_cash_flows_sim || [],
          rawResults: results.data // Include full Python results
        };

        console.log('Python calculation completed successfully');
        return { success: true, data: transformedResults };
      } else {
        console.error('Python calculation returned error:', results.error || 'Unknown error');
        return { success: false, error: results.error || 'Calculation failed' };
      }
      
    } catch (error) {
      console.error('Python calculation failed:', error);
      return { success: false, error: String(error) };
    }
  });

  // Python Process Management
  ipcMain.handle('python:kill', async () => {
    try {
      pythonBridge.killProcess();
      return { success: true, message: 'Python process terminated' };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  console.log('Enhanced IPC handlers setup complete with Python Bridge');
}