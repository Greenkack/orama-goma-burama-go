import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

export default function HeatpumpSimulator() {
  return (
    <div className="min-h-screen p-4">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-primary mb-2">Wärmepumpen Simulator</h1>
        <p className="text-lg text-600">Berechnung und Dimensionierung von Wärmepumpen</p>
      </div>

      <div className="grid">
        <div className="col-12">
          <Message 
            severity="info" 
            text="Der Wärmepumpen Simulator wird demnächst verfügbar sein. Diese Seite wird die Berechnung und Dimensionierung von Wärmepumpen ermöglichen."
            className="w-full"
          />
        </div>

        <div className="col-12 lg:col-6">
          <Card title="Geplante Features" className="h-full">
            <ul className="list-none p-0 m-0">
              <li className="flex align-items-center py-2">
                <i className="pi pi-check-circle text-green-500 mr-2"></i>
                <span>Heizlastberechnung</span>
              </li>
              <li className="flex align-items-center py-2">
                <i className="pi pi-check-circle text-green-500 mr-2"></i>
                <span>Wärmepumpen-Dimensionierung</span>
              </li>
              <li className="flex align-items-center py-2">
                <i className="pi pi-check-circle text-green-500 mr-2"></i>
                <span>Effizienzberechnung (COP/SCOP)</span>
              </li>
              <li className="flex align-items-center py-2">
                <i className="pi pi-check-circle text-green-500 mr-2"></i>
                <span>Wirtschaftlichkeitsanalyse</span>
              </li>
              <li className="flex align-items-center py-2">
                <i className="pi pi-check-circle text-green-500 mr-2"></i>
                <span>Kombinierte PV+WP Systeme</span>
              </li>
            </ul>
          </Card>
        </div>

        <div className="col-12 lg:col-6">
          <Card title="Integration" className="h-full">
            <p className="text-600 line-height-3 mb-3">
              Der Wärmepumpen Simulator wird vollständig in die DING-App integriert und ermöglicht:
            </p>
            <ul className="list-none p-0 m-0">
              <li className="flex align-items-center py-2">
                <i className="pi pi-link text-blue-500 mr-2"></i>
                <span>Verbindung mit Kundendaten</span>
              </li>
              <li className="flex align-items-center py-2">
                <i className="pi pi-link text-blue-500 mr-2"></i>
                <span>Einbindung in PDF-Erstellung</span>
              </li>
              <li className="flex align-items-center py-2">
                <i className="pi pi-link text-blue-500 mr-2"></i>
                <span>Kombinierte Angebote PV+WP</span>
              </li>
              <li className="flex align-items-center py-2">
                <i className="pi pi-link text-blue-500 mr-2"></i>
                <span>Dashboard-Integration</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      <div className="text-center mt-6">
        <Button 
          label="Zurück zum Hauptmenü" 
          icon="pi pi-arrow-left"
          className="p-button-secondary"
          onClick={() => window.history.back()}
        />
      </div>
    </div>
  );
}