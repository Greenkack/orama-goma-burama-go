# Contracts-Referenz (PV-App)

Ziel: Eine zentrale, kurze und verlässliche Übersicht aller wichtigen Datenverträge (Inputs/Outputs), Session-State-Keys und PDF-Pipeline-Schnittstellen – als Nachschlagewerk für Entwicklung und Migration (Electron + PrimeReact + TypeScript).

## 1) Kern-Datenstrukturen

### project_data (Dict)

- customer_data
  - `customer_name: str`
  - `customer_address: str`
  - `customer_email: str | None`
  - `customer_phone: str | None`
- project_details
  - `module_quantity: int`
  - `selected_module_name: str | None`
  - `selected_module_id: int | None`
  - `selected_module_capacity_w: float` (Wp je Modul)
  - `anlage_kwp: float` (berechnet)
  - `selected_inverter_name: str | None`
  - `selected_inverter_id: int | None`
  - `selected_inverter_quantity: int` (>= 1)
  - `selected_inverter_power_kw_single: float`
  - `selected_inverter_power_kw: float` (gesamt)
  - Storage (optional)
    - `include_storage: bool`
    - `selected_storage_name: str | None`
    - `selected_storage_id: int | None`
    - `selected_storage_storage_power_kw: float` (kWh gesamt)
  - Additional (optional; je nach Auswahl)
    - `selected_wallbox_name/id`, `selected_ems_name/id`, `selected_optimizer_name/id`, `selected_carport_name/id`, `selected_notstrom_name/id`, `selected_tierabwehr_name/id`
- economic_data
  - ggf. Zinsen, Strompreise, Förderungen etc. (variiert je Setup)
- Top-Level Convenience
  - `inverter_power_kw: float` (Duplikat der Gesamtleistung für Analysen)

### analysis_results (Dict)

- Wirtschaft/Kosten (Auszug – Zahlenwerte in Netto, wenn nicht anders angegeben)
  - `base_matrix_price_netto: float | None`
  - `total_additional_costs_netto: float | None`
  - `subtotal_netto: float | None`
  - `total_investment_netto: float`
  - `total_investment_brutto: float`
  - `annual_pv_production_kwh: float`
  - Einspeisevergütung: `einspeiseverguetung_*` Felder
  - Simulationslisten/KPIs: z. B. `monthly_productions_sim: List[12]`, `cumulative_cash_flows_sim: List[N+1]`, `annual_benefits_sim: List[N]`, `simulation_period_years_effective: int`
- Chart-Bytes (für PDF-Einbau; PNG)
  - `yearly_production_chart_bytes: bytes | None`
  - `break_even_chart_bytes: bytes | None`
  - `amortisation_chart_bytes: bytes | None`
  - `co2_savings_chart_bytes: bytes | None`
- Fallback-Preise
  - `final_price: float | None` (kann aus UI-Session-State oder aus `total_investment_*` abgeleitet werden)

### company_info (Dict)

- `id: int | str`
- `name: str`
- `address: str | None`
- `logo_base64: str | None`
- Weitere Felder je nach DB (Telefon, E-Mail, Bankverbindung etc.)

### product_db (Minimalfelder je Kategorie)

- Modul: `id, model_name, capacity_w`
- Wechselrichter: `id, model_name, power_kw`
- Speicher: `id, model_name, storage_power_kw`
- Weitere: `model_name` + sinnvolle Basisattribute für Darstellung/Preislogik

## 2) Wichtige Session-State-Keys

- Live-Pricing
  - `live_pricing_calculations = { base_cost: float, total_rabatte_nachlaesse: float, total_aufpreise_zuschlaege: float, final_price: float }`
- PDF-Konfiguration (doc_output/pdf_ui)
  - `pdf_selected_main_sections: List[str]` (Reihenfolge der Hauptkapitel)
  - `pdf_inclusion_options: Dict`
    - Flags: `include_company_logo`, `include_product_images`, `all_documents`, `append_additional_pages_after_main6`
    - Listen: `company_document_ids_to_include: List[int]`, `selected_charts_for_pdf: List[str]`
  - `pdf_design_config: Dict` (Design-/Layout-Optionen klassisch)
  - `chart_config: Dict` (Diagramm-Auswahl/Parameter UI-seitig)
  - `financing_config: Dict` (Szenarien/Parameter für Finanzvergleiche)
  - `generated_pdf_bytes_for_download_v1: bytes | None`
- PDF Themes/Visuals (pdf_styles)
  - `pdf_theme_settings = { selected_theme: str, chart_customizations: Dict, layout_customizations: Dict, effects: Dict }`
  - `custom_themes: Dict[str, ThemeDef]`
- PDF Struktur/Content (pdf_widgets)
  - `pdf_section_order: List[str]`
  - `pdf_section_contents: Dict[str, List[{ id: str, type: 'text'|'image'|'pdf'|'table'|'chart', data: Any }]>`
  - `pdf_custom_sections: Dict[str, { name: str, icon: str, content_types: List[str], created: ISODate }]>`

## 3) PDF-Pipeline – Generator-Vertrag

Eingabe an `pdf_generator.generate_offer_pdf_with_main_templates` (vereinheitlicht):

