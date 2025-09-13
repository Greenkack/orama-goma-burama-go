import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

export default function MainMenu() {
  const navigate = useNavigate();

  const menuCards = [
    {
      title: 'Berechnungen',
      description: 'PV/WP Kalkulationen und Solarrechner',
      icon: 'pi pi-calculator',
      route: '/solar-calculator',
      color: 'primary'
    },
    {
      title: 'Kundendaten',
      description: 'Eingabe und Verwaltung von Kundendaten',
      icon: 'pi pi-users',
      route: '/customer-data',
      color: 'success'
    },
    {
      title: 'Ergebnisse',
      description: 'Berechnungsergebnisse und KPIs',
      icon: 'pi pi-chart-line',
      route: '/results',
      color: 'info'
    },
    {
      title: 'Dashboard',
      description: 'Charts, Diagramme und Visualisierungen',
      icon: 'pi pi-chart-bar',
      route: '/dashboard',
      color: 'warning'
    },
    {
      title: 'Dokumentenerstellung',
      description: 'PDF-Generierung und Multi-PDF',
      icon: 'pi pi-file-pdf',
      route: '/documents',
      color: 'danger'
    },
    {
      title: 'CRM',
      description: 'Kundenprozesse und Verwaltung',
      icon: 'pi pi-briefcase',
      route: '/crm',
      color: 'secondary'
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold text-primary mb-2">DING App</h1>
        <p className="text-xl text-600">Photovoltaik & Wärmepumpen Kalkulationen</p>
      </div>

      <div className="grid grid-nogutter justify-content-center gap-4" style={{ marginTop: '2rem' }}>
        {menuCards.map((card, index) => (
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

      {/* Planungen Placeholder */}
      <div className="text-center mt-6">
        <Card className="inline-block">
          <div className="p-4">
            <i className="pi pi-cog text-4xl text-500 mb-3"></i>
            <h3 className="text-xl font-semibold text-500">Planungen</h3>
            <p className="text-500">Demnächst verfügbar</p>
          </div>
        </Card>
      </div>

      {/* Admin Bereich - Links unten */}
      <div className="fixed left-0 bottom-0 p-4">
        <Button 
          label="Adminbereich" 
          icon="pi pi-cog"
          className="p-button-secondary"
          onClick={() => navigate('/admin')}
        />
      </div>
    </div>
  );
}