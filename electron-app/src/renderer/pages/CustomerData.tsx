import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

export default function CustomerData() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Kundendaten</h2>
      <Card>
        <p>Kundendaten-Formular wird hier implementiert</p>
        <Button label="Weiter" className="mt-3" />
      </Card>
    </div>
  );
}