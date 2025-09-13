import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

export default function AdminArea() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Adminbereich</h2>
      <Card>
        <p>Admin-Panel wird hier implementiert</p>
        <Button label="Einstellungen" className="mt-3" />
      </Card>
    </div>
  );
}