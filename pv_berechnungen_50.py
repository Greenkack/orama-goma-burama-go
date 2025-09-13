# -*- coding: utf-8 -*-
"""
pv_berechnungen_50.py – Katalog der 50 PV-Berechnungen (Dispatcher/Registry)

Ziel:
- Vollständiger Satz von 50 PV-relevanten Berechnungen als aufrufbare Registry
- KEINE Doppel-Implementationen: Wenn eine Berechnung bereits in bestehenden
  Modulen vorhanden ist (insb. calculations_extended.py), wird diese importiert
  und hier nur referenziert. Dieses Modul enthält selbst nur minimale Wrapper,
  wo nötig (z. B. LCOE-Einheitenangleichung).

Öffentliche API:
- CALC_REGISTRY: Dict[str, CalcSpec] – Metadaten + Callable
- compute_calculation(key: str, params: Dict[str, Any]) -> Any
- run_all_50(params: Dict[str, Any]) -> Dict[str, Any]

Konventionen:
- Einheiten werden im Registry-Eintrag dokumentiert ("unit").
- Wrapper werden nur verwendet, wenn es in den Bestandsmodulen widersprüchliche
  Varianten gibt (z. B. LCOE ct/kWh vs. €/kWh). In diesem Fall normalisieren wir
  auf die in der Contracts-Referenz bevorzugte Einheit (€/kWh).

Hinweis:
- Einige der 50 Berechnungen haben in calculations_extended.py Platzhalter-Charakter
  (z. B. Szenarien-Vergleich). Wir referenzieren sie dennoch als Callables und geben
  die Ergebnisse transparent weiter.
"""

from __future__ import annotations

from typing import Any, Callable, Dict, List, TypedDict

# Bestehende Implementierungen importieren (KEINE Duplikate bauen)
try:
    import calculations_extended as ext
except Exception as _imp_err:  # Fallbacks nur als Notanker (werden selten genutzt)
    ext = None  # type: ignore


class CalcSpec(TypedDict):
    func: Callable[..., Any]
    inputs: List[str]
    unit: str
    description: str


# Wrapper: LCOE in €/kWh normalisieren
def _lcoe_eur_per_kwh_wrapper(*, investment: float, annual_production_kwh: float) -> float:
    """Normalisiert auf €/kWh. calculations_extended.calculate_lcoe liefert ct/kWh."""
    if ext is None:
        raise RuntimeError("calculations_extended nicht verfügbar")
    lcoe_ct = ext.calculate_lcoe(investment, annual_production_kwh)
    try:
        return float(lcoe_ct) / 100.0
    except Exception:
        return float("inf")


