# Projekt-Index

Umfassender Navigations-Index für dieses Repository. Für Details verweise zusätzlich auf `README.md` und Quellkommentare in den Modulen.

## Inhaltsverzeichnis

- Überblick und Highlights
- Architektur und Hauptkomponenten
- Wichtige Datenflüsse und Contracts
- Modullandkarte (nach Themen)
- Erweiterte PDF-Ausgabe (optionale Kapitel)
- Diagramme und Visualisierungen
- Datenbanken & CRM
- Wichtigste Berechnungsergebnisse (Keys)
- Startpunkte und typische Workflows
- How to run (lokal)
- Daten, Templates und Assets
- Tests und Tools
- Troubleshooting und Hinweise

## Überblick und Highlights

Python-App zur professionellen PV-Angebotserstellung mit Streamlit-UI, starker Kalkulations-/Simulations-Engine und modularer PDF-Erzeugung (ReportLab + pypdf). Kernthemen:

- Pricing-Engine mit Preis-Matrix, Auf-/Abschlägen, Rabatten und Live-Finalpreis
- PV- und Speicher-Konfiguration inkl. Spezialfälle (z. B. „Ohne Speicher“ mit Produkt-DB-Aufpreisen)
- Wirtschaftlichkeitsrechnung, Cashflows, Einspeisevergütung, KPIs
- PDF-Angebot mit 6–7-Seiten Haupttemplate (Overlay/YAML-Koordinaten) und optionaler „klassischer“ PDF-Anlage
- CRM-Funktionalitäten (Kunden/Pipeline/Kalender) und Multi-Offer-Generator
- Admin-Panel (Preis-Matrix-Upload, Firmen-/Logo-Management, App-Settings)
- Datenpersistenz via SQLite + dateibasierte Artefakte

## Architektur und Hauptkomponenten

- UI/Workflows (Streamlit)
  - `analysis.py`: zentrale App-/KPI-Ansichten, Live-Kosten-Vorschau, Simulationen, Pricing-Modifikationen
  - `pdf_ui.py`: PDF-Konfiguration/Validierung, Übergabe an Generator, Download-Flow
  - `pdf_preview.py`, `crm*.py`, `heatpump_ui.py`: weitere UIs
  - `gui.py`: Startdatei/Launcher für App-Ansichten
- Berechnungen/Domain
  - `calculations.py`: Kernkalkulationen, Preis-Matrix, Zusatzkosten, Netto/Brutto, Einspeisevergütung, Cashflows, KPIs
  - `calculations_extended.py`, `calculations_heatpump.py`: Spezialberechnungen (z. B. Wärmepumpe)
  - `financial_tools.py`: Finanzfunktionen (Barwerte, Renditen etc.)
- Daten/DB
  - `data/`: SQLite `app_data.db`, Preis-Matrix (CSV/XLSX), Produkt-/Firmendokumente, Kundenprojekte
  - `database.py`, `product_db.py`: DB-/Produktabfragen; `init_database.py` Setup/Seeds
- PDF-Erzeugung
  - `pdf_generator.py`: Kapitel, Validierung, Kosten-/Wirtschaftlichkeitsseiten; unterstützt 6–7-Seiten-Overlay
  - `pdf_template_engine/`: Overlay-Engine
    - `placeholders.py`: Mapping von Platzhaltern auf logische Keys (z. B. customer_name, pv_power_kWp)
    - `dynamic_overlay.py`, `overlay.py`, `merger.py`: Rendering, Layering und Merging
  - Styles/Widgets: `pdf_styles.py`, `theming/pdf_styles.py`, `pdf_widgets.py`

## Erweiterte PDF-Ausgabe (optionale Kapitel)

- Modularer Aufbau: Kapitel können abhängig von Benutzerwahl/Projektkontext ein- oder ausgeblendet werden (z. B. Detailrechnungen, Diagramme, Produktseiten, AGBs, Anhänge)
- Overlay-Haupttemplate (6–7 Seiten) via YAML-Koordinaten; optionale „klassische“ PDF wird angehängt
- Dynamische Inhalte werden in `build_dynamic_data` zusammengeführt; fehlende Werte (z. B. `final_price`) werden defensiv gefüllt
- Wärmepumpen- und Zusatzmodule können nach Bedarf ergänzt und in das Angebot integriert werden

## Diagramme und Visualisierungen

- KPI- und Produktionsdiagramme (z. B. Ertrag, Autarkie, Cashflow) werden in den UI-Ansichten erzeugt (`analysis.py`, `pv_visuals.py`) und können in die PDF übernommen werden
- Unterstützung für tabellarische Detaildarstellungen (Kostenblöcke, Matrixpreise, Auf-/Abschläge)
- Live-Vorschau der Kosten und Effekte von Rabatten/Zuschlägen über die Analyse-UI

