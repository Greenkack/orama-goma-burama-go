import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';
import type { Module, ModuleSelectionProps } from '../../../shared/types';

const MOCK_MODULES: Module[] = [
  {
    id: 'mod-1',
    manufacturer: 'Jinko Solar',
    model: 'Tiger Neo N-type 54HL4-(V) 420W',
    powerWp: 420,
    efficiency: 21.25,
    technology: 'mono',
    dimensions: { length: 1762, width: 1134, thickness: 30 },
    weight: 21.5,
    pricePerWp: 0.28,
    warranty: { product: 12, performance: 25 },
    temperatureCoefficient: -0.30,
    maxSystemVoltage: 1500,
    shortCircuitCurrent: 13.92,
    openCircuitVoltage: 37.8
  },
  {
    id: 'mod-2',
    manufacturer: 'Canadian Solar',
    model: 'HiKu6 Mono PERC CS6W-410MS',
    powerWp: 410,
    efficiency: 20.9,
    technology: 'mono',
    dimensions: { length: 2094, width: 1038, thickness: 35 },
    weight: 22.4,
    pricePerWp: 0.26,
    warranty: { product: 12, performance: 25 },
    temperatureCoefficient: -0.37,
    maxSystemVoltage: 1500,
    shortCircuitCurrent: 13.20,
    openCircuitVoltage: 39.1
  },
  {
    id: 'mod-3',
    manufacturer: 'Q CELLS',
    model: 'Q.PEAK DUO BLK ML-G10+ 405',
    powerWp: 405,
    efficiency: 20.6,
    technology: 'mono',
    dimensions: { length: 2020, width: 1000, thickness: 32 },
    weight: 20.6,
    pricePerWp: 0.32,
    warranty: { product: 12, performance: 25 },
    temperatureCoefficient: -0.34,
    maxSystemVoltage: 1500,
    shortCircuitCurrent: 12.43,
    openCircuitVoltage: 41.4
  }
];

