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

      const pythonScriptPath = path.join(__dirname, '../../../python_bridge.py');
      
      this.pythonProcess = spawn('python', [pythonScriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.dirname(pythonScriptPath)
      });

      let stdoutData = '';
      let stderrData = '';

      this.pythonProcess.stdout!.on('data', (data) => {
        stdoutData += data.toString();
      });

      this.pythonProcess.stderr!.on('data', (data) => {
        stderrData += data.toString();
        console.error('Python stderr:', data.toString());
      });

      this.pythonProcess.on('close', (code) => {
        this.isProcessing = false;
        this.pythonProcess = null;

        if (code === 0) {
          try {
            const result = JSON.parse(stdoutData);
            resolve(result);
          } catch (parseError) {
            console.error('Failed to parse Python output:', parseError);
            resolve({ success: false, error: 'Failed to parse calculation results' });
          }
        } else {
          console.error(`Python process exited with code ${code}`);
          console.error('Stderr:', stderrData);
          resolve({ success: false, error: `Python calculation failed with code ${code}` });
        }
      });

      this.pythonProcess.on('error', (error) => {
        this.isProcessing = false;
        this.pythonProcess = null;
        console.error('Python process error:', error);
        resolve({ success: false, error: `Python process error: ${error.message}` });
      });

      // Send project data to Python process
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

// Create global instances
const realDbManager = new RealDatabaseManager();
const pythonBridge = new PythonBridge();

// Enhanced IPC handlers with real database and Python Bridge integration
export function setupIpcHandlers(mainWindow?: BrowserWindow) {
  console.log('Setting up enhanced IPC handlers with real database...');

  // Health check
  ipcMain.handle('ping', async () => 'pong');

  // File Upload with Real Excel Processing
  ipcMain.handle('file:upload', async (event, data) => {
    try {
      console.log('File upload requested:', {
        filename: data.filename,
        category: data.category,
        size: data.size,
        contentLength: data.content ? data.content.length : 0
      });
      
      if (!data.content || !data.category) {
        throw new Error('Missing file content or category');
      }

      // Convert base64 content to buffer
      let buffer: Buffer;
      if (typeof data.content === 'string') {
        // Remove data URL prefix if present
        const base64Data = data.content.includes(',') 
          ? data.content.split(',')[1] 
          : data.content;
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        buffer = Buffer.from(data.content);
      }

      // Process Excel file and insert into database
      const result = realDbManager.bulkInsertFromExcel(data.category, buffer);
      
      return { 
        success: true, 
        message: `File ${data.filename} processed successfully. ${result.insertedCount} of ${result.totalRows} records inserted.`,
        inserted: result.insertedCount,
        totalRows: result.totalRows
      };
    } catch (error) {
      console.error('File upload error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Legacy Database Operations (for backward compatibility)
  ipcMain.handle('db:uploadFile', async (event, data) => {
    return ipcMain.emit('file:upload', event, data);
  });

  ipcMain.handle('db:getProducts', async (event, category) => {
    try {
      const products = realDbManager.getProducts(category);
      return { success: true, data: products };
    } catch (error) {
      console.error('Get products error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('db:addProduct', async (event, productData) => {
    try {
      if (!productData.table) {
        throw new Error('Table name is required');
      }
      const { table, ...data } = productData;
      const id = realDbManager.createProduct(table, data);
      return { success: true, id };
    } catch (error) {
      console.error('Add product error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('db:updateProduct', async (event, id, productData) => {
    try {
      if (!productData.table) {
        throw new Error('Table name is required');
      }
      const { table, ...data } = productData;
      const success = realDbManager.updateProduct(table, id, data);
      return { success };
    } catch (error) {
      console.error('Update product error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('db:deleteProduct', async (event, id, table) => {
    try {
      if (!table) {
        throw new Error('Table name is required');
      }
      const success = realDbManager.deleteProduct(table, id);
      return { success };
    } catch (error) {
      console.error('Delete product error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('db:getStats', async (event) => {
    try {
      const stats = realDbManager.getStats();
      return { success: true, data: stats };
    } catch (error) {
      console.error('Get stats error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // New Enhanced Database API
  ipcMain.handle('database:getStats', async (event) => {
    try {
      const stats = realDbManager.getStats();
      return { success: true, data: stats };
    } catch (error) {
      console.error('Database stats error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('database:getProducts', async (event, category) => {
    try {
      const products = realDbManager.getProducts(category);
      return { success: true, data: products };
    } catch (error) {
      console.error('Database get products error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('database:getProductById', async (event, table, id) => {
    try {
      const product = realDbManager.getProductById(table, id);
      return { success: true, data: product };
    } catch (error) {
      console.error('Database get product by ID error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('database:createProduct', async (event, table, data) => {
    try {
      const id = realDbManager.createProduct(table, data);
      return { success: true, id };
    } catch (error) {
      console.error('Database create product error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('database:updateProduct', async (event, table, id, data) => {
    try {
      const success = realDbManager.updateProduct(table, id, data);
      return { success };
    } catch (error) {
      console.error('Database update product error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('database:deleteProduct', async (event, table, id) => {
    try {
      const success = realDbManager.deleteProduct(table, id);
      return { success };
    } catch (error) {
      console.error('Database delete product error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Python Solar Calculation Handler
  ipcMain.handle('python:calculate', async (event, projectData) => {
    try {
      console.log('Python calculation requested');
      
      // Call Python calculation engine directly
      const results = await pythonBridge.calculateSolarSystem(projectData);
      
      console.log('Python calculation completed');
      return results;
      
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

  console.log('Enhanced IPC handlers setup complete with real database and Python Bridge');
}