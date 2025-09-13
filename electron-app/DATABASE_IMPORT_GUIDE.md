# DING-App Database Excel/CSV Import Guide

## Übersicht

Die DING-App unterstützt Bulk-Upload von Produktdaten über Excel (.xlsx, .xls) und CSV-Dateien. Dieses Dokument erklärt die exakten Feldnamen und Datentypen, die für jeden Produkttyp erforderlich sind.

## Template-Dateien

Im `templates/` Ordner finden Sie vorgefertigte Template-Dateien für alle Produktkategorien:
- `modules_template.csv` - PV-Module
- `inverters_template.csv` - Wechselrichter  
- `storages_template.csv` - Batteriespeicher
- `accessories_template.csv` - Zubehör
- `companies_template.csv` - Unternehmensdaten

## Feldmappings nach Kategorie

### 1. PV-Module (modules_template.csv)

**Pflichtfelder:**
- `name` (Text) - Produktname
- `manufacturer` (Text) - Hersteller
- `model` (Text) - Modellbezeichnung
- `power_wp` (Zahl) - Leistung in Wp
- `cost_per_wp_netto_eur` (Dezimal) - Kosten pro Wp netto in EUR
- `cost_per_wp_brutto_eur` (Dezimal) - Kosten pro Wp brutto in EUR

**Optionale Felder:**
- `voltage_mpp_v` (Dezimal) - MPP-Spannung in V
- `current_mpp_a` (Dezimal) - MPP-Strom in A
- `voltage_oc_v` (Dezimal) - Leerlaufspannung in V
- `current_sc_a` (Dezimal) - Kurzschlussstrom in A
- `efficiency_percent` (Dezimal) - Wirkungsgrad in %
- `technology` (Text) - Technologie (z.B. "Monokristallin")
- `dimensions_length_mm` (Zahl) - Länge in mm
- `dimensions_width_mm` (Zahl) - Breite in mm
- `dimensions_height_mm` (Zahl) - Höhe in mm
- `weight_kg` (Dezimal) - Gewicht in kg
- `cells_count` (Zahl) - Anzahl Zellen
- `frame_color` (Text) - Rahmenfarbe
- `cost_per_module_netto_eur` (Dezimal) - Kosten pro Modul netto
- `cost_per_module_brutto_eur` (Dezimal) - Kosten pro Modul brutto
- `warranty_years` (Zahl) - Garantie in Jahren
- `is_new_generation` (Boolean: true/false) - Neue Generation
- `min_roof_area_m2` (Dezimal) - Mindest-Dachfläche in m²
- `available_power_classes` (Text) - Verfügbare Leistungsklassen (komma-getrennt)

### 2. Wechselrichter (inverters_template.csv)

**Pflichtfelder:**
- `name` (Text) - Produktname
- `manufacturer` (Text) - Hersteller
- `model` (Text) - Modellbezeichnung
- `power_kw` (Dezimal) - Leistung in kW
- `cost_netto_eur` (Dezimal) - Kosten netto in EUR
- `cost_brutto_eur` (Dezimal) - Kosten brutto in EUR

**Optionale Felder:**
- `input_voltage_range_v` (Text) - Eingangsspannungsbereich
- `max_efficiency_percent` (Dezimal) - Max. Wirkungsgrad in %
- `european_efficiency_percent` (Dezimal) - Europäischer Wirkungsgrad in %
- `mppt_inputs` (Zahl) - Anzahl MPPT-Eingänge
- `max_input_current_a` (Dezimal) - Max. Eingangsstrom in A
- `dimensions_length_mm` (Zahl) - Länge in mm
- `dimensions_width_mm` (Zahl) - Breite in mm
- `dimensions_height_mm` (Zahl) - Höhe in mm
- `weight_kg` (Dezimal) - Gewicht in kg
- `protection_class` (Text) - Schutzklasse (z.B. "IP65")
- `warranty_years` (Zahl) - Garantie in Jahren
- `is_string_inverter` (Boolean) - String-Wechselrichter
- `is_power_optimizer` (Boolean) - Power-Optimizer
- `max_modules_per_string` (Zahl) - Max. Module pro String
- `operating_temperature_range_c` (Text) - Betriebstemperaturbereich

### 3. Batteriespeicher (storages_template.csv)

**Pflichtfelder:**
- `name` (Text) - Produktname
- `manufacturer` (Text) - Hersteller
- `model` (Text) - Modellbezeichnung
- `capacity_kwh` (Dezimal) - Kapazität in kWh
- `cost_netto_eur` (Dezimal) - Kosten netto in EUR
- `cost_brutto_eur` (Dezimal) - Kosten brutto in EUR

