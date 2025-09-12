"""
placeholders.py
Definiert die Zuordnung zwischen Beispieltexten in den coords/seiteX.yml-Dateien
und logischen Platzhalter-Schlüsseln sowie eine Hilfsfunktion, um aus den
App-Daten (project_data, analysis_results, company_info) die dynamischen Werte
für die PDF-Overlays zu erzeugen.
"""

from __future__ import annotations
from typing import Dict, Any
import re

# Abbildung von Beispieltexten (so wie sie in den YML-Dateien stehen) auf
# logische Platzhalter-Keys. Diese Keys werden später mit echten Werten befüllt.
PLACEHOLDER_MAPPING: Dict[str, str] = {
	# Kundendaten (Beispiele aus seite1.yml)
	"qwe qe": "customer_name",  # Platzhalter für Namen (wird aus Anrede/Titel/Vor-/Nachname gebaut)
	"22359 Hamburg": "customer_city_zip",
	"Tel: 0155555555": "customer_phone",
	"oemertimur@gmail.com": "customer_email",

	# KPIs / Kennzahlen (Beispiele) – an echte Keys der App angepasst
	"36.958,00 EUR*": "anlage_kwp",
	"29.150,00 EUR*": "amortization_time",
	# Beispielwerte aus der Vorlage
	"8,4 kWp": "anlage_kwp",
	# Rechts neben "Batterie": statischer Text (ersetzt die Beispielzahl 6,1 kWh)
	"6,1 kWh": "storage_capacity_kwh",
	"8.251,92 kWh/Jahr": "annual_pv_production_kwh",
	"54%": "self_supply_rate_percent",
	"42%": "self_consumption_percent",
}

# Ergänzungen: Exakte YAML-Beispiele und Firmendaten-Mapping
PLACEHOLDER_MAPPING.update({
	# Exakte Adresse aus coords/seite1.yml (Schreibweise exakt wie in YML)
	"Auf den Wöörden 23": "customer_street",

	# Firmendaten (rechte Seite)
	"TommaTech GmbH": "company_name",
	"Zeppelinstraße 14": "company_street",
	"85748 Garching b. München": "company_city_zip",
	"Tel: +49 89 1250 36 860": "company_phone",
	"mail@tommatech.de": "company_email",
})

# Seite 1: spezielle Ersetzungen der linken Label durch dynamische Werte
PLACEHOLDER_MAPPING.update({
	# "Heizung" soll zur reinen Modulanzahl werden (nur Zahl)
	"Heizung": "pv_modules_count_with_unit",
	# "Warmwasser" soll die Wechselrichter-Gesamtleistung (kW) anzeigen
	"Warmwasser": "inverter_total_power_kw",
	# "Verbrauch" soll die Speicherkapazität (kWh) anzeigen
	"Verbrauch": "storage_capacity_kwh",
	# Neue Anforderungen Seite 1:
	# Wert neben „Dachneigung“ (Beispiel „30°“) zeigt jetzt die jährliche Einspeisevergütung in Euro
	"Dachneigung": "annual_feed_in_revenue_eur",
	# "Solaranlage" zeigt jetzt den MwSt.-Betrag (19% vom Netto-Endbetrag)
	"Solaranlage": "vat_amount_eur",
	# "Batterie" und "Jahresertrag" werden als statischer Text "inklusive" angezeigt
	"Batterie": "static_inklusive",
	"Jahresertrag": "static_inklusive",
	# Rechte Spalte Texte an den geänderten Positionen
	"DC Dachmontage": "static_dc_dachmontage",
	# Unterstütze beide Schreibweisen im Template für den rechten Wert neben "Jahresertrag"
	"AC Installation und Inbetriebnahme": "static_ac_installation",
	"AC Installation | Inbetriebnahme": "static_ac_installation",
})

# Footer: dynamische Firma/Datum (ersetzt feste Dummy-Werte in allen seiteX.yml)
PLACEHOLDER_MAPPING.update({
	"tom-90": "footer_company",
	"29.11.2024": "footer_date",
})

# Seite 2: Energieflüsse und Quoten
PLACEHOLDER_MAPPING.update({
	"8.251 kWh": "pv_prod_kwh_short",
	"1.945 kWh": "direct_self_consumption_kwh",
	"1.562 kWh": "battery_charge_kwh",
	"1.313 kWh": "battery_discharge_for_sc_kwh",
	# Variante im Template vorkommend
	"1.321 kWh": "battery_discharge_for_sc_kwh",
	"4.745 kWh": "grid_feed_in_kwh",
	"2.742 kWh": "grid_bezug_kwh",
	"6.000 kWh": "annual_consumption_kwh",
	# Kreisdiagramm-Beschriftungen (Produktion)
	"19%": "battery_use_quote_prod_percent",
	"58%": "direct_consumption_quote_prod_percent",
	# Zahlen-only Token neben separatem "%" auf dem Template
	"24": "feed_in_quote_prod_percent_number",
	# Kreisdiagramm-Beschriftungen (Verbrauch)
	"22%": "battery_cover_consumption_percent",
	"46%": "grid_consumption_rate_percent",
	"32": "direct_cover_consumption_percent_number",
})