## Wichtige Datenflüsse und Contracts

- Kalkulations-Contract (`perform_calculations` in `calculations.py`) liefert u. a.:
  - `base_matrix_price_netto`, `total_additional_costs_netto`, `subtotal_netto`,
    `total_investment_netto`, `total_investment_brutto`, `einspeiseverguetung_*`, KPI-/Simulationslisten
- Live Pricing (Analysis/UI):
  - `st.session_state["live_pricing_calculations"]` mit Feldern
    - `base_cost`, `total_rabatte_nachlaesse`, `total_aufpreise_zuschlaege`, `final_price`
- PDF-Pipeline (`pdf_ui.render_pdf_ui` -> `pdf_generator.generate_offer_pdf`):
  - Erzeugt Haupttemplate-Overlay (6–7 Seiten) und merged optional klassische PDF
  - Validierung prüft u. a. `anlage_kwp`, `annual_pv_production_kwh`, `final_price` und Firmendaten
  - Fallbacks vor der Validierung: `final_price` aus Session-State bzw. Netto/Brutto ableiten; `company_info` injizieren
- Platzhalter/Overlay:
  - YML-Koordinaten in `coords/seite1.yml` … `seite7.yml`
  - Mapping/Databuild in `pdf_template_engine/placeholders.py` (Funktion `build_dynamic_data`)

## Datenbanken & CRM

- SQLite-DB und dateibasierte Ablagen unter `data/` (z. B. `app_data.db`, `company_docs/`, `customer_docs/`)
- CRM-Module `crm.py`, `crm_pipeline_ui.py`, `crm_dashboard_ui.py`, `crm_calendar_ui.py` ermöglichen Pipeline-Verwaltung, Kundendatenpflege und Terminierung
- Produkt- und Preisdaten werden via `product_db.py` und Preis-Matrix (`data/price_matrix.xlsx`/`.csv`) bereitgestellt
- Import-/Exportpfade und Artefaktverwaltung werden in den UI- und Tool-Modulen orchestriert

## Wichtigste Berechnungsergebnisse (Keys)

- Basis-/Matrixpreise: `base_matrix_price_netto`
- Speicher-Aufpreise (wenn Matrixspalte „Ohne Speicher“): `cost_storage_aufpreis_product_db_netto`
- Zusatzkosten: `total_additional_costs_netto`
- Zwischensumme/Endsumme netto/brutto: `subtotal_netto`, `total_investment_netto`, `total_investment_brutto`
- Erzeugung/KPIs: `anlage_kwp`, `annual_pv_production_kwh`, diverse KPI-/Simulationswerte, `einspeiseverguetung_*`
- Live-Pricing (Session-State): `st.session_state["live_pricing_calculations"]`
  - `base_cost`, `total_rabatte_nachlaesse`, `total_aufpreise_zuschlaege`, `final_price`
- Finanz-/Cashflow-Outputs (je nach Konfiguration): Barwerte, Amortisation, Rendite-Kennwerte

## Modullandkarte (nach Themen)

- UI & Workflows: `analysis.py`, `pdf_ui.py`, `pdf_preview.py`, `crm.py`, `crm_calendar_ui.py`, `crm_dashboard_ui.py`, `crm_pipeline_ui.py`, `heatpump_ui.py`, `gui.py`
- Kalkulationen/Domain: `calculations.py`, `calculations_extended.py`, `calculations_heatpump.py`, `financial_tools.py`, `solar_calculator.py`, `pv_visuals.py`, `quick_calc.py`, `scenario_manager.py`, `live_calculation_engine.py`
- PDF: `pdf_generator.py`, `pdf_styles.py`, `pdf_widgets.py`, `pdf_template_engine/{dynamic_overlay.py, overlay.py, merger.py, placeholders.py}`
- Daten/DB: `database.py`, `product_db.py`, `init_database.py`, `data/` (z. B. `price_matrix.xlsx`, `app_data.db`, `company_docs/`, `customer_docs/`)
- Admin & Maintenance: `admin_panel.py`, `app_status.py`, `update_tariffs.py`, `check_companies.py`, `check_db.py`
- Werkzeuge/Utils: `tools/` (z. B. `test_main_pdf.py`, `test_build_dynamic_data.py`, `count_pages.py`), `utils.py`, `utils/export_coords.py`

### Erwähnenswerte Einzelfeatures

- `multi_offer_generator.py`/`multi_offer_generator_new.py`/`multi_offer_generator_old.py`: Mehrfach-Angebotserzeugung
- `data_input.py`: Import-/Eingabelogik
- CRM: Leads/Pipeline/Kalender via `crm*`-Module
- Wärmepumpen-Simulator: `calculations_heatpump.py` (Berechnungen), `heatpump_ui.py` (UI) für Szenarien/Preisbildung/Integration in PDF