**Optionale Felder:**
- `usable_capacity_kwh` (Dezimal) - Nutzbare Kapazität in kWh
- `voltage_v` (Zahl) - Spannung in V
- `technology` (Text) - Technologie (z.B. "LiFePO4")
- `cycles_count` (Zahl) - Anzahl Zyklen
- `depth_of_discharge_percent` (Dezimal) - Entladetiefe in %
- `efficiency_percent` (Dezimal) - Wirkungsgrad in %
- `dimensions_length_mm` (Zahl) - Länge in mm
- `dimensions_width_mm` (Zahl) - Breite in mm
- `dimensions_height_mm` (Zahl) - Höhe in mm
- `weight_kg` (Dezimal) - Gewicht in kg
- `cost_per_kwh_netto_eur` (Dezimal) - Kosten pro kWh netto
- `cost_per_kwh_brutto_eur` (Dezimal) - Kosten pro kWh brutto
- `warranty_years` (Zahl) - Garantie in Jahren
- `operating_temperature_range_c` (Text) - Betriebstemperaturbereich
- `installation_location` (Text) - Installationsort

### 4. Zubehör (accessories_template.csv)

**Pflichtfelder:**
- `name` (Text) - Produktname
- `category` (Text) - Kategorie (z.B. "Kabel", "Montage", "Monitoring")
- `cost_netto_eur` (Dezimal) - Kosten netto in EUR
- `cost_brutto_eur` (Dezimal) - Kosten brutto in EUR

**Optionale Felder:**
- `manufacturer` (Text) - Hersteller
- `model` (Text) - Modellbezeichnung
- `description` (Text) - Beschreibung
- `cost_per_unit_netto_eur` (Dezimal) - Kosten pro Einheit netto
- `cost_per_unit_brutto_eur` (Dezimal) - Kosten pro Einheit brutto
- `unit` (Text) - Einheit (z.B. "Stück", "Meter")
- `quantity_per_installation` (Zahl) - Menge pro Installation
- `is_required` (Boolean) - Erforderlich ja/nein
- `compatibility_tags` (Text) - Kompatibilitäts-Tags (komma-getrennt)
- `installation_time_hours` (Dezimal) - Installationszeit in Stunden
- `warranty_years` (Zahl) - Garantie in Jahren

### 5. Unternehmen (companies_template.csv)

**Pflichtfelder:**
- `name` (Text) - Firmenname
- `is_active` (Boolean) - Aktiv ja/nein

**Optionale Felder:**
- `address` (Text) - Adresse
- `phone` (Text) - Telefonnummer
- `email` (Text) - E-Mail-Adresse
- `website` (Text) - Website
- `tax_id` (Text) - Steuernummer
- `registration_number` (Text) - Handelsregisternummer
- `bank_name` (Text) - Bankname
- `iban` (Text) - IBAN
- `bic` (Text) - BIC
- `logo_path` (Text) - Logo-Pfad
- `contact_person_name` (Text) - Ansprechpartner Name
- `contact_person_title` (Text) - Ansprechpartner Titel
- `contact_person_phone` (Text) - Ansprechpartner Telefon
- `contact_person_email` (Text) - Ansprechpartner E-Mail
- `created_date` (Datum: YYYY-MM-DD) - Erstellungsdatum
- `notes` (Text) - Notizen

## Datentypen

**Text:** Beliebiger Text
**Zahl:** Ganzzahlen (z.B. 123)
**Dezimal:** Dezimalzahlen (z.B. 123.45)
**Boolean:** true oder false
**Datum:** Format YYYY-MM-DD (z.B. 2024-01-15)

## Bulk-Upload-Prozess

1. **Template herunterladen:** Nutzen Sie die bereitgestellten Template-Dateien
2. **Daten eingeben:** Füllen Sie die Excel/CSV-Datei mit Ihren Produktdaten
3. **Datei importieren:** Ziehen Sie die Datei per Drag & Drop in die App
4. **Validierung:** Die App prüft automatisch alle Datentypen und Pflichtfelder
5. **Import:** Nach erfolgreicher Validierung werden die Daten importiert

## Fehlerbehandlung

Die App zeigt detaillierte Fehlermeldungen bei:
- Fehlenden Pflichtfeldern
- Falschen Datentypen
- Ungültigen Werten
- Duplikaten (basierend auf Name + Hersteller + Modell)

## Tipps für erfolgreichen Import

1. **Verwenden Sie die Templates:** Beginnen Sie immer mit den bereitgestellten Template-Dateien
2. **Achten Sie auf Datentypen:** Boolean-Werte müssen exakt "true" oder "false" sein
3. **Dezimaltrennzeichen:** Verwenden Sie Punkt (.) als Dezimaltrennzeichen, nicht Komma
4. **Komma-getrennte Listen:** Für Felder wie `available_power_classes` verwenden Sie Kommas ohne Leerzeichen
5. **Leer lassen:** Optionale Felder können leer gelassen werden
6. **Eindeutige Namen:** Kombination aus Name + Hersteller + Modell sollte eindeutig sein

## Support

Bei Fragen zum Import-Format oder Problemen mit dem Upload wenden Sie sich an das Entwicklungsteam.