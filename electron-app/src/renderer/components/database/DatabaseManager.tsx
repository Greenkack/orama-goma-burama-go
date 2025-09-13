import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { FileUpload } from 'primereact/fileupload';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { ProgressBar } from 'primereact/progressbar';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { Toolbar } from 'primereact/toolbar';
import { FileUploader } from './FileUploader';
import './DatabaseManager.css';

interface Product {
  id?: number;
  name: string;
  manufacturer: string;
  model: string;
  [key: string]: any;
}

export function DatabaseManager() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('modules');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ severity: 'success' | 'info' | 'warn' | 'error'; text: string } | null>(null);
  const [stats, setStats] = useState({ modules: 0, inverters: 0, storages: 0, accessories: 0, companies: 0 });
  
  // CRUD States
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDialog, setProductDialog] = useState(false);
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [productForm, setProductForm] = useState<Product>({
    name: '',
    manufacturer: '',
    model: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  const categories = [
    { label: 'PV-Module', value: 'modules' },
    { label: 'Wechselrichter', value: 'inverters' },
    { label: 'Batteriespeicher', value: 'storages' },
    { label: 'Zubehör', value: 'accessories' },
    { label: 'Unternehmen', value: 'companies' }
  ];

  useEffect(() => {
    loadStats();
    loadProducts();
  }, [selectedCategory]);

  const loadStats = async () => {
    try {
      if (!window.electronAPI) {
        console.warn('electronAPI not available');
        return;
      }
      const result = await window.electronAPI.getStats();
      if (result.success) {
        setStats(result.data || stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadProducts = async () => {
    try {
      if (!window.electronAPI) {
        console.warn('electronAPI not available');
        return;
      }
      const result = await window.electronAPI.getProducts(selectedCategory);
      if (result.success) {
        setProducts(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    }
  };

  const handleFileUpload = async (file: File, content: string) => {
    if (!window.electronAPI) {
      throw new Error('Electron API nicht verfügbar');
    }

    const result = await window.electronAPI.uploadFile({
      filename: file.name,
      category: selectedCategory,
      size: file.size,
      content: content
    });

    if (result.success) {
      await loadStats();
      await loadProducts();
    } else {
      throw new Error(result.error || 'Upload fehlgeschlagen');
    }
  };

  // CRUD Operations
  const openNew = () => {
    setProductForm(getEmptyProduct());
    setIsEditing(false);
    setProductDialog(true);
  };

  const editProduct = (product: Product) => {
    setProductForm({ ...product });
    setIsEditing(true);
    setProductDialog(true);
  };

  const confirmDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setDeleteProductDialog(true);
  };

  const saveProduct = async () => {
    if (!window.electronAPI) {
      setMessage({ severity: 'error', text: 'Electron API nicht verfügbar' });
      return;
    }

    try {
      let result;
      if (isEditing && productForm.id) {
        result = await window.electronAPI.updateProduct(productForm.id, productForm);
      } else {
        result = await window.electronAPI.addProduct({ ...productForm, category: selectedCategory });
      }

      if (result.success) {
        setMessage({ 
          severity: 'success', 
          text: isEditing ? 'Produkt erfolgreich aktualisiert!' : 'Produkt erfolgreich hinzugefügt!' 
        });
        setProductDialog(false);
        await loadProducts();
        await loadStats();
      } else {
        setMessage({ severity: 'error', text: result.error || 'Speichern fehlgeschlagen' });
      }
    } catch (error) {
      setMessage({ severity: 'error', text: 'Fehler beim Speichern: ' + (error as Error).message });
    }
  };

  const deleteProduct = async () => {
    if (!window.electronAPI) {
      setMessage({ severity: 'error', text: 'Electron API nicht verfügbar' });
      return;
    }

    if (selectedProduct?.id) {
      try {
        const result = await window.electronAPI.deleteProduct(selectedProduct.id);
        if (result.success) {
          setMessage({ severity: 'success', text: 'Produkt erfolgreich gelöscht!' });
          setDeleteProductDialog(false);
          await loadProducts();
          await loadStats();
        } else {
          setMessage({ severity: 'error', text: result.error || 'Löschen fehlgeschlagen' });
        }
      } catch (error) {
        setMessage({ severity: 'error', text: 'Fehler beim Löschen: ' + (error as Error).message });
      }
    }
  };

  const getEmptyProduct = (): Product => {
    const base = { name: '', manufacturer: '', model: '' };
    
    switch (selectedCategory) {
      case 'modules':
        return { 
          ...base, 
          power_wp: 0, 
          voltage_mpp_v: 0, 
          current_mpp_a: 0, 
          efficiency_percent: 0,
          cost_per_wp_netto_eur: 0,
          cost_per_wp_brutto_eur: 0,
          warranty_years: 25,
          technology: 'Monokristallin',
          image_path: '',
          datasheet_path: ''
        };
      case 'inverters':
        return { 
          ...base, 
          power_kw: 0, 
          max_efficiency_percent: 0, 
          mppt_inputs: 1,
          cost_netto_eur: 0,
          cost_brutto_eur: 0,
          warranty_years: 12,
          is_string_inverter: true,
          image_path: '',
          datasheet_path: ''
        };
      case 'storages':
        return { 
          ...base, 
          capacity_kwh: 0, 
          usable_capacity_kwh: 0, 
          technology: 'LiFePO4',
          cost_netto_eur: 0,
          cost_brutto_eur: 0,
          cost_per_kwh_netto_eur: 0,
          warranty_years: 10,
          image_path: '',
          datasheet_path: ''
        };
      case 'accessories':
        return { 
          ...base, 
          category: 'Kabel', 
          cost_netto_eur: 0,
          cost_brutto_eur: 0,
          unit: 'Stück',
          quantity_per_installation: 1,
          is_required: false,
          image_path: '',
          datasheet_path: ''
        };
      case 'companies':
        return { 
          ...base, 
          address: '',
          phone: '',
          email: '',
          website: '',
          logo_path: '',
          contact_person_name: '',
          is_active: true
        };
      default:
        return base;
    }
  };

  const actionBodyTemplate = (rowData: Product) => {
    return (
      <div className="flex gap-2">
        <Button 
          icon="pi pi-pencil" 
          className="p-button-rounded p-button-success p-button-sm" 
          onClick={() => editProduct(rowData)} 
        />
        <Button 
          icon="pi pi-trash" 
          className="p-button-rounded p-button-danger p-button-sm" 
          onClick={() => confirmDeleteProduct(rowData)} 
        />
      </div>
    );
  };

  const productDialogFooter = (
    <div className="flex gap-2">
      <Button label="Abbrechen" icon="pi pi-times" className="p-button-secondary" onClick={() => setProductDialog(false)} />
      <Button label="Speichern" icon="pi pi-check" onClick={saveProduct} />
    </div>
  );

  const deleteProductDialogFooter = (
    <div className="flex gap-2">
      <Button label="Nein" icon="pi pi-times" className="p-button-secondary" onClick={() => setDeleteProductDialog(false)} />
      <Button label="Ja" icon="pi pi-check" className="p-button-danger" onClick={deleteProduct} />
    </div>
  );

  const renderProductForm = () => {
    const category = selectedCategory;
    
    return (
      <div className="p-fluid grid">
        {/* Grunddaten für alle Kategorien */}
        <div className="field col-12 md:col-6">
          <label htmlFor="name" className="block">Name *</label>
          <InputText 
            id="name" 
            value={productForm.name} 
            onChange={(e) => setProductForm({...productForm, name: e.target.value})} 
            required 
          />
        </div>
        
        <div className="field col-12 md:col-6">
          <label htmlFor="manufacturer" className="block">Hersteller *</label>
          <InputText 
            id="manufacturer" 
            value={productForm.manufacturer} 
            onChange={(e) => setProductForm({...productForm, manufacturer: e.target.value})} 
            required 
          />
        </div>
        
        <div className="field col-12 md:col-6">
          <label htmlFor="model" className="block">Modell *</label>
          <InputText 
            id="model" 
            value={productForm.model} 
            onChange={(e) => setProductForm({...productForm, model: e.target.value})} 
            required 
          />
        </div>

        {/* Spezifische Felder je Kategorie */}
        {category === 'modules' && (
          <>
            <div className="field col-12 md:col-6">
              <label htmlFor="power_wp" className="block">Leistung (Wp)</label>
              <InputNumber 
                id="power_wp" 
                value={productForm.power_wp} 
                onValueChange={(e) => setProductForm({...productForm, power_wp: e.value || 0})} 
                suffix=" Wp"
              />
            </div>
            <div className="field col-12 md:col-6">
              <label htmlFor="efficiency_percent" className="block">Wirkungsgrad (%)</label>
              <InputNumber 
                id="efficiency_percent" 
                value={productForm.efficiency_percent} 
                onValueChange={(e) => setProductForm({...productForm, efficiency_percent: e.value || 0})} 
                suffix=" %"
                maxFractionDigits={2}
              />
            </div>
            <div className="field col-12 md:col-6">
              <label htmlFor="cost_per_wp_netto_eur" className="block">Kosten pro Wp (netto €)</label>
              <InputNumber 
                id="cost_per_wp_netto_eur" 
                value={productForm.cost_per_wp_netto_eur} 
                onValueChange={(e) => setProductForm({...productForm, cost_per_wp_netto_eur: e.value || 0})} 
                prefix="€ "
                maxFractionDigits={2}
              />
            </div>
          </>
        )}

        {category === 'inverters' && (
          <>
            <div className="field col-12 md:col-6">
              <label htmlFor="power_kw" className="block">Leistung (kW)</label>
              <InputNumber 
                id="power_kw" 
                value={productForm.power_kw} 
                onValueChange={(e) => setProductForm({...productForm, power_kw: e.value || 0})} 
                suffix=" kW"
                maxFractionDigits={1}
              />
            </div>
            <div className="field col-12 md:col-6">
              <label htmlFor="max_efficiency_percent" className="block">Max. Wirkungsgrad (%)</label>
              <InputNumber 
                id="max_efficiency_percent" 
                value={productForm.max_efficiency_percent} 
                onValueChange={(e) => setProductForm({...productForm, max_efficiency_percent: e.value || 0})} 
                suffix=" %"
                maxFractionDigits={2}
              />
            </div>
            <div className="field col-12 md:col-6">
              <label htmlFor="cost_netto_eur" className="block">Kosten (netto €)</label>
              <InputNumber 
                id="cost_netto_eur" 
                value={productForm.cost_netto_eur} 
                onValueChange={(e) => setProductForm({...productForm, cost_netto_eur: e.value || 0})} 
                prefix="€ "
                maxFractionDigits={2}
              />
            </div>
          </>
        )}

        {category === 'storages' && (
          <>
            <div className="field col-12 md:col-6">
              <label htmlFor="capacity_kwh" className="block">Kapazität (kWh)</label>
              <InputNumber 
                id="capacity_kwh" 
                value={productForm.capacity_kwh} 
                onValueChange={(e) => setProductForm({...productForm, capacity_kwh: e.value || 0})} 
                suffix=" kWh"
                maxFractionDigits={1}
              />
            </div>
            <div className="field col-12 md:col-6">
              <label htmlFor="usable_capacity_kwh" className="block">Nutzbare Kapazität (kWh)</label>
              <InputNumber 
                id="usable_capacity_kwh" 
                value={productForm.usable_capacity_kwh} 
                onValueChange={(e) => setProductForm({...productForm, usable_capacity_kwh: e.value || 0})} 
                suffix=" kWh"
                maxFractionDigits={1}
              />
            </div>
            <div className="field col-12 md:col-6">
              <label htmlFor="cost_netto_eur" className="block">Kosten (netto €)</label>
              <InputNumber 
                id="cost_netto_eur" 
                value={productForm.cost_netto_eur} 
                onValueChange={(e) => setProductForm({...productForm, cost_netto_eur: e.value || 0})} 
                prefix="€ "
                maxFractionDigits={2}
              />
            </div>
          </>
        )}

        {category === 'accessories' && (
          <>
            <div className="field col-12 md:col-6">
              <label htmlFor="category" className="block">Kategorie</label>
              <Dropdown 
                id="category" 
                value={productForm.category} 
                options={[
                  { label: 'Kabel', value: 'Kabel' },
                  { label: 'Befestigung', value: 'Befestigung' },
                  { label: 'Überwachung', value: 'Überwachung' },
                  { label: 'Sonstiges', value: 'Sonstiges' }
                ]}
                onChange={(e) => setProductForm({...productForm, category: e.value})} 
              />
            </div>
            <div className="field col-12 md:col-6">
              <label htmlFor="cost_netto_eur" className="block">Kosten (netto €)</label>
              <InputNumber 
                id="cost_netto_eur" 
                value={productForm.cost_netto_eur} 
                onValueChange={(e) => setProductForm({...productForm, cost_netto_eur: e.value || 0})} 
                prefix="€ "
                maxFractionDigits={2}
              />
            </div>
          </>
        )}

        {category === 'companies' && (
          <>
            <div className="field col-12">
              <label htmlFor="address" className="block">Adresse</label>
              <InputTextarea 
                id="address" 
                value={productForm.address || ''} 
                onChange={(e) => setProductForm({...productForm, address: e.target.value})} 
                rows={3}
              />
            </div>
            <div className="field col-12 md:col-6">
              <label htmlFor="phone" className="block">Telefon</label>
              <InputText 
                id="phone" 
                value={productForm.phone || ''} 
                onChange={(e) => setProductForm({...productForm, phone: e.target.value})} 
              />
            </div>
            <div className="field col-12 md:col-6">
              <label htmlFor="email" className="block">E-Mail</label>
              <InputText 
                id="email" 
                value={productForm.email || ''} 
                onChange={(e) => setProductForm({...productForm, email: e.target.value})} 
              />
            </div>
            <div className="field col-12 md:col-6">
              <label htmlFor="website" className="block">Website</label>
              <InputText 
                id="website" 
                value={productForm.website || ''} 
                onChange={(e) => setProductForm({...productForm, website: e.target.value})} 
              />
            </div>
            <div className="field col-12 md:col-6">
              <label htmlFor="contact_person_name" className="block">Ansprechpartner</label>
              <InputText 
                id="contact_person_name" 
                value={productForm.contact_person_name || ''} 
                onChange={(e) => setProductForm({...productForm, contact_person_name: e.target.value})} 
              />
            </div>
          </>
        )}

        {/* File Upload Bereiche */}
        {(category === 'modules' || category === 'inverters' || category === 'storages' || category === 'accessories') && (
          <>
            <div className="field col-12">
              <label className="block">Produktbild</label>
              <FileUpload 
                mode="basic" 
                name="productImage" 
                accept="image/*" 
                maxFileSize={5000000}
                chooseLabel="Bild auswählen"
                className="p-button-outlined"
              />
            </div>
            <div className="field col-12">
              <label className="block">Datenblatt (PDF)</label>
              <FileUpload 
                mode="basic" 
                name="productDatasheet" 
                accept=".pdf" 
                maxFileSize={10000000}
                chooseLabel="PDF auswählen"
                className="p-button-outlined"
              />
            </div>
          </>
        )}

        {category === 'companies' && (
          <>
            <div className="field col-12">
              <label className="block">Logo</label>
              <FileUpload 
                mode="basic" 
                name="companyLogo" 
                accept="image/*" 
                maxFileSize={5000000}
                chooseLabel="Logo auswählen"
                className="p-button-outlined"
              />
            </div>
            <div className="field col-12">
              <label className="block">Dokumente</label>
              <FileUpload 
                mode="basic" 
                name="companyDocs" 
                accept=".pdf,.doc,.docx" 
                maxFileSize={10000000}
                chooseLabel="Dokumente auswählen"
                className="p-button-outlined"
                multiple
              />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="database-manager p-4">
      <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
        {/* Tab 1: Datei-Import */}
        <TabPanel header="Datei-Import" leftIcon="pi pi-upload">
          <div className="grid">
            <div className="col-12">
              <Card title="Datei-Import" className="mb-4">
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <div className="field">
                      <label htmlFor="category" className="block mb-2">Kategorie auswählen</label>
                      <Dropdown
                        id="category"
                        value={selectedCategory}
                        options={categories}
                        onChange={(e) => setSelectedCategory(e.value)}
                        placeholder="Kategorie wählen"
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="col-12">
                    <FileUploader
                      onUpload={handleFileUpload}
                      accept=".csv,.xlsx,.xls"
                      maxFileSize={10000000}
                      category={selectedCategory}
                      disabled={isUploading}
                    />
                  </div>

                  {isUploading && (
                    <div className="col-12">
                      <ProgressBar mode="indeterminate" className="mb-2" />
                      <p className="text-center text-sm text-gray-600">Datei wird verarbeitet...</p>
                    </div>
                  )}

                  {message && (
                    <div className="col-12">
                      <Message severity={message.severity} text={message.text} />
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Statistiken */}
            <div className="col-12">
              <div className="grid">
                {Object.entries(stats).map(([key, value]) => (
                  <div key={key} className="col-12 md:col-6 lg:col-2">
                    <Card className="text-center">
                      <div className="text-2xl font-bold text-primary">{value}</div>
                      <div className="text-sm text-gray-600 capitalize">
                        {categories.find(c => c.value === key)?.label || key}
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Template Downloads */}
            <div className="col-12">
              <Card title="Vorlagen herunterladen">
                <p className="mb-3">Laden Sie CSV-Vorlagen für den Import herunter:</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category.value}
                      label={`${category.label} Vorlage`}
                      icon="pi pi-download"
                      className="p-button-outlined p-button-sm"
                      onClick={() => {
                        // TODO: Download template implementation
                        console.log(`Download template for ${category.value}`);
                      }}
                    />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabPanel>

        {/* Tab 2: Manuelle Eingabe */}
        <TabPanel header="Manuelle Eingabe" leftIcon="pi pi-plus">
          <div className="grid">
            <div className="col-12">
              <Toolbar className="mb-4">
                <div className="toolbar-left">
                  <Dropdown
                    value={selectedCategory}
                    options={categories}
                    onChange={(e) => setSelectedCategory(e.value)}
                    placeholder="Kategorie wählen"
                    className="mr-2"
                  />
                  <Button 
                    label="Neu hinzufügen" 
                    icon="pi pi-plus" 
                    className="p-button-success" 
                    onClick={openNew} 
                  />
                </div>
              </Toolbar>

              <Card title={`${categories.find(c => c.value === selectedCategory)?.label || 'Produkte'} verwalten`}>
                <DataTable
                  value={products}
                  paginator
                  rows={10}
                  rowsPerPageOptions={[5, 10, 25]}
                  className="p-datatable-gridlines"
                  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                  currentPageReportTemplate="Zeige {first} bis {last} von {totalRecords} Einträgen"
                  emptyMessage="Keine Produkte gefunden"
                  header={`${products.length} Einträge gefunden`}
                >
                  <Column field="name" header="Name" sortable />
                  <Column field="manufacturer" header="Hersteller" sortable />
                  <Column field="model" header="Modell" sortable />
                  
                  {selectedCategory === 'modules' && (
                    <>
                      <Column field="power_wp" header="Leistung (Wp)" sortable />
                      <Column field="efficiency_percent" header="Wirkungsgrad (%)" sortable />
                    </>
                  )}
                  
                  {selectedCategory === 'inverters' && (
                    <>
                      <Column field="power_kw" header="Leistung (kW)" sortable />
                      <Column field="max_efficiency_percent" header="Wirkungsgrad (%)" sortable />
                    </>
                  )}
                  
                  {selectedCategory === 'storages' && (
                    <>
                      <Column field="capacity_kwh" header="Kapazität (kWh)" sortable />
                      <Column field="usable_capacity_kwh" header="Nutzbar (kWh)" sortable />
                    </>
                  )}
                  
                  {selectedCategory === 'companies' && (
                    <>
                      <Column field="phone" header="Telefon" />
                      <Column field="email" header="E-Mail" />
                    </>
                  )}
                  
                  <Column body={actionBodyTemplate} header="Aktionen" exportable={false} />
                </DataTable>
              </Card>
            </div>
          </div>
        </TabPanel>
      </TabView>

      {/* Product Dialog */}
      <Dialog
        visible={productDialog}
        style={{ width: '90vw', maxWidth: '800px' }}
        header={isEditing ? 'Produkt bearbeiten' : 'Neues Produkt hinzufügen'}
        modal
        className="p-fluid"
        footer={productDialogFooter}
        onHide={() => setProductDialog(false)}
      >
        {renderProductForm()}
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        visible={deleteProductDialog}
        style={{ width: '450px' }}
        header="Bestätigung"
        modal
        footer={deleteProductDialogFooter}
        onHide={() => setDeleteProductDialog(false)}
      >
        <div className="flex align-items-center justify-content-center">
          <i className="pi pi-exclamation-triangle mr-3 text-2xl" />
          {selectedProduct && (
            <span>
              Sind Sie sicher, dass Sie <b>{selectedProduct.name}</b> löschen möchten?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}