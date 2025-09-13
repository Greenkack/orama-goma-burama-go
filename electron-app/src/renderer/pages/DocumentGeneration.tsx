import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

export default function DocumentGeneration() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Dokumentenerstellung</h2>
      <Card>
        <p>PDF-Erzeugung wird hier implementiert</p>
        <Button label="PDF erstellen" className="mt-3" />
      </Card>
    </div>
  );
}