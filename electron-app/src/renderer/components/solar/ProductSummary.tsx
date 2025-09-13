import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import type { ProductSelection } from '../../../shared/types';

interface ProductSummaryProps {
  selection: ProductSelection;
  onCalculateStart: () => void;
}

export default function ProductSummary({ selection, onCalculateStart }: ProductSummaryProps) {
  const calculateTotalPrice = (): number => {
    let total = 0;
    
    // Module cost
    if (selection.module?.pricePerWp) {
      total += selection.module.pricePerWp * selection.module.powerWp * selection.moduleQuantity;
    }
    
    // Inverter cost
    if (selection.inverter?.price) {
      total += selection.inverter.price;
    }
    
    // Storage cost
    if (selection.storage?.price && selection.storageEnabled) {
      total += selection.storage.price;
    }
    
    // Accessories cost
    selection.accessories.forEach(accessory => {
      total += accessory.price;
    });
    
    return total;
  };

  const totalSystemPower = selection.module 
    ? (selection.module.powerWp * selection.moduleQuantity) / 1000 
    : 0;

  return (
    <div className="product-summary">
      <Card title="Anlagen-Zusammenfassung" className="mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Overview */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Systemübersicht</h4>
            
            <div className="space-y-3">
              <div className="p-3 border border-blue-200 rounded bg-blue-50">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Gesamtleistung:</span>
                  <span className="text-lg font-bold text-blue-700">
                    {totalSystemPower.toFixed(2)} kWp
                  </span>
                </div>
              </div>
              
              <div className="p-3 border border-green-200 rounded bg-green-50">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Geschätzte Kosten:</span>
                  <span className="text-lg font-bold text-green-700">
                    {calculateTotalPrice().toFixed(0)} €
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Component Details */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Komponenten</h4>
            
            <div className="space-y-4">
              {/* Module */}
              {selection.module && (
                <div className="p-3 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h6 className="font-semibold">PV-Module</h6>
                      <p className="text-sm text-gray-600">
                        {selection.module.manufacturer} {selection.module.model}
                      </p>
                    </div>
                    <Tag value={`${selection.moduleQuantity}x ${selection.module.powerWp}Wp`} severity="info" />
                  </div>
                  <div className="text-xs text-gray-500">
                    Gesamt: {(selection.module.powerWp * selection.moduleQuantity).toLocaleString()} Wp
                  </div>
                </div>
              )}

              {/* Inverter */}
              {selection.inverter && (
                <div className="p-3 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h6 className="font-semibold">Wechselrichter</h6>
                      <p className="text-sm text-gray-600">
                        {selection.inverter.manufacturer} {selection.inverter.model}
                      </p>
                    </div>
                    <Tag value={`${selection.inverter.powerKw} kW`} severity="success" />
                  </div>
                  <div className="text-xs text-gray-500">
                    Typ: {selection.inverter.type}, Effizienz: {selection.inverter.efficiency}%
                  </div>
                </div>
              )}

              {/* Storage */}
              {selection.storage && selection.storageEnabled && (
                <div className="p-3 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h6 className="font-semibold">Batteriespeicher</h6>
                      <p className="text-sm text-gray-600">
                        {selection.storage.manufacturer} {selection.storage.model}
                      </p>
                    </div>
                    <Tag value={`${selection.storage.usableCapacity} kWh`} severity="warning" />
                  </div>
                  <div className="text-xs text-gray-500">
                    Technologie: {selection.storage.technology}, Leistung: {selection.storage.powerKw} kW
                  </div>
                </div>
              )}

              {/* Accessories */}
              {selection.accessories.length > 0 && (
                <div className="p-3 border rounded">
                  <h6 className="font-semibold mb-2">Zubehör ({selection.accessories.length})</h6>
                  <div className="space-y-1">
                    {selection.accessories.slice(0, 3).map((accessory, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{accessory.name}</span>
                        <span className="text-gray-600">{accessory.price} €</span>
                      </div>
                    ))}
                    {selection.accessories.length > 3 && (
                      <div className="text-xs text-gray-500">
                        ... und {selection.accessories.length - 3} weitere
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Divider />

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Ihre Konfiguration ist bereit für die Wirtschaftlichkeitsberechnung
          </div>
          
          <div className="flex gap-3">
            <Button
              label="Konfiguration speichern"
              icon="pi pi-save"
              severity="secondary"
              outlined
              disabled
              tooltip="Noch nicht implementiert"
            />
            <Button
              label="Berechnung starten"
              icon="pi pi-calculator"
              size="large"
              onClick={onCalculateStart}
              disabled={!selection.module || !selection.inverter}
              tooltip={!selection.module || !selection.inverter ? "Mindestens Modul und Wechselrichter müssen ausgewählt sein" : ""}
            />
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      <Card title="Empfehlungen & Hinweise" className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 border border-yellow-200 rounded bg-yellow-50">
            <h6 className="font-semibold text-yellow-700 mb-2">
              <i className="pi pi-exclamation-triangle mr-2"></i>
              Wichtige Hinweise
            </h6>
            <ul className="text-sm space-y-1">
              <li>• Preise sind Richtpreise ohne Montage und Installation</li>
              <li>• Förderungen und Steuervorteile nicht berücksichtigt</li>
              <li>• Finale Auslegung sollte von Fachbetrieb geprüft werden</li>
            </ul>
          </div>

          <div className="p-3 border border-blue-200 rounded bg-blue-50">
            <h6 className="font-semibold text-blue-700 mb-2">
              <i className="pi pi-lightbulb mr-2"></i>
              Optimierungsvorschläge
            </h6>
            <ul className="text-sm space-y-1">
              {!selection.storageEnabled && (
                <li>• Batteriespeicher erhöht den Eigenverbrauch</li>
              )}
              {selection.accessories.length === 0 && (
                <li>• Monitoring-System für optimale Überwachung</li>
              )}
              <li>• Wallbox für günstige Elektromobilität</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}