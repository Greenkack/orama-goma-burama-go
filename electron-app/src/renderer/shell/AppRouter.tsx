import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Menubar } from "primereact/menubar";
import { Sidebar } from "primereact/sidebar";
import MainMenu from "../pages/MainMenu";
import SolarCalculator from "../pages/SolarCalculator";
import CustomerData from "../pages/CustomerData";
import ResultsPage from "../pages/ResultsPage";
import Dashboard from "../pages/Dashboard";
import AdminArea from "../pages/AdminArea";
import DocumentGeneration from "../pages/DocumentGeneration";
import CRMArea from "../pages/CRMArea";
import PlanningArea from "../pages/PlanningArea";
import LivePreview from "../components/LivePreview";

export default function AppRouter() {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const menuItems = [
    {
      label: 'Hauptmenü',
      icon: 'pi pi-home',
      command: () => window.location.hash = '/'
    },
    {
      label: 'Live-Vorschau',
      icon: 'pi pi-eye',
      command: () => setSidebarVisible(true)
    }
  ];

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Menubar 
          model={menuItems}
          start={<span className="font-bold text-xl">DING App</span>}
          end={
            <Button 
              label="Beenden" 
              icon="pi pi-power-off" 
              className="p-button-danger p-button-sm"
              onClick={() => window.close()} 
            />
          }
        />
        
        <div className="p-4">
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/solar-calculator" element={<SolarCalculator />} />
            <Route path="/customer-data" element={<CustomerData />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminArea />} />
            <Route path="/documents" element={<DocumentGeneration />} />
            <Route path="/crm" element={<CRMArea />} />
            <Route path="/planning" element={<PlanningArea />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        <Sidebar 
          visible={sidebarVisible} 
          position="right" 
          onHide={() => setSidebarVisible(false)}
          className="w-30rem"
        >
          <LivePreview />
        </Sidebar>
      </div>
    </Router>
  );
}