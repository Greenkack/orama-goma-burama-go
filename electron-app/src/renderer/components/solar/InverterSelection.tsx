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
import { ProgressBar } from 'primereact/progressbar';
import { Message } from 'primereact/message';
import type { Inverter, InverterSelectionProps } from '../../../shared/types';

const MOCK_INVERTERS: Inverter[] = [
  {
    id: 'inv-1',
    manufacturer: 'SMA',
    model: 'Sunny Tripower 8.0',
    type: 'string',
    powerKw: 8.0,
    efficiency: 98.3,
    maxDcVoltage: 1000,
    startupVoltage: 150,
    mpptChannels: 2,
    maxDcCurrent: 15,
    acVoltage: 400,
    price: 1250,
    warranty: 5,
    dimensions: { length: 665, width: 431, height: 242 },
    weight: 34,
    protectionClass: 'IP65',
    features: ['Webconnect', 'Grid management', 'Shadow management']
  },
  {
    id: 'inv-2',
    manufacturer: 'Fronius',
    model: 'Symo 10.0-3-M',
    type: 'string',
    powerKw: 10.0,
    efficiency: 98.1,
    maxDcVoltage: 1000,
    startupVoltage: 200,
    mpptChannels: 2,
    maxDcCurrent: 18,
    acVoltage: 400,
    price: 1450,
    warranty: 5,
    dimensions: { length: 645, width: 431, height: 204 },
    weight: 30.8,
    protectionClass: 'IP65',
    features: ['WiFi', 'Fronius Solar.web', 'Dynamic Peak Manager']
  },
  {
    id: 'inv-3',
    manufacturer: 'Huawei',
    model: 'SUN2000-12KTL-M1',
    type: 'string',
    powerKw: 12.0,
    efficiency: 98.6,
    maxDcVoltage: 1100,
    startupVoltage: 200,
    mpptChannels: 4,
    maxDcCurrent: 13,
    acVoltage: 400,
    price: 1650,
    warranty: 10,
    dimensions: { length: 525, width: 470, height: 166 },
    weight: 22,
    protectionClass: 'IP65',
    features: ['Smart IV Diagnosis', 'AFCI Protection', 'PID Recovery']
  },
  {
    id: 'inv-4',
    manufacturer: 'SolarEdge',
    model: 'SE10K-RWS',
    type: 'power-optimizer',
    powerKw: 10.0,
    efficiency: 99.0,
    maxDcVoltage: 1000,
    startupVoltage: 300,
    mpptChannels: 1,
    maxDcCurrent: 33,
    acVoltage: 400,
    price: 2200,
    warranty: 12,
    dimensions: { length: 656, width: 368, height: 206 },
    weight: 26,
    protectionClass: 'IP65',
    features: ['Module-level monitoring', 'Power optimizers', 'Safety shutdown']
  }
];