# Seite 2: Hinweistext für Batterie-Heuristik (Token anpassbar in coords/seite2.yml)
PLACEHOLDER_MAPPING.update({
	"Hinweis Batteriespeicher": "battery_note_text",
})

# Seite 2: KWh-Anteile für "Woher kommt mein Strom?" (optional – Token in coords/seite2.yml platzieren)
PLACEHOLDER_MAPPING.update({
	"Direkter Verbrauch (kWh)": "consumption_direct_kwh",
	"Batteriespeicher (kWh)": "consumption_battery_kwh",
	"Netzbezug (kWh)": "consumption_grid_kwh",
})

# Seite 3: Wirtschaftlichkeit
PLACEHOLDER_MAPPING.update({
	# Ertrag über 20 Jahre (Zahl ohne Einheit, da "EUR" separat gelayoutet ist)
	"36.958": "savings_with_battery_number",
	"29.150": "savings_without_battery_number",
	# IRR / Rendite (Platzhalter – bis dedizierte Szenarienwerte mit/ohne Speicher vorliegen)
	"12,7%": "irr_percent",
	"9,7%": "irr_percent",
	# Produktionskosten (ct/kWh) – basierend auf LCOE
	"8,9 Cent": "lcoe_cent_per_kwh",
	"13,5 Cent": "lcoe_cent_per_kwh",
})

# Seite 4: Komponenten (Module / WR / Speicher)
# WICHTIG: Die folgenden Beispieltexte müssen 1:1 mit den Textfeldern in coords/seite4.yml übereinstimmen
# (ohne führende Leerzeichen). Diese sind absichtlich eindeutig, damit Module/WR/Speicher getrennt befüllt werden können.
PLACEHOLDER_MAPPING.update({
	# Modul
	"Modul-Hersteller": "module_manufacturer",
	"Modul-Modell": "module_model",
	"Modul-Leistung": "module_power_wp",
	"Modul-Garantie": "module_warranty_years",
	"Modul-Leistungsgarantie": "module_performance_warranty",
	# Wechselrichter
	"WR-Hersteller": "inverter_manufacturer",
	"WR-Wirkungsgrad": "inverter_max_efficiency_percent",
	"WR-Garantie": "inverter_warranty_years",
	# Speicher
	"Speicher-Hersteller": "storage_manufacturer",
	"Speicher-Modell": "storage_model",
	"Speicher-Kapazität": "storage_capacity_kwh",
	"Speicher-Leistung": "storage_power_kw",
	"Speicher-Entladetiefe": "storage_dod_percent",
	"Speicher-Zyklen": "storage_cycles",
})