## Konfiguration & Lokalisierung

- Texte/Übersetzungen: `de.json`, `locales.py`
- UI-/PDF-Styles: `theming/pdf_styles.py`, `pdf_styles.py`
- App-Optionen/Flags: `options.py`, zustandsbezogene Settings in `app_status.py`
- Karten/Adresse: `map_integration.py`

## Startpunkte und typische Workflows

- App starten (typisch):
  - `gui.py` als Launcher verwenden oder direkt einzelne Streamlit-Ansichten starten (z. B. `analysis.py`, `pdf_ui.py`)
- PDF testen:
  - Sicherstellen, dass die statischen Hintergründe (z. B. `pdf_templates_static/notext/nt_nt_01.pdf` … `nt_nt_07.pdf`) vorhanden sind
  - YML-Koordinaten `coords/seite1.yml` … `coords/seite7.yml` müssen zu den Platzhaltern passen
- Preis-Matrix aktualisieren:
  - Upload im `admin_panel.py` (XLSX/CSV), Laufzeitzugriff in `calculations.py`
- Multi-Offer:
  - Mit `multi_offer_generator.py` Varianten generieren und als Sammel-PDF zusammenführen
- CRM/Pipeline:
  - Kundendaten pflegen, Angebote verknüpfen, Wiedervorlagen im Kalender
- Wärmepumpe:
  - `heatpump_ui.py` starten, Parameter konfigurieren, Ergebnisse prüfen; Ergebnisse können in Angebote eingebunden werden

## Wärmepumpen-Simulator

- UI: `heatpump_ui.py` – Interaktive Konfiguration und Ergebnisdarstellung
- Berechnungen: `calculations_heatpump.py` – Kosten-/Leistungs-/Szenario-Berechnungen
- Integration: Ergebnisse lassen sich in die Angebots-PDF integrieren (optional als Kapitel)
- Typische Parameter: Leistungsbedarf, COP, Strompreis-/Tarifszenarien, Investitions-/Förderparameter
- Typische Outputs: Jahresverbrauch/-kosten, Einsparungen, Wirtschaftlichkeit über die Laufzeit

## How to run (lokal)

Voraussetzungen: Python 3.12+ empfohlen, Windows/macOS/Linux. In der Regel reicht ein venv + `requirements.txt`.

PowerShell (Windows):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Start als App-Launcher (falls vorgesehen)
python gui.py

# Alternativ einzelne UIs starten (Streamlit)
streamlit run analysis.py
# oder
streamlit run pdf_ui.py
```

## Daten, Templates und Assets

- Datenverzeichnis `data/`:
  - Preis-Matrix: `data/price_matrix.xlsx` bzw. CSV
  - SQLite/Projektstände: `data/app_data.db` (sofern genutzt)
  - Firmen-/Kundendokumente: `data/company_docs/`, `data/customer_docs/`
- Overlay/Koordinaten:
  - `coords/seite1.yml` … `coords/seite7.yml` (Abgleich mit `pdf_template_engine/placeholders.py`)
- Statische Hintergründe:
  - `pdf_templates_static/notext/nt_nt_01.pdf` … `nt_nt_07.pdf` (oder projektinterne BGs unter `pdf_template_engine/bg/`)

## Tests und Tools

- PDF/Overlay-Checks: `tools/test_main_pdf.py`, `tools/test_main6_render.py`, `tools/test_overlay_footer.py`
- Platzhalter/Databuild: `tools/test_build_dynamic_data.py`, `tools/test_page3_values.py`
- Nützliche Helfer: `tools/count_pages.py`, `utils/export_coords.py`

Ausführung (Beispiele):

```powershell
python tools/test_main_pdf.py
python tools/test_build_dynamic_data.py
```

## Troubleshooting und Hinweise

- EOLs/Zeilenenden: `.gitattributes` erzwingt konsistente LF im Repo; Git normalisiert bei Windows-Checkouts (CRLF). Warnungen sind unkritisch.
- `final_price` fehlt: Wird in der PDF-Pipeline aus Session-State oder Netto/Brutto abgeleitet, sofern nicht vorhanden.
- Fehlende Templates/Hintergründe: Koordinaten/YML und statische PDFs prüfen; Pfade/Dateinamen exakt einhalten.
- Preis-Matrix-Fälle „Ohne Speicher“: Aufpreise aus Produkt-DB werden addiert (`cost_storage_aufpreis_product_db_netto`).
- Performance großer PDFs: Optional Git LFS für große Assets erwägen.

—
Maintainer: siehe GitHub-Projektseite.