# Mapping der 50 Berechnungen → vorhandene Implementierungen in calculations_extended
# WICHTIG: Nur referenzieren, nicht duplizieren. Beschreibungen/Einheiten ergänzt.
CALC_REGISTRY: Dict[str, CalcSpec] = {
    # 1–10: Grundlagen & KPIs
    "annual_energy_yield": {
        "func": ext.calculate_annual_energy_yield,
        "inputs": ["pv_peak_power_kwp", "specific_yield_kwh_per_kwp"],
        "unit": "kWh/a",
        "description": "Jahresenergieertrag",
    },
    "lcoe_eur_per_kwh": {
        "func": _lcoe_eur_per_kwh_wrapper,
        "inputs": ["investment", "annual_production_kwh"],
        "unit": "€/kWh",
        "description": "Stromgestehungskosten (normalisiert auf €/kWh)",
    },
    "self_consumption_quote_percent": {
        "func": ext.calculate_self_consumption_quote,
        "inputs": ["self_consumed_kwh", "total_generation_kwh"],
        "unit": "%",
        "description": "Eigenverbrauchsquote",
    },
    "autarky_degree_percent": {
        "func": ext.calculate_autarky_degree,
        "inputs": ["self_consumed_kwh", "total_consumption_kwh"],
        "unit": "%",
        "description": "Autarkiegrad",
    },
    "payback_period_years": {
        "func": ext.calculate_payback_period,
        "inputs": ["investment_costs", "annual_savings"],
        "unit": "a",
        "description": "Amortisationsdauer",
    },
    "annual_cost_savings_eur": {
        "func": ext.calculate_annual_cost_savings,
        "inputs": ["self_consumed_kwh", "electricity_price"],
        "unit": "€",
        "description": "Jährliche Stromkostenersparnis",
    },
    "feed_in_tariff_revenue_eur": {
        "func": ext.calculate_feed_in_tariff_revenue,
        "inputs": ["feed_in_kwh", "feed_in_rate_eur"],
        "unit": "€",
        "description": "Einspeisevergütung pro Jahr",
    },
    "total_yield_over_lifetime_kwh": {
        "func": ext.calculate_total_yield_over_lifetime,
        "inputs": ["annual_yield", "lifetime_years"],
        "unit": "kWh",
        "description": "Gesamtertrag über Laufzeit",
    },
    "co2_savings_kg_per_year": {
        "func": ext.calculate_co2_savings,
        "inputs": ["annual_yield_kwh", "co2_factor_kg_per_kwh"],
        "unit": "kg/a",
        "description": "CO2-Einsparung Jahr 1",
    },
    "effective_pv_electricity_price_ct_per_kwh": {
        "func": ext.calculate_effective_pv_electricity_price,
        "inputs": ["total_costs", "total_generated_kwh"],
        "unit": "ct/kWh",
        "description": "Effektiver PV-Strompreis (ct/kWh)",
    },

    # 11–20: Finanzmathematik & Vergleiche
    "npv": {
        "func": ext.calculate_npv,
        "inputs": ["cashflows", "discount_rate"],
        "unit": "€",
        "description": "Nettobarwert",
    },
    "irr_percent": {
        "func": ext.calculate_irr,
        "inputs": ["cashflows"],
        "unit": "%",
        "description": "Interner Zinsfuß",
    },
    "alternative_investment_value_eur": {
        "func": ext.calculate_alternative_investment_value,
        "inputs": ["investment", "interest_rate", "lifetime_years"],
        "unit": "€",
        "description": "Kapitalwert Alternativanlage",
    },
    "cumulative_savings_eur": {
        "func": ext.calculate_cumulative_savings,
        "inputs": ["annual_savings", "lifetime_years"],
        "unit": "€",
        "description": "Kumulierte Einsparungen",
    },
    "storage_coverage_degree_percent": {
        "func": ext.calculate_storage_coverage_degree,
        "inputs": ["stored_self_consumption_kwh", "total_self_consumption_kwh"],
        "unit": "%",
        "description": "Speicherdeckungsgrad",
    },
    "power_after_degradation_kw": {
        "func": ext.calculate_power_after_degradation,
        "inputs": ["initial_power", "degradation_percent_per_year", "years"],
        "unit": "kW|kWp",
        "description": "Leistung nach Degradation",
    },
    "simulate_electricity_price_increase_eur": {
        "func": ext.simulate_electricity_price_increase,
        "inputs": ["initial_costs", "increase_percent_per_year", "years"],
        "unit": "€",
        "description": "Kosten nach Strompreissteigerung",
    },
    "roof_usage_modules": {
        "func": ext.calculate_roof_usage,
        "inputs": ["roof_area_m2", "module_length_m", "module_width_m"],
        "unit": "Stück",
        "description": "Dachflächennutzung – Modulanzahl",
    },
    "break_even_year": {
        "func": ext.calculate_break_even_year,
        "inputs": ["investment", "annual_savings"],
        "unit": "Jahr",
        "description": "Jahr des Break-even",
    },
    "compare_scenarios": {
        "func": ext.compare_scenarios,
        "inputs": ["configs"],
        "unit": "-",
        "description": "Szenarienvergleich (Platzhalter-Logik)",
    },

    # 21–30: Technische KPIs & Verluste
    "performance_ratio": {
        "func": ext.calculate_performance_ratio,
        "inputs": ["actual_yield_kwh", "global_radiation_kwh_per_m2", "pv_area_m2"],
        "unit": "ratio",
        "description": "Performance Ratio (tats./theor. Ertrag)",
    },
    "specific_yield_kwh_per_kwp": {
        "func": ext.calculate_specific_yield,
        "inputs": ["annual_yield_kwh", "pv_peak_power_kwp"],
        "unit": "kWh/kWp",
        "description": "Spezifischer Ertrag",
    },
    "area_specific_yield_kwh_per_m2": {
        "func": ext.calculate_area_specific_yield,
        "inputs": ["annual_yield_kwh", "occupied_area_m2"],
        "unit": "kWh/m²",
        "description": "Flächenspezifischer Ertrag",
    },
    "pv_module_efficiency_percent": {
        "func": ext.calculate_pv_module_efficiency,
        "inputs": ["module_power_wp", "module_area_m2"],
        "unit": "%",
        "description": "Modulwirkungsgrad",
    },
    "shading_loss_percent": {
        "func": ext.calculate_shading_loss,
        "inputs": ["yield_with_shading", "optimal_yield"],
        "unit": "%",
        "description": "Verschattungsverlust",
    },
    "dc_ac_oversizing_factor": {
        "func": ext.calculate_dc_ac_oversizing_factor,
        "inputs": ["pv_power_kwp", "inverter_power_kw"],
        "unit": "ratio",
        "description": "DC/AC-Überdimensionierungsfaktor",
    },
    "temperature_corrected_power": {
        "func": ext.calculate_temperature_corrected_power,
        "inputs": ["p_nominal", "temp_coefficient_percent", "temperature", "ref_temp"],
        "unit": "W|kW",
        "description": "Temperaturkorrektur der Leistung",
    },
    "degradation_yield_kwh": {
        "func": ext.calculate_degradation_yield,
        "inputs": ["initial_yield", "annual_degradation_percent", "years"],
        "unit": "kWh",
        "description": "Ertrag nach Degradation",
    },
    "total_maintenance_costs_eur": {
        "func": ext.calculate_total_maintenance_costs,
        "inputs": ["annual_maintenance", "lifetime_years"],
        "unit": "€",
        "description": "Wartungskosten gesamt",
    },
    "self_consumption_increase_with_storage_kwh": {
        "func": ext.calculate_self_consumption_increase_with_storage,
        "inputs": ["old_self_consumption_kwh", "additional_kwh_from_storage"],
        "unit": "kWh",
        "description": "Eigenverbrauchserhöhung durch Speicher",
    },

    # 31–40: Speicher, Lastmanagement & Finanzierung
    "optimal_storage_size_kwh": {
        "func": ext.calculate_optimal_storage_size,
        "inputs": ["daily_consumption_kwh", "losses_percent"],
        "unit": "kWh",
        "description": "Optimale Speichergröße (Heuristik)",
    },
    "load_shifting_potential_kwh": {
        "func": ext.calculate_load_shifting_potential,
        "inputs": ["controllable_load_kwh", "pv_surplus_kwh"],
        "unit": "kWh",
        "description": "Lastverschiebepotenzial",
    },
    "pv_coverage_for_heatpump_percent": {
        "func": ext.calculate_pv_coverage_for_heatpump,
        "inputs": ["pv_surplus_to_hp_kwh", "heatpump_annual_consumption_kwh"],
        "unit": "%",
        "description": "PV-Deckungsgrad für Wärmepumpe",
    },
    "roe_percent": {
        "func": ext.calculate_roe,
        "inputs": ["profit", "equity_capital"],
        "unit": "%",
        "description": "Eigenkapitalrendite",
    },
    "debt_service_capability_factor": {
        "func": ext.check_debt_service_capability,
        "inputs": ["annual_surplus", "annuity"],
        "unit": "ratio",
        "description": "Kapitaldienstfähigkeit",
    },
    "residual_value_eur": {
        "func": ext.calculate_residual_value,
        "inputs": ["investment", "annual_depreciation_percent", "years"],
        "unit": "€",
        "description": "Restwert nach x Jahren",
    },
    "linear_depreciation_eur_per_year": {
        "func": ext.calculate_linear_depreciation,
        "inputs": ["investment", "depreciation_years"],
        "unit": "€/a",
        "description": "Lineare AfA",
    },
    "costs_after_funding_eur": {
        "func": ext.calculate_costs_after_funding,
        "inputs": ["investment", "funding_amount"],
        "unit": "€",
        "description": "Effektive Kosten nach Förderung",
    },
    "grid_connection_costs_eur": {
        "func": ext.calculate_grid_connection_costs,
        "inputs": ["*costs"],
        "unit": "€",
        "description": "Netzanschlusskosten (Summe)",
    },
    "compare_pv_vs_balcony": {
        "func": ext.compare_pv_vs_balcony,
        "inputs": ["costs_pv", "yield_pv", "costs_balcony", "yield_balcony"],
        "unit": "Dict",
        "description": "Vergleich PV vs. Balkonkraftwerk",
    },

    # 41–50: Lebensdauer, Risiko & Spezialfälle
    "yield_after_inverter_degradation_kwh": {
        "func": ext.calculate_yield_after_inverter_degradation,
        "inputs": ["initial_yield", "degradation_rate_percent", "years"],
        "unit": "kWh",
        "description": "Ertrag nach WR-Degradation",
    },
    "emergency_power_capacity_kwh_per_day": {
        "func": ext.calculate_emergency_power_capacity,
        "inputs": ["storage_kwh", "usable_capacity_percent"],
        "unit": "kWh",
        "description": "Notstromfähigkeit",
    },
    "battery_lifespan_years": {
        "func": ext.calculate_battery_lifespan_years,
        "inputs": ["max_cycles", "cycles_per_year"],
        "unit": "a",
        "description": "Batterie-Lebensdauer (Zyklen/ Jahr)",
    },
    "simulate_ev_charging_profile_kwh": {
        "func": ext.simulate_ev_charging_profile,
        "inputs": ["pv_surplus_kwh", "ev_demand_kwh", "charging_efficiency_percent"],
        "unit": "kWh",
        "description": "PV-geladene EV-Energie",
    },
    "cumulative_co2_savings_kg": {
        "func": ext.calculate_cumulative_co2_savings,
        "inputs": ["annual_co2_savings_kg", "lifetime_years"],
        "unit": "kg",
        "description": "Kumulierte CO2-Einsparung",
    },
    "value_after_inflation_eur": {
        "func": ext.calculate_value_after_inflation,
        "inputs": ["value", "inflation_rate_percent", "years"],
        "unit": "€",
        "description": "Wert nach Inflation (heutiger Wert)",
    },
    "analyze_investment_scenarios": {
        "func": ext.analyze_investment_scenarios,
        "inputs": ["scenarios"],
        "unit": "Dict",
        "description": "Investitionsszenarien A/B/C (Pass-through)",
    },
    "plant_expansion_diff": {
        "func": ext.calculate_plant_expansion,
        "inputs": ["old_kpis", "new_kpis"],
        "unit": "Dict",
        "description": "KPI-Differenzen bei Erweiterung",
    },
    "risk_expected_loss_eur": {
        "func": ext.analyze_risk,
        "inputs": ["damage_amount", "probability_percent"],
        "unit": "€",
        "description": "Erwarteter Verlust (Risiko)",
    },
    "peak_shaving_effect_kw": {
        "func": ext.calculate_peak_shaving_effect,
        "inputs": ["max_load_kw", "optimized_load_kw"],
        "unit": "kW",
        "description": "Reduzierte Lastspitze",
    },
}


