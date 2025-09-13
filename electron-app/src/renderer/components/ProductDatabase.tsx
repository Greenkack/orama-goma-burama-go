import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toolbar } from 'primereact/toolbar';
import { FileUpload } from 'primereact/fileupload';
import { Tag } from 'primereact/tag';
import { Badge } from 'primereact/badge';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

interface Product {
  id: number;
  manufacturer: string;
  model: string;
  [key: string]: any;
}

interface ProductStats {
  modules: number;
  inverters: number;
  storages: number;
  accessories: number;
  companies: number;
  total: number;
}

const ProductDatabase: React.FC = () => {
  const [products, setProducts] = useState<Record<string, Product[]>>({
    modules: [],
    inverters: [],
    storages: [],
    accessories: [],
    companies: []
  });
  
  const [stats, setStats] = useState<ProductStats>({
    modules: 0,
    inverters: 0,
    storages: 0,
    accessories: 0,
    companies: 0,
    total: 0
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDialog, setProductDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const toast = useRef<Toast>(null);

  const categories = [
    { name: 'modules', label: 'Module', icon: 'pi-th-large' },
    { name: 'inverters', label: 'Wechselrichter', icon: 'pi-bolt' },
    { name: 'storages', label: 'Speicher', icon: 'pi-database' },
    { name: 'accessories', label: 'Zubehör', icon: 'pi-cog' },
    { name: 'companies', label: 'Firmen', icon: 'pi-building' }
  ];

  const currentCategory = categories[activeIndex].name;

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load statistics
      const statsResult = await window.electronAPI.database.getStats();
      if (statsResult.success) {
        setStats(statsResult.data);
      }

      // Load products for all categories
      const productData: Record<string, Product[]> = {};
      for (const category of categories) {
        const result = await window.electronAPI.database.getProducts(category.name);
        if (result.success) {
          productData[category.name] = result.data || [];
        } else {
          productData[category.name] = [];
        }
      }
      setProducts(productData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: 'Daten konnten nicht geladen werden'
      });
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setSelectedProduct(null);
    setEditMode(false);
    setProductDialog(true);
  };

  const editProduct = (product: Product) => {
    setSelectedProduct({ ...product });
    setEditMode(true);
    setProductDialog(true);
  };

  const deleteProduct = async (product: Product) => {
    confirmDialog({
      message: `Möchten Sie das Produkt "${product.manufacturer} ${product.model}" wirklich löschen?`,
      header: 'Löschen bestätigen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja',
      rejectLabel: 'Nein',
      accept: async () => {
        try {
          const result = await window.electronAPI.database.deleteProduct(currentCategory, product.id);
          if (result.success) {
            toast.current?.show({
              severity: 'success',
              summary: 'Erfolgreich',
              detail: 'Produkt wurde gelöscht'
            });
            loadAllData();
          } else {
            throw new Error(result.error || 'Löschen fehlgeschlagen');
          }
        } catch (error) {
          toast.current?.show({
            severity: 'error',
            summary: 'Fehler',
            detail: `Fehler beim Löschen: ${error}`
          });
        }
      }
    });
  };

  const saveProduct = async () => {
    if (!selectedProduct) return;

    try {
      let result;
      if (editMode) {
        result = await window.electronAPI.database.updateProduct(
          currentCategory,
          selectedProduct.id,
          selectedProduct
        );
      } else {
        result = await window.electronAPI.database.createProduct(
          currentCategory,
          selectedProduct
        );
      }

      if (result.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Erfolgreich',
          detail: `Produkt wurde ${editMode ? 'aktualisiert' : 'erstellt'}`
        });
        setProductDialog(false);
        loadAllData();
      } else {
        throw new Error(result.error || 'Speichern fehlgeschlagen');
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: `Fehler beim Speichern: ${error}`
      });
    }
  };

  const onUpload = async (event: any) => {
    const file = event.files[0];
    if (!file) return;

    try {
      setLoading(true);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          const result = await window.electronAPI.file.upload({
            filename: file.name,
            content: Array.from(uint8Array),
            category: currentCategory,
            size: file.size
          });

          if (result.success) {
            toast.current?.show({
              severity: 'success',
              summary: 'Upload erfolgreich',
              detail: result.message
            });
            loadAllData();
          } else {
            throw new Error(result.error || 'Upload fehlgeschlagen');
          }
        } catch (error) {
          toast.current?.show({
            severity: 'error',
            summary: 'Upload Fehler',
            detail: `${error}`
          });
        } finally {
          setLoading(false);
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      setLoading(false);
      toast.current?.show({
        severity: 'error',
        summary: 'Fehler',
        detail: `Upload fehlgeschlagen: ${error}`
      });
    }
  };

  const actionBodyTemplate = (rowData: Product) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success"
          onClick={() => editProduct(rowData)}
          tooltip="Bearbeiten"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-warning"
          onClick={() => deleteProduct(rowData)}
          tooltip="Löschen"
        />
      </div>
    );
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-content-between align-items-center">
        <h2 className="m-0">
          <i className={`pi ${categories[activeIndex].icon} mr-2`}></i>
          {categories[activeIndex].label}
        </h2>
        <div className="flex gap-2 align-items-center">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              type="search"
              onInput={(e) => setGlobalFilter((e.target as HTMLInputElement).value)}
              placeholder="Suchen..."
            />
          </span>
          <Button
            icon="pi pi-plus"
            label="Neu"
            className="p-button-success"
            onClick={openNew}
          />
          <FileUpload
            mode="basic"
            name="productFile"
            accept=".xlsx,.xls,.csv"
            maxFileSize={10000000}
            onUpload={onUpload}
            chooseLabel="Excel Import"
            className="p-button-help"
            auto
          />
        </div>
      </div>
    );
  };

  const renderModuleColumns = () => (
    <>
      <Column field="manufacturer" header="Hersteller" sortable />
      <Column field="model" header="Modell" sortable />
      <Column field="powerWp" header="Leistung (Wp)" sortable />
      <Column field="efficiency" header="Wirkungsgrad (%)" sortable />
      <Column field="pricePerWp" header="Preis/Wp (€)" sortable />
      <Column field="warranty" header="Garantie (Jahre)" sortable />
      <Column field="technology" header="Technologie" sortable />
      <Column body={actionBodyTemplate} header="Aktionen" />
    </>
  );

  const renderInverterColumns = () => (
    <>
      <Column field="manufacturer" header="Hersteller" sortable />
      <Column field="model" header="Modell" sortable />
      <Column field="powerKw" header="Leistung (kW)" sortable />
      <Column field="efficiency" header="Wirkungsgrad (%)" sortable />
      <Column field="mpptChannels" header="MPPT Kanäle" sortable />
      <Column field="price" header="Preis (€)" sortable />
      <Column field="warranty" header="Garantie (Jahre)" sortable />
      <Column body={actionBodyTemplate} header="Aktionen" />
    </>
  );

  const renderStorageColumns = () => (
    <>
      <Column field="manufacturer" header="Hersteller" sortable />
      <Column field="model" header="Modell" sortable />
      <Column field="capacityKwh" header="Kapazität (kWh)" sortable />
      <Column field="powerKw" header="Leistung (kW)" sortable />
      <Column field="efficiency" header="Wirkungsgrad (%)" sortable />
      <Column field="price" header="Preis (€)" sortable />
      <Column field="warranty" header="Garantie (Jahre)" sortable />
      <Column body={actionBodyTemplate} header="Aktionen" />
    </>
  );

  const renderAccessoryColumns = () => (
    <>
      <Column field="manufacturer" header="Hersteller" sortable />
      <Column field="model" header="Modell" sortable />
      <Column field="category" header="Kategorie" sortable />
      <Column field="description" header="Beschreibung" sortable />
      <Column field="price" header="Preis (€)" sortable />
      <Column field="warranty" header="Garantie (Jahre)" sortable />
      <Column body={actionBodyTemplate} header="Aktionen" />
    </>
  );

  const renderCompanyColumns = () => (
    <>
      <Column field="name" header="Firmenname" sortable />
      <Column field="address" header="Adresse" sortable />
      <Column field="phone" header="Telefon" sortable />
      <Column field="email" header="E-Mail" sortable />
      <Column field="website" header="Website" sortable />
      <Column body={actionBodyTemplate} header="Aktionen" />
    </>
  );

  const getColumnsForCategory = () => {
    switch (currentCategory) {
      case 'modules': return renderModuleColumns();
      case 'inverters': return renderInverterColumns();
      case 'storages': return renderStorageColumns();
      case 'accessories': return renderAccessoryColumns();
      case 'companies': return renderCompanyColumns();
      default: return null;
    }
  };

  const renderProductForm = () => {
    if (!selectedProduct) return null;

    switch (currentCategory) {
      case 'modules':
        return (
          <div className="grid">
            <div className="col-12 md:col-6">
              <label htmlFor="manufacturer">Hersteller *</label>
              <InputText
                id="manufacturer"
                value={selectedProduct.manufacturer || ''}
                onChange={(e) => setSelectedProduct({...selectedProduct, manufacturer: e.target.value})}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-6">
              <label htmlFor="model">Modell *</label>
              <InputText
                id="model"
                value={selectedProduct.model || ''}
                onChange={(e) => setSelectedProduct({...selectedProduct, model: e.target.value})}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-6">
              <label htmlFor="powerWp">Leistung (Wp) *</label>
              <InputNumber
                id="powerWp"
                value={selectedProduct.powerWp || 0}
                onValueChange={(e) => setSelectedProduct({...selectedProduct, powerWp: e.value})}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-6">
              <label htmlFor="efficiency">Wirkungsgrad (%)</label>
              <InputNumber
                id="efficiency"
                value={selectedProduct.efficiency || 0}
                onValueChange={(e) => setSelectedProduct({...selectedProduct, efficiency: e.value})}
                mode="decimal"
                minFractionDigits={1}
                maxFractionDigits={2}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-6">
              <label htmlFor="pricePerWp">Preis/Wp (€)</label>
              <InputNumber
                id="pricePerWp"
                value={selectedProduct.pricePerWp || 0}
                onValueChange={(e) => setSelectedProduct({...selectedProduct, pricePerWp: e.value})}
                mode="currency"
                currency="EUR"
                locale="de-DE"
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-6">
              <label htmlFor="warranty">Garantie (Jahre)</label>
              <InputNumber
                id="warranty"
                value={selectedProduct.warranty || 0}
                onValueChange={(e) => setSelectedProduct({...selectedProduct, warranty: e.value})}
                className="w-full"
              />
            </div>
            <div className="col-12">
              <label htmlFor="technology">Technologie</label>
              <InputText
                id="technology"
                value={selectedProduct.technology || ''}
                onChange={(e) => setSelectedProduct({...selectedProduct, technology: e.target.value})}
                className="w-full"
              />
            </div>
          </div>
        );

      case 'inverters':
        return (
          <div className="grid">
            <div className="col-12 md:col-6">
              <label htmlFor="manufacturer">Hersteller *</label>
              <InputText
                id="manufacturer"
                value={selectedProduct.manufacturer || ''}
                onChange={(e) => setSelectedProduct({...selectedProduct, manufacturer: e.target.value})}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-6">
              <label htmlFor="model">Modell *</label>
              <InputText
                id="model"
                value={selectedProduct.model || ''}
                onChange={(e) => setSelectedProduct({...selectedProduct, model: e.target.value})}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-6">
              <label htmlFor="powerKw">Leistung (kW) *</label>
              <InputNumber
                id="powerKw"
                value={selectedProduct.powerKw || 0}
                onValueChange={(e) => setSelectedProduct({...selectedProduct, powerKw: e.value})}
                mode="decimal"
                minFractionDigits={1}
                maxFractionDigits={2}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-6">
              <label htmlFor="efficiency">Wirkungsgrad (%)</label>
              <InputNumber
                id="efficiency"
                value={selectedProduct.efficiency || 0}
                onValueChange={(e) => setSelectedProduct({...selectedProduct, efficiency: e.value})}
                mode="decimal"
                minFractionDigits={1}
                maxFractionDigits={2}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-6">
              <label htmlFor="price">Preis (€)</label>
              <InputNumber
                id="price"
                value={selectedProduct.price || 0}
                onValueChange={(e) => setSelectedProduct({...selectedProduct, price: e.value})}
                mode="currency"
                currency="EUR"
                locale="de-DE"
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-6">
              <label htmlFor="mpptChannels">MPPT Kanäle</label>
              <InputNumber
                id="mpptChannels"
                value={selectedProduct.mpptChannels || 0}
                onValueChange={(e) => setSelectedProduct({...selectedProduct, mpptChannels: e.value})}
                className="w-full"
              />
            </div>
          </div>
        );

      case 'companies':
        return (
          <div className="grid">
            <div className="col-12">
              <label htmlFor="name">Firmenname *</label>
              <InputText
                id="name"
                value={selectedProduct.name || ''}
                onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})}
                className="w-full"
              />
            </div>
            <div className="col-12">
              <label htmlFor="address">Adresse</label>
              <InputText
                id="address"
                value={selectedProduct.address || ''}
                onChange={(e) => setSelectedProduct({...selectedProduct, address: e.target.value})}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-6">
              <label htmlFor="phone">Telefon</label>
              <InputText
                id="phone"
                value={selectedProduct.phone || ''}
                onChange={(e) => setSelectedProduct({...selectedProduct, phone: e.target.value})}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-6">
              <label htmlFor="email">E-Mail</label>
              <InputText
                id="email"
                value={selectedProduct.email || ''}
                onChange={(e) => setSelectedProduct({...selectedProduct, email: e.target.value})}
                className="w-full"
              />
            </div>
            <div className="col-12">
              <label htmlFor="website">Website</label>
              <InputText
                id="website"
                value={selectedProduct.website || ''}
                onChange={(e) => setSelectedProduct({...selectedProduct, website: e.target.value})}
                className="w-full"
              />
            </div>
          </div>
        );

      default:
        return <div>Formular für {currentCategory} nicht implementiert</div>;
    }
  };

  return (
    <div className="product-database">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      {/* Statistics Cards */}
      <div className="grid mb-4">
        {categories.map((category, index) => (
          <div key={category.name} className="col-12 md:col-2">
            <Card className="text-center">
              <div className="flex flex-column align-items-center">
                <i className={`${category.icon} text-3xl mb-2`}></i>
                <h3 className="m-0">{stats[category.name as keyof ProductStats]}</h3>
                <p className="text-600 m-0">{category.label}</p>
              </div>
            </Card>
          </div>
        ))}
        <div className="col-12 md:col-2">
          <Card className="text-center">
            <div className="flex flex-column align-items-center">
              <i className="pi pi-chart-bar text-3xl mb-2"></i>
              <h3 className="m-0">{stats.total}</h3>
              <p className="text-600 m-0">Gesamt</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
          {categories.map((category, index) => (
            <TabPanel
              key={category.name}
              header={
                <span>
                  <i className={`${category.icon} mr-2`}></i>
                  {category.label}
                  <Badge value={stats[category.name as keyof ProductStats]} className="ml-2" />
                </span>
              }
            >
              {loading ? (
                <div className="flex justify-content-center">
                  <ProgressSpinner />
                </div>
              ) : (
                <DataTable
                  value={products[category.name] || []}
                  paginator
                  rows={10}
                  dataKey="id"
                  filterDisplay="menu"
                  globalFilter={globalFilter}
                  header={renderHeader()}
                  emptyMessage="Keine Produkte gefunden."
                  responsiveLayout="scroll"
                >
                  {getColumnsForCategory()}
                </DataTable>
              )}
            </TabPanel>
          ))}
        </TabView>
      </Card>

      {/* Product Dialog */}
      <Dialog
        visible={productDialog}
        style={{ width: '800px' }}
        header={`${editMode ? 'Bearbeiten' : 'Neues Produkt'} - ${categories[activeIndex].label}`}
        modal
        className="p-fluid"
        footer={
          <div>
            <Button label="Abbrechen" icon="pi pi-times" className="p-button-text" onClick={() => setProductDialog(false)} />
            <Button label="Speichern" icon="pi pi-check" className="p-button-text" onClick={saveProduct} />
          </div>
        }
        onHide={() => setProductDialog(false)}
      >
        {renderProductForm()}
      </Dialog>
    </div>
  );
};

export default ProductDatabase;