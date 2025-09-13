import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

export default function ProductSummary() {
  return (
    <Card>
      <h3>Produkt-Zusammenfassung</h3>
      <p>Zusammenfassung wird hier implementiert</p>
      <Button label="Berechnung starten" />
    </Card>
  );
}