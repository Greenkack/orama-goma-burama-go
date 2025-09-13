import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

export default function Dashboard() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <Card>
        <p>Dashboard-Übersicht wird hier implementiert</p>
        <Button label="Aktualisieren" className="mt-3" />
      </Card>
    </div>
  );
}