export default function InverterSelection({ 
  selectedInverter, 
  onInverterSelect, 
  systemSize 
}: InverterSelectionProps) {
  const [inverters] = useState<Inverter[]>(MOCK_INVERTERS);
  const [filteredInverters, setFilteredInverters] = useState<Inverter[]>(MOCK_INVERTERS);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailInverter, setDetailInverter] = useState<Inverter | null>(null);

  // Get unique manufacturers and types for filters
  const manufacturers = Array.from(new Set(inverters.map(i => i.manufacturer))).sort();
  const types = Array.from(new Set(inverters.map(i => i.type))).sort();

  // Filter inverters based on criteria and system size compatibility
  useEffect(() => {
    let filtered = inverters;

    if (selectedManufacturer) {
      filtered = filtered.filter(i => i.manufacturer === selectedManufacturer);
    }

    if (selectedType) {
      filtered = filtered.filter(i => i.type === selectedType);
    }

    if (searchTerm) {
      filtered = filtered.filter(i => 
        i.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by compatibility with system size (±20% tolerance)
    if (systemSize > 0) {
      filtered = filtered.filter(i => {
        const minSize = systemSize * 0.8;
        const maxSize = systemSize * 1.2;
        return i.powerKw >= minSize && i.powerKw <= maxSize;
      });
    }

    setFilteredInverters(filtered);
  }, [inverters, selectedManufacturer, selectedType, searchTerm, systemSize]);

  const handleInverterSelect = (inverter: Inverter) => {
    onInverterSelect(inverter);
  };

  const showInverterDetails = (inverter: Inverter) => {
    setDetailInverter(inverter);
    setShowDetailsDialog(true);
  };

  const clearFilters = () => {
    setSelectedManufacturer('');
    setSelectedType('');
    setSearchTerm('');
  };

  // Calculate compatibility score
  const getCompatibilityScore = (inverter: Inverter): number => {
    if (systemSize === 0) return 100;
    const ratio = inverter.powerKw / systemSize;
    if (ratio >= 0.9 && ratio <= 1.1) return 100;
    if (ratio >= 0.8 && ratio <= 1.2) return 80;
    if (ratio >= 0.7 && ratio <= 1.3) return 60;
    return 40;
  };

  const getCompatibilityLabel = (score: number): string => {
    if (score >= 95) return 'Perfekt';
    if (score >= 80) return 'Sehr gut';
    if (score >= 60) return 'Gut';
    return 'Bedingt geeignet';
  };

  const getCompatibilitySeverity = (score: number): 'success' | 'warning' | 'danger' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  // Column templates
  const manufacturerTemplate = (rowData: Inverter) => (
    <div>
      <div className="font-semibold">{rowData.manufacturer}</div>
      <div className="text-sm text-gray-600">{rowData.model}</div>
    </div>
  );

  const powerTemplate = (rowData: Inverter) => (
    <div className="text-center">
      <div className="font-semibold">{rowData.powerKw} kW</div>
      <div className="text-xs text-gray-500">{rowData.efficiency}% Eff.</div>
    </div>
  );

  const typeTemplate = (rowData: Inverter) => (
    <Tag 
      value={rowData.type.replace('-', ' ').toUpperCase()} 
      severity={rowData.type === 'power-optimizer' ? 'info' : 'success'}
    />
  );

  const compatibilityTemplate = (rowData: Inverter) => {
    const score = getCompatibilityScore(rowData);
    return (
      <div className="text-center">
        <div className="mb-1">
          <Tag 
            value={getCompatibilityLabel(score)} 
            severity={getCompatibilitySeverity(score)}
          />
        </div>
        <ProgressBar 
          value={score} 
          style={{ height: '0.5rem' }}
          color={score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'}
        />
      </div>
    );
  };

  const priceTemplate = (rowData: Inverter) => (
    <div className="text-center">
      {rowData.price ? (
        <>
          <div className="font-semibold">{rowData.price.toFixed(0)} €</div>
          <div className="text-xs text-gray-500">
            {(rowData.price / rowData.powerKw).toFixed(0)} €/kW
          </div>
        </>
      ) : (
        <span className="text-gray-400">Preis auf Anfrage</span>
      )}
    </div>
  );

  const actionTemplate = (rowData: Inverter) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-info-circle"
        size="small"
        outlined
        onClick={() => showInverterDetails(rowData)}
        tooltip="Details anzeigen"
        tooltipOptions={{ position: 'top' }}
      />
      <Button
        icon="pi pi-check"
        size="small"
        severity={selectedInverter?.id === rowData.id ? 'success' : 'secondary'}
        label={selectedInverter?.id === rowData.id ? 'Ausgewählt' : 'Auswählen'}
        onClick={() => handleInverterSelect(rowData)}
      />
    </div>
  );

  return (
    <div className="inverter-selection">
      <Card title="Wechselrichter Auswahl" className="mb-4">
        {/* System Size Info */}
        {systemSize > 0 && (
          <Message 
            severity="info" 
            text={`Systemgröße: ${systemSize.toFixed(2)} kWp - Empfohlene Wechselrichterleistung: ${(systemSize * 0.8).toFixed(1)} - ${(systemSize * 1.1).toFixed(1)} kW`}
            className="mb-4"
          />
        )}

        {/* Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                { label: 'String-Wechselrichter', value: 'string' },
                { label: 'Zentral-Wechselrichter', value: 'central' },
                { label: 'Mikro-Wechselrichter', value: 'micro' },
                { label: 'Leistungsoptimierer', value: 'power-optimizer' }
              ]}
              onChange={(e) => setSelectedType(e.value)}
              placeholder="Typ wählen"
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

        {/* Inverter Table */}
        <DataTable
          value={filteredInverters}
          selection={selectedInverter}
          onSelectionChange={(e) => handleInverterSelect(e.value as Inverter)}
          selectionMode="single"
          dataKey="id"
          className="mb-4"
          emptyMessage="Keine passenden Wechselrichter gefunden"
          paginator
          rows={5}
          responsiveLayout="scroll"
          sortField="powerKw"
          sortOrder={1}
        >
          <Column field="manufacturer" header="Hersteller & Modell" body={manufacturerTemplate} />
          <Column field="powerKw" header="Leistung" body={powerTemplate} sortable />
          <Column field="type" header="Typ" body={typeTemplate} />
          <Column field="mpptChannels" header="MPPT" body={(rowData) => `${rowData.mpptChannels} Tracker`} />
          <Column header="Kompatibilität" body={compatibilityTemplate} />
          <Column field="price" header="Preis" body={priceTemplate} sortable />
          <Column body={actionTemplate} header="Aktionen" />
        </DataTable>

        {/* Selected Inverter Summary */}
        {selectedInverter && (
          <Card title="Ausgewählter Wechselrichter" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Modell</label>
                <div className="flex items-center h-10 px-3 border border-gray-300 rounded bg-gray-50">
                  <span className="font-semibold">{selectedInverter.manufacturer} {selectedInverter.model}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Leistung</label>
                <div className="flex items-center h-10 px-3 border border-gray-300 rounded bg-gray-50">
                  <span className="font-semibold text-blue-600">{selectedInverter.powerKw} kW</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Wirkungsgrad</label>
                <div className="flex items-center h-10 px-3 border border-gray-300 rounded bg-gray-50">
                  <span>{selectedInverter.efficiency}%</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Preis</label>
                <div className="flex items-center h-10 px-3 border border-gray-300 rounded bg-gray-50">
                  <span className="font-semibold text-green-600">
                    {selectedInverter.price ? `${selectedInverter.price.toFixed(0)} €` : 'Auf Anfrage'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </Card>

      {/* Inverter Details Dialog */}
      <Dialog
        header={detailInverter ? `${detailInverter.manufacturer} ${detailInverter.model}` : 'Wechselrichter Details'}
        visible={showDetailsDialog}
        onHide={() => setShowDetailsDialog(false)}
        style={{ width: '700px' }}
      >
        {detailInverter && (
          <div className="inverter-details">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h6 className="font-semibold mb-2">Leistungsdaten</h6>
                <ul className="list-none p-0 m-0">
                  <li className="flex justify-between py-1">
                    <span>AC-Leistung:</span>
                    <strong>{detailInverter.powerKw} kW</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Wirkungsgrad:</span>
                    <strong>{detailInverter.efficiency}%</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Typ:</span>
                    <strong>{detailInverter.type.replace('-', ' ')}</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>MPPT-Tracker:</span>
                    <strong>{detailInverter.mpptChannels}</strong>
                  </li>
                </ul>
              </div>
              
              <div>
                <h6 className="font-semibold mb-2">DC-Eingangsdaten</h6>
                <ul className="list-none p-0 m-0">
                  <li className="flex justify-between py-1">
                    <span>Max. DC-Spannung:</span>
                    <strong>{detailInverter.maxDcVoltage} V</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Startspannung:</span>
                    <strong>{detailInverter.startupVoltage} V</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Max. DC-Strom:</span>
                    <strong>{detailInverter.maxDcCurrent} A</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>AC-Spannung:</span>
                    <strong>{detailInverter.acVoltage} V</strong>
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
                    <strong>{detailInverter.dimensions.length}×{detailInverter.dimensions.width}×{detailInverter.dimensions.height} mm</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Gewicht:</span>
                    <strong>{detailInverter.weight} kg</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Schutzklasse:</span>
                    <strong>{detailInverter.protectionClass}</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Garantie:</span>
                    <strong>{detailInverter.warranty} Jahre</strong>
                  </li>
                </ul>
              </div>
              
              <div>
                <h6 className="font-semibold mb-2">Features & Preis</h6>
                <div className="mb-3">
                  <span className="text-sm text-gray-600">Besondere Features:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {detailInverter.features.map((feature, index) => (
                      <Tag key={index} value={feature} severity="info" />
                    ))}
                  </div>
                </div>
                <ul className="list-none p-0 m-0">
                  <li className="flex justify-between py-1">
                    <span>Preis:</span>
                    <strong>
                      {detailInverter.price ? `${detailInverter.price.toFixed(0)} €` : 'Auf Anfrage'}
                    </strong>
                  </li>
                  {detailInverter.price && (
                    <li className="flex justify-between py-1">
                      <span>Preis pro kW:</span>
                      <strong>{(detailInverter.price / detailInverter.powerKw).toFixed(0)} €/kW</strong>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}