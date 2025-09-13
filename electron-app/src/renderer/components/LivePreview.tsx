import React, { useState } from 'react';
import { Panel } from 'primereact/panel';
import { Slider } from 'primereact/slider';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import type { SimulationSettings } from '../../shared/types';

export default function LivePreview() {
  const [settings, setSettings] = useState<SimulationSettings>({
    duration_years: 20,
    strompreissteigerung_prozent: 2.5
  });

  const handleDurationChange = (value: number | null) => {
    if (value !== null) {
      setSettings(prev => ({ ...prev, duration_years: value }));
    }
  };

  const handlePriceIncreaseChange = (value: number | null) => {
    if (value !== null) {
      setSettings(prev => ({ ...prev, strompreissteigerung_prozent: value }));
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-xl font-bold mb-4">Live-Vorschau</h3>
      
      <Card className="mb-4">
        <h4 className="font-semibold mb-3">Simulationseinstellungen</h4>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Simulationsdauer: {settings.duration_years} Jahre
          </label>
          <Slider
            value={settings.duration_years}
            onChange={(e) => handleDurationChange(Array.isArray(e.value) ? e.value[0] : e.value)}
            min={5}
            max={30}
            step={1}
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Strompreissteigerung: {settings.strompreissteigerung_prozent}%
          </label>
          <Slider
            value={settings.strompreissteigerung_prozent}
            onChange={(e) => handlePriceIncreaseChange(Array.isArray(e.value) ? e.value[0] : e.value)}
            min={0}
            max={10}
            step={0.1}
            className="w-full"
          />
        </div>
      </Card>

      <div className="flex gap-2">
        <Button 
          label="Menü" 
          icon="pi pi-home" 
          className="flex-1" 
          outlined 
          onClick={() => window.location.hash = '/'}
        />
        <Button 
          label="Berechnen" 
          icon="pi pi-calculator" 
          className="flex-1"
        />
      </div>
    </div>
  );
}