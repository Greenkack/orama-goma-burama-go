import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { DatabaseManager } from '../components/database/DatabaseManager';

export default function AdminArea() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="min-h-screen p-4">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-primary mb-2">Einstellungen & Adminbereich</h1>
        <p className="text-lg text-600">Konfiguration, Datenbank-Verwaltung und Admin-Tools</p>
      </div>

      <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
        <TabPanel header="Datenbank-Verwaltung" leftIcon="pi pi-database mr-2">
          <DatabaseManager />
        </TabPanel>

        <TabPanel header="Anwendungseinstellungen" leftIcon="pi pi-cog mr-2">
          <div className="grid">
            <div className="col-12 lg:col-6">
              <Card title="Allgemeine Einstellungen" className="h-full">
                <div className="flex flex-column gap-3">
                  <Button 
                    label="Sprache ändern" 
                    icon="pi pi-globe"
                    className="p-button-outlined w-full"
                  />
                  <Button 
                    label="Theme wechseln" 
                    icon="pi pi-palette"
                    className="p-button-outlined w-full"
                  />
                  <Button 
                    label="Standard-Werte setzen" 
                    icon="pi pi-refresh"
                    className="p-button-outlined w-full"
                  />
                </div>
              </Card>
            </div>

            <div className="col-12 lg:col-6">
              <Card title="System-Informationen" className="h-full">
                <div className="flex flex-column gap-2">
                  <div className="flex justify-content-between">
                    <span className="font-semibold">Version:</span>
                    <span>1.0.0</span>
                  </div>
                  <div className="flex justify-content-between">
                    <span className="font-semibold">Plattform:</span>
                    <span>Electron App</span>
                  </div>
                  <div className="flex justify-content-between">
                    <span className="font-semibold">Framework:</span>
                    <span>React + TypeScript</span>
                  </div>
                  <div className="flex justify-content-between">
                    <span className="font-semibold">UI-Library:</span>
                    <span>PrimeReact</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Benutzer-Verwaltung" leftIcon="pi pi-users mr-2">
          <Card title="Benutzer-Verwaltung" className="mb-4">
            <p className="text-600 mb-3">Verwaltung von Benutzern und Berechtigungen</p>
            <div className="flex gap-2">
              <Button 
                label="Neuer Benutzer" 
                icon="pi pi-user-plus"
                className="p-button-success"
              />
              <Button 
                label="Benutzer verwalten" 
                icon="pi pi-users"
                className="p-button-outlined"
              />
              <Button 
                label="Berechtigungen" 
                icon="pi pi-shield"
                className="p-button-outlined"
              />
            </div>
          </Card>
        </TabPanel>

        <TabPanel header="Backup & Export" leftIcon="pi pi-download mr-2">
          <div className="grid">
            <div className="col-12 lg:col-6">
              <Card title="Datenbank Backup" className="h-full">
                <p className="text-600 mb-3">Erstellen und Wiederherstellen von Datenbank-Backups</p>
                <div className="flex flex-column gap-2">
                  <Button 
                    label="Backup erstellen" 
                    icon="pi pi-download"
                    className="p-button-success w-full"
                  />
                  <Button 
                    label="Backup wiederherstellen" 
                    icon="pi pi-upload"
                    className="p-button-warning w-full"
                  />
                  <Button 
                    label="Backup-Verlauf" 
                    icon="pi pi-history"
                    className="p-button-outlined w-full"
                  />
                </div>
              </Card>
            </div>

            <div className="col-12 lg:col-6">
              <Card title="Daten Export" className="h-full">
                <p className="text-600 mb-3">Export von Projekten und Berechnungen</p>
                <div className="flex flex-column gap-2">
                  <Button 
                    label="Projekte exportieren" 
                    icon="pi pi-file-export"
                    className="p-button-info w-full"
                  />
                  <Button 
                    label="Produktdaten exportieren" 
                    icon="pi pi-table"
                    className="p-button-info w-full"
                  />
                  <Button 
                    label="Vollständiger Export" 
                    icon="pi pi-file-excel"
                    className="p-button-outlined w-full"
                  />
                </div>
              </Card>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Logs & Monitoring" leftIcon="pi pi-chart-line mr-2">
          <Card title="System-Monitoring" className="mb-4">
            <p className="text-600 mb-3">Überwachung der Anwendungsleistung und Fehlerbehandlung</p>
            <div className="flex gap-2 flex-wrap">
              <Button 
                label="Anwendungs-Logs" 
                icon="pi pi-file"
                className="p-button-outlined"
              />
              <Button 
                label="Performance Monitor" 
                icon="pi pi-chart-line"
                className="p-button-outlined"
              />
              <Button 
                label="Fehler-Protokoll" 
                icon="pi pi-exclamation-triangle"
                className="p-button-outlined"
              />
              <Button 
                label="Logs löschen" 
                icon="pi pi-trash"
                className="p-button-danger"
              />
            </div>
          </Card>
        </TabPanel>
      </TabView>

      <div className="text-center mt-6">
        <Button 
          label="Zurück zum Hauptmenü" 
          icon="pi pi-arrow-left"
          className="p-button-secondary"
          onClick={() => window.location.hash = '/'}
        />
      </div>
    </div>
  );
}