- `project_data: Dict` (siehe oben)
- `analysis_results: Dict` (inkl. `*_chart_bytes`)
- `company_info: Dict`
- `sections_to_include: List[str]` (z. B. Deckblatt, Projektübersicht, Komponenten, Kosten, Wirtschaftlichkeit …)
- `inclusion_options: Dict` (Logos, Produktbilder, Firmendokumente, Charts, Append-Optionen)
- `texts: Dict[str, str]` (Lokalisierung)
- optional: Theme/Stylesheet (aus `pdf_styles` abgeleitet) bzw. `pdf_theme_settings`

Ausgabe:

- `bytes` (PDF)

Fehler-/Fallback-Politik:

- Validierung (`_validate_pdf_data_availability`) füllt fehlende `final_price`/Firmendaten, warnt bei fehlenden KPIs, nutzt Defaults.
- Falls Charts fehlen (`*_chart_bytes = None`), sollte der Generator Platzhalter/Überspringen unterstützen.

## 4) Visuals/Charts – Contracts

- Renderer: `pv_visuals.py` erzeugt Plotly 3D-Figuren und speichert PNG-Bytes in `analysis_results`:
  - `yearly_production_chart_bytes`, `break_even_chart_bytes`, `amortisation_chart_bytes`, `co2_savings_chart_bytes`
- Export benötigt `kaleido`; bei Fehler → `None` (Generator muss robust sein).

## 5) Themes/Styles – Contracts

- Farbpalette `get_color_palette()` liefert `Dict[str, Color]` mit Keys:
  - `primary, secondary, text, separator, white, black, grey, darkgrey`
- ParagraphStyles (ReportLab) – Beispiele (Name → Zweck):
  - `OfferMainTitle`, `SectionTitle`, `SubSectionTitle`, `TableText/Number/Header`, `ImageCaption` …
- TableStyles: `get_base_table_style`, `get_data_table_style`, `get_product_table_style`, `get_main_product_table_style`
- Theme-Manager (UI):
  - `pdf_theme_settings.selected_theme`
  - `chart_customizations`: `grid, grid_alpha, line_width, marker_size, shadow, gradient`
  - `layout_customizations`: `margin_*`, `header_height`, `footer_height`, `section_spacing`, `element_spacing`
  - `effects`: `watermark, page_numbers, header_line, footer_line, section_borders, highlight_important, use_icons, rounded_corners` (+ ggf. `watermark_settings`)

## 6) Finanz-APIs (financial_tools)

- `calculate_annuity(principal, apr, years)` → `{ monatliche_rate, gesamtzinsen, gesamtkosten, effective_rate, tilgungsplan[], laufzeit_monate }`
- `calculate_leasing_costs(total_investment, leasing_factor, duration_months, residual_value_percent)` → Kosten/Restwert/Effektivkosten
- `calculate_depreciation(initial_value, useful_life_years, method='linear')` → lineare Abschreibung + Plan
- `calculate_financing_comparison(investment, apr, years, leasing_factor)` → `{ kredit, leasing, cash_kauf, empfehlung }`
- `calculate_capital_gains_tax(profit, tax_rate)` → Steuer/Netto
- `calculate_contracting_costs(base_fee, consumption_price, consumed_kwh, period_years)` → Periodenkosten/Effektivpreis

## 7) Edge/Fallback-Checkliste

- `final_price` nicht gesetzt → aus `live_pricing_calculations` oder `total_investment_*` ableiten.
- Firmendaten fehlen → `company_info` in `project_data.company_information` injizieren.
- Charts `None` → Generator überspringt/platzhaltert.
- Plotly/Kaleido/Fonts/Headless → Laufzeitumgebung prüfen.
- DnD-Paket fehlt → `pdf_widgets` nutzt Button-Fallback.

## 8) Pipeline-Diagramm

```mermaid
flowchart LR
  A[UI: analysis/pdf_ui/doc_output] --> B[Consolidation: project_data + analysis_results + company_info + sections + inclusion_options + theme]
  B --> C[Validation: _validate_pdf_data_availability + Fallback-Fills]
  C --> D[PDF Generator: generate_offer_pdf_with_main_templates]
  D --> E[PDF Bytes]
  E --> F[Preview: pdf_preview (PyMuPDF → PNG)]
  E --> G[Download Button]
```

## 9) Beispiel – Generator-Call (Pseudo)

```json
{
  "project_data": { "customer_data": {"customer_name": "Max Mustermann"}, "project_details": {"anlage_kwp": 9.86, "module_quantity": 22} },
  "analysis_results": { "total_investment_netto": 18750.0, "annual_pv_production_kwh": 9800, "yearly_production_chart_bytes": "<base64>" },
  "company_info": { "name": "Solar GmbH", "logo_base64": "<base64>" },
  "sections_to_include": ["cover_page", "project_overview", "technical_components", "cost_details", "economics"],
  "inclusion_options": { "include_company_logo": true, "selected_charts_for_pdf": ["yearly_production_chart_bytes", "break_even_chart_bytes"] },
  "texts": { "offer_title": "Ihr PV-Angebot" },
  "theme": { "selected_theme": "modern_blue" }
}
```

## 10) Migrationstipps (TS)

- Contracts als TS-Interfaces pflegen (zod-Validation), JSON-Persistence im `userData`.
- Chart-Bytes serverseitig generieren (node-kaleido) → als `ArrayBuffer` einbetten.
- PDF-Stack (pdf-lib/pdfmake) mit zweiphasigem Seitenzähler (optional).
- Preview mit `pdf.js`; DnD via `dnd-kit`.
