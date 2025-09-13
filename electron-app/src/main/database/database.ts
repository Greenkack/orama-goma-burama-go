import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import type { Module, Inverter, Storage, Accessory, CompanyInfo } from '../../shared/types';

// Database path in user data directory
const DB_PATH = path.join(app.getPath('userData'), 'solar_calculator.db');

export class SolarDatabase {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.initializeTables();
  }

  private initializeTables() {
    // Create modules table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY,
        manufacturer TEXT NOT NULL,
        model TEXT NOT NULL,
        powerWp REAL NOT NULL,
        efficiency REAL NOT NULL,
        technology TEXT NOT NULL,
        dimensions_length REAL NOT NULL,
        dimensions_width REAL NOT NULL,
        dimensions_thickness REAL NOT NULL,
        weight REAL NOT NULL,
        pricePerWp REAL,
        warranty_product INTEGER NOT NULL,
        warranty_performance INTEGER NOT NULL,
        temperatureCoefficient REAL NOT NULL,
        maxSystemVoltage REAL NOT NULL,
        shortCircuitCurrent REAL NOT NULL,
        openCircuitVoltage REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create inverters table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inverters (
        id TEXT PRIMARY KEY,
        manufacturer TEXT NOT NULL,
        model TEXT NOT NULL,
        type TEXT NOT NULL,
        powerKw REAL NOT NULL,
        efficiency REAL NOT NULL,
        maxDcVoltage REAL NOT NULL,
        startupVoltage REAL NOT NULL,
        mpptChannels INTEGER NOT NULL,
        maxDcCurrent REAL NOT NULL,
        acVoltage REAL NOT NULL,
        price REAL,
        warranty INTEGER NOT NULL,
        dimensions_length REAL NOT NULL,
        dimensions_width REAL NOT NULL,
        dimensions_height REAL NOT NULL,
        weight REAL NOT NULL,
        protectionClass TEXT NOT NULL,
        features TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create storages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS storages (
        id TEXT PRIMARY KEY,
        manufacturer TEXT NOT NULL,
        model TEXT NOT NULL,
        type TEXT NOT NULL,
        capacity REAL NOT NULL,
        usableCapacity REAL NOT NULL,
        powerKw REAL NOT NULL,
        efficiency REAL NOT NULL,
        cycleLife INTEGER NOT NULL,
        voltage REAL NOT NULL,
        technology TEXT NOT NULL,
        price REAL,
        warranty_product INTEGER NOT NULL,
        warranty_cycles INTEGER NOT NULL,
        dimensions_length REAL NOT NULL,
        dimensions_width REAL NOT NULL,
        dimensions_height REAL NOT NULL,
        weight REAL NOT NULL,
        temperatureRange_min REAL NOT NULL,
        temperatureRange_max REAL NOT NULL,
        features TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create accessories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS accessories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        manufacturer TEXT NOT NULL,
        model TEXT NOT NULL,
        power REAL NOT NULL,
        price REAL NOT NULL,
        features TEXT NOT NULL,
        description TEXT NOT NULL,
        specifications TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create companies table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        street TEXT NOT NULL,
        city TEXT NOT NULL,
        zipCode TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        website TEXT,
        logoBase64 TEXT,
        umsatzsteuerNr TEXT,
        handelsregister TEXT,
        geschaeftsfuehrer TEXT,
        bankName TEXT,
        iban TEXT,
        bic TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create customer_projects table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customer_projects (
        id TEXT PRIMARY KEY,
        customerName TEXT NOT NULL,
        street TEXT NOT NULL,
        city TEXT NOT NULL,
        zipCode TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        anlageKwp REAL NOT NULL,
        moduleQuantity INTEGER NOT NULL,
        selectedModule TEXT,
        selectedInverter TEXT,
        roofOrientation REAL NOT NULL,
        roofTilt REAL NOT NULL,
        roofArea REAL,
        installationType TEXT NOT NULL,
        storageCapacityKwh REAL,
        selectedStorage TEXT,
        latitude REAL,
        longitude REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(selectedModule) REFERENCES modules(id),
        FOREIGN KEY(selectedInverter) REFERENCES inverters(id),
        FOREIGN KEY(selectedStorage) REFERENCES storages(id)
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_modules_manufacturer ON modules(manufacturer);
      CREATE INDEX IF NOT EXISTS idx_modules_powerWp ON modules(powerWp);
      CREATE INDEX IF NOT EXISTS idx_inverters_manufacturer ON inverters(manufacturer);
      CREATE INDEX IF NOT EXISTS idx_inverters_powerKw ON inverters(powerKw);
      CREATE INDEX IF NOT EXISTS idx_storages_manufacturer ON storages(manufacturer);
      CREATE INDEX IF NOT EXISTS idx_storages_capacity ON storages(usableCapacity);
      CREATE INDEX IF NOT EXISTS idx_accessories_category ON accessories(category);
      CREATE INDEX IF NOT EXISTS idx_accessories_manufacturer ON accessories(manufacturer);
    `);
  }

  // ============================================================================
  // MODULE OPERATIONS
  // ============================================================================

  insertModule(module: Omit<Module, 'id'>): string {
    const id = this.generateId('mod');
    const stmt = this.db.prepare(`
      INSERT INTO modules (
        id, manufacturer, model, powerWp, efficiency, technology,
        dimensions_length, dimensions_width, dimensions_thickness, weight,
        pricePerWp, warranty_product, warranty_performance, temperatureCoefficient,
        maxSystemVoltage, shortCircuitCurrent, openCircuitVoltage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, module.manufacturer, module.model, module.powerWp, module.efficiency, module.technology,
      module.dimensions.length, module.dimensions.width, module.dimensions.thickness, module.weight,
      module.pricePerWp || null, module.warranty.product, module.warranty.performance, module.temperatureCoefficient,
      module.maxSystemVoltage, module.shortCircuitCurrent, module.openCircuitVoltage
    );
    
    return id;
  }

  getAllModules(): Module[] {
    const stmt = this.db.prepare('SELECT * FROM modules ORDER BY manufacturer, model');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      manufacturer: row.manufacturer,
      model: row.model,
      powerWp: row.powerWp,
      efficiency: row.efficiency,
      technology: row.technology,
      dimensions: {
        length: row.dimensions_length,
        width: row.dimensions_width,
        thickness: row.dimensions_thickness
      },
      weight: row.weight,
      pricePerWp: row.pricePerWp,
      warranty: {
        product: row.warranty_product,
        performance: row.warranty_performance
      },
      temperatureCoefficient: row.temperatureCoefficient,
      maxSystemVoltage: row.maxSystemVoltage,
      shortCircuitCurrent: row.shortCircuitCurrent,
      openCircuitVoltage: row.openCircuitVoltage
    }));
  }

  getModuleById(id: string): Module | null {
    const stmt = this.db.prepare('SELECT * FROM modules WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      manufacturer: row.manufacturer,
      model: row.model,
      powerWp: row.powerWp,
      efficiency: row.efficiency,
      technology: row.technology,
      dimensions: {
        length: row.dimensions_length,
        width: row.dimensions_width,
        thickness: row.dimensions_thickness
      },
      weight: row.weight,
      pricePerWp: row.pricePerWp,
      warranty: {
        product: row.warranty_product,
        performance: row.warranty_performance
      },
      temperatureCoefficient: row.temperatureCoefficient,
      maxSystemVoltage: row.maxSystemVoltage,
      shortCircuitCurrent: row.shortCircuitCurrent,
      openCircuitVoltage: row.openCircuitVoltage
    };
  }

  updateModule(id: string, module: Partial<Omit<Module, 'id'>>): boolean {
    const fields = [];
    const values = [];

    if (module.manufacturer !== undefined) { fields.push('manufacturer = ?'); values.push(module.manufacturer); }
    if (module.model !== undefined) { fields.push('model = ?'); values.push(module.model); }
    if (module.powerWp !== undefined) { fields.push('powerWp = ?'); values.push(module.powerWp); }
    if (module.efficiency !== undefined) { fields.push('efficiency = ?'); values.push(module.efficiency); }
    if (module.technology !== undefined) { fields.push('technology = ?'); values.push(module.technology); }
    if (module.dimensions?.length !== undefined) { fields.push('dimensions_length = ?'); values.push(module.dimensions.length); }
    if (module.dimensions?.width !== undefined) { fields.push('dimensions_width = ?'); values.push(module.dimensions.width); }
    if (module.dimensions?.thickness !== undefined) { fields.push('dimensions_thickness = ?'); values.push(module.dimensions.thickness); }
    if (module.weight !== undefined) { fields.push('weight = ?'); values.push(module.weight); }
    if (module.pricePerWp !== undefined) { fields.push('pricePerWp = ?'); values.push(module.pricePerWp); }
    if (module.warranty?.product !== undefined) { fields.push('warranty_product = ?'); values.push(module.warranty.product); }
    if (module.warranty?.performance !== undefined) { fields.push('warranty_performance = ?'); values.push(module.warranty.performance); }
    if (module.temperatureCoefficient !== undefined) { fields.push('temperatureCoefficient = ?'); values.push(module.temperatureCoefficient); }
    if (module.maxSystemVoltage !== undefined) { fields.push('maxSystemVoltage = ?'); values.push(module.maxSystemVoltage); }
    if (module.shortCircuitCurrent !== undefined) { fields.push('shortCircuitCurrent = ?'); values.push(module.shortCircuitCurrent); }
    if (module.openCircuitVoltage !== undefined) { fields.push('openCircuitVoltage = ?'); values.push(module.openCircuitVoltage); }

    if (fields.length === 0) return false;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`UPDATE modules SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    
    return result.changes > 0;
  }

  deleteModule(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM modules WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // ============================================================================
  // INVERTER OPERATIONS
  // ============================================================================

  insertInverter(inverter: Omit<Inverter, 'id'>): string {
    const id = this.generateId('inv');
    const stmt = this.db.prepare(`
      INSERT INTO inverters (
        id, manufacturer, model, type, powerKw, efficiency,
        maxDcVoltage, startupVoltage, mpptChannels, maxDcCurrent, acVoltage,
        price, warranty, dimensions_length, dimensions_width, dimensions_height,
        weight, protectionClass, features
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, inverter.manufacturer, inverter.model, inverter.type, inverter.powerKw, inverter.efficiency,
      inverter.maxDcVoltage, inverter.startupVoltage, inverter.mpptChannels, inverter.maxDcCurrent, inverter.acVoltage,
      inverter.price || null, inverter.warranty, inverter.dimensions.length, inverter.dimensions.width, inverter.dimensions.height,
      inverter.weight, inverter.protectionClass, inverter.features.join(',')
    );
    
    return id;
  }

  getAllInverters(): Inverter[] {
    const stmt = this.db.prepare('SELECT * FROM inverters ORDER BY manufacturer, model');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      manufacturer: row.manufacturer,
      model: row.model,
      type: row.type,
      powerKw: row.powerKw,
      efficiency: row.efficiency,
      maxDcVoltage: row.maxDcVoltage,
      startupVoltage: row.startupVoltage,
      mpptChannels: row.mpptChannels,
      maxDcCurrent: row.maxDcCurrent,
      acVoltage: row.acVoltage,
      price: row.price,
      warranty: row.warranty,
      dimensions: {
        length: row.dimensions_length,
        width: row.dimensions_width,
        height: row.dimensions_height
      },
      weight: row.weight,
      protectionClass: row.protectionClass,
      features: row.features ? row.features.split(',') : []
    }));
  }

  getInverterById(id: string): Inverter | null {
    const stmt = this.db.prepare('SELECT * FROM inverters WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      manufacturer: row.manufacturer,
      model: row.model,
      type: row.type,
      powerKw: row.powerKw,
      efficiency: row.efficiency,
      maxDcVoltage: row.maxDcVoltage,
      startupVoltage: row.startupVoltage,
      mpptChannels: row.mpptChannels,
      maxDcCurrent: row.maxDcCurrent,
      acVoltage: row.acVoltage,
      price: row.price,
      warranty: row.warranty,
      dimensions: {
        length: row.dimensions_length,
        width: row.dimensions_width,
        height: row.dimensions_height
      },
      weight: row.weight,
      protectionClass: row.protectionClass,
      features: row.features ? row.features.split(',') : []
    };
  }

  updateInverter(id: string, inverter: Partial<Omit<Inverter, 'id'>>): boolean {
    const fields = [];
    const values = [];

    if (inverter.manufacturer !== undefined) { fields.push('manufacturer = ?'); values.push(inverter.manufacturer); }
    if (inverter.model !== undefined) { fields.push('model = ?'); values.push(inverter.model); }
    if (inverter.type !== undefined) { fields.push('type = ?'); values.push(inverter.type); }
    if (inverter.powerKw !== undefined) { fields.push('powerKw = ?'); values.push(inverter.powerKw); }
    if (inverter.efficiency !== undefined) { fields.push('efficiency = ?'); values.push(inverter.efficiency); }
    if (inverter.maxDcVoltage !== undefined) { fields.push('maxDcVoltage = ?'); values.push(inverter.maxDcVoltage); }
    if (inverter.startupVoltage !== undefined) { fields.push('startupVoltage = ?'); values.push(inverter.startupVoltage); }
    if (inverter.mpptChannels !== undefined) { fields.push('mpptChannels = ?'); values.push(inverter.mpptChannels); }
    if (inverter.maxDcCurrent !== undefined) { fields.push('maxDcCurrent = ?'); values.push(inverter.maxDcCurrent); }
    if (inverter.acVoltage !== undefined) { fields.push('acVoltage = ?'); values.push(inverter.acVoltage); }
    if (inverter.price !== undefined) { fields.push('price = ?'); values.push(inverter.price); }
    if (inverter.warranty !== undefined) { fields.push('warranty = ?'); values.push(inverter.warranty); }
    if (inverter.dimensions?.length !== undefined) { fields.push('dimensions_length = ?'); values.push(inverter.dimensions.length); }
    if (inverter.dimensions?.width !== undefined) { fields.push('dimensions_width = ?'); values.push(inverter.dimensions.width); }
    if (inverter.dimensions?.height !== undefined) { fields.push('dimensions_height = ?'); values.push(inverter.dimensions.height); }
    if (inverter.weight !== undefined) { fields.push('weight = ?'); values.push(inverter.weight); }
    if (inverter.protectionClass !== undefined) { fields.push('protectionClass = ?'); values.push(inverter.protectionClass); }
    if (inverter.features !== undefined) { fields.push('features = ?'); values.push(inverter.features.join(',')); }

    if (fields.length === 0) return false;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`UPDATE inverters SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    
    return result.changes > 0;
  }

  deleteInverter(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM inverters WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // ============================================================================
  // STORAGE OPERATIONS
  // ============================================================================

  insertStorage(storage: Omit<Storage, 'id'>): string {
    const id = this.generateId('stor');
    const stmt = this.db.prepare(`
      INSERT INTO storages (
        id, manufacturer, model, type, capacity, usableCapacity, powerKw,
        efficiency, cycleLife, voltage, technology, price,
        warranty_product, warranty_cycles, dimensions_length, dimensions_width, dimensions_height,
        weight, temperatureRange_min, temperatureRange_max, features
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, storage.manufacturer, storage.model, storage.type, storage.capacity, storage.usableCapacity, storage.powerKw,
      storage.efficiency, storage.cycleLife, storage.voltage, storage.technology, storage.price || null,
      storage.warranty.product, storage.warranty.cycles, storage.dimensions.length, storage.dimensions.width, storage.dimensions.height,
      storage.weight, storage.temperatureRange.min, storage.temperatureRange.max, storage.features.join(',')
    );
    
    return id;
  }

  getAllStorages(): Storage[] {
    const stmt = this.db.prepare('SELECT * FROM storages ORDER BY manufacturer, model');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      manufacturer: row.manufacturer,
      model: row.model,
      type: row.type,
      capacity: row.capacity,
      usableCapacity: row.usableCapacity,
      powerKw: row.powerKw,
      efficiency: row.efficiency,
      cycleLife: row.cycleLife,
      voltage: row.voltage,
      technology: row.technology,
      price: row.price,
      warranty: {
        product: row.warranty_product,
        cycles: row.warranty_cycles
      },
      dimensions: {
        length: row.dimensions_length,
        width: row.dimensions_width,
        height: row.dimensions_height
      },
      weight: row.weight,
      temperatureRange: {
        min: row.temperatureRange_min,
        max: row.temperatureRange_max
      },
      features: row.features ? row.features.split(',') : []
    }));
  }

  getStorageById(id: string): Storage | null {
    const stmt = this.db.prepare('SELECT * FROM storages WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      manufacturer: row.manufacturer,
      model: row.model,
      type: row.type,
      capacity: row.capacity,
      usableCapacity: row.usableCapacity,
      powerKw: row.powerKw,
      efficiency: row.efficiency,
      cycleLife: row.cycleLife,
      voltage: row.voltage,
      technology: row.technology,
      price: row.price,
      warranty: {
        product: row.warranty_product,
        cycles: row.warranty_cycles
      },
      dimensions: {
        length: row.dimensions_length,
        width: row.dimensions_width,
        height: row.dimensions_height
      },
      weight: row.weight,
      temperatureRange: {
        min: row.temperatureRange_min,
        max: row.temperatureRange_max
      },
      features: row.features ? row.features.split(',') : []
    };
  }

  updateStorage(id: string, storage: Partial<Omit<Storage, 'id'>>): boolean {
    const fields = [];
    const values = [];

    if (storage.manufacturer !== undefined) { fields.push('manufacturer = ?'); values.push(storage.manufacturer); }
    if (storage.model !== undefined) { fields.push('model = ?'); values.push(storage.model); }
    if (storage.type !== undefined) { fields.push('type = ?'); values.push(storage.type); }
    if (storage.capacity !== undefined) { fields.push('capacity = ?'); values.push(storage.capacity); }
    if (storage.usableCapacity !== undefined) { fields.push('usableCapacity = ?'); values.push(storage.usableCapacity); }
    if (storage.powerKw !== undefined) { fields.push('powerKw = ?'); values.push(storage.powerKw); }
    if (storage.efficiency !== undefined) { fields.push('efficiency = ?'); values.push(storage.efficiency); }
    if (storage.cycleLife !== undefined) { fields.push('cycleLife = ?'); values.push(storage.cycleLife); }
    if (storage.voltage !== undefined) { fields.push('voltage = ?'); values.push(storage.voltage); }
    if (storage.technology !== undefined) { fields.push('technology = ?'); values.push(storage.technology); }
    if (storage.price !== undefined) { fields.push('price = ?'); values.push(storage.price); }
    if (storage.warranty?.product !== undefined) { fields.push('warranty_product = ?'); values.push(storage.warranty.product); }
    if (storage.warranty?.cycles !== undefined) { fields.push('warranty_cycles = ?'); values.push(storage.warranty.cycles); }
    if (storage.dimensions?.length !== undefined) { fields.push('dimensions_length = ?'); values.push(storage.dimensions.length); }
    if (storage.dimensions?.width !== undefined) { fields.push('dimensions_width = ?'); values.push(storage.dimensions.width); }
    if (storage.dimensions?.height !== undefined) { fields.push('dimensions_height = ?'); values.push(storage.dimensions.height); }
    if (storage.weight !== undefined) { fields.push('weight = ?'); values.push(storage.weight); }
    if (storage.temperatureRange?.min !== undefined) { fields.push('temperatureRange_min = ?'); values.push(storage.temperatureRange.min); }
    if (storage.temperatureRange?.max !== undefined) { fields.push('temperatureRange_max = ?'); values.push(storage.temperatureRange.max); }
    if (storage.features !== undefined) { fields.push('features = ?'); values.push(storage.features.join(',')); }

    if (fields.length === 0) return false;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`UPDATE storages SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    
    return result.changes > 0;
  }

  deleteStorage(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM storages WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // ============================================================================
  // ACCESSORY OPERATIONS
  // ============================================================================

  insertAccessory(accessory: Omit<Accessory, 'id'>): string {
    const id = this.generateId('acc');
    const stmt = this.db.prepare(`
      INSERT INTO accessories (
        id, name, category, manufacturer, model, power, price,
        features, description, specifications
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, accessory.name, accessory.category, accessory.manufacturer, accessory.model,
      accessory.power, accessory.price, accessory.features.join(','),
      accessory.description, accessory.specifications ? JSON.stringify(accessory.specifications) : null
    );
    
    return id;
  }

  getAllAccessories(): Accessory[] {
    const stmt = this.db.prepare('SELECT * FROM accessories ORDER BY category, manufacturer, name');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      manufacturer: row.manufacturer,
      model: row.model,
      power: row.power,
      price: row.price,
      features: row.features ? row.features.split(',') : [],
      description: row.description,
      specifications: row.specifications ? JSON.parse(row.specifications) : undefined
    }));
  }

  getAccessoryById(id: string): Accessory | null {
    const stmt = this.db.prepare('SELECT * FROM accessories WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      manufacturer: row.manufacturer,
      model: row.model,
      power: row.power,
      price: row.price,
      features: row.features ? row.features.split(',') : [],
      description: row.description,
      specifications: row.specifications ? JSON.parse(row.specifications) : undefined
    };
  }

  updateAccessory(id: string, accessory: Partial<Omit<Accessory, 'id'>>): boolean {
    const fields = [];
    const values = [];

    if (accessory.name !== undefined) { fields.push('name = ?'); values.push(accessory.name); }
    if (accessory.category !== undefined) { fields.push('category = ?'); values.push(accessory.category); }
    if (accessory.manufacturer !== undefined) { fields.push('manufacturer = ?'); values.push(accessory.manufacturer); }
    if (accessory.model !== undefined) { fields.push('model = ?'); values.push(accessory.model); }
    if (accessory.power !== undefined) { fields.push('power = ?'); values.push(accessory.power); }
    if (accessory.price !== undefined) { fields.push('price = ?'); values.push(accessory.price); }
    if (accessory.features !== undefined) { fields.push('features = ?'); values.push(accessory.features.join(',')); }
    if (accessory.description !== undefined) { fields.push('description = ?'); values.push(accessory.description); }
    if (accessory.specifications !== undefined) { fields.push('specifications = ?'); values.push(JSON.stringify(accessory.specifications)); }

    if (fields.length === 0) return false;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`UPDATE accessories SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    
    return result.changes > 0;
  }

  deleteAccessory(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM accessories WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // ============================================================================
  // COMPANY OPERATIONS
  // ============================================================================

  insertCompany(company: Omit<CompanyInfo, 'id'>): string {
    const id = this.generateId('comp');
    const stmt = this.db.prepare(`
      INSERT INTO companies (
        id, name, street, city, zipCode, phone, email, website,
        logoBase64, umsatzsteuerNr, handelsregister, geschaeftsfuehrer,
        bankName, iban, bic
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, company.name, company.street, company.city, company.zipCode, company.phone, company.email,
      company.website || null, company.logoBase64 || null, company.umsatzsteuerNr || null,
      company.handelsregister || null, company.geschaeftsfuehrer || null,
      company.bankName || null, company.iban || null, company.bic || null
    );
    
    return id;
  }

  getAllCompanies(): CompanyInfo[] {
    const stmt = this.db.prepare('SELECT * FROM companies ORDER BY name');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      street: row.street,
      city: row.city,
      zipCode: row.zipCode,
      phone: row.phone,
      email: row.email,
      website: row.website,
      logoBase64: row.logoBase64,
      umsatzsteuerNr: row.umsatzsteuerNr,
      handelsregister: row.handelsregister,
      geschaeftsfuehrer: row.geschaeftsfuehrer,
      bankName: row.bankName,
      iban: row.iban,
      bic: row.bic
    }));
  }

  getCompanyById(id: string): CompanyInfo | null {
    const stmt = this.db.prepare('SELECT * FROM companies WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      street: row.street,
      city: row.city,
      zipCode: row.zipCode,
      phone: row.phone,
      email: row.email,
      website: row.website,
      logoBase64: row.logoBase64,
      umsatzsteuerNr: row.umsatzsteuerNr,
      handelsregister: row.handelsregister,
      geschaeftsfuehrer: row.geschaeftsfuehrer,
      bankName: row.bankName,
      iban: row.iban,
      bic: row.bic
    };
  }

  updateCompany(id: string, company: Partial<Omit<CompanyInfo, 'id'>>): boolean {
    const fields = [];
    const values = [];

    if (company.name !== undefined) { fields.push('name = ?'); values.push(company.name); }
    if (company.street !== undefined) { fields.push('street = ?'); values.push(company.street); }
    if (company.city !== undefined) { fields.push('company.city = ?'); values.push(company.city); }
    if (company.zipCode !== undefined) { fields.push('zipCode = ?'); values.push(company.zipCode); }
    if (company.phone !== undefined) { fields.push('phone = ?'); values.push(company.phone); }
    if (company.email !== undefined) { fields.push('email = ?'); values.push(company.email); }
    if (company.website !== undefined) { fields.push('website = ?'); values.push(company.website); }
    if (company.logoBase64 !== undefined) { fields.push('logoBase64 = ?'); values.push(company.logoBase64); }
    if (company.umsatzsteuerNr !== undefined) { fields.push('umsatzsteuerNr = ?'); values.push(company.umsatzsteuerNr); }
    if (company.handelsregister !== undefined) { fields.push('handelsregister = ?'); values.push(company.handelsregister); }
    if (company.geschaeftsfuehrer !== undefined) { fields.push('geschaeftsfuehrer = ?'); values.push(company.geschaeftsfuehrer); }
    if (company.bankName !== undefined) { fields.push('bankName = ?'); values.push(company.bankName); }
    if (company.iban !== undefined) { fields.push('iban = ?'); values.push(company.iban); }
    if (company.bic !== undefined) { fields.push('bic = ?'); values.push(company.bic); }

    if (fields.length === 0) return false;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`UPDATE companies SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    
    return result.changes > 0;
  }

  deleteCompany(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM companies WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // ============================================================================
  // BULK OPERATIONS FOR EXCEL/CSV IMPORT
  // ============================================================================

  bulkInsertModules(modules: Omit<Module, 'id'>[]): string[] {
    const transaction = this.db.transaction((moduleList: Omit<Module, 'id'>[]) => {
      const ids: string[] = [];
      for (const module of moduleList) {
        ids.push(this.insertModule(module));
      }
      return ids;
    });

    return transaction(modules);
  }

  bulkInsertInverters(inverters: Omit<Inverter, 'id'>[]): string[] {
    const transaction = this.db.transaction((inverterList: Omit<Inverter, 'id'>[]) => {
      const ids: string[] = [];
      for (const inverter of inverterList) {
        ids.push(this.insertInverter(inverter));
      }
      return ids;
    });

    return transaction(inverters);
  }

  bulkInsertStorages(storages: Omit<Storage, 'id'>[]): string[] {
    const transaction = this.db.transaction((storageList: Omit<Storage, 'id'>[]) => {
      const ids: string[] = [];
      for (const storage of storageList) {
        ids.push(this.insertStorage(storage));
      }
      return ids;
    });

    return transaction(storages);
  }

  bulkInsertAccessories(accessories: Omit<Accessory, 'id'>[]): string[] {
    const transaction = this.db.transaction((accessoryList: Omit<Accessory, 'id'>[]) => {
      const ids: string[] = [];
      for (const accessory of accessoryList) {
        ids.push(this.insertAccessory(accessory));
      }
      return ids;
    });

    return transaction(accessories);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clearTable(tableName: string): void {
    const stmt = this.db.prepare(`DELETE FROM ${tableName}`);
    stmt.run();
  }

  close(): void {
    this.db.close();
  }

  // Get database statistics
  getStats(): { [tableName: string]: number } {
    const tables = ['modules', 'inverters', 'storages', 'accessories', 'companies', 'customer_projects'];
    const stats: { [tableName: string]: number } = {};

    for (const table of tables) {
      const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`);
      const result = stmt.get() as { count: number };
      stats[table] = result.count;
    }

    return stats;
  }
}

// Singleton instance
let dbInstance: SolarDatabase | null = null;

export function getDatabase(): SolarDatabase {
  if (!dbInstance) {
    dbInstance = new SolarDatabase();
  }
  return dbInstance;
}