export default function ModuleSelection({ 
  selectedModule, 
  onModuleSelect, 
  quantity, 
  onQuantityChange 
}: ModuleSelectionProps) {
  const [modules] = useState<Module[]>(MOCK_MODULES);
  const [filteredModules, setFilteredModules] = useState<Module[]>(MOCK_MODULES);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [minPower, setMinPower] = useState<number>(0);
  const [maxPower, setMaxPower] = useState<number>(1000);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailModule, setDetailModule] = useState<Module | null>(null);

  // Calculate total system size
  const totalSystemSizeKwp = selectedModule ? (selectedModule.powerWp * quantity) / 1000 : 0;
  const totalArea = selectedModule ? (selectedModule.dimensions.length * selectedModule.dimensions.width * quantity) / 1000000 : 0;
  const totalPrice = selectedModule && selectedModule.pricePerWp ? selectedModule.pricePerWp * selectedModule.powerWp * quantity : 0;

  // Get unique manufacturers for filter
  const manufacturers = Array.from(new Set(modules.map(m => m.manufacturer))).sort();

  // Filter modules based on criteria
  useEffect(() => {
    let filtered = modules;

    if (selectedManufacturer) {
      filtered = filtered.filter(m => m.manufacturer === selectedManufacturer);
    }

    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered = filtered.filter(m => m.powerWp >= minPower && m.powerWp <= maxPower);

    setFilteredModules(filtered);
  }, [modules, selectedManufacturer, searchTerm, minPower, maxPower]);

  const handleModuleSelect = (module: Module) => {
    onModuleSelect(module);
  };

  const showModuleDetails = (module: Module) => {
    setDetailModule(module);
    setShowDetailsDialog(true);
  };

  const clearFilters = () => {
    setSelectedManufacturer('');
    setSearchTerm('');
    setMinPower(0);
    setMaxPower(1000);
  };

  // Column templates
  const manufacturerTemplate = (rowData: Module) => (
    <div>
      <div className="font-semibold">{rowData.manufacturer}</div>
      <div className="text-sm text-gray-600">{rowData.model}</div>
    </div>
  );

  const powerTemplate = (rowData: Module) => (
    <div className="text-center">
      <div className="font-semibold">{rowData.powerWp} Wp</div>
      <div className="text-xs text-gray-500">{rowData.efficiency}% Eff.</div>
    </div>
  );

  const technologyTemplate = (rowData: Module) => (
    <Tag 
      value={rowData.technology.toUpperCase()} 
      severity={rowData.technology === 'mono' ? 'success' : 'info'}
    />
  );

  const priceTemplate = (rowData: Module) => (
    <div className="text-center">
      {rowData.pricePerWp ? (
        <>
          <div className="font-semibold">{rowData.pricePerWp.toFixed(2)} €/Wp</div>
          <div className="text-xs text-gray-500">
            {(rowData.pricePerWp * rowData.powerWp).toFixed(0)} € gesamt
          </div>
        </>
      ) : (
        <span className="text-gray-400">Preis auf Anfrage</span>
      )}
    </div>
  );

  const actionTemplate = (rowData: Module) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-info-circle"
        size="small"
        outlined
        onClick={() => showModuleDetails(rowData)}
        tooltip="Details anzeigen"
        tooltipOptions={{ position: 'top' }}
      />
      <Button
        icon="pi pi-check"
        size="small"
        severity={selectedModule?.id === rowData.id ? 'success' : 'secondary'}
        label={selectedModule?.id === rowData.id ? 'Ausgewählt' : 'Auswählen'}
        onClick={() => handleModuleSelect(rowData)}
      />
    </div>
  );

  return (
    <div className="module-selection">
      <Card title="PV-Module Auswahl" className="mb-4">
        {/* Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Hersteller</label>
            <Dropdown
              value={selectedManufacturer}
              options={[{ label: 'Alle Hersteller', value: '' }, ...manufacturers.map(m => ({ label: m, value: m }))]}
              onChange={(e) => setSelectedManufacturer(e.value)}
              placeholder="Hersteller wählen"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Suche</label>
            <InputText
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Modell oder Hersteller"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Min. Leistung (Wp)</label>
            <InputNumber
              value={minPower}
              onValueChange={(e) => setMinPower(e.value || 0)}
              min={0}
              max={1000}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Max. Leistung (Wp)</label>
            <InputNumber
              value={maxPower}
              onValueChange={(e) => setMaxPower(e.value || 1000)}
              min={0}
              max={1000}
              className="w-full"
            />
          </div>
          
          <div className="flex items-end">
            <Button
              label="Filter zurücksetzen"
              icon="pi pi-times"
              size="small"
              outlined
              onClick={clearFilters}
              className="w-full"
            />
          </div>
        </div>

        {/* Module Table */}
        <DataTable
          value={filteredModules}
          selection={selectedModule}
          onSelectionChange={(e) => handleModuleSelect(e.value as Module)}
          selectionMode="single"
          dataKey="id"
          className="mb-4"
          emptyMessage="Keine Module gefunden"
          paginator
          rows={5}
          responsiveLayout="scroll"
        >
          <Column field="manufacturer" header="Hersteller & Modell" body={manufacturerTemplate} />
          <Column field="powerWp" header="Leistung" body={powerTemplate} />
          <Column field="technology" header="Technologie" body={technologyTemplate} />
          <Column field="efficiency" header="Wirkungsgrad" body={(rowData) => `${rowData.efficiency}%`} />
          <Column field="pricePerWp" header="Preis" body={priceTemplate} />
          <Column body={actionTemplate} header="Aktionen" />
        </DataTable>

        {/* Quantity Selection */}
        {selectedModule && (
          <Card title="Anzahl & Systemgröße" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Anzahl Module</label>
                <InputNumber
                  value={quantity}
                  onValueChange={(e) => onQuantityChange(e.value || 0)}
                  min={1}
                  max={100}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Systemgröße</label>
                <div className="flex items-center h-10 px-3 border border-gray-300 rounded bg-gray-50">
                  <span className="font-semibold text-blue-600">{totalSystemSizeKwp.toFixed(2)} kWp</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Gesamtfläche</label>
                <div className="flex items-center h-10 px-3 border border-gray-300 rounded bg-gray-50">
                  <span>{totalArea.toFixed(1)} m²</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Geschätzte Kosten</label>
                <div className="flex items-center h-10 px-3 border border-gray-300 rounded bg-gray-50">
                  <span className="font-semibold text-green-600">
                    {totalPrice > 0 ? `${totalPrice.toFixed(0)} €` : 'Auf Anfrage'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </Card>

      {/* Module Details Dialog */}
      <Dialog
        header={detailModule ? `${detailModule.manufacturer} ${detailModule.model}` : 'Modul Details'}
        visible={showDetailsDialog}
        onHide={() => setShowDetailsDialog(false)}
        style={{ width: '600px' }}
      >
        {detailModule && (
          <div className="module-details">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h6 className="font-semibold mb-2">Technische Daten</h6>
                <ul className="list-none p-0 m-0">
                  <li className="flex justify-between py-1 border-bottom">
                    <span>Leistung:</span>
                    <strong>{detailModule.powerWp} Wp</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Wirkungsgrad:</span>
                    <strong>{detailModule.efficiency}%</strong>
                  </li>
                  <li className="flex justify-between py-1 border-bottom">
                    <span>Technologie:</span>
                    <strong>{detailModule.technology.toUpperCase()}</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Temperaturkoeffizient:</span>
                    <strong>{detailModule.temperatureCoefficient}%/°C</strong>
                  </li>
                </ul>
              </div>
              
              <div>
                <h6 className="font-semibold mb-2">Abmessungen & Gewicht</h6>
                <ul className="list-none p-0 m-0">
                  <li className="flex justify-between py-1">
                    <span>Länge:</span>
                    <strong>{detailModule.dimensions.length} mm</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Breite:</span>
                    <strong>{detailModule.dimensions.width} mm</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Dicke:</span>
                    <strong>{detailModule.dimensions.thickness} mm</strong>
                  </li>
                  <li className="flex justify-between py-1 border-bottom">
                    <span>Gewicht:</span>
                    <strong>{detailModule.weight} kg</strong>
                  </li>
                </ul>
              </div>
            </div>
            
            <Divider />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h6 className="font-semibold mb-2">Elektrische Eigenschaften</h6>
                <ul className="list-none p-0 m-0">
                  <li className="flex justify-between py-1">
                    <span>Max. Systemspannung:</span>
                    <strong>{detailModule.maxSystemVoltage} V</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Kurzschlussstrom:</span>
                    <strong>{detailModule.shortCircuitCurrent} A</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Leerlaufspannung:</span>
                    <strong>{detailModule.openCircuitVoltage} V</strong>
                  </li>
                </ul>
              </div>
              
              <div>
                <h6 className="font-semibold mb-2">Garantie & Preis</h6>
                <ul className="list-none p-0 m-0">
                  <li className="flex justify-between py-1">
                    <span>Produktgarantie:</span>
                    <strong>{detailModule.warranty.product} Jahre</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Leistungsgarantie:</span>
                    <strong>{detailModule.warranty.performance} Jahre</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Preis pro Wp:</span>
                    <strong>
                      {detailModule.pricePerWp ? `${detailModule.pricePerWp.toFixed(2)} €` : 'Auf Anfrage'}
                    </strong>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}