def build_dynamic_data(
	project_data: Dict[str, Any] | None,
	analysis_results: Dict[str, Any] | None,
	company_info: Dict[str, Any] | None = None,
) -> Dict[str, str]:
	"""Erzeugt ein Dictionary mit dynamischen Werten für die Overlays.

	Args:
		project_data: Stammdaten des Projekts (inkl. Kundendaten).
		analysis_results: Ergebnisse/kennzahlen der Berechnungen.
		company_info: optionale Firmendaten (für spätere Felder/Logos).

	Returns:
		Mapping von Platzhalter-Keys (siehe PLACEHOLDER_MAPPING Werte) zu Strings.
	"""
	project_data = project_data or {}
	analysis_results = analysis_results or {}
	company_info = company_info or {}

	customer = project_data.get("customer_data", {}) if isinstance(project_data, dict) else {}
	project_details = project_data.get("project_details", {}) if isinstance(project_data, dict) else {}

	def as_str(v: Any) -> str:
		return "" if v is None else str(v)

	# Einfache deutschformatierte Zahl mit Komma und optionaler Einheit
	# Primär über das zentrale Format aus calculations.py für Parität
	def fmt_number(val: Any, decimals: int = 1, unit: str = "") -> str:
		try:
			from calculations import format_kpi_value as _fmt
			return _fmt(val, unit=unit, precision=decimals, texts_dict=None)
		except Exception:
			# Fallback: einfache deutsche Formatierung
			try:
				f = float(val)
				s_en = f"{f:,.{decimals}f}"
				s_de = s_en.replace(",", "#").replace(".", ",").replace("#", ".")
				return (s_de + (" " + unit if unit else "")).strip()
			except Exception:
				return as_str(val)

	# Tolerante Zahl-zu-Float Konvertierung: akzeptiert "10,0", "10.0", "10 kWh", "10,00 kWh"
	def parse_float(val: Any) -> float | None:
		if val is None:
			return None
		try:
			if isinstance(val, (int, float)):
				return float(val)
			s = str(val).strip()
			# Einheiten entfernen
			s = re.sub(r"[^0-9,\.\-]", "", s)
			# Komma in Punkt wandeln
			s = s.replace(",", ".")
			return float(s) if s not in {"", "-", "."} else None
		except Exception:
			return None

	# Kundendaten korrekt aus den echten Keys aufbauen
	first = as_str(customer.get("first_name") or "").strip()
	last = as_str(customer.get("last_name") or "").strip()
	salutation = as_str(customer.get("salutation") or "").strip()
	title = as_str(customer.get("title") or "").strip()
	if title.lower() in {"", "(kein)", "keine", "none", "null"}:
		title = ""
	name_parts = [p for p in [salutation, title, first, last] if p]
	full_name = " ".join(name_parts)

	street = as_str(customer.get("address") or "").strip()
	house_no = as_str(customer.get("house_number") or "").strip()
	street_full = (street + (" " + house_no if house_no else "")).strip()
	zip_code = as_str(customer.get("zip_code") or "").strip()
	city = as_str(customer.get("city") or "").strip()
	city_zip = (f"{zip_code} {city}").strip()
	phone = as_str(customer.get("phone_mobile") or customer.get("phone_landline") or "").strip()
	email = as_str(customer.get("email") or "").strip()

	result: Dict[str, str] = {
		"customer_name": full_name,
		"customer_street": street_full,
		"customer_city_zip": city_zip,
		"customer_phone": phone,
		"customer_email": email,

		# Firma (für Platzhalter rechts)
		"company_name": as_str(company_info.get("name") or ""),
		"company_street": as_str(company_info.get("street") or ""),
		"company_city_zip": as_str((f"{company_info.get('zip_code','')} {company_info.get('city','')}").strip()),
		"company_phone": as_str(company_info.get("phone") or ""),
		"company_email": as_str(company_info.get("email") or ""),
		"company_website": as_str(company_info.get("website") or ""),

		# Firmenlogo (Base64) für Overlay-Header auf Seiten 1-6
		"company_logo_b64": as_str(company_info.get("logo_base64") or ""),

		# Seite 4 – Defaults, damit keine Platzhaltertexte stehen bleiben
		"module_manufacturer": "",
		"module_model": "",
		"module_power_wp": "",
		"module_warranty_years": "",
		"module_performance_warranty": "",
		"inverter_manufacturer": "",
		"inverter_max_efficiency_percent": "",
		"inverter_warranty_years": "",
		"storage_manufacturer": "",
		"storage_model": "",
		"storage_capacity_kwh": "",
		"storage_power_kw": "",
		"storage_dod_percent": "",
		"storage_cycles": "",
			# Bilder für Seite 4 (aus Produkt-DB, Base64 – werden separat gezeichnet)
			"module_image_b64": "",
			"inverter_image_b64": "",
			"storage_image_b64": "",
	}

	# Footer-Infos: Links unten jetzt Kundenname; Mitte: aktuelles Datum (dd.mm.YYYY)
	try:
		from datetime import datetime
		date_str = datetime.now().strftime("%d.%m.%Y")
	except Exception:
		date_str = ""
	# Links unten: Kundenname (wie auf allen Seiten gewünscht)
	result["footer_company"] = full_name
	# Mitte unten: "Angebot, <Datum>"
	result["footer_date"] = f"Angebot, {date_str}" if date_str else "Angebot"

	# Anlagengröße (kWp): bevorzugt aus analysis_results, sonst aus project_details berechnen
	anlage_kwp = analysis_results.get("anlage_kwp")
	if anlage_kwp is None:
		# Berechnung: Anzahl Module × Leistung pro Modul (Wp) / 1000
		try:
			mod_qty = float(project_details.get("module_quantity") or 0)
			mod_wp = float(project_details.get("selected_module_capacity_w") or 0)
			anlage_kwp_calc = (mod_qty * mod_wp) / 1000.0 if mod_qty > 0 and mod_wp > 0 else project_details.get("anlage_kwp")
			anlage_kwp = anlage_kwp_calc
		except Exception:
			anlage_kwp = project_details.get("anlage_kwp")
	if anlage_kwp is not None:
		# Seite 1: immer 2 Dezimalstellen anzeigen
		result["anlage_kwp"] = fmt_number(anlage_kwp, 2, "kWp")
		# Kompatibilität: fülle optional alten Key mit (ebenfalls 2 Dezimalstellen)
		result["pv_power_kWp"] = fmt_number(anlage_kwp, 2, "kWp")

	# Anzahl der PV-Module (nur Zahl)
	try:
		mods_qty = project_details.get("module_quantity")
		if mods_qty is None:
			mods_qty = analysis_results.get("module_quantity")
		if mods_qty is not None:
			# Nur die Zahl ohne Einheit
			result["pv_modules_count_number"] = fmt_number(float(mods_qty), 0, "")
			# Neu: Darstellung mit Suffix "Stück" für Seite 1
			result["pv_modules_count_with_unit"] = f"{result['pv_modules_count_number']} Stück"
	except Exception:
		pass

	# Batteriegröße (kWh): Spiegel die UI-Logik aus dem Solar Calculator
	# Priorität:
	# 1) Vom Nutzer gesetzte Kapazität in der Technik-Auswahl: project_details['selected_storage_storage_power_kw'] (App-Konvention: kWh)
	# 2) Kapazität aus Produkt-DB zum gewählten Modell – bevorzugt 'storage_power_kw' (in der App häufig als kWh gepflegt),
	#    danach echte Kapazitätsfelder ('capacity_kwh', 'usable_capacity_kwh', 'nominal_capacity_kwh')
	# 3) Weitere Fallbacks: analysis_results['battery_capacity_kwh'], project_details explizit, alternative Felder
	bat_kwh = None
	# 1) Modellkapazität aus DB (wie im Solar Calculator angezeigt) – BEVOR UI-Wert,
	#    damit direkt beim Modellwechsel die richtige Kapazität angezeigt wird.
	if bat_kwh in (None, 0.0):
		try:
			from product_db import get_product_by_model_name as _get_prod_model_cap
		except Exception:
			_get_prod_model_cap = None  # type: ignore
		storage_model_name_pref = as_str(project_details.get("selected_storage_name") or "").strip()
		if _get_prod_model_cap and storage_model_name_pref:
			try:
				std_pref = _get_prod_model_cap(storage_model_name_pref) or {}
				# Bevorzugt exakt wie im Solar Calculator: storage_power_kw als kWh interpretieren,
				# danach echte Kapazitätsfelder als Fallback
				cand_db = [
					std_pref.get("storage_power_kw"),
					std_pref.get("capacity_kwh"),
					std_pref.get("usable_capacity_kwh"),
					std_pref.get("nominal_capacity_kwh"),
				]
				for cand in cand_db:
					val = parse_float(cand)
					if val and 0.0 < val <= 200.0:
						bat_kwh = val
						break
			except Exception:
				pass

	# 2) Nutzerwert aus UI (falls DB nichts lieferte)
	if bat_kwh in (None, 0.0):
		ui_kwh = parse_float(project_details.get("selected_storage_storage_power_kw"))
		if ui_kwh and ui_kwh > 0:
			bat_kwh = ui_kwh

	# 3) Fallbacks auf Analyse/weitere Projektfelder
	if bat_kwh in (None, 0.0):
		fallbacks = [
			analysis_results.get("battery_capacity_kwh"),
			project_details.get("selected_storage_capacity_kwh"),
			project_details.get("battery_capacity_kwh"),
			analysis_results.get("selected_storage_storage_power_kw"),
		]
		for f in fallbacks:
			val = parse_float(f)
			if val and val > 0:
				bat_kwh = val
				break

	if bat_kwh is not None and bat_kwh > 0:
		result["battery_capacity_kwh"] = fmt_number(float(bat_kwh), 2, "kWh")
		# Für Seite 1 und allgemeine Anzeige: gleicher Wert unter dem generischen Key verwenden
		result["storage_capacity_kwh"] = fmt_number(float(bat_kwh), 2, "kWh")
		# Seite 2: erwartete jährliche Batteriemenge (Daumenregel): Kapazität × 300 Tage
		try:
			battery_expected_annual_kwh = float(bat_kwh) * 300.0
		except Exception:
			battery_expected_annual_kwh = None
	else:
		battery_expected_annual_kwh = None

	# Jahresproduktion (kWh/Jahr)
	annual_prod = (
		analysis_results.get("annual_pv_production_kwh")
		or analysis_results.get("annual_yield_kwh")
		or analysis_results.get("sim_annual_yield_kwh")
	)
	if annual_prod is not None:
		# Seite 1: immer 2 Dezimalstellen anzeigen
		result["annual_pv_production_kwh"] = fmt_number(annual_prod, 2, "kWh/Jahr")
		# Kurzform (z. B. Seite 2) bleibt grob gerundet
		result["pv_prod_kwh_short"] = fmt_number(annual_prod, 0, "kWh")

	# Wechselrichter Gesamtleistung (kW) – für Seite 1 "Warmwasser"-Platz
	# Quellen: project_details['selected_inverter_power_kw'] oder ['inverter_power_kw']
	# Fallback: single * quantity
	try:
		inv_total_kw = (
			project_details.get("selected_inverter_power_kw")
			or project_details.get("inverter_power_kw")
		)
		if inv_total_kw is None:
			inv_single = project_details.get("selected_inverter_power_kw_single")
			inv_qty = project_details.get("selected_inverter_quantity", 1)
			if inv_single is not None and inv_qty:
				inv_total_kw = float(inv_single) * float(inv_qty)
		if inv_total_kw is not None:
			# Neu: ohne Dezimalstellen anzeigen
			result["inverter_total_power_kw"] = fmt_number(float(inv_total_kw), 0, "kW")
	except Exception:
		pass

	# Autarkie und Eigenverbrauch (%)
	self_supply = (
		analysis_results.get("self_supply_rate_percent")
		or analysis_results.get("self_sufficiency_percent")
		or analysis_results.get("autarky_percent")
	)
	if self_supply is not None:
		result["self_supply_rate_percent"] = fmt_number(self_supply, 0, "%")

	self_cons = analysis_results.get("self_consumption_percent")
	if self_cons is not None:
		result["self_consumption_percent"] = fmt_number(self_cons, 0, "%")

	# Amortisationszeit (Jahre) für Seite 1
	amort_years = (
		analysis_results.get("amortization_time_years")
		or analysis_results.get("amortisationszeit_jahre")
	)
	if amort_years is not None:
		# Immer 2 Dezimalstellen für die Amortisationszeit im PDF (Seite 1)
		result["amortization_time"] = fmt_number(amort_years, 2, "Jahre")

	# Ersparnisse (Beispiele)
	savings_batt = analysis_results.get("savings_20y_with_battery_eur")
	if savings_batt is not None:
		result["savings_with_battery"] = fmt_number(savings_batt, 2, "EUR*")
		# Zahlen-only für Seite 3 (EUR steht separat)
		result["savings_with_battery_number"] = fmt_number(savings_batt, 0, "").replace(" €", "")

	savings_no_batt = analysis_results.get("savings_20y_without_battery_eur")
	if savings_no_batt is not None:
		result["savings_without_battery"] = fmt_number(savings_no_batt, 2, "EUR*")
		result["savings_without_battery_number"] = fmt_number(savings_no_batt, 0, "").replace(" €", "")

	# Seite 2: Energieflüsse (Jahr 1)
	monthly_direct_sc = analysis_results.get("monthly_direct_self_consumption_kwh", []) or []
	monthly_storage_charge = analysis_results.get("monthly_storage_charge_kwh", []) or []
	monthly_storage_discharge_sc = analysis_results.get("monthly_storage_discharge_for_sc_kwh", []) or []
	feed_in_kwh = analysis_results.get("netzeinspeisung_kwh")
	grid_bezug_kwh = analysis_results.get("grid_bezug_kwh") or analysis_results.get("grid_purchase_kwh")
	# Jahresverbrauch aus möglichst vielen Quellen robust ermitteln (9500 kWh sicher übernehmen)
	annual_consumption = (
		# Primär: Analysis-Ergebnisse
		analysis_results.get("annual_consumption_kwh")
		or analysis_results.get("annual_consumption_kwh_yr")
		or analysis_results.get("total_consumption_kwh_yr")
		or analysis_results.get("annual_consumption")
		# Projekt-Details (Eingabemaske)
		or project_details.get("annual_consumption_kwh_yr")
		or project_details.get("annual_consumption_kwh")
		# Gesamtdaten (z. B. CRM/Quick-Calc/Importe)
		or project_data.get("annual_consumption_kwh")
		or project_data.get("annual_consumption")
		or (project_data.get("consumption_data", {}) or {}).get("annual_consumption")
	)
	# Falls nur Teilwerte vorhanden sind: Haushalt + Heizung aufaddieren
	if annual_consumption in (None, 0, 0.0):
		try:
			haushalt = float(project_details.get("annual_consumption_kwh_yr") or 0.0)
			heizung = float(project_details.get("consumption_heating_kwh_yr") or 0.0)
			combo = haushalt + heizung
			annual_consumption = combo if combo > 0 else annual_consumption
		except Exception:
			pass
	# Jahresproduktion (für Konsistenzprüfung auf Seite 2)
	annual_prod_float = None
	try:
		if annual_prod is not None:
			annual_prod_float = float(annual_prod)
	except Exception:
		annual_prod_float = None

	try:
		direct_sc_sum = sum(float(v or 0) for v in monthly_direct_sc)
		charge_sum = sum(float(v or 0) for v in monthly_storage_charge)
		discharge_sc_sum = sum(float(v or 0) for v in monthly_storage_discharge_sc)
	except Exception:
		direct_sc_sum, charge_sum, discharge_sc_sum = 0.0, 0.0, 0.0

	# Falls Speicherkapazität bekannt: Batteriesummen überschreiben (heuristisch) mit Kapazität × 300
	if battery_expected_annual_kwh and battery_expected_annual_kwh > 0:
		charge_sum = float(battery_expected_annual_kwh)
		discharge_sc_sum = float(battery_expected_annual_kwh)

	# Konsistenz- und Realismus-Korrekturen für Seite 2
	def to_float_or_none(x: Any) -> float | None:
		try:
			return float(x)
		except Exception:
			return None

	cons_total = to_float_or_none(annual_consumption)
	grid_bezug_val = to_float_or_none(grid_bezug_kwh)
	feed_in_val = to_float_or_none(feed_in_kwh)

	# 1) Direktverbrauch darf weder Jahresproduktion noch Jahresverbrauch überschreiten
	if annual_prod_float is not None:
		direct_sc_sum = min(direct_sc_sum, max(0.0, annual_prod_float))
	if cons_total is not None:
		direct_sc_sum = min(direct_sc_sum, max(0.0, cons_total))

	# 2) Speicher-Ladung kann nicht größer sein als Restproduktion nach Direktverbrauch
	if annual_prod_float is not None:
		charge_sum = min(charge_sum, max(0.0, annual_prod_float - direct_sc_sum))
	# 3) Speicher-Entladung für Direktverbrauch kann nicht größer sein als geladen UND Rest-Verbrauch
	if cons_total is not None:
		discharge_sc_sum = min(discharge_sc_sum, max(0.0, cons_total - direct_sc_sum))
	discharge_sc_sum = min(discharge_sc_sum, charge_sum)

	# 4) Einspeisung = Produktion - (Direkt + Speicher-Ladung) [>=0]
	if annual_prod_float is not None:
		feed_in_calc = max(0.0, annual_prod_float - direct_sc_sum - charge_sum)
		feed_in_val = feed_in_calc

	# 5) Netzbezug = Verbrauch - (Direkt + Speicher-Entladung) [>=0]
	if cons_total is not None:
		grid_bezug_calc = max(0.0, cons_total - direct_sc_sum - discharge_sc_sum)
		grid_bezug_val = grid_bezug_calc

	# Formatiert in Ergebnisfelder schreiben
	if direct_sc_sum:
		result["direct_self_consumption_kwh"] = fmt_number(direct_sc_sum, 0, "kWh")
	if charge_sum:
		result["battery_charge_kwh"] = fmt_number(charge_sum, 0, "kWh")
	if discharge_sc_sum:
		result["battery_discharge_for_sc_kwh"] = fmt_number(discharge_sc_sum, 0, "kWh")
	if feed_in_val is not None:
		result["grid_feed_in_kwh"] = fmt_number(feed_in_val, 0, "kWh")
	if grid_bezug_val is not None:
		result["grid_bezug_kwh"] = fmt_number(grid_bezug_val, 0, "kWh")
	if cons_total is not None:
		result["annual_consumption_kwh"] = fmt_number(cons_total, 0, "kWh")

	# Unteres Diagramm ("Woher kommt mein Strom?") als kWh ausgeben
	if cons_total is not None:
		# Direkter Verbrauch (aus PV)
		result["consumption_direct_kwh"] = fmt_number(max(0.0, min(direct_sc_sum, cons_total)), 0, "kWh")
		# Batteriespeicher deckt Verbrauch mittels Entladung
		result["consumption_battery_kwh"] = fmt_number(max(0.0, min(discharge_sc_sum, cons_total)), 0, "kWh")
		# Rest aus dem Netz
		res_grid = cons_total - max(0.0, min(direct_sc_sum, cons_total)) - max(0.0, min(discharge_sc_sum, cons_total))
		result["consumption_grid_kwh"] = fmt_number(max(0.0, res_grid), 0, "kWh")

	# Seite 2: Hinweistext zur Heuristik (300 Tage statt 365)
	if battery_expected_annual_kwh and battery_expected_annual_kwh > 0:
		result["battery_note_text"] = (
			"Hinweis: Batteriespeicher-Jahreswert überschlägig mit Speicherkapazität × 300 Tage kalkuliert (statt 365)."
		)

	# Falls self_consumption_percent fehlt, robust ableiten:
	# 1) aus Produktionsanteilen: direkt + Speicher (in %)
	# 2) aus kWh-Summen: (Direkt + Speicher-Entladung für Direktverbrauch) / Jahresproduktion
	if not result.get("self_consumption_percent"):
		_direct_q = analysis_results.get("direktverbrauch_anteil_pv_produktion_pct")
		_batt_q = analysis_results.get("speichernutzung_anteil_pv_produktion_pct")
		if isinstance(_direct_q, (int, float)) and isinstance(_batt_q, (int, float)):
			try:
				val = max(0.0, min(100.0, float(_direct_q) + float(_batt_q)))
				result["self_consumption_percent"] = fmt_number(val, 0, "%")
			except Exception:
				pass
		elif (annual_prod is not None) and (direct_sc_sum or discharge_sc_sum):
			try:
				prod = float(annual_prod)
				if prod > 0:
					val = max(0.0, min(100.0, 100.0 * (float(direct_sc_sum) + float(discharge_sc_sum)) / prod))
					result["self_consumption_percent"] = fmt_number(val, 0, "%")
			except Exception:
				pass

	# Seite 2: Quoten / Prozente – Produktion strikt als Partition (Direkt, Batterie-Ladung, Einspeisung)
	if annual_prod_float and annual_prod_float > 0:
		try:
			# Rohanteile 0..1
			direct_raw = max(0.0, min(direct_sc_sum, annual_prod_float)) / annual_prod_float
			# Batterieanteil an Produktion basiert auf Ladung aus Produktion, begrenzt durch Rest nach Direktverbrauch
			battery_raw = max(0.0, min(charge_sum, max(0.0, annual_prod_float - direct_sc_sum))) / annual_prod_float
			feed_raw = max(0.0, 1.0 - direct_raw - battery_raw)

			# Integer-Normalisierung: Summe exakt 100
			direct_int = int(round(direct_raw * 100.0))
			battery_int = int(round(battery_raw * 100.0))
			# Falls Rundung > 100, zuerst Batterie reduzieren, dann Direkt
			if direct_int + battery_int > 100:
				over = direct_int + battery_int - 100
				reduce_batt = min(over, battery_int)
				battery_int -= reduce_batt
				over -= reduce_batt
				if over > 0:
					direct_int = max(0, direct_int - over)
			feed_int = max(0, 100 - direct_int - battery_int)

			# Diese drei betreffen die Pfeile oben; Positionen von Direktverbrauch und Einspeisung tauschen
			# Direktverbrauchs-Prozent im Template soll den Einspeisungswert anzeigen
			result["direct_consumption_quote_prod_percent"] = fmt_number(feed_int, 0, "%")
			result["battery_use_quote_prod_percent"] = fmt_number(battery_int, 0, "%")
			# Einspeisungs-Token (Zahl ohne %) soll den Direktverbrauchswert anzeigen
			result["feed_in_quote_prod_percent_number"] = str(direct_int)
		except Exception:
			pass

	if cons_total and cons_total > 0:
		try:
			battery_cover_pct = 100.0 * max(0.0, min(discharge_sc_sum, cons_total)) / cons_total
			grid_rate_pct = 100.0 * max(0.0, min(grid_bezug_val or 0.0, cons_total)) / cons_total
			direct_cover_pct = 100.0 * max(0.0, min(direct_sc_sum, cons_total)) / cons_total
			# Diese drei betreffen die Pfeile unten; immer setzen
			result["battery_cover_consumption_percent"] = fmt_number(battery_cover_pct, 0, "%")
			result["grid_consumption_rate_percent"] = fmt_number(grid_rate_pct, 0, "%")
			try:
				from calculations import format_kpi_value as _fmt
				result["direct_cover_consumption_percent_number"] = _fmt(direct_cover_pct, unit="", precision=0)
			except Exception:
				result["direct_cover_consumption_percent_number"] = str(int(round(direct_cover_pct)))
		except Exception:
			pass

	# Seite 3: LCOE als Cent/kWh, IRR
	lcoe_eur_kwh = analysis_results.get("lcoe_euro_per_kwh")
	if isinstance(lcoe_eur_kwh, (int, float)):
		result["lcoe_cent_per_kwh"] = fmt_number(lcoe_eur_kwh * 100.0, 1, "Cent")
	irr = analysis_results.get("irr_percent")
	if irr is not None:
		result["irr_percent"] = fmt_number(irr, 1, "%")

	# Seite 4: Produktdetails für Modul / WR / Speicher
	# Wir versuchen, Produktdetails aus der lokalen DB zu laden (optional), basierend auf den ausgewählten Modellnamen.
	get_product_by_model_name = None
	try:
		from product_db import get_product_by_model_name as _get_prod
		get_product_by_model_name = _get_prod  # type: ignore
	except Exception:
		get_product_by_model_name = None

	def fetch_details(model_name: str) -> Dict[str, Any]:
		if not model_name or not isinstance(model_name, str):
			return {}
		if get_product_by_model_name is None:
			return {}
		try:
			data = get_product_by_model_name(model_name)
			return data or {}
		except Exception:
			return {}

	# Modul
	module_name = as_str(project_details.get("selected_module_name") or "").strip()
	module_details = fetch_details(module_name) if module_name else {}
	if module_details or module_name:
		mod_brand = as_str(module_details.get("brand") or module_details.get("manufacturer") or "")
		if mod_brand:
			result["module_manufacturer"] = mod_brand
		mod_model = as_str(module_details.get("model_name") or module_name)
		if mod_model:
			result["module_model"] = mod_model
		mod_wp = module_details.get("capacity_w") or project_details.get("selected_module_capacity_w")
		if mod_wp is not None:
			try:
				result["module_power_wp"] = fmt_number(float(mod_wp), 0, "Wp")
			except Exception:
				result["module_power_wp"] = as_str(mod_wp)
		mod_warranty_years = module_details.get("warranty_years")
		if mod_warranty_years is not None:
			try:
				result["module_warranty_years"] = fmt_number(float(mod_warranty_years), 0, "Jahre")
			except Exception:
				result["module_warranty_years"] = as_str(mod_warranty_years)
		# Leistungsgarantie (z. B. "30 Jahre / 87%") – falls Felder existieren
		perf_years = module_details.get("performance_warranty_years")
		perf_pct = module_details.get("performance_warranty_percent") or module_details.get("efficiency_percent_end")
		if perf_years is not None and perf_pct is not None:
			try:
				years_str = fmt_number(float(perf_years), 0, "Jahre")
			except Exception:
				years_str = as_str(perf_years)
			try:
				pct_str = fmt_number(float(perf_pct), 0, "%")
			except Exception:
				pct_str = as_str(perf_pct)
			result["module_performance_warranty"] = f"{years_str} / {pct_str}"

		# Produktbild (Base64), falls in DB vorhanden
		img_b64 = as_str(module_details.get("image_base64") or "").strip()
		if img_b64:
			result["module_image_b64"] = img_b64

	# Wechselrichter
	inverter_name = as_str(project_details.get("selected_inverter_name") or "").strip()
	inverter_details = fetch_details(inverter_name) if inverter_name else {}
	if inverter_details or inverter_name:
		inv_brand = as_str(inverter_details.get("brand") or inverter_details.get("manufacturer") or "")
		if inv_brand:
			result["inverter_manufacturer"] = inv_brand
		# Menge der Wechselrichter optional als Suffix bereitstellen
		try:
			inv_qty = int(project_details.get("selected_inverter_quantity", 1) or 1)
		except Exception:
			inv_qty = 1
		if inv_qty > 1 and inverter_name:
			result["inverter_display_with_qty"] = f"{inv_qty}x {inverter_name}"
		else:
			result["inverter_display_with_qty"] = inverter_name
		inv_eff = inverter_details.get("efficiency_percent")
		if inv_eff is not None:
			try:
				result["inverter_max_efficiency_percent"] = fmt_number(float(inv_eff), 0, "%")
			except Exception:
				result["inverter_max_efficiency_percent"] = as_str(inv_eff)
		inv_warranty_years = inverter_details.get("warranty_years")
		if inv_warranty_years is not None:
			try:
				result["inverter_warranty_years"] = fmt_number(float(inv_warranty_years), 0, "Jahre")
			except Exception:
				result["inverter_warranty_years"] = as_str(inv_warranty_years)

		# Produktbild (Base64)
		img_b64 = as_str(inverter_details.get("image_base64") or "").strip()
		if img_b64:
			result["inverter_image_b64"] = img_b64

	# Speicher
	storage_name = as_str(project_details.get("selected_storage_name") or "").strip()
	storage_details = fetch_details(storage_name) if storage_name else {}
	if storage_details or storage_name or project_details.get("include_storage"):
		sto_brand = as_str(storage_details.get("brand") or storage_details.get("manufacturer") or "")
		if sto_brand:
			result["storage_manufacturer"] = sto_brand
		sto_model = as_str(storage_details.get("model_name") or storage_name)
		if sto_model:
			result["storage_model"] = sto_model
		# Kapazität (kWh): wie in der Technik-Auswahl zuerst den UI-Wert nehmen,
		# dann DB (bevorzugt storage_power_kw als kWh), dann weitere Felder
		# Wie oben: erst DB-Kapazität anzeigen, dann UI-Wert
		cand_sto = [
			storage_details.get("storage_power_kw"),  # App-Konvention: häufig als kWh gepflegt
			storage_details.get("capacity_kwh"),
			storage_details.get("usable_capacity_kwh"),
			storage_details.get("nominal_capacity_kwh"),
			project_details.get("selected_storage_storage_power_kw"),
			project_details.get("selected_storage_capacity_kwh"),
			project_details.get("battery_capacity_kwh"),
		]
		sto_kwh = None
		for c in cand_sto:
			v = parse_float(c)
			if v and v > 0:
				sto_kwh = v
				break
		if sto_kwh is not None:
			try:
				val = float(sto_kwh)
				# Nur setzen, wenn noch nicht vorbelegt
				if not result.get("storage_capacity_kwh"):
					result["storage_capacity_kwh"] = fmt_number(val, 2, "kWh")
				# battery_capacity_kwh parallel konsistent halten, falls noch leer
				if not result.get("battery_capacity_kwh"):
					result["battery_capacity_kwh"] = fmt_number(val, 2, "kWh")
			except Exception:
				if not result.get("storage_capacity_kwh"):
					result["storage_capacity_kwh"] = as_str(sto_kwh)
		# Leistung (kW)
		sto_kw = storage_details.get("power_kw") or storage_details.get("storage_power_kw")
		if sto_kw is not None:
			try:
				result["storage_power_kw"] = fmt_number(float(sto_kw), 1, "kW")
			except Exception:
				result["storage_power_kw"] = as_str(sto_kw)
		# Entladetiefe (DoD %)
		dod_pct = storage_details.get("dod_percent") or analysis_results.get("storage_dod_percent")
		if dod_pct is not None:
			try:
				result["storage_dod_percent"] = fmt_number(float(dod_pct), 0, "%")
			except Exception:
				result["storage_dod_percent"] = as_str(dod_pct)
		# Zyklen
		cycles = storage_details.get("max_cycles")
		if cycles is not None:
			try:
				result["storage_cycles"] = f"{int(float(cycles))} cycles"
			except Exception:
				result["storage_cycles"] = f"{as_str(cycles)} cycles"

		# Produktbild (Base64)
		img_b64 = as_str(storage_details.get("image_base64") or "").strip()
		if img_b64:
			result["storage_image_b64"] = img_b64

	# Seite 1 – neue dynamische Felder und statische Texte nach Kundenwunsch
	# 1) Jährliche Einspeisevergütung in Euro (für Platz "Dachneigung")
	try:
		annual_feed_rev = (
			analysis_results.get("annual_feedin_revenue_euro")
			or analysis_results.get("annual_feed_in_revenue_year1")
		)
		if annual_feed_rev is not None:
			result["annual_feed_in_revenue_eur"] = fmt_number(float(annual_feed_rev), 2, "€")
	except Exception:
		pass

	# 2) MwSt.-Betrag (19% vom Netto-Endbetrag) für Platz "Solaranlage"
	# Basis: bevorzugt total_investment_netto, sonst final_price (falls Netto), sonst subtotal_netto.
	try:
		base_net = (
			analysis_results.get("total_investment_netto")
			or analysis_results.get("final_price")
			or analysis_results.get("subtotal_netto")
		)
		vat_amount = None
		if isinstance(base_net, (int, float)):
			vat_amount = float(base_net) * 0.19
		else:
			# Falls nur Brutto/Netto-Kombi verfügbar, Differenz nutzen
			netto = analysis_results.get("total_investment_netto")
			brutto = analysis_results.get("total_investment_brutto")
			if isinstance(netto, (int, float)) and isinstance(brutto, (int, float)):
				vat_amount = max(0.0, float(brutto) - float(netto))
		if vat_amount is not None:
			result["vat_amount_eur"] = fmt_number(float(vat_amount), 2, "€")
	except Exception:
		pass

	# 3) Statische Texte
	#    a) „inklusive“ für die Label-Plätze "Batterie" und "Jahresertrag"
	result["static_inklusive"] = "inklusive"
	#    b) Rechts neben Batterie: „DC Dachmontage“
	result["static_dc_dachmontage"] = "DC Dachmontage"
	#    c) Rechts neben Jahresertrag: „AC Installation | Inbetriebnahme“
	result["static_ac_installation"] = "AC Installation | Inbetriebnahme"

	return result
