import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

export default function CRMArea() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">CRM Bereich</h2>
      <Card>
        <p>Customer Relationship Management wird hier implementiert</p>
        <Button label="Kunde hinzufügen" className="mt-3" />
      </Card>
    </div>
  );
}