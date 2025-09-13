import React, { useState, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Steps } from 'primereact/steps';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import ModuleSelection from '../components/solar/ModuleSelection';
import InverterSelection from '../components/solar/InverterSelection';
import StorageSelection from '../components/solar/StorageSelection';
import AccessorySelection from '../components/solar/AccessorySelection';
import ProductSummary from '../components/solar/ProductSummary';
import type { ProductSelection, Module, Inverter, Storage, Accessory } from '../../shared/types';

export default function SolarCalculator() {
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [productSelection, setProductSelection] = useState<ProductSelection>({
    moduleQuantity: 1,
    storageEnabled: false,
    accessories: []
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

  const handleCalculateStart = async () => {
    if (!productSelection.module || !productSelection.inverter) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Unvollständige Auswahl',
        detail: 'Bitte wählen Sie mindestens ein Modul und einen Wechselrichter aus.'
      });
      return;
    }

    setIsCalculating(true);
    
    try {
      // Prepare calculation data for Python Bridge
      const projectData = {
        project_details: {
          module_quantity: productSelection.moduleQuantity,
          selected_module_id: productSelection.module.id,
          selected_inverter_id: productSelection.inverter.id,
          include_storage: productSelection.storageEnabled,
          selected_storage_id: productSelection.storage?.id || null,
          selected_storage_storage_power_kw: productSelection.storage?.powerKw || 0,
          // Default values for calculation
          annual_consumption_kwh_yr: 4000,
          electricity_price_kwh: 0.30,
          roof_inclination_deg: 30,
          roof_orientation: "Süd",
          latitude: 48.13, // Munich default
          longitude: 11.57, // Munich default
          free_roof_area_sqm: 50,
          building_height_gt_7m: false,
          include_additional_components: productSelection.accessories.length > 0
        }
      };

      // Call Python Bridge API
      const result = await window.electronAPI.python.calculate(projectData);
      
      if (result.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Berechnung erfolgreich',
          detail: 'Die Wirtschaftlichkeitsberechnung wurde abgeschlossen.'
        });
        
        // Store results in sessionStorage for ResultsPage
        sessionStorage.setItem('calculationResults', JSON.stringify(result.data));
        sessionStorage.setItem('productSelection', JSON.stringify(productSelection));
        
        // Navigate to results page
        navigate('/results');
      } else {
        throw new Error(result.error || 'Unbekannter Berechnungsfehler');
      }
    } catch (error) {
      console.error('Calculation error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Berechnungsfehler',
        detail: error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten.'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ModuleSelection 
            selectedModule={productSelection.module}
            onModuleSelect={(module: Module) => setProductSelection(prev => ({ ...prev, module }))}
            quantity={productSelection.moduleQuantity}
            onQuantityChange={(quantity: number) => setProductSelection(prev => ({ ...prev, moduleQuantity: quantity }))}
          />
        );
      case 1:
        return (
          <InverterSelection 
            selectedInverter={productSelection.inverter}
            onInverterSelect={(inverter: Inverter) => setProductSelection(prev => ({ ...prev, inverter }))}
            systemSize={productSelection.module ? (productSelection.module.powerWp * productSelection.moduleQuantity) / 1000 : 0}
          />
        );
      case 2:
        return (
          <StorageSelection 
            selectedStorage={productSelection.storage || null}
            onStorageSelect={(storage: Storage | null) => setProductSelection(prev => ({ ...prev, storage }))}
            enabled={productSelection.storageEnabled}
            onEnabledChange={(enabled: boolean) => setProductSelection(prev => ({ ...prev, storageEnabled: enabled }))}
            systemSize={productSelection.module ? (productSelection.module.powerWp * productSelection.moduleQuantity) / 1000 : 0}
          />
        );
      case 3:
        return (
          <AccessorySelection 
            selectedAccessories={productSelection.accessories}
            onAccessoriesChange={(accessories: Accessory[]) => setProductSelection(prev => ({ ...prev, accessories }))}
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
      <Toast ref={toast} />
      
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
          {isCalculating ? (
            <div className="flex justify-content-center align-items-center h-20rem">
              <div className="text-center">
                <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
                <p className="mt-3">Berechnung läuft...</p>
                <p className="text-sm text-600">Bitte warten Sie, während die Wirtschaftlichkeitsberechnung durchgeführt wird.</p>
              </div>
            </div>
          ) : (
            renderStepContent()
          )}
        </div>

        <Divider />

        <div className="flex justify-content-between pt-3">
          <Button 
            label="zurück" 
            icon="pi pi-chevron-left"
            className="p-button-secondary"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isCalculating}
          />
          
          <div className="flex gap-2">
            <Button 
              label="zurück zum Hauptmenü" 
              icon="pi pi-home"
              className="p-button-outlined"
              onClick={() => navigate('/')}
              disabled={isCalculating}
            />
            
            {currentStep < steps.length - 1 ? (
              <Button 
                label="nächste Seite" 
                icon="pi pi-chevron-right"
                iconPos="right"
                onClick={handleNext}
                disabled={isCalculating}
              />
            ) : (
              <Button 
                label={isCalculating ? "Berechnung läuft..." : "Berechnungen starten"}
                icon={isCalculating ? "pi pi-spin pi-spinner" : "pi pi-play"}
                className="p-button-success"
                onClick={handleCalculateStart}
                disabled={isCalculating || !productSelection.module || !productSelection.inverter}
                loading={isCalculating}
              />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}