import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { ToggleButton } from 'primereact/togglebutton';
import { ProgressBar } from 'primereact/progressbar';
import { Message } from 'primereact/message';
import { Chart } from 'primereact/chart';
import type { Storage, StorageSelectionProps } from '../../../shared/types';

const MOCK_STORAGES: Storage[] = [
  {
    id: 'bat-1',
    manufacturer: 'BYD',
    model: 'Battery-Box Premium HVS 7.7',
    type: 'DC',
    capacity: 7.68,
    usableCapacity: 6.9,
    powerKw: 3.0,
    efficiency: 96,
    cycleLife: 6000,
    voltage: 512,
    technology: 'LiFePO4',
    price: 5800,
    warranty: { product: 10, cycles: 6000 },
    dimensions: { length: 580, width: 380, height: 290 },
    weight: 75,
    temperatureRange: { min: -10, max: 50 },
    features: ['Modular expandable', 'Integrated BMS', 'Safety certified']
  },
  {
    id: 'bat-2',
    manufacturer: 'Huawei',
    model: 'LUNA2000-10-S0',
    type: 'DC',
    capacity: 10.0,
    usableCapacity: 9.5,
    powerKw: 5.0,
    efficiency: 97,
    cycleLife: 6000,
    voltage: 600,
    technology: 'LiFePO4',
    price: 7200,
    warranty: { product: 10, cycles: 6000 },
    dimensions: { length: 570, width: 350, height: 240 },
    weight: 95,
    temperatureRange: { min: -20, max: 55 },
    features: ['Smart optimization', 'Module-level monitoring', 'Easy installation']
  },
  {
    id: 'bat-3',
    manufacturer: 'Sonnen',
    model: 'sonnenBatterie 10',
    type: 'AC',
    capacity: 11.0,
    usableCapacity: 10.0,
    powerKw: 4.6,
    efficiency: 95,
    cycleLife: 10000,
    voltage: 400,
    technology: 'LiFePO4',
    price: 12500,
    warranty: { product: 10, cycles: 10000 },
    dimensions: { length: 690, width: 340, height: 1800 },
    weight: 170,
    temperatureRange: { min: -5, max: 40 },
    features: ['Integrated inverter', 'Virtual power plant', 'sonnenConnect']
  },
  {
    id: 'bat-4',
    manufacturer: 'Tesla',
    model: 'Powerwall 2',
    type: 'AC',
    capacity: 13.5,
    usableCapacity: 13.5,
    powerKw: 5.0,
    efficiency: 92,
    cycleLife: 5000,
    voltage: 400,
    technology: 'Li-Ion',
    price: 11000,
    warranty: { product: 10, cycles: 5000 },
    dimensions: { length: 755, width: 155, height: 1150 },
    weight: 114,
    temperatureRange: { min: -20, max: 50 },
    features: ['Backup gateway', 'Tesla app', 'Storm watch']
  },
  {
    id: 'bat-5',
    manufacturer: 'SENEC',
    model: 'SENEC.Home V3 hybrid 7.5',
    type: 'DC',
    capacity: 7.5,
    usableCapacity: 6.75,
    powerKw: 5.0,
    efficiency: 94,
    cycleLife: 7000,
    voltage: 400,
    technology: 'Li-Ion',
    price: 8500,
    warranty: { product: 10, cycles: 7000 },
    dimensions: { length: 600, width: 350, height: 200 },
    weight: 85,
    temperatureRange: { min: -10, max: 45 },
    features: ['Cloud backup', 'Energy trading', 'Weather forecast']
  }
];

