import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { Accordion, AccordionTab } from 'primereact/accordion';
import type { Accessory, AccessorySelectionProps } from '../../../shared/types';

const MOCK_ACCESSORIES: Accessory[] = [
  // Wallboxen
  {
    id: 'wb-1',
    name: 'Heidelberg Energy Control',
    category: 'wallbox',
    manufacturer: 'Heidelberg',
    model: 'Energy Control',
    power: 11,
    price: 1299,
    features: ['3-phasig', 'RFID', 'App-Steuerung', 'MID-Zähler'],
    description: 'Intelligente Wallbox mit Lastmanagement',
    specifications: {
      chargingPower: [3.7, 7.4, 11],
      connectorType: 'Typ 2',
      installationType: 'Wandmontage',
      protection: 'IP54',
      dimensions: { length: 240, width: 290, height: 103 }
    }
  },
  {
    id: 'wb-2',
    name: 'go-eCharger HOMEfix',
    category: 'wallbox',
    manufacturer: 'go-e',
    model: 'HOMEfix 11kW',
    power: 11,
    price: 799,
    features: ['WiFi', 'App', 'Lastmanagement', 'PV-Überschuss'],
    description: 'Kompakte Wallbox mit PV-Integration',
    specifications: {
      chargingPower: [1.4, 3.7, 7.4, 11],
      connectorType: 'Typ 2',
      installationType: 'Wandmontage',
      protection: 'IP54',
      dimensions: { length: 225, width: 165, height: 100 }
    }
  },
  {
    id: 'wb-3',
    name: 'KEBA KeContact P30',
    category: 'wallbox',
    manufacturer: 'KEBA',
    model: 'KeContact P30',
    power: 22,
    price: 1899,
    features: ['22kW', 'Display', 'RFID', 'Ethernet'],
    description: 'Professionelle Wallbox für höchste Ansprüche',
    specifications: {
      chargingPower: [3.7, 7.4, 11, 22],
      connectorType: 'Typ 2',
      installationType: 'Wandmontage',
      protection: 'IP54',
      dimensions: { length: 312, width: 195, height: 110 }
    }
  },
  
  // Monitoring
  {
    id: 'mon-1',
    name: 'SolarEdge Monitoring',
    category: 'monitoring',
    manufacturer: 'SolarEdge',
    model: 'Monitoring Portal',
    power: 0,
    price: 299,
    features: ['Web-Portal', 'App', 'Modul-Level', 'Alerts'],
    description: 'Umfassendes Anlagen-Monitoring',
    specifications: {
      monitoringLevel: 'Modul-Level',
      connectivity: 'Ethernet/WiFi',
      dataRetention: '25 Jahre'
    }
  },
  {
    id: 'mon-2',
    name: 'Fronius Solar.web',
    category: 'monitoring',
    manufacturer: 'Fronius',
    model: 'Solar.web live',
    power: 0,
    price: 199,
    features: ['Webportal', 'App', 'String-Level', 'Prognose'],
    description: 'Intelligentes Monitoring mit Prognosen',
    specifications: {
      monitoringLevel: 'String-Level',
      connectivity: 'Ethernet/WiFi',
      dataRetention: '20 Jahre'
    }
  },

  // Energiemanagement
  {
    id: 'em-1',
    name: 'SMA Sunny Home Manager',
    category: 'energy_management',
    manufacturer: 'SMA',
    model: 'Sunny Home Manager 2.0',
    power: 0,
    price: 699,
    features: ['Verbrauchsoptimierung', 'Prognose', 'Smart Home'],
    description: 'Intelligentes Energiemanagement-System',
    specifications: {
      connectivity: 'Ethernet/WiFi',
      compatibility: 'SMA Wechselrichter',
      functions: ['Lastmanagement', 'Wetterprognose', 'Verbrauchsoptimierung']
    }
  },
  {
    id: 'em-2',
    name: 'SENEC.Grid',
    category: 'energy_management',
    manufacturer: 'SENEC',
    model: 'SENEC.Grid',
    power: 0,
    price: 499,
    features: ['Cloud-Service', 'Stromhandel', 'Community'],
    description: 'Energie-Community und Handel',
    specifications: {
      connectivity: 'Internet',
      compatibility: 'SENEC Speicher',
      functions: ['Stromhandel', 'Community', 'Backup']
    }
  },

  // Optimierer
  {
    id: 'opt-1',
    name: 'SolarEdge Optimierer',
    category: 'optimizer',
    manufacturer: 'SolarEdge',
    model: 'P730',
    power: 730,
    price: 89,
    features: ['Modul-Level', 'Monitoring', 'Sicherheit'],
    description: 'Leistungsoptimierer für maximalen Ertrag',
    specifications: {
      maxPower: 730,
      efficiency: 99.5,
      warranty: 25,
      compatibility: 'SolarEdge Wechselrichter'
    }
  },
  {
    id: 'opt-2',
    name: 'Tigo TS4-A-O',
    category: 'optimizer',
    manufacturer: 'Tigo',
    model: 'TS4-A-O',
    power: 700,
    price: 75,
    features: ['Rapid Shutdown', 'Monitoring', 'Universal'],
    description: 'Universeller Optimierer mit Sicherheitsfunktion',
    specifications: {
      maxPower: 700,
      efficiency: 99.5,
      warranty: 25,
      compatibility: 'String Wechselrichter'
    }
  },

  // Sicherheit & Installation
  {
    id: 'safe-1',
    name: 'DC-Freischalter',
    category: 'safety',
    manufacturer: 'ABB',
    model: 'DC Switch 32A',
    power: 0,
    price: 149,
    features: ['32A', 'IP65', 'UV-beständig'],
    description: 'DC-Freischalter für Wartungsarbeiten',
    specifications: {
      current: 32,
      voltage: 1000,
      protection: 'IP65'
    }
  },
  {
    id: 'safe-2',
    name: 'AC-Überspannungsschutz',
    category: 'safety',
    manufacturer: 'Phoenix Contact',
    model: 'FLT-SEC-T1+T2',
    power: 0,
    price: 89,
    features: ['Typ 1+2', '3-phasig', 'LED-Anzeige'],
    description: 'Überspannungsschutz für AC-Seite',
    specifications: {
      type: 'Typ 1+2',
      phases: 3,
      maxVoltage: 440
    }
  },

  // Kabel & Montage
  {
    id: 'cable-1',
    name: 'DC-Kabel Set',
    category: 'installation',
    manufacturer: 'Stäubli',
    model: 'MC4 Kabel 6mm²',
    power: 0,
    price: 3.5,
    features: ['MC4', '6mm²', 'UV-beständig', '25J Garantie'],
    description: 'Hochwertige DC-Verkabelung (Preis pro Meter)',
    specifications: {
      crossSection: 6,
      connector: 'MC4',
      temperature: '-40°C bis +90°C',
      warranty: 25
    }
  },
  {
    id: 'mount-1',
    name: 'Dachhaken Ziegel',
    category: 'installation',
    manufacturer: 'K2 Systems',
    model: 'K2 Dachhaken Ziegel',
    power: 0,
    price: 12,
    features: ['Edelstahl', 'Universell', 'EPDM-Dichtung'],
    description: 'Universeller Dachhaken für Ziegeldächer',
    specifications: {
      material: 'Edelstahl',
      roofType: 'Ziegel',
      warranty: 20
    }
  }
];

