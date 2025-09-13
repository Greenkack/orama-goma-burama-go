import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

export default function MainMenu() {
  const navigate = useNavigate();

  const mainMenuCards = [
    {
      title: 'Kundendaten & Bedarfsanalyse',
      description: 'Kundendaten erfassen und Energiebedarf analysieren',
      icon: 'pi pi-users',
      route: '/customer-data',
      color: 'primary'
    },
    {
      title: 'Solar Calculator',
      description: 'PV-Anlagen Kalkulation und Produktauswahl',
      icon: 'pi pi-calculator',
      route: '/solar-calculator',
      color: 'success'
    },
    {
      title: 'Wärmepumpen Simulator',
      description: 'Wärmepumpen Berechnung und Dimensionierung',
      icon: 'pi pi-home',
      route: '/heatpump-simulator',
      color: 'info'
    },
    {
      title: 'Ergebnisse und Dashboard',
      description: 'Berechnungsergebnisse, KPIs und Visualisierungen',
      icon: 'pi pi-chart-line',
      route: '/results',
      color: 'warning'
    },
    {
      title: 'CRM',
      description: 'Kundenprozesse, Pipeline und Verwaltung',
      icon: 'pi pi-briefcase',
      route: '/crm',
      color: 'danger'
    },
    {
      title: 'Dokumentenerstellung',
      description: 'PDF-Generierung, Angebote und Multi-PDF',
      icon: 'pi pi-file-pdf',
      route: '/documents',
      color: 'secondary'
    },
    {
      title: 'Produktdatenbank',
      description: 'Produkte verwalten, Excel Import und CRUD',
      icon: 'pi pi-database',
      route: '/product-database',
      color: 'help'
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold text-primary mb-2">DING App</h1>
        <p className="text-xl text-600">Photovoltaik & Wärmepumpen Kalkulationen</p>
      </div>

      <div className="grid grid-nogutter justify-content-center gap-4" style={{ marginTop: '2rem' }}>
        {mainMenuCards.map((card, index) => (
          <div key={index} className="col-12 md:col-6 lg:col-4">
            <Card 
              className={`h-full cursor-pointer transition-all transition-duration-300 hover:shadow-4 border-1 surface-border`}
              onClick={() => navigate(card.route)}
            >
              <div className="text-center p-4">
                <div className={`inline-flex align-items-center justify-content-center border-circle mb-3`} 
                     style={{ width: '4rem', height: '4rem', backgroundColor: 'var(--primary-color)', color: 'white' }}>
                  <i className={`${card.icon} text-2xl`}></i>
                </div>
                <h3 className="text-2xl font-semibold mb-2">{card.title}</h3>
                <p className="text-600 line-height-3">{card.description}</p>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Einstellungen & Adminbereich - Links unten, kleiner als Hauptmenüs */}
      <div className="fixed left-0 bottom-0 p-4">
        <Card className="inline-block cursor-pointer hover:shadow-2 transition-all transition-duration-300">
          <div className="p-3" onClick={() => navigate('/admin')}>
            <div className="flex align-items-center gap-2">
              <i className="pi pi-cog text-lg text-600"></i>
              <div>
                <h4 className="text-sm font-semibold mb-1 text-700">Einstellungen & Adminbereich</h4>
                <p className="text-xs text-500 m-0">Datenbank, Konfiguration & Admin-Tools</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}