def compute_calculation(key: str, params: Dict[str, Any]) -> Any:
    """Führt eine einzelne Berechnung aus.

    - key: Registry-Schlüssel
    - params: Dict mit den erwarteten Parametern; fehlende optionale werden ignoriert
    """
    if ext is None:
        raise RuntimeError("Berechnungsmodul 'calculations_extended' nicht verfügbar")

    spec = CALC_REGISTRY.get(key)
    if not spec:
        raise KeyError(f"Unbekannte Berechnung: {key}")

    func = spec["func"]
    input_names = spec["inputs"]

    # Variadische Kosten-Liste unterstützen (grid_connection_costs)
    if input_names and input_names[0] == "*costs":
        costs = params.get("costs") or params.get("*costs") or []
        if not isinstance(costs, (list, tuple)):
            costs = [costs]
        return func(*costs)

    # Keyword-Argumente extrahieren (defensiv)
    kwargs: Dict[str, Any] = {}
    for name in input_names:
        if name in params:
            kwargs[name] = params[name]
    return func(**kwargs) if kwargs else func()


def run_all_50(params: Dict[str, Any]) -> Dict[str, Any]:
    """Führt alle 50 Registry-Berechnungen aus, soweit Inputs vorhanden.

    - params: globaler Eingabe-Dict; die benötigten Felder je Berechnung stehen
      im Registry-Eintrag unter "inputs".
    - Rückgabe: Dict[key] = Ergebnis oder Fehlermeldung (String) bei Parametermangel.
    """
    results: Dict[str, Any] = {}
    for key, spec in CALC_REGISTRY.items():
        try:
            # Check minimaler Param-Support: Wenn alle geforderten Inputs fehlen, überspringen
            required = [n for n in spec["inputs"] if not n.startswith("*")]
            if required and all(n not in params for n in required):
                results[key] = "skipped: missing inputs"
                continue
            results[key] = compute_calculation(key, params)
        except Exception as e:
            results[key] = f"error: {e}"
    return results


__all__ = [
    "CALC_REGISTRY",
    "compute_calculation",
    "run_all_50",
]
