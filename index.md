# Projekt-Index

Kurzübersicht und Navigations-Index für dieses Repository. Für eine ausführliche Beschreibung siehe auch die bestehende `README.md`.

## Inhaltsverzeichnis
- Überblick
- Verzeichnisstruktur (Top-Level)
- Wichtige Dateien und Module
- Startpunkte (typisch)
- Daten & PDF-Templates

## Überblick
Python-App zur PV-Angebotserstellung mit Streamlit-UI, Berechnungs-Engine und modularer PDF-Erzeugung (ReportLab + pypdf). Fokus: Angebotslogik, Preisbildung (Matrix + Auf-/Abschläge), Simulationen und PDF.

## Verzeichnisstruktur (Top-Level)
- `analysis.py`, `pdf_ui.py`, `pdf_preview.py` – UI/Workflows (Streamlit)
- `calculations.py`, `calculations_extended.py`, `calculations_heatpump.py`, `financial_tools.py` – Kalkulationen/Domain
- `pdf_generator.py`, `pdf_styles.py`, `pdf_widgets.py`, `pdf_template_engine/` – PDF-Erzeugung und Overlay-Engine
- `data/` – Preis-Matrix, Produkt-/Firmendaten
- `coords/`, `coords_wp/` – YML-Koordinaten fürs 6-Seiten-Haupttemplate
- `tools/`, `utils/`, `theming/` – Hilfs-Skripte, Utilities, Styles

## Wichtige Dateien und Module
- `calculations.py` – Kernkalkulationen (Preis-Matrix, Zusatzkosten, Netto/Brutto, Einspeisevergütung, KPIs)
- `analysis.py` – Zentrale App-/KPI-Ansichten, Live-Kosten-Vorschau, Simulationen, Pricing-Modifikationen
- `pdf_ui.py` – PDF-UI, Validierung, Aufruf des Generators
- `pdf_generator.py` – PDF-Erzeugung inkl. 6-Seiten-Overlay (`pdf_template_engine/`)
- `pdf_template_engine/placeholders.py` – Mapping der Platzhalter zu Datenfeldern

## Startpunkte (typisch)
- Streamlit (UI-Ansichten):
  - `analysis.py` und/oder `pdf_ui.py` als Einstiege für die App-Ansichten
- PDF testen:
  - Sicherstellen, dass `pdf_templates_static/notext/nt_nt_01.pdf` … `06.pdf` vorhanden sind und `coords/seite1.yml` … `seite6.yml` zu den Platzhaltern passen.

Hinweis: Netto-Werte sind die Basis für viele KPIs/Entscheidungen; `final_price` wird bei der PDF-Erzeugung defensiv aus Session-State oder Netto/Brutto hergeleitet.

## Daten & PDF-Templates
- Preis-Matrix: Upload/Verwendung über `admin_panel.py` und Zugriff in `calculations.py`.
- Overlay-Engine: `pdf_template_engine/` mit YML-Koordinaten in `coords/` und statischen Hintergründen in `pdf_templates_static/notext/`.

—
Maintainer: siehe GitHub-Projektseite.
