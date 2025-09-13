import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Steps } from 'primereact/steps';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import ModuleSelection from '../components/solar/ModuleSelection';
import InverterSelection from '../components/solar/InverterSelection';
import StorageSelection from '../components/solar/StorageSelection';
import AccessorySelection from '../components/solar/AccessorySelection';
import ProductSummary from '../components/solar/ProductSummary';
import type { ProductSelection } from '../../shared/types';

export default function SolarCalculator() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [productSelection, setProductSelection] = useState<ProductSelection>({
    pv_module_count: 0,
    pv_module_hersteller: '',
    pv_module_modell: '',
    pv_module_leistung_wp: 0,
    wechselrichter_hersteller: '',
    wechselrichter_modell: '',
    wechselrichter_count: 1,
    wechselrichter_leistung_kw: 0,
    speicher_enabled: false,
    wallbox_enabled: false,
    energiemanagement_enabled: false,
    notstrom_enabled: false,
    leistungsoptimierung_enabled: false,
    carport_enabled: false,
    tierabwehr_enabled: false
  });

  const steps = [
    { label: 'PV Module', icon: 'pi pi-th-large' },
    { label: 'Wechselrichter', icon: 'pi pi-cog' },
    { label: 'Speicher (opt.)', icon: 'pi pi-battery' },
    { label: 'Zubehör (opt.)', icon: 'pi pi-plus-circle' },
    { label: 'Zusammenfassung', icon: 'pi pi-check-circle' }
  ];

  const quickActions = [
    { label: 'Kundendaten', icon: 'pi pi-user', route: '/customer-data' },
    { label: 'Wärmepumpe Simulator', icon: 'pi pi-home', route: '/heatpump-simulator' },
    { label: 'Ergebnisse der Analyse', icon: 'pi pi-chart-line', route: '/results' },
    { label: 'Dashboard', icon: 'pi pi-chart-bar', route: '/dashboard' },
    { label: 'Dokumentenerstellung', icon: 'pi pi-file-pdf', route: '/documents' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCalculateStart = () => {
    // Trigger calculations and navigate to results
    navigate('/results');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ModuleSelection 
            selection={productSelection}
            onChange={setProductSelection}
          />
        );
      case 1:
        return (
          <InverterSelection 
            selection={productSelection}
            onChange={setProductSelection}
          />
        );
      case 2:
        return (
          <StorageSelection 
            selection={productSelection}
            onChange={setProductSelection}
          />
        );
      case 3:
        return (
          <AccessorySelection 
            selection={productSelection}
            onChange={setProductSelection}
          />
        );
      case 4:
        return (
          <ProductSummary 
            selection={productSelection}
            onCalculateStart={handleCalculateStart}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="flex justify-content-between align-items-center mb-4">
        <h1 className="text-4xl font-bold text-primary">Solarrechner</h1>
        <div className="flex gap-2">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              label={action.label}
              icon={action.icon}
              className="p-button-outlined"
              size="small"
              onClick={() => navigate(action.route)}
            />
          ))}
        </div>
      </div>

      <Card>
        <div className="mb-4">
          <Steps 
            model={steps} 
            activeIndex={currentStep}
            onSelect={(e) => setCurrentStep(e.index)}
            readOnly={false}
          />
        </div>

        <Divider />

        <div className="min-h-400">
          {renderStepContent()}
        </div>

        <Divider />

        <div className="flex justify-content-between pt-3">
          <Button 
            label="zurück" 
            icon="pi pi-chevron-left"
            className="p-button-secondary"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          />
          
          <div className="flex gap-2">
            <Button 
              label="zurück zum Hauptmenü" 
              icon="pi pi-home"
              className="p-button-outlined"
              onClick={() => navigate('/')}
            />
            
            {currentStep < steps.length - 1 ? (
              <Button 
                label="nächste Seite" 
                icon="pi pi-chevron-right"
                iconPos="right"
                onClick={handleNext}
              />
            ) : (
              <Button 
                label="Berechnungen starten" 
                icon="pi pi-play"
                className="p-button-success"
                onClick={handleCalculateStart}
              />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}