export default function StorageSelection({ 
  selectedStorage, 
  onStorageSelect, 
  enabled, 
  onEnabledChange, 
  systemSize 
}: StorageSelectionProps) {
  const [storages] = useState<Storage[]>(MOCK_STORAGES);
  const [filteredStorages, setFilteredStorages] = useState<Storage[]>(MOCK_STORAGES);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedTechnology, setSelectedTechnology] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailStorage, setDetailStorage] = useState<Storage | null>(null);

  // Get unique values for filters
  const manufacturers = Array.from(new Set(storages.map(s => s.manufacturer))).sort();
  const types = Array.from(new Set(storages.map(s => s.type))).sort();
  const technologies = Array.from(new Set(storages.map(s => s.technology))).sort();

  // Recommended storage size based on system size
  const recommendedCapacity = systemSize * 1.2; // 1.2 kWh per kWp as rule of thumb

  // Filter storages based on criteria
  useEffect(() => {
    let filtered = storages;

    if (selectedManufacturer) {
      filtered = filtered.filter(s => s.manufacturer === selectedManufacturer);
    }

    if (selectedType) {
      filtered = filtered.filter(s => s.type === selectedType);
    }

    if (selectedTechnology) {
      filtered = filtered.filter(s => s.technology === selectedTechnology);
    }

    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStorages(filtered);
  }, [storages, selectedManufacturer, selectedType, selectedTechnology, searchTerm]);

  const handleStorageSelect = (storage: Storage | null) => {
    onStorageSelect(storage);
  };

  const showStorageDetails = (storage: Storage) => {
    setDetailStorage(storage);
    setShowDetailsDialog(true);
  };

  const clearFilters = () => {
    setSelectedManufacturer('');
    setSelectedType('');
    setSelectedTechnology('');
    setSearchTerm('');
  };

  // Calculate sizing recommendation score
  const getSizingScore = (storage: Storage): number => {
    if (systemSize === 0) return 100;
    const ratio = storage.usableCapacity / recommendedCapacity;
    if (ratio >= 0.8 && ratio <= 1.3) return 100;
    if (ratio >= 0.6 && ratio <= 1.5) return 80;
    if (ratio >= 0.4 && ratio <= 2.0) return 60;
    return 40;
  };

  const getSizingLabel = (score: number): string => {
    if (score >= 95) return 'Optimal';
    if (score >= 80) return 'Sehr gut';
    if (score >= 60) return 'Gut';
    return 'Überdimensioniert';
  };

  const getSizingSeverity = (score: number): 'success' | 'warning' | 'danger' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  // Calculate cost per kWh
  const getCostPerKwh = (storage: Storage): number => {
    return storage.price ? storage.price / storage.usableCapacity : 0;
  };

  // Column templates
  const manufacturerTemplate = (rowData: Storage) => (
    <div>
      <div className="font-semibold">{rowData.manufacturer}</div>
      <div className="text-sm text-gray-600">{rowData.model}</div>
    </div>
  );

  const capacityTemplate = (rowData: Storage) => (
    <div className="text-center">
      <div className="font-semibold">{rowData.usableCapacity} kWh</div>
      <div className="text-xs text-gray-500">({rowData.capacity} kWh nominal)</div>
    </div>
  );

  const typeTemplate = (rowData: Storage) => (
    <div className="text-center">
      <Tag 
        value={rowData.type} 
        severity={rowData.type === 'DC' ? 'success' : 'info'}
        className="mb-1"
      />
      <div className="text-xs">{rowData.technology}</div>
    </div>
  );

  const powerTemplate = (rowData: Storage) => (
    <div className="text-center">
      <div className="font-semibold">{rowData.powerKw} kW</div>
      <div className="text-xs text-gray-500">{rowData.efficiency}% Eff.</div>
    </div>
  );

  const sizingTemplate = (rowData: Storage) => {
    const score = getSizingScore(rowData);
    return (
      <div className="text-center">
        <div className="mb-1">
          <Tag 
            value={getSizingLabel(score)} 
            severity={getSizingSeverity(score)}
          />
        </div>
        <div className="text-xs text-gray-500">
          {((rowData.usableCapacity / recommendedCapacity) * 100).toFixed(0)}% der Empfehlung
        </div>
      </div>
    );
  };

  const priceTemplate = (rowData: Storage) => (
    <div className="text-center">
      {rowData.price ? (
        <>
          <div className="font-semibold">{rowData.price.toFixed(0)} €</div>
          <div className="text-xs text-gray-500">
            {getCostPerKwh(rowData).toFixed(0)} €/kWh
          </div>
        </>
      ) : (
        <span className="text-gray-400">Preis auf Anfrage</span>
      )}
    </div>
  );

  const cyclesTemplate = (rowData: Storage) => (
    <div className="text-center">
      <div className="font-semibold">{rowData.cycleLife.toLocaleString()}</div>
      <div className="text-xs text-gray-500">{rowData.warranty.product} J. Garantie</div>
    </div>
  );

  const actionTemplate = (rowData: Storage) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-info-circle"
        size="small"
        outlined
        onClick={() => showStorageDetails(rowData)}
        tooltip="Details anzeigen"
        tooltipOptions={{ position: 'top' }}
      />
      <Button
        icon="pi pi-check"
        size="small"
        severity={selectedStorage?.id === rowData.id ? 'success' : 'secondary'}
        label={selectedStorage?.id === rowData.id ? 'Ausgewählt' : 'Auswählen'}
        onClick={() => handleStorageSelect(rowData)}
      />
    </div>
  );

  // Chart data for comparison
  const getComparisonChartData = () => {
    const limitedStorages = filteredStorages.slice(0, 5);
    return {
      labels: limitedStorages.map(s => s.manufacturer),
      datasets: [
        {
          label: 'Kapazität (kWh)',
          data: limitedStorages.map(s => s.usableCapacity),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Preis (k€)',
          data: limitedStorages.map(s => s.price ? s.price / 1000 : 0),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="storage-selection">
      <Card title="Stromspeicher Auswahl" className="mb-4">
        {/* Enable/Disable Storage */}
        <div className="flex items-center gap-3 mb-4">
          <ToggleButton
            checked={enabled}
            onChange={(e) => onEnabledChange(e.value)}
            onLabel="Speicher aktiviert"
            offLabel="Speicher deaktiviert"
            onIcon="pi pi-battery-full"
            offIcon="pi pi-battery-empty"
            className="w-auto"
          />
          {!enabled && (
            <Message 
              severity="info" 
              text="Stromspeicher ist optional. Aktivieren Sie die Option für mehr Unabhängigkeit und höhere Eigenverbrauchsquote."
              className="flex-1"
            />
          )}
        </div>

        {enabled && (
          <>
            {/* System Size Info */}
            {systemSize > 0 && (
              <Message 
                severity="info" 
                text={`Systemgröße: ${systemSize.toFixed(2)} kWp - Empfohlene Speicherkapazität: ${recommendedCapacity.toFixed(1)} kWh`}
                className="mb-4"
              />
            )}

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
                <label className="block text-sm font-medium mb-1">Typ</label>
                <Dropdown
                  value={selectedType}
                  options={[
                    { label: 'Alle Typen', value: '' },
                    { label: 'DC-gekoppelt', value: 'DC' },
                    { label: 'AC-gekoppelt', value: 'AC' }
                  ]}
                  onChange={(e) => setSelectedType(e.value)}
                  placeholder="Typ wählen"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Technologie</label>
                <Dropdown
                  value={selectedTechnology}
                  options={[
                    { label: 'Alle Technologien', value: '' },
                    ...technologies.map(t => ({ label: t, value: t }))
                  ]}
                  onChange={(e) => setSelectedTechnology(e.value)}
                  placeholder="Technologie wählen"
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

            {/* Comparison Chart */}
            {filteredStorages.length > 1 && (
              <Card title="Vergleichsübersicht" className="mb-4">
                <Chart type="bar" data={getComparisonChartData()} options={chartOptions} height="300px" />
              </Card>
            )}

            {/* Storage Table */}
            <DataTable
              value={filteredStorages}
              selection={selectedStorage}
              onSelectionChange={(e) => handleStorageSelect(e.value as Storage)}
              selectionMode="single"
              dataKey="id"
              className="mb-4"
              emptyMessage="Keine passenden Stromspeicher gefunden"
              paginator
              rows={5}
              responsiveLayout="scroll"
              sortField="usableCapacity"
              sortOrder={1}
            >
              <Column field="manufacturer" header="Hersteller & Modell" body={manufacturerTemplate} />
              <Column field="usableCapacity" header="Kapazität" body={capacityTemplate} sortable />
              <Column field="type" header="Typ & Technologie" body={typeTemplate} />
              <Column field="powerKw" header="Leistung" body={powerTemplate} sortable />
              <Column header="Dimensionierung" body={sizingTemplate} />
              <Column field="cycleLife" header="Zyklen & Garantie" body={cyclesTemplate} sortable />
              <Column field="price" header="Preis" body={priceTemplate} sortable />
              <Column body={actionTemplate} header="Aktionen" />
            </DataTable>

            {/* Selected Storage Summary */}
            {selectedStorage && (
              <Card title="Ausgewählter Stromspeicher" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Modell</label>
                    <div className="flex items-center h-10 px-3 border border-gray-300 rounded bg-gray-50">
                      <span className="font-semibold">{selectedStorage.manufacturer} {selectedStorage.model}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Nutzbare Kapazität</label>
                    <div className="flex items-center h-10 px-3 border border-gray-300 rounded bg-gray-50">
                      <span className="font-semibold text-blue-600">{selectedStorage.usableCapacity} kWh</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Typ & Leistung</label>
                    <div className="flex items-center h-10 px-3 border border-gray-300 rounded bg-gray-50">
                      <span>{selectedStorage.type}-gekoppelt, {selectedStorage.powerKw} kW</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Preis</label>
                    <div className="flex items-center h-10 px-3 border border-gray-300 rounded bg-gray-50">
                      <span className="font-semibold text-green-600">
                        {selectedStorage.price ? `${selectedStorage.price.toFixed(0)} €` : 'Auf Anfrage'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Benefits Info */}
                <div className="mt-4 p-4 bg-blue-50 rounded">
                  <h6 className="font-semibold mb-2 text-blue-700">Vorteile mit Stromspeicher:</h6>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <i className="pi pi-sun text-yellow-500 mr-2"></i>
                      <span>Höhere Eigenverbrauchsquote (bis zu 70%)</span>
                    </div>
                    <div>
                      <i className="pi pi-shield text-green-500 mr-2"></i>
                      <span>Notstromversorgung bei Stromausfall</span>
                    </div>
                    <div>
                      <i className="pi pi-chart-line text-blue-500 mr-2"></i>
                      <span>Optimierte Nutzung der PV-Energie</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* No Storage Option */}
            <div className="mt-4">
              <Button
                label="Ohne Stromspeicher fortfahren"
                icon="pi pi-times"
                severity="secondary"
                outlined
                onClick={() => handleStorageSelect(null)}
                className={!selectedStorage ? 'border-orange-500 text-orange-500' : ''}
              />
            </div>
          </>
        )}
      </Card>

      {/* Storage Details Dialog */}
      <Dialog
        header={detailStorage ? `${detailStorage.manufacturer} ${detailStorage.model}` : 'Stromspeicher Details'}
        visible={showDetailsDialog}
        onHide={() => setShowDetailsDialog(false)}
        style={{ width: '800px' }}
      >
        {detailStorage && (
          <div className="storage-details">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h6 className="font-semibold mb-2">Kapazität & Leistung</h6>
                <ul className="list-none p-0 m-0">
                  <li className="flex justify-between py-1">
                    <span>Nominale Kapazität:</span>
                    <strong>{detailStorage.capacity} kWh</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Nutzbare Kapazität:</span>
                    <strong>{detailStorage.usableCapacity} kWh</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Entladeleistung:</span>
                    <strong>{detailStorage.powerKw} kW</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Rundwirkungsgrad:</span>
                    <strong>{detailStorage.efficiency}%</strong>
                  </li>
                </ul>
              </div>
              
              <div>
                <h6 className="font-semibold mb-2">Technische Daten</h6>
                <ul className="list-none p-0 m-0">
                  <li className="flex justify-between py-1">
                    <span>Typ:</span>
                    <strong>{detailStorage.type}-gekoppelt</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Technologie:</span>
                    <strong>{detailStorage.technology}</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Nennspannung:</span>
                    <strong>{detailStorage.voltage} V</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Zyklenlebensdauer:</span>
                    <strong>{detailStorage.cycleLife.toLocaleString()}</strong>
                  </li>
                </ul>
              </div>
            </div>
            
            <Divider />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h6 className="font-semibold mb-2">Mechanische Daten</h6>
                <ul className="list-none p-0 m-0">
                  <li className="flex justify-between py-1">
                    <span>Abmessungen (L×B×H):</span>
                    <strong>{detailStorage.dimensions.length}×{detailStorage.dimensions.width}×{detailStorage.dimensions.height} mm</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Gewicht:</span>
                    <strong>{detailStorage.weight} kg</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Betriebstemperatur:</span>
                    <strong>{detailStorage.temperatureRange.min}°C bis {detailStorage.temperatureRange.max}°C</strong>
                  </li>
                </ul>
              </div>
              
              <div>
                <h6 className="font-semibold mb-2">Garantie & Preis</h6>
                <ul className="list-none p-0 m-0">
                  <li className="flex justify-between py-1">
                    <span>Produktgarantie:</span>
                    <strong>{detailStorage.warranty.product} Jahre</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Zyklengarantie:</span>
                    <strong>{detailStorage.warranty.cycles.toLocaleString()}</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Preis:</span>
                    <strong>
                      {detailStorage.price ? `${detailStorage.price.toFixed(0)} €` : 'Auf Anfrage'}
                    </strong>
                  </li>
                  {detailStorage.price && (
                    <li className="flex justify-between py-1">
                      <span>Preis pro kWh:</span>
                      <strong>{getCostPerKwh(detailStorage).toFixed(0)} €/kWh</strong>
                    </li>
                  )}
                </ul>
              </div>
            </div>
            
            <Divider />
            
            <div>
              <h6 className="font-semibold mb-2">Besondere Features</h6>
              <div className="flex flex-wrap gap-2">
                {detailStorage.features.map((feature, index) => (
                  <Tag key={index} value={feature} severity="info" />
                ))}
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}