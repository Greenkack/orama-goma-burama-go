import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chart } from 'primereact/chart';

export default function ResultsPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Mock-Daten für Berechnungsergebnisse
  const calculationResults = [
    { parameter: 'Anlagenleistung', value: '10,5 kWp', unit: 'kWp' },
    { parameter: 'Jährlicher Ertrag', value: '10.200', unit: 'kWh' },
    { parameter: 'Eigenverbrauchsquote', value: '65', unit: '%' },
    { parameter: 'Autarkiegrad', value: '58', unit: '%' },
    { parameter: 'CO₂-Einsparung', value: '5,1', unit: 't/Jahr' },
    { parameter: 'Amortisationszeit', value: '8,5', unit: 'Jahre' }
  ];

  // Mock-Daten für Wirtschaftlichkeit
  const economicData = [
    { jahr: 1, ertrag: 850, kosten: 120, gewinn: 730 },
    { jahr: 2, ertrag: 840, kosten: 125, gewinn: 715 },
    { jahr: 3, ertrag: 835, kosten: 130, gewinn: 705 },
    { jahr: 4, ertrag: 825, kosten: 135, gewinn: 690 },
    { jahr: 5, ertrag: 820, kosten: 140, gewinn: 680 }
  ];

  // Chart-Daten für Ertragsprognose
  const chartData = {
    labels: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    datasets: [
      {
        label: 'Prognostizierter Ertrag (kWh)',
        data: [480, 620, 850, 950, 1100, 1200, 1250, 1150, 950, 720, 520, 420],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Ertrag (kWh)'
        }
      }
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-primary mb-2">Ergebnisse und Dashboard</h1>
        <p className="text-lg text-600">Berechnungsergebnisse, KPIs und Visualisierungen</p>
      </div>

      <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
        <TabPanel header="Berechnungsergebnisse" leftIcon="pi pi-calculator mr-2">
          <div className="grid">
            <div className="col-12 lg:col-8">
              <Card title="Technische Kennzahlen" className="mb-4">
                <DataTable value={calculationResults} responsiveLayout="scroll">
                  <Column field="parameter" header="Parameter" style={{ width: '60%' }}></Column>
                  <Column field="value" header="Wert" style={{ width: '25%' }}></Column>
                  <Column field="unit" header="Einheit" style={{ width: '15%' }}></Column>
                </DataTable>
              </Card>
            </div>

            <div className="col-12 lg:col-4">
              <Card title="Aktionen" className="mb-4">
                <div className="flex flex-column gap-2">
                  <Button 
                    label="PDF-Angebot erstellen" 
                    icon="pi pi-file-pdf"
                    className="p-button-success w-full"
                  />
                  <Button 
                    label="Ergebnisse exportieren" 
                    icon="pi pi-download"
                    className="p-button-info w-full"
                  />
                  <Button 
                    label="E-Mail versenden" 
                    icon="pi pi-envelope"
                    className="p-button-outlined w-full"
                  />
                  <Button 
                    label="Neue Berechnung" 
                    icon="pi pi-plus"
                    className="p-button-secondary w-full"
                  />
                </div>
              </Card>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Wirtschaftlichkeit" leftIcon="pi pi-euro mr-2">
          <div className="grid">
            <div className="col-12 lg:col-8">
              <Card title="Wirtschaftlichkeitsanalyse (erste 5 Jahre)" className="mb-4">
                <DataTable value={economicData} responsiveLayout="scroll">
                  <Column field="jahr" header="Jahr"></Column>
                  <Column 
                    field="ertrag" 
                    header="Ertrag (€)" 
                    body={(rowData) => `${rowData.ertrag} €`}
                  ></Column>
                  <Column 
                    field="kosten" 
                    header="Kosten (€)" 
                    body={(rowData) => `${rowData.kosten} €`}
                  ></Column>
                  <Column 
                    field="gewinn" 
                    header="Gewinn (€)" 
                    body={(rowData) => `${rowData.gewinn} €`}
                    style={{ fontWeight: 'bold', color: 'green' }}
                  ></Column>
                </DataTable>
              </Card>
            </div>

            <div className="col-12 lg:col-4">
              <Card title="Finanzielle Kennzahlen" className="mb-4">
                <div className="flex flex-column gap-3">
                  <div className="text-center p-3 border-round bg-green-50">
                    <div className="text-2xl font-bold text-green-600">12,8%</div>
                    <div className="text-sm text-600">Rendite (IRR)</div>
                  </div>
                  <div className="text-center p-3 border-round bg-blue-50">
                    <div className="text-2xl font-bold text-blue-600">18.540 €</div>
                    <div className="text-sm text-600">Investitionssumme</div>
                  </div>
                  <div className="text-center p-3 border-round bg-orange-50">
                    <div className="text-2xl font-bold text-orange-600">8,5 Jahre</div>
                    <div className="text-sm text-600">Amortisation</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Ertragsprognose" leftIcon="pi pi-chart-line mr-2">
          <Card title="Monatliche Ertragsprognose" className="mb-4">
            <Chart type="line" data={chartData} options={chartOptions} style={{ height: '400px' }} />
          </Card>

          <div className="grid">
            <div className="col-12 md:col-6 lg:col-3">
              <Card className="text-center">
                <div className="text-2xl font-bold text-primary">10.200 kWh</div>
                <div className="text-sm text-600">Jahresertrag</div>
              </Card>
            </div>
            <div className="col-12 md:col-6 lg:col-3">
              <Card className="text-center">
                <div className="text-2xl font-bold text-green-600">971 kWh/kWp</div>
                <div className="text-sm text-600">Spezifischer Ertrag</div>
              </Card>
            </div>
            <div className="col-12 md:col-6 lg:col-3">
              <Card className="text-center">
                <div className="text-2xl font-bold text-orange-600">1.250 kWh</div>
                <div className="text-sm text-600">Beste Monat (Juli)</div>
              </Card>
            </div>
            <div className="col-12 md:col-6 lg:col-3">
              <Card className="text-center">
                <div className="text-2xl font-bold text-blue-600">420 kWh</div>
                <div className="text-sm text-600">Schwächster Monat</div>
              </Card>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Vergleiche" leftIcon="pi pi-chart-bar mr-2">
          <div className="grid">
            <div className="col-12">
              <Card title="Szenario-Vergleich" className="mb-4">
                <p className="text-600 mb-3">
                  Vergleich verschiedener Anlagenkonfigurationen und Szenarien
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    label="Szenario hinzufügen" 
                    icon="pi pi-plus"
                    className="p-button-success"
                  />
                  <Button 
                    label="Szenarien vergleichen" 
                    icon="pi pi-chart-bar"
                    className="p-button-info"
                  />
                  <Button 
                    label="Optimierung" 
                    icon="pi pi-cog"
                    className="p-button-warning"
                  />
                </div>
              </Card>
            </div>
          </div>
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