const CATEGORY_LABELS = {
  wallbox: 'Wallbox / Ladestation',
  monitoring: 'Monitoring',
  energy_management: 'Energiemanagement',
  optimizer: 'Leistungsoptimierer',
  safety: 'Sicherheit & Schutz',
  installation: 'Installation & Montage'
};

export default function AccessorySelection({ 
  selectedAccessories, 
  onAccessoriesChange 
}: AccessorySelectionProps) {
  const [accessories] = useState<Accessory[]>(MOCK_ACCESSORIES);
  const [filteredAccessories, setFilteredAccessories] = useState<Accessory[]>(MOCK_ACCESSORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailAccessory, setDetailAccessory] = useState<Accessory | null>(null);
  const [accessoryQuantities, setAccessoryQuantities] = useState<Record<string, number>>({});

  // Get unique values for filters
  const categories = Array.from(new Set(accessories.map(a => a.category))).sort();
  const manufacturers = Array.from(new Set(accessories.map(a => a.manufacturer))).sort();

  // Filter accessories based on criteria
  useEffect(() => {
    let filtered = accessories;

    if (selectedCategory) {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    if (selectedManufacturer) {
      filtered = filtered.filter(a => a.manufacturer === selectedManufacturer);
    }

    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAccessories(filtered);
  }, [accessories, selectedCategory, selectedManufacturer, searchTerm]);

  // Group accessories by category
  const groupedAccessories = filteredAccessories.reduce((groups, accessory) => {
    const category = accessory.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(accessory);
    return groups;
  }, {} as Record<string, Accessory[]>);

  const handleAccessoryToggle = (accessory: Accessory, checked: boolean) => {
    let updatedAccessories = [...selectedAccessories];
    
    if (checked) {
      // Add accessory if not already selected
      if (!updatedAccessories.find(a => a.id === accessory.id)) {
        updatedAccessories.push(accessory);
        // Set default quantity
        setAccessoryQuantities(prev => ({
          ...prev,
          [accessory.id]: 1
        }));
      }
    } else {
      // Remove accessory
      updatedAccessories = updatedAccessories.filter(a => a.id !== accessory.id);
      // Remove quantity
      setAccessoryQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[accessory.id];
        return newQuantities;
      });
    }

    onAccessoriesChange(updatedAccessories);
  };

  const handleQuantityChange = (accessoryId: string, quantity: number) => {
    setAccessoryQuantities(prev => ({
      ...prev,
      [accessoryId]: Math.max(1, quantity || 1)
    }));
  };

  const showAccessoryDetails = (accessory: Accessory) => {
    setDetailAccessory(accessory);
    setShowDetailsDialog(true);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedManufacturer('');
    setSearchTerm('');
  };

  const isAccessorySelected = (accessory: Accessory): boolean => {
    return selectedAccessories.some((a: Accessory) => a.id === accessory.id);
  };

  const getQuantity = (accessoryId: string): number => {
    return accessoryQuantities[accessoryId] || 1;
  };

  const getTotalPrice = (): number => {
    return selectedAccessories.reduce((total: number, accessory: Accessory) => {
      const quantity = getQuantity(accessory.id);
      return total + (accessory.price * quantity);
    }, 0);
  };

  // Column templates
  const nameTemplate = (rowData: Accessory) => (
    <div>
      <div className="font-semibold">{rowData.name}</div>
      <div className="text-sm text-gray-600">{rowData.manufacturer}</div>
    </div>
  );

  const categoryTemplate = (rowData: Accessory) => (
    <Tag 
      value={CATEGORY_LABELS[rowData.category as keyof typeof CATEGORY_LABELS] || rowData.category} 
      severity="info"
    />
  );

  const priceTemplate = (rowData: Accessory) => (
    <div className="text-center">
      <span className="font-semibold">{rowData.price.toFixed(2)} €</span>
      {rowData.category === 'installation' && rowData.id.includes('cable') && (
        <div className="text-xs text-gray-500">pro Meter</div>
      )}
    </div>
  );

  const featuresTemplate = (rowData: Accessory) => (
    <div className="flex flex-wrap gap-1">
      {rowData.features.slice(0, 3).map((feature: string, index: number) => (
        <Tag key={index} value={feature} severity="secondary" className="text-xs" />
      ))}
      {rowData.features.length > 3 && (
        <Tag value={`+${rowData.features.length - 3}`} severity="secondary" className="text-xs" />
      )}
    </div>
  );

  const actionTemplate = (rowData: Accessory) => {
    const isSelected = isAccessorySelected(rowData);
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          checked={isSelected}
          onChange={(e) => handleAccessoryToggle(rowData, e.checked || false)}
        />
        {isSelected && (
          <InputNumber
            value={getQuantity(rowData.id)}
            onValueChange={(e) => handleQuantityChange(rowData.id, e.value || 1)}
            min={1}
            max={100}
            size={1}
            className="w-16"
          />
        )}
        <Button
          icon="pi pi-info-circle"
          size="small"
          outlined
          onClick={() => showAccessoryDetails(rowData)}
          tooltip="Details anzeigen"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  return (
    <div className="accessory-selection">
      <Card title="Zubehör & Zusatzkomponenten" className="mb-4">
        {/* Info Message */}
        <Message 
          severity="info" 
          text="Wählen Sie optionales Zubehör für Ihre PV-Anlage. Wallboxen, Monitoring und Energiemanagement erhöhen den Nutzen Ihrer Anlage erheblich."
          className="mb-4"
        />

        {/* Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Kategorie</label>
            <Dropdown
              value={selectedCategory}
              options={[
                { label: 'Alle Kategorien', value: '' },
                ...categories.map(c => ({ 
                  label: CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS] || c, 
                  value: c 
                }))
              ]}
              onChange={(e) => setSelectedCategory(e.value)}
              placeholder="Kategorie wählen"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Hersteller</label>
            <Dropdown
              value={selectedManufacturer}
              options={[
                { label: 'Alle Hersteller', value: '' },
                ...manufacturers.map(m => ({ label: m, value: m }))
              ]}
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
              placeholder="Name oder Beschreibung"
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

        {/* Accessories by Category */}
        <Accordion multiple>
          {Object.entries(groupedAccessories).map(([category, categoryAccessories]) => (
            <AccordionTab 
              key={category} 
              header={`${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category} (${(categoryAccessories as Accessory[]).length})`}
            >
              <DataTable
                value={categoryAccessories as Accessory[]}
                className="mb-2"
                emptyMessage="Keine Zubehörteile in dieser Kategorie gefunden"
                size="small"
              >
                <Column field="name" header="Produkt" body={nameTemplate} />
                <Column field="description" header="Beschreibung" />
                <Column field="price" header="Preis" body={priceTemplate} />
                <Column field="features" header="Features" body={featuresTemplate} />
                <Column body={actionTemplate} header="Auswahl" />
              </DataTable>
            </AccordionTab>
          ))}
        </Accordion>

        {/* Selected Accessories Summary */}
        {selectedAccessories.length > 0 && (
          <Card title="Ausgewähltes Zubehör" className="mt-4">
            <DataTable
              value={selectedAccessories}
              className="mb-4"
              emptyMessage="Kein Zubehör ausgewählt"
            >
              <Column field="name" header="Produkt" body={nameTemplate} />
              <Column field="category" header="Kategorie" body={categoryTemplate} />
              <Column 
                header="Menge" 
                body={(rowData) => (
                  <InputNumber
                    value={getQuantity(rowData.id)}
                    onValueChange={(e) => handleQuantityChange(rowData.id, e.value || 1)}
                    min={1}
                    max={100}
                    size={1}
                    className="w-20"
                  />
                )}
              />
              <Column 
                header="Einzelpreis" 
                body={(rowData) => (
                  <span>{rowData.price.toFixed(2)} €</span>
                )}
              />
              <Column 
                header="Gesamtpreis" 
                body={(rowData) => (
                  <span className="font-semibold">
                    {(rowData.price * getQuantity(rowData.id)).toFixed(2)} €
                  </span>
                )}
              />
              <Column 
                body={(rowData) => (
                  <Button
                    icon="pi pi-times"
                    size="small"
                    severity="danger"
                    outlined
                    onClick={() => handleAccessoryToggle(rowData, false)}
                    tooltip="Entfernen"
                  />
                )}
                header="Entfernen"
              />
            </DataTable>

            {/* Total Price */}
            <div className="flex justify-end">
              <div className="p-3 bg-blue-50 rounded">
                <span className="text-lg font-semibold text-blue-700">
                  Gesamtpreis Zubehör: {getTotalPrice().toFixed(2)} €
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Recommendations */}
        <Card title="Empfehlungen" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-blue-200 rounded bg-blue-50">
              <h6 className="font-semibold text-blue-700 mb-2">
                <i className="pi pi-car mr-2"></i>
                Elektromobilität
              </h6>
              <p className="text-sm mb-2">
                Eine Wallbox ermöglicht das günstige Laden Ihres Elektroautos mit eigenem Solarstrom.
              </p>
              <p className="text-xs text-gray-600">
                Empfohlen: 11 kW Ladeleistung für optimale Ladezeiten
              </p>
            </div>

            <div className="p-4 border border-green-200 rounded bg-green-50">
              <h6 className="font-semibold text-green-700 mb-2">
                <i className="pi pi-chart-line mr-2"></i>
                Monitoring
              </h6>
              <p className="text-sm mb-2">
                Überwachen Sie Ihre Anlage und optimieren Sie den Eigenverbrauch.
              </p>
              <p className="text-xs text-gray-600">
                Empfohlen: Modul-Level Monitoring für maximale Transparenz
              </p>
            </div>

            <div className="p-4 border border-purple-200 rounded bg-purple-50">
              <h6 className="font-semibold text-purple-700 mb-2">
                <i className="pi pi-cog mr-2"></i>
                Energiemanagement
              </h6>
              <p className="text-sm mb-2">
                Intelligente Steuerung für optimalen Eigenverbrauch und Kosteneinsparung.
              </p>
              <p className="text-xs text-gray-600">
                Empfohlen: Besonders sinnvoll bei Speicher und Wallbox
              </p>
            </div>
          </div>
        </Card>
      </Card>

      {/* Accessory Details Dialog */}
      <Dialog
        header={detailAccessory ? detailAccessory.name : 'Zubehör Details'}
        visible={showDetailsDialog}
        onHide={() => setShowDetailsDialog(false)}
        style={{ width: '700px' }}
      >
        {detailAccessory && (
          <div className="accessory-details">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h6 className="font-semibold mb-2">Produktinformationen</h6>
                <ul className="list-none p-0 m-0">
                  <li className="flex justify-between py-1">
                    <span>Hersteller:</span>
                    <strong>{detailAccessory.manufacturer}</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Modell:</span>
                    <strong>{detailAccessory.model}</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Kategorie:</span>
                    <strong>{CATEGORY_LABELS[detailAccessory.category as keyof typeof CATEGORY_LABELS] || detailAccessory.category}</strong>
                  </li>
                  {detailAccessory.power > 0 && (
                    <li className="flex justify-between py-1">
                      <span>Leistung:</span>
                      <strong>{detailAccessory.power} {detailAccessory.category === 'wallbox' ? 'kW' : 'W'}</strong>
                    </li>
                  )}
                  <li className="flex justify-between py-1">
                    <span>Preis:</span>
                    <strong>{detailAccessory.price.toFixed(2)} €</strong>
                  </li>
                </ul>
              </div>
              
              <div>
                <h6 className="font-semibold mb-2">Technische Spezifikationen</h6>
                <ul className="list-none p-0 m-0">
                  {Object.entries(detailAccessory.specifications || {}).map(([key, value]) => (
                    <li key={key} className="flex justify-between py-1">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                      <strong>
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                        {typeof value === 'object' && value !== null && !Array.isArray(value) ? 
                          JSON.stringify(value) : ''}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <Divider />
            
            <div>
              <h6 className="font-semibold mb-2">Beschreibung</h6>
              <p className="text-sm text-gray-700 mb-3">{detailAccessory.description}</p>
              
              <h6 className="font-semibold mb-2">Features</h6>
              <div className="flex flex-wrap gap-2">
                {detailAccessory.features.map((feature: string, index: number) => (
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