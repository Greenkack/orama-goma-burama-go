import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

export default function PlanningArea() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Planungsbereich</h2>
      <Card>
        <p>Projektplanung wird hier implementiert</p>
        <Button label="Neues Projekt" className="mt-3" />
      </Card>
    </div>
  );
}