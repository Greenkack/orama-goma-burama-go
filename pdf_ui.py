# pdf_ui.py
"""
Datei: pdf_ui.py
Zweck: Benutzeroberfläche für die Konfiguration und Erstellung von Angebots-PDFs.
       Ermöglicht die Auswahl von Vorlagen, Inhalten und spezifischen Diagrammen in einem Dreispaltenlayout.
Autor: Gemini Ultra (maximale KI-Performance)
Datum: 2025-06-08 (Datenstatus-Anzeige und Fallback-PDF-Option hinzugefügt)
"""
import streamlit as st
from typing import Dict, Any, Optional, List, Callable
import base64
import traceback
import os
import json
from datetime import datetime
from doc_output import _show_pdf_data_status
from pdf_widgets import render_pdf_structure_manager
import os

# --- Fallback-Funktionsreferenzen ---
def _dummy_load_admin_setting_pdf_ui(key, default=None):
    if key == 'pdf_title_image_templates': return [{'name': 'Standard-Titelbild (Fallback)', 'data': None}]
    if key == 'pdf_offer_title_templates': return [{'name': 'Standard-Titel (Fallback)', 'content': 'Angebot für Ihre Photovoltaikanlage'}]
    if key == 'pdf_cover_letter_templates': return [{'name': 'Standard-Anschreiben (Fallback)', 'content': 'Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihr Interesse.'}]
    elif key == 'active_company_id': return None
    elif key == 'pdf_offer_presets': return [] # Korrekter Fallback als Liste
    return default
def _dummy_save_admin_setting_pdf_ui(key, value): return False
def _dummy_generate_offer_pdf(*args, **kwargs):
    st.error("PDF-Generierungsfunktion (pdf_generator.py) nicht verfügbar oder fehlerhaft (Dummy in pdf_ui.py aktiv).")
    return None
def _dummy_get_active_company_details() -> Optional[Dict[str, Any]]:
    return {"name": "Dummy Firma AG", "id": 0, "logo_base64": None}
def _dummy_list_company_documents(company_id: int, doc_type: Optional[str]=None) -> List[Dict[str, Any]]:
    return []

_generate_offer_pdf_safe = _dummy_generate_offer_pdf
try:
    from pdf_generator import generate_offer_pdf
    _generate_offer_pdf_safe = generate_offer_pdf
except (ImportError, ModuleNotFoundError): pass 
except Exception: pass

# PDF-VORSCHAU INTEGRATION (NEU)
try:
    from pdf_preview import show_pdf_preview_interface, create_pdf_template_presets
    _PDF_PREVIEW_AVAILABLE = True
except (ImportError, ModuleNotFoundError):
    _PDF_PREVIEW_AVAILABLE = False
    
    def show_pdf_preview_interface(*args, **kwargs):
        st.error(" PDF-Vorschau-Modul nicht verfügbar!")
        return None
    
    def create_pdf_template_presets():
        return {}

#  PROFESSIONAL PDF GENERATOR INTEGRATION


# --- Hilfsfunktionen ---
def get_text_pdf_ui(texts_dict: Dict[str, str], key: str, fallback_text: Optional[str] = None) -> str:
    if not isinstance(texts_dict, dict):
        return fallback_text if fallback_text is not None else key.replace("_", " ").title() + " (Texte fehlen)"
    return texts_dict.get(key, fallback_text if fallback_text is not None else key.replace("_", " ").title() + " (Text-Key fehlt)")

def _get_all_available_chart_keys(analysis_results: Dict[str, Any], chart_key_map: Dict[str, str]) -> List[str]:
    if not analysis_results or not isinstance(analysis_results, dict):
        return []
    return [k for k in chart_key_map.keys() if analysis_results.get(k) is not None]

def _get_all_available_company_doc_ids(active_company_id: Optional[int], db_list_company_documents_func: Callable) -> List[int]:
    if active_company_id is None or not callable(db_list_company_documents_func):
        return []
    docs = db_list_company_documents_func(active_company_id, None)
    return [doc['id'] for doc in docs if isinstance(doc, dict) and 'id' in doc]

# --- Haupt-Render-Funktion für die PDF UI ---
def render_pdf_ui(
    texts: Dict[str, str],
    project_data: Dict[str, Any],
    analysis_results: Dict[str, Any],
    load_admin_setting_func: Callable[[str, Any], Any],
    save_admin_setting_func: Callable[[str, Any], bool],
    list_products_func: Callable, 
    get_product_by_id_func: Callable, 
    get_active_company_details_func: Callable[[], Optional[Dict[str, Any]]] = _dummy_get_active_company_details,
    db_list_company_documents_func: Callable[[int, Optional[str]], List[Dict[str, Any]]] = _dummy_list_company_documents
):
    #  LIVE-KOSTEN-VORSCHAU IN SIDEBAR
    with st.sidebar:
        st.markdown("###  Live-Kosten-Vorschau")
        
        calc_results = st.session_state.get("calculation_results", {})
        base_cost = calc_results.get("base_matrix_price_netto", 0.0)
        if base_cost == 0.0:
            base_cost = st.session_state.get("base_matrix_price_netto", 0.0)
        
        discount_percent = st.session_state.get("pricing_modifications_discount_slider", 0.0)
        rebates_eur = st.session_state.get("pricing_modifications_rebates_slider", 0.0)
        surcharge_percent = st.session_state.get("pricing_modifications_surcharge_slider", 0.0)
        special_costs_eur = st.session_state.get("pricing_modifications_special_costs_slider", 0.0)
        miscellaneous_eur = st.session_state.get("pricing_modifications_miscellaneous_slider", 0.0)
        
        discount_amount = base_cost * (discount_percent / 100.0)
        total_rabatte_nachlaesse = discount_amount + rebates_eur
        price_after_discounts = base_cost - total_rabatte_nachlaesse
        surcharge_amount = price_after_discounts * (surcharge_percent / 100.0)
        total_aufpreise_zuschlaege = surcharge_amount + special_costs_eur + miscellaneous_eur
        final_price = price_after_discounts + total_aufpreise_zuschlaege
        
        st.write(f"**Grundpreis:** {base_cost:,.2f} €")
        st.write(f"**Summe Rabatte / Nachlässe:** -{total_rabatte_nachlaesse:,.2f} €")
        st.write(f"**Summe Aufpreise / Zuschläge:** +{total_aufpreise_zuschlaege:,.2f} €")
        st.write(f"**Endpreis (inkl. Zuschläge, Rabatte, usw.):** {final_price:,.2f} €")
        
        st.session_state["live_pricing_calculations"] = {
            "base_cost": base_cost,
            "total_rabatte_nachlaesse": total_rabatte_nachlaesse,
            "total_aufpreise_zuschlaege": total_aufpreise_zuschlaege,
            "final_price": final_price,
            "discount_amount": discount_amount,
            "surcharge_amount": surcharge_amount,
            "price_after_discounts": price_after_discounts,
        }
        
        #  EXTENDED FEATURES STATUS
        st.markdown("---")
        st.markdown("###  Extended Features")
        
        financing_active = st.session_state.get('financing_config', {}).get('enabled', False)
        chart_active = bool(st.session_state.get('chart_config', {}))
        content_count = len(st.session_state.get('custom_content_items', []))
        design_active = bool(st.session_state.get('pdf_design_config', {}))
        
        st.write(f" Finanzierung: {'' if financing_active else ''}")
        st.write(f" Charts: {'' if chart_active else ''}")
        st.write(f" Content: {content_count} Elemente")
        st.write(f" Design: {'' if design_active else ''}")
        
        if financing_active or chart_active or content_count > 0 or design_active:
            st.success(" Extended Features aktiv!")
        else:
            st.info(" Standard PDF-Modus")

    st.header(get_text_pdf_ui(texts, "menu_item_doc_output", "Angebotsausgabe (PDF)"))
    
    # Debug-Bereich hinzufügen
    render_pdf_debug_section(
        texts, project_data, analysis_results, 
        get_active_company_details_func, db_list_company_documents_func, get_product_by_id_func
    )

    if 'pdf_generating_lock_v1' not in st.session_state: st.session_state.pdf_generating_lock_v1 = False
    if 'pdf_inclusion_options' not in st.session_state:
        st.session_state.pdf_inclusion_options = {
            "include_company_logo": True, "include_product_images": True, 
            "include_all_documents": False, "company_document_ids_to_include": [],
            "selected_charts_for_pdf": [], "include_optional_component_details": True,
            # NEU: Zusatzseiten (ab Seite 7) nur optional anhängen
            "append_additional_pages_after_main6": False,
        }
    if "pdf_selected_main_sections" not in st.session_state:
         st.session_state.pdf_selected_main_sections = ["ProjectOverview", "TechnicalComponents", "CostDetails", "Economics", "SimulationDetails", "CO2Savings", "Visualizations", "FutureAspects"]
    if 'pdf_preset_name_input' not in st.session_state: st.session_state.pdf_preset_name_input = ""

    minimal_data_ok = True 
    if not project_data or not isinstance(project_data, dict): project_data = {}; minimal_data_ok = False
    customer_data_pdf = project_data.get('customer_data', {}); project_details_pdf = project_data.get('project_details', {})
    if not (project_details_pdf.get('module_quantity') and (project_details_pdf.get('selected_module_id') or project_details_pdf.get('selected_module_name')) and (project_details_pdf.get('selected_inverter_id') or project_details_pdf.get('selected_inverter_name'))): minimal_data_ok = False
    if not minimal_data_ok: 
        st.info(get_text_pdf_ui(texts, "pdf_creation_minimal_data_missing_info", "Minimale Projektdaten...fehlen."))
        return
    if not analysis_results or not isinstance(analysis_results, dict): 
        analysis_results = {}
        st.info(get_text_pdf_ui(texts, "pdf_creation_no_analysis_for_pdf_info", "Analyseergebnisse unvollständig..."))
    
    active_company = get_active_company_details_func()
    company_info_for_pdf = active_company if active_company else {"name": "Ihre Firma (Fallback)"}
    company_logo_b64_for_pdf = active_company.get('logo_base64') if active_company else None
    active_company_id_for_docs = active_company.get('id') if active_company else None # Korrigiert: None statt 0 als Fallback
    
    if active_company: 
        st.caption(f"Angebot für Firma: **{active_company.get('name', 'Unbekannt')}** (ID: {active_company_id_for_docs})")
    else: 
        st.warning("Keine aktive Firma ausgewählt. PDF verwendet Fallback-Daten.")

    # DATENSTATUS-ANZEIGE UND EMPFEHLUNGEN
    st.markdown("---")
    data_status = _show_pdf_data_status(project_data, analysis_results, texts)
    
    # Wenn kritische Daten fehlen, PDF-Formular nicht anzeigen
    if data_status == False:
        return
    elif data_status == "fallback":
        # Fallback-PDF erstellen
        try:
            from pdf_generator import _create_no_data_fallback_pdf
            customer_data = project_data.get('customer_data', {})
            fallback_pdf = _create_no_data_fallback_pdf(texts, customer_data)
            
            if fallback_pdf:
                st.success(" Einfaches Info-PDF erstellt!")
                st.download_button(
                    label=" Info-PDF herunterladen",
                    data=fallback_pdf,
                    file_name=f"PV_Info_{customer_data.get('last_name', 'Interessent')}.pdf",
                    mime="application/pdf"
                )
            else:
                st.error("Fehler beim Erstellen des Info-PDFs")
        except Exception as e:
            st.error(f"Fehler beim Erstellen des Fallback-PDFs: {e}")
        return
    
    st.markdown("---")

    # Vorlagen und Presets laden
    title_image_templates, offer_title_templates, cover_letter_templates, pdf_presets = [], [], [], []
    try:
        title_image_templates = load_admin_setting_func('pdf_title_image_templates', [])
        offer_title_templates = load_admin_setting_func('pdf_offer_title_templates', [])
        cover_letter_templates = load_admin_setting_func('pdf_cover_letter_templates', [])
        
        # KORREKTUR: `load_admin_setting_func` gibt bereits eine Liste zurück, wenn der Wert als JSON-Array gespeichert wurde.
        # Kein erneutes `json.loads` nötig.
        loaded_presets = load_admin_setting_func('pdf_offer_presets', []) # Standard ist eine leere Liste
        if isinstance(loaded_presets, list):
            pdf_presets = loaded_presets
        elif isinstance(loaded_presets, str) and loaded_presets.strip(): # Fallback, falls doch als String gespeichert
            try:
                pdf_presets = json.loads(loaded_presets)
                if not isinstance(pdf_presets, list): # Sicherstellen, dass es eine Liste ist
                    st.warning("PDF-Presets sind nicht im korrekten Listenformat gespeichert. Werden zurückgesetzt.")
                    pdf_presets = []
            except json.JSONDecodeError:
                st.warning("Fehler beim Parsen der PDF-Presets aus der Datenbank. Werden zurückgesetzt.")
                pdf_presets = []
        else: # Default, falls nichts geladen oder unerwarteter Typ
            pdf_presets = []

        # Typsicherheit für andere Vorlagen
        if not isinstance(title_image_templates, list): title_image_templates = []
        if not isinstance(offer_title_templates, list): offer_title_templates = []
        if not isinstance(cover_letter_templates, list): cover_letter_templates = []

    except Exception as e_load_data:
        st.error(f"Fehler beim Laden von PDF-Vorlagen oder Presets: {e_load_data}")
        # Fallback-Werte sicherstellen
        title_image_templates, offer_title_templates, cover_letter_templates, pdf_presets = [], [], [], []
    
    # ... (Rest der Funktion render_pdf_ui wie in der vorherigen Antwort) ...    # (Initialisierung Session State für Vorlagenauswahl, Definitionen für "Alles auswählen/abwählen", Callbacks, UI-Elemente)
    if "selected_title_image_name_doc_output" not in st.session_state: st.session_state.selected_title_image_name_doc_output = title_image_templates[0]['name'] if title_image_templates and isinstance(title_image_templates[0], dict) else None
    if "selected_title_image_b64_data_doc_output" not in st.session_state: st.session_state.selected_title_image_b64_data_doc_output = title_image_templates[0]['data'] if title_image_templates and isinstance(title_image_templates[0], dict) else None
    if "selected_offer_title_name_doc_output" not in st.session_state: st.session_state.selected_offer_title_name_doc_output = offer_title_templates[0]['name'] if offer_title_templates and isinstance(offer_title_templates[0], dict) else None
    if "selected_offer_title_text_content_doc_output" not in st.session_state: st.session_state.selected_offer_title_text_content_doc_output = offer_title_templates[0]['content'] if offer_title_templates and isinstance(offer_title_templates[0], dict) else ""
    if "selected_cover_letter_name_doc_output" not in st.session_state: st.session_state.selected_cover_letter_name_doc_output = cover_letter_templates[0]['name'] if cover_letter_templates and isinstance(cover_letter_templates[0], dict) else None
    if "selected_cover_letter_text_content_doc_output" not in st.session_state: st.session_state.selected_cover_letter_text_content_doc_output = cover_letter_templates[0]['content'] if cover_letter_templates and isinstance(cover_letter_templates[0], dict) else ""

    default_pdf_sections_map = {"ProjectOverview": get_text_pdf_ui(texts, "pdf_section_title_projectoverview", "1. Projektübersicht"),"TechnicalComponents": get_text_pdf_ui(texts, "pdf_section_title_technicalcomponents", "2. Systemkomponenten"),"CostDetails": get_text_pdf_ui(texts, "pdf_section_title_costdetails", "3. Kostenaufstellung"),"Economics": get_text_pdf_ui(texts, "pdf_section_title_economics", "4. Wirtschaftlichkeit"),"SimulationDetails": get_text_pdf_ui(texts, "pdf_section_title_simulationdetails", "5. Simulation"),"CO2Savings": get_text_pdf_ui(texts, "pdf_section_title_co2savings", "6. CO₂-Einsparung"),"Visualizations": get_text_pdf_ui(texts, "pdf_section_title_visualizations", "7. Grafiken"),"FutureAspects": get_text_pdf_ui(texts, "pdf_section_title_futureaspects", "8. Zukunftsaspekte")}
    all_main_section_keys = list(default_pdf_sections_map.keys())
    chart_key_to_friendly_name_map = {'monthly_prod_cons_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_monthly_compare", "Monatl. Produktion/Verbrauch (2D)"),'cost_projection_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_cost_projection", "Stromkosten-Hochrechnung (2D)"),'cumulative_cashflow_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_cum_cashflow", "Kumulierter Cashflow (2D)"),'consumption_coverage_pie_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_consum_coverage_pie", "Verbrauchsdeckung (Kreis)"),'pv_usage_pie_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_pv_usage_pie", "PV-Nutzung (Kreis)"),'daily_production_switcher_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_daily_3d", "Tagesproduktion (3D)"),'weekly_production_switcher_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_weekly_3d", "Wochenproduktion (3D)"),'yearly_production_switcher_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_yearly_3d_bar", "Jahresproduktion (3D-Balken)"),'project_roi_matrix_switcher_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_roi_matrix_3d", "Projektrendite-Matrix (3D)"),'feed_in_revenue_switcher_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_feedin_3d", "Einspeisevergütung (3D)"),'prod_vs_cons_switcher_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_prodcons_3d", "Verbr. vs. Prod. (3D)"),'tariff_cube_switcher_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_tariffcube_3d", "Tarifvergleich (3D)"),'co2_savings_value_switcher_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_co2value_3d", "CO2-Ersparnis vs. Wert (3D)"),'investment_value_switcher_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_investval_3D", "Investitionsnutzwert (3D)"),'storage_effect_switcher_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_storageeff_3d", "Speicherwirkung (3D)"),'selfuse_stack_switcher_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_selfusestack_3d", "Eigenverbr. vs. Einspeis. (3D)"),'cost_growth_switcher_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_costgrowth_3d", "Stromkostensteigerung (3D)"),'selfuse_ratio_switcher_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_selfuseratio_3d", "Eigenverbrauchsgrad (3D)"),'roi_comparison_switcher_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_roicompare_3d", "ROI-Vergleich (3D)"),'scenario_comparison_switcher_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_scenariocomp_3d", "Szenarienvergleich (3D)"),'tariff_comparison_switcher_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_tariffcomp_3d", "Vorher/Nachher Stromkosten (3D)"),'income_projection_switcher_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_incomeproj_3d", "Einnahmenprognose (3D)"),'yearly_production_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_pvvis_yearly", "PV Visuals: Jahresproduktion"),'break_even_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_pvvis_breakeven", "PV Visuals: Break-Even"),'amortisation_chart_bytes': get_text_pdf_ui(texts, "pdf_chart_label_pvvis_amort", "PV Visuals: Amortisation")}
    all_available_chart_keys_for_selection = _get_all_available_chart_keys(analysis_results, chart_key_to_friendly_name_map)
    all_available_company_doc_ids_for_selection = _get_all_available_company_doc_ids(active_company_id_for_docs, db_list_company_documents_func)

    def select_all_options():
        st.session_state.pdf_inclusion_options["include_company_logo"] = True; st.session_state.pdf_inclusion_options["include_product_images"] = True; st.session_state.pdf_inclusion_options["include_all_documents"] = True; st.session_state.pdf_inclusion_options["company_document_ids_to_include"] = all_available_company_doc_ids_for_selection[:]; st.session_state.pdf_inclusion_options["selected_charts_for_pdf"] = all_available_chart_keys_for_selection[:]; st.session_state.pdf_inclusion_options["include_optional_component_details"] = True; st.session_state.pdf_selected_main_sections = all_main_section_keys[:]
        st.success("Alle Optionen ausgewählt!")
    def deselect_all_options():
        st.session_state.pdf_inclusion_options["include_company_logo"] = False; st.session_state.pdf_inclusion_options["include_product_images"] = False; st.session_state.pdf_inclusion_options["include_all_documents"] = False; st.session_state.pdf_inclusion_options["company_document_ids_to_include"] = []; st.session_state.pdf_inclusion_options["selected_charts_for_pdf"] = []; st.session_state.pdf_inclusion_options["include_optional_component_details"] = False; st.session_state.pdf_selected_main_sections = []
        st.success("Alle Optionen abgewählt!")
    def load_preset_on_click(preset_name_to_load: str):
        selected_preset = next((p for p in pdf_presets if p['name'] == preset_name_to_load), None)
        if selected_preset and 'selections' in selected_preset:
            selections = selected_preset['selections']
            st.session_state.pdf_inclusion_options["include_company_logo"] = selections.get("include_company_logo", True)
            st.session_state.pdf_inclusion_options["include_product_images"] = selections.get("include_product_images", True)
            st.session_state.pdf_inclusion_options["include_all_documents"] = selections.get("include_all_documents", False)
            st.session_state.pdf_inclusion_options["company_document_ids_to_include"] = selections.get("company_document_ids_to_include", [])
            st.session_state.pdf_inclusion_options["selected_charts_for_pdf"] = selections.get("selected_charts_for_pdf", [])
            st.session_state.pdf_inclusion_options["include_optional_component_details"] = selections.get("include_optional_component_details", True)
            st.session_state.pdf_selected_main_sections = selections.get("pdf_selected_main_sections", all_main_section_keys[:])
            st.success(f"Vorlage '{preset_name_to_load}' geladen.")
        else: 
            st.warning(f"Vorlage '{preset_name_to_load}' nicht gefunden oder fehlerhaft.")
    
    def save_current_selection_as_preset():
        preset_name = st.session_state.get("pdf_preset_name_input", "").strip()
        if not preset_name:
            st.error("Bitte einen Namen für die Vorlage eingeben.")
            return
        if any(p['name'] == preset_name for p in pdf_presets): 
            st.warning(f"Eine Vorlage mit dem Namen '{preset_name}' existiert bereits.")
            return
        current_selections = {
            "include_company_logo": st.session_state.pdf_inclusion_options.get("include_company_logo"),
            "include_product_images": st.session_state.pdf_inclusion_options.get("include_product_images"),
            "include_all_documents": st.session_state.pdf_inclusion_options.get("include_all_documents"),
            "company_document_ids_to_include": st.session_state.pdf_inclusion_options.get("company_document_ids_to_include"),
            "selected_charts_for_pdf": st.session_state.pdf_inclusion_options.get("selected_charts_for_pdf"),
            "include_optional_component_details": st.session_state.pdf_inclusion_options.get("include_optional_component_details"),
            "pdf_selected_main_sections": st.session_state.get("pdf_selected_main_sections")
        }
        new_preset = {"name": preset_name, "selections": current_selections}
        updated_presets = pdf_presets + [new_preset]
        try:
            if save_admin_setting_func('pdf_offer_presets', json.dumps(updated_presets)):
                st.success(f"Vorlage '{preset_name}' erfolgreich gespeichert!")
                st.session_state.pdf_preset_name_input = ""
                # Um die Liste der Presets im Selectbox zu aktualisieren, ist ein Rerun nötig.
                # Dies geschieht, wenn das Hauptformular abgesendet wird oder durch eine andere Interaktion.
                # Alternativ könnte man hier ein st.rerun() erzwingen, aber das kann die Formularinteraktion stören.
            else: 
                st.error("Fehler beim Speichern der Vorlage in den Admin-Einstellungen.")
        except Exception as e_save_preset:
            st.error(f"Fehler beim Speichern der Vorlage: {e_save_preset}")

    st.markdown("---"); st.subheader(get_text_pdf_ui(texts, "pdf_template_management_header", "Vorlagen & Schnellauswahl"))
    col_preset1, col_preset2 = st.columns([3,2])
    with col_preset1:
        preset_names = [p['name'] for p in pdf_presets if isinstance(p,dict) and 'name' in p]
        if preset_names:
            selected_preset_name_to_load = st.selectbox(get_text_pdf_ui(texts, "pdf_load_preset_label", "Vorlage laden"), options=[get_text_pdf_ui(texts, "pdf_no_preset_selected_option", "-- Keine Vorlage --")] + preset_names, key="pdf_preset_load_select_v1_stable")
            if selected_preset_name_to_load != get_text_pdf_ui(texts, "pdf_no_preset_selected_option", "-- Keine Vorlage --"):
                if st.button(get_text_pdf_ui(texts, "pdf_load_selected_preset_button", "Ausgewählte Vorlage anwenden"), key="pdf_load_preset_btn_v1_stable", on_click=load_preset_on_click, args=(selected_preset_name_to_load,)): pass
        else: 
            st.caption(get_text_pdf_ui(texts, "pdf_no_presets_available_caption", "Keine Vorlagen gespeichert."))
    with col_preset2:
        st.text_input(get_text_pdf_ui(texts, "pdf_new_preset_name_label", "Name für neue Vorlage"), key="pdf_preset_name_input")
        st.button(get_text_pdf_ui(texts, "pdf_save_current_selection_button", "Aktuelle Auswahl speichern"), on_click=save_current_selection_as_preset, key="pdf_save_preset_btn_v1_stable")
    col_global_select1, col_global_select2 = st.columns(2)
    with col_global_select1: st.button(f" {get_text_pdf_ui(texts, 'pdf_select_all_button', 'Alle Optionen auswählen')}", on_click=select_all_options, key="pdf_select_all_btn_v1_stable", use_container_width=True)
    with col_global_select2: st.button(f" {get_text_pdf_ui(texts, 'pdf_deselect_all_button', 'Alle Optionen abwählen')}", on_click=deselect_all_options, key="pdf_deselect_all_btn_v1_stable", use_container_width=True)
    st.markdown("---")
    
    #  ERWEITERTE PDF-FEATURES UI (AUSSERHALB DES FORMS)
    st.markdown("###  ERWEITERTE PDF-FEATURES")
    
    # Feature-Tabs inkl. Drag&Drop Struktur-Manager
    ext_tab1, ext_tab2, ext_tab3, ext_tab4, ext_tab5 = st.tabs([
        " Finanzierung",
        " Charts",
        " Custom Content",
        " Design",
        " Struktur"
    ])
    
    # TAB 1: ERWEITERTE FINANZIERUNGSANALYSE
    with ext_tab1:
        financing_enabled = st.checkbox(
            "Erweiterte Finanzierungsanalyse aktivieren",
            value=st.session_state.get('financing_config', {}).get('enabled', False),
            key="financing_enabled_checkbox_outside_form"
        )
        
        if financing_enabled:
            financing_config = st.session_state.get('financing_config', {})
            financing_config['enabled'] = True
            
            col1_fin, col2_fin = st.columns(2)
            
            with col1_fin:
                financing_config['scenario_analysis'] = st.checkbox(
                    "3-Szenarien-Analyse",
                    value=financing_config.get('scenario_analysis', True),
                    key="financing_scenario_analysis_outside_form"
                )
                
                financing_config['sensitivity_analysis'] = st.checkbox(
                    "Sensitivitätsanalyse",
                    value=financing_config.get('sensitivity_analysis', True),
                    key="financing_sensitivity_analysis_outside_form"
                )
                
                financing_config['financing_options'] = st.checkbox(
                    "Finanzierungsoptionen",
                    value=financing_config.get('financing_options', True),
                    key="financing_options_enabled_outside_form"
                )
            
            with col2_fin:
                # Szenarien-Konfiguration (kompakt)
                if 'conservative' not in financing_config:
                    financing_config['conservative'] = {'roi_year_1': 6.5, 'payback_years': 14.2, 'total_savings_20y': 28000}
                if 'balanced' not in financing_config:
                    financing_config['balanced'] = {'roi_year_1': 8.2, 'payback_years': 12.5, 'total_savings_20y': 35000}
                if 'aggressive' not in financing_config:
                    financing_config['aggressive'] = {'roi_year_1': 10.8, 'payback_years': 10.1, 'total_savings_20y': 45000}
                if 'bank_loan' not in financing_config:
                    financing_config['bank_loan'] = {'interest_rate': 3.2, 'duration_years': 15, 'monthly_payment': 185}
                if 'kfw_loan' not in financing_config:
                    financing_config['kfw_loan'] = {'interest_rate': 1.8, 'duration_years': 20, 'monthly_payment': 145}
                
                st.info(" Finanzierungs-Szenarien werden automatisch berechnet")
            
            st.session_state['financing_config'] = financing_config
        else:
            st.session_state['financing_config'] = {'enabled': False}
    
    # TAB 2: ENHANCED CHART CONFIGURATION
    with ext_tab2:
        chart_config = st.session_state.get('chart_config', {})
        
        col1_chart, col2_chart = st.columns(2)
        
        with col1_chart:
            chart_config['chart_type'] = st.selectbox(
                "Chart-Typ",
                options=["BAR", "LINE", "PIE", "DONUT", "AREA", "SCATTER", "RADAR", "HEATMAP"],
                index=["BAR", "LINE", "PIE", "DONUT", "AREA", "SCATTER", "RADAR", "HEATMAP"].index(
                    chart_config.get('chart_type', 'DONUT')
                ),
                key="chart_type_select_outside_form"
            )
            
            chart_config['resolution'] = st.selectbox(
                "Auflösung",
                options=["low", "medium", "high", "ultra"],
                index=["low", "medium", "high", "ultra"].index(
                    chart_config.get('resolution', 'high')
                ),
                key="chart_resolution_select_outside_form"
            )
        
        with col2_chart:
            if 'effects' not in chart_config:
                chart_config['effects'] = {}
            
            chart_config['effects']['animation'] = st.checkbox(
                "Animation-Effekte",
                value=chart_config.get('effects', {}).get('animation', True),
                key="chart_animation_effects_outside_form"
            )
            
            chart_config['effects']['3d_effects'] = st.checkbox(
                "3D-Effekte",
                value=chart_config.get('effects', {}).get('3d_effects', True),
                key="chart_3d_effects_outside_form"
            )
            
            chart_config['effects']['gradient_effects'] = st.checkbox(
                "Gradient-Effekte",
                value=chart_config.get('effects', {}).get('gradient_effects', True),
                key="chart_gradient_effects_outside_form"
            )
        
        st.session_state['chart_config'] = chart_config
    
    # TAB 5: DRAG & DROP STRUKTUR-MANAGER
    with ext_tab5:
        render_pdf_structure_manager(texts)

    # TAB 3: ERWEITERTE CUSTOM CONTENT ERSTELLUNG
    with ext_tab3:
        st.markdown("####  Individuelle Inhalte & Uploads")
        
        if 'custom_content_items' not in st.session_state:
            st.session_state['custom_content_items'] = []
        
        # CONTENT-TYP AUSWAHL
        content_type_tab1, content_type_tab2, content_type_tab3, content_type_tab4 = st.tabs([
            " Text-Inhalte", 
            " Bilder & Fotos", 
            " Tabellen", 
            " Verwaltung"
        ])
        
        # TAB 1: TEXT-INHALTE
        with content_type_tab1:
            st.markdown("**Individueller Text-Inhalt hinzufügen:**")
            
            col1_text, col2_text = st.columns([3, 1])
            
            with col1_text:
                text_title = st.text_input(
                    "Titel/Überschrift:",
                    placeholder="z.B. Besondere Hinweise, Garantiebedingungen...",
                    key="custom_text_title"
                )
                
                text_content = st.text_area(
                    "Text-Inhalt:",
                    placeholder="Geben Sie hier Ihren individuellen Text ein...",
                    height=120,
                    key="custom_text_content"
                )
                
                text_style = st.selectbox(
                    "Text-Stil:",
                    options=["normal", "highlight", "warning", "info", "success"],
                    key="custom_text_style"
                )
            
            with col2_text:
                text_position = st.selectbox(
                    "Position im PDF:",
                    options=["top", "middle", "bottom", "after_analysis"],
                    format_func=lambda x: {
                        "top": " Oben (nach Deckblatt)",
                        "middle": " Mitte (nach Analyse)", 
                        "bottom": " Unten (vor Anhang)",
                        "after_analysis": " Nach Berechnungen"
                    }[x],
                    key="custom_text_position"
                )
                
                st.markdown("---")
                
                if st.button(" Text hinzufügen", key="add_text_content", type="primary"):
                    if text_title and text_content:
                        new_text_item = {
                            "type": "text",
                            "id": f"custom_text_{len(st.session_state['custom_content_items']) + 1}",
                            "title": text_title,
                            "content": text_content,
                            "style": text_style,
                            "position": text_position,
                            "created": datetime.now().strftime("%Y-%m-%d %H:%M")
                        }
                        st.session_state['custom_content_items'].append(new_text_item)
                        st.success(f" '{text_title}' hinzugefügt!")
                        st.rerun()
                    else:
                        st.error(" Bitte Titel und Inhalt eingeben!")
        
        # TAB 2: BILDER & FOTOS
        with content_type_tab2:
            st.markdown("**Bilder und Fotos hochladen:**")
            
            col1_img, col2_img = st.columns([2, 2])
            
            with col1_img:
                uploaded_image = st.file_uploader(
                    "Bild auswählen:",
                    type=['jpg', 'jpeg', 'png', 'gif', 'bmp'],
                    key="custom_image_upload"
                )
                
                if uploaded_image:
                    st.image(uploaded_image, caption="Vorschau", width=200)
            
            with col2_img:
                img_title = st.text_input(
                    "Bildtitel/Beschriftung:",
                    placeholder="z.B. Projektstandort, Dachansicht...",
                    key="custom_image_title"
                )
                
                img_description = st.text_area(
                    "Bildbeschreibung:",
                    placeholder="Optionale Beschreibung des Bildes...",
                    height=80,
                    key="custom_image_description"
                )
                
                img_position = st.selectbox(
                    "Position im PDF:",
                    options=["top", "middle", "bottom", "gallery"],
                    format_func=lambda x: {
                        "top": " Oben",
                        "middle": " Mitte", 
                        "bottom": " Unten",
                        "gallery": " Bildergalerie"
                    }[x],
                    key="custom_image_position"
                )
                
                if st.button(" Bild hinzufügen", key="add_image_content", type="primary"):
                    if uploaded_image and img_title:
                        # Bild zu Base64 konvertieren
                        image_bytes = uploaded_image.read()
                        image_b64 = base64.b64encode(image_bytes).decode()
                        
                        new_image_item = {
                            "type": "image",
                            "id": f"custom_image_{len(st.session_state['custom_content_items']) + 1}",
                            "title": img_title,
                            "description": img_description,
                            "image_data": image_b64,
                            "image_format": uploaded_image.type,
                            "position": img_position,
                            "created": datetime.now().strftime("%Y-%m-%d %H:%M")
                        }
                        st.session_state['custom_content_items'].append(new_image_item)
                        st.success(f" Bild '{img_title}' hinzugefügt!")
                        st.rerun()
                    else:
                        st.error(" Bitte Bild und Titel eingeben!")
        
        # TAB 3: TABELLEN
        with content_type_tab3:
            st.markdown("**Individuelle Tabelle erstellen:**")
            
            table_title = st.text_input(
                "Tabellen-Titel:",
                placeholder="z.B. Zusätzliche Leistungen, Komponenten-Details...",
                key="custom_table_title"
            )
            
            # Tabellen-Editor
            if 'temp_table_data' not in st.session_state:
                st.session_state['temp_table_data'] = {
                    'headers': ["Komponente", "Beschreibung", "Preis"],
                    'rows': [
                        ["Beispiel 1", "Beschreibung...", "1.000 €"],
                        ["Beispiel 2", "Beschreibung...", "2.000 €"]
                    ]
                }
            
            col1_table, col2_table = st.columns([3, 1])
            
            with col1_table:
                # Header bearbeiten
                st.markdown("**Spalten-Überschriften:**")
                headers_input = st.text_input(
                    "Spalten (mit Komma trennen):",
                    value=", ".join(st.session_state['temp_table_data']['headers']),
                    key="table_headers_input"
                )
                
                if headers_input:
                    st.session_state['temp_table_data']['headers'] = [h.strip() for h in headers_input.split(',')]
                
                # Zeilen bearbeiten
                st.markdown("**Tabellenzeilen:**")
                for i, row in enumerate(st.session_state['temp_table_data']['rows']):
                    cols = st.columns(len(st.session_state['temp_table_data']['headers']) + 1)
                    
                    for j, header in enumerate(st.session_state['temp_table_data']['headers']):
                        with cols[j]:
                            new_value = st.text_input(
                                f"{header}:",
                                value=row[j] if j < len(row) else "",
                                key=f"table_cell_{i}_{j}",
                                label_visibility="collapsed"
                            )
                            if j < len(row):
                                st.session_state['temp_table_data']['rows'][i][j] = new_value
                            else:
                                st.session_state['temp_table_data']['rows'][i].append(new_value)
                    
                    with cols[-1]:
                        if st.button("", key=f"delete_row_{i}", help="Zeile löschen"):
                            st.session_state['temp_table_data']['rows'].pop(i)
                            st.rerun()
            
            with col2_table:
                table_position = st.selectbox(
                    "Position:",
                    options=["top", "middle", "bottom", "pricing"],
                    format_func=lambda x: {
                        "top": " Oben",
                        "middle": " Mitte", 
                        "bottom": " Unten",
                        "pricing": " Bei Preisen"
                    }[x],
                    key="custom_table_position"
                )
                
                st.markdown("---")
                
                if st.button(" Zeile hinzufügen", key="add_table_row"):
                    new_row = [""] * len(st.session_state['temp_table_data']['headers'])
                    st.session_state['temp_table_data']['rows'].append(new_row)
                    st.rerun()
                
                if st.button(" Tabelle hinzufügen", key="add_table_content", type="primary"):
                    if table_title and st.session_state['temp_table_data']['rows']:
                        new_table_item = {
                            "type": "table",
                            "id": f"custom_table_{len(st.session_state['custom_content_items']) + 1}",
                            "title": table_title,
                            "headers": st.session_state['temp_table_data']['headers'].copy(),
                            "rows": [row.copy() for row in st.session_state['temp_table_data']['rows']],
                            "position": table_position,
                            "created": datetime.now().strftime("%Y-%m-%d %H:%M")
                        }
                        st.session_state['custom_content_items'].append(new_table_item)
                        st.success(f" Tabelle '{table_title}' hinzugefügt!")
                        # Reset temp data
                        st.session_state['temp_table_data'] = {
                            'headers': ["Komponente", "Beschreibung", "Preis"],
                            'rows': [["", "", ""]]
                        }
                        st.rerun()
                    else:
                        st.error(" Bitte Titel eingeben und Zeilen ausfüllen!")
        
        # TAB 4: VERWALTUNG
        with content_type_tab4:
            content_count = len(st.session_state['custom_content_items'])
            
            if content_count > 0:
                st.success(f" **{content_count} Custom Content-Element(e) aktiv**")
                
                # Bestehende Elemente anzeigen
                st.markdown("**Bestehende Inhalte:**")
                
                for i, item in enumerate(st.session_state['custom_content_items']):
                    with st.expander(f"{item.get('type', '').upper()}: {item.get('title', 'Ohne Titel')} (Position: {item.get('position', 'unbekannt')})"):
                        col1_manage, col2_manage = st.columns([3, 1])
                        
                        with col1_manage:
                            if item['type'] == 'text':
                                st.write(f"**Inhalt:** {item.get('content', '')[:100]}...")
                                st.write(f"**Stil:** {item.get('style', 'normal')}")
                            elif item['type'] == 'image':
                                st.write(f"**Beschreibung:** {item.get('description', 'Keine')}")
                                if 'image_data' in item:
                                    st.write("**Bild:**  Vorhanden")
                            elif item['type'] == 'table':
                                st.write(f"**Spalten:** {', '.join(item.get('headers', []))}")
                                st.write(f"**Zeilen:** {len(item.get('rows', []))}")
                            
                            st.write(f"**Erstellt:** {item.get('created', 'Unbekannt')}")
                        
                        with col2_manage:
                            if st.button(f" Löschen", key=f"delete_content_{i}"):
                                st.session_state['custom_content_items'].pop(i)
                                st.rerun()
                
                st.markdown("---")
                
                col1_clear, col2_clear = st.columns(2)
                with col1_clear:
                    if st.button(" Alle löschen", key="clear_all_content"):
                        st.session_state['custom_content_items'] = []
                        st.rerun()
                
                with col2_clear:
                    if st.button(" Vorschau", key="preview_content"):
                        st.info("Vorschau wird im generierten PDF angezeigt")
            else:
                st.info("ℹ **Noch keine Custom Content-Elemente hinzugefügt**")
                st.markdown("""
                **Verfügbare Content-Typen:**
                -  **Texte:** Individuelle Hinweise, Garantien, etc.
                -  **Bilder:** Fotos vom Projekt, Referenzen, etc.  
                -  **Tabellen:** Zusätzliche Komponenten, Preislisten, etc.
                """)
    
    # TAB 4: PDF DESIGN THEMES
    with ext_tab4:
        pdf_design_config = st.session_state.get('pdf_design_config', {})
        
        col1_design, col2_design, col3_design = st.columns(3)
        
        with col1_design:
            pdf_design_config['theme'] = st.selectbox(
                "Theme",
                options=["professional", "modern", "classic", "minimal"],
                index=["professional", "modern", "classic", "minimal"].index(
                    pdf_design_config.get('theme', 'professional')
                ),
                key="design_theme_select_outside_form"
            )
        
        with col2_design:
            pdf_design_config['color_scheme'] = st.selectbox(
                "Farbschema",
                options=["blue_gradient", "green_modern", "orange_warm", "purple_elegant"],
                index=["blue_gradient", "green_modern", "orange_warm", "purple_elegant"].index(
                    pdf_design_config.get('color_scheme', 'blue_gradient')
                ),
                key="color_scheme_select_outside_form"
            )
        
        with col3_design:
            pdf_design_config['typography'] = st.selectbox(
                "Typografie",
                options=["modern", "classic", "bold", "elegant"],
                index=["modern", "classic", "bold", "elegant"].index(
                    pdf_design_config.get('typography', 'modern')
                ),
                key="typography_select_outside_form"
            )
        
        st.session_state['pdf_design_config'] = pdf_design_config
    
    # Feature-Status anzeigen
    st.markdown("** Feature-Status:**")
    col1_status, col2_status, col3_status, col4_status = st.columns(4)
    
    with col1_status:
        financing_active = st.session_state.get('financing_config', {}).get('enabled', False)
        st.write(f" Finanzierung: {'' if financing_active else ''}")
    
    with col2_status:
        chart_active = bool(st.session_state.get('chart_config', {}))
        st.write(f" Charts: {'' if chart_active else ''}")
    
    with col3_status:
        content_count = len(st.session_state.get('custom_content_items', []))
        st.write(f" Content: {content_count} Elemente")
    
    with col4_status:
        design_active = bool(st.session_state.get('pdf_design_config', {}))
        st.write(f" Design: {'' if design_active else ''}")
    
    st.markdown("---")
    
    # Hauptformular
    # ... (Rest des Formulars und der PDF-Generierungslogik wie in der vorherigen Antwort, mit der Korrektur für st.form_submit_button) ...
    form_submit_key = "pdf_final_submit_btn_v13_corrected_again" 
    submit_button_disabled = st.session_state.pdf_generating_lock_v1
    with st.form(key="pdf_generation_form_v13_final_locked_options_main", clear_on_submit=False):
        st.subheader(get_text_pdf_ui(texts, "pdf_config_header", "PDF-Konfiguration"))
        with st.container():
            st.markdown("**" + get_text_pdf_ui(texts, "pdf_template_selection_info", "Vorlagen für das Angebot auswählen") + "**")
            title_image_options = {t.get('name', f"Bild {i+1}"): t.get('data') for i, t in enumerate(title_image_templates) if isinstance(t,dict) and t.get('name')}
            if not title_image_options: title_image_options = {get_text_pdf_ui(texts, "no_title_images_available", "Keine Titelbilder verfügbar"): None}
            title_image_keys = list(title_image_options.keys()); idx_title_img = title_image_keys.index(st.session_state.selected_title_image_name_doc_output) if st.session_state.selected_title_image_name_doc_output in title_image_keys else 0
            selected_title_image_name = st.selectbox(get_text_pdf_ui(texts, "pdf_select_title_image", "Titelbild auswählen"), options=title_image_keys, index=idx_title_img, key="pdf_title_image_select_v13_form")
            if selected_title_image_name != st.session_state.selected_title_image_name_doc_output : st.session_state.selected_title_image_name_doc_output = selected_title_image_name; st.session_state.selected_title_image_b64_data_doc_output = title_image_options.get(selected_title_image_name)
            offer_title_options = {t.get('name', f"Titel {i+1}"): t.get('content') for i, t in enumerate(offer_title_templates) if isinstance(t,dict) and t.get('name')}
            if not offer_title_options: offer_title_options = {get_text_pdf_ui(texts, "no_offer_titles_available", "Keine Angebotstitel verfügbar"): "Standard Angebotstitel"}
            offer_title_keys = list(offer_title_options.keys()); idx_offer_title = offer_title_keys.index(st.session_state.selected_offer_title_name_doc_output) if st.session_state.selected_offer_title_name_doc_output in offer_title_keys else 0
            selected_offer_title_name = st.selectbox(get_text_pdf_ui(texts, "pdf_select_offer_title", "Überschrift/Titel auswählen"), options=offer_title_keys, index=idx_offer_title, key="pdf_offer_title_select_v13_form")
            if selected_offer_title_name != st.session_state.selected_offer_title_name_doc_output: st.session_state.selected_offer_title_name_doc_output = selected_offer_title_name; st.session_state.selected_offer_title_text_content_doc_output = offer_title_options.get(selected_offer_title_name, "")
            cover_letter_options = {t.get('name', f"Anschreiben {i+1}"): t.get('content') for i, t in enumerate(cover_letter_templates) if isinstance(t,dict) and t.get('name')}
            if not cover_letter_options: cover_letter_options = {get_text_pdf_ui(texts, "no_cover_letters_available", "Keine Anschreiben verfügbar"): "Standard Anschreiben"}
            cover_letter_keys = list(cover_letter_options.keys()); idx_cover_letter = cover_letter_keys.index(st.session_state.selected_cover_letter_name_doc_output) if st.session_state.selected_cover_letter_name_doc_output in cover_letter_keys else 0
            selected_cover_letter_name = st.selectbox(get_text_pdf_ui(texts, "pdf_select_cover_letter", "Anschreiben auswählen"), options=cover_letter_keys, index=idx_cover_letter, key="pdf_cover_letter_select_v13_form")
            if selected_cover_letter_name != st.session_state.selected_cover_letter_name_doc_output: st.session_state.selected_cover_letter_name_doc_output = selected_cover_letter_name; st.session_state.selected_cover_letter_text_content_doc_output = cover_letter_options.get(selected_cover_letter_name, "")
        st.markdown("---")
        st.markdown("**" + get_text_pdf_ui(texts, "pdf_content_selection_info", "Inhalte für das PDF auswählen") + "**")
        # Schalter: Zusatzseiten ab Seite 7
        col_pdf_content1_form, col_pdf_content2_form, col_pdf_content3_form = st.columns(3)
        with col_pdf_content1_form: 
            # NEU: Klarer Hauptschalter für erweiterte PDF-Ausgabe (steuert Zusatzseiten ab Seite 7)
            st.session_state.pdf_inclusion_options["append_additional_pages_after_main6"] = st.checkbox(
                get_text_pdf_ui(texts, "pdf_append_after_main6_label", "Erweiterte PDF-Ausgabe (ab Seite 7) aktivieren?"),
                value=st.session_state.pdf_inclusion_options.get("append_additional_pages_after_main6", False),
                key="pdf_cb_append_after_main6_v1"
            )
            append_after_main6_flag = bool(st.session_state.pdf_inclusion_options.get("append_additional_pages_after_main6", False))

            # Zusatzoptionen für Seiten ab 7 nur anzeigen, wenn der Schalter aktiv ist
            if append_after_main6_flag:
                st.caption("Erweiterter Modus aktiv: Die 6 festen Hauptseiten werden erzeugt und zusätzliche Angebotsseiten ab Seite 7 angehängt.")
                st.session_state.pdf_inclusion_options["include_company_logo"] = st.checkbox(get_text_pdf_ui(texts, "pdf_include_company_logo_label", "Firmenlogo anzeigen?"), value=st.session_state.pdf_inclusion_options.get("include_company_logo", True), key="pdf_cb_logo_v13_form_main_stable")
                st.session_state.pdf_inclusion_options["include_product_images"] = st.checkbox(get_text_pdf_ui(texts, "pdf_include_product_images_label", "Produktbilder anzeigen? (Haupt & Zubehör)"), value=st.session_state.pdf_inclusion_options.get("include_product_images", True), key="pdf_cb_prod_img_v13_form_main_stable")
                st.session_state.pdf_inclusion_options["include_optional_component_details"] = st.checkbox(get_text_pdf_ui(texts, "pdf_include_optional_component_details_label", "Details zu optionalen Komponenten anzeigen?"), value=st.session_state.pdf_inclusion_options.get("include_optional_component_details", True), key="pdf_cb_opt_comp_details_v13_form_main_stable")
                st.session_state.pdf_inclusion_options["include_all_documents"] = st.checkbox(get_text_pdf_ui(texts, "pdf_include_all_documents_label", "Alle Datenblätter & ausgew. Firmendokumente anhängen?"), value=st.session_state.pdf_inclusion_options.get("include_all_documents", False), key="pdf_cb_all_docs_v13_form_main_stable")

                st.markdown("**" + get_text_pdf_ui(texts, "pdf_options_select_company_docs", "Spezifische Firmendokumente für Anhang") + "**")
                if active_company_id_for_docs is not None and isinstance(active_company_id_for_docs, int) and callable(db_list_company_documents_func):
                    company_docs_list_form = db_list_company_documents_func(active_company_id_for_docs, None)
                    if company_docs_list_form:
                        current_selected_doc_ids_form = st.session_state.pdf_inclusion_options.get("company_document_ids_to_include", [])
                        selected_doc_ids_in_form = []
                        for doc_item_form in company_docs_list_form:
                            if isinstance(doc_item_form, dict) and 'id' in doc_item_form:
                                doc_id_item_form = doc_item_form['id']
                                doc_label_item_form = f"{doc_item_form.get('display_name', doc_item_form.get('file_name', 'Unbenannt'))} ({doc_item_form.get('document_type')})"
                                if st.checkbox(doc_label_item_form, value=(doc_id_item_form in current_selected_doc_ids_form), key=f"pdf_cb_company_doc_form_{doc_id_item_form}_v13_stable"):
                                    selected_doc_ids_in_form.append(doc_id_item_form)
                        st.session_state.pdf_inclusion_options["_temp_company_document_ids_to_include"] = selected_doc_ids_in_form
                    else: 
                        st.caption(get_text_pdf_ui(texts, "pdf_no_company_documents_available", "Keine Dokumente für Firma hinterlegt."))
                else:
                    st.caption(get_text_pdf_ui(texts, "pdf_select_active_company_for_docs", "Aktive Firma nicht korrekt."))
            else:
                st.info(get_text_pdf_ui(texts, "pdf_only_main6_active_info", "Standardmodus: Es werden nur die 6 Hauptseiten erzeugt. Erweiterte PDF-Ausgabe ist deaktiviert."))
        with col_pdf_content2_form: 
            if append_after_main6_flag:
                st.markdown("**" + get_text_pdf_ui(texts, "pdf_options_column_main_sections", "Hauptsektionen im Angebot (Zusatzseiten)") + "**")
                current_selected_main_sections_in_state_form = st.session_state.get("pdf_selected_main_sections", all_main_section_keys[:])
                selected_sections_in_form = []
                for section_key_form, section_label_from_map_form in default_pdf_sections_map.items():
                    if st.checkbox(section_label_from_map_form, value=(section_key_form in current_selected_main_sections_in_state_form), key=f"pdf_section_cb_form_{section_key_form}_v13_stable"):
                        selected_sections_in_form.append(section_key_form)
                st.session_state["_temp_pdf_selected_main_sections"] = selected_sections_in_form
            else:
                st.empty()
        with col_pdf_content3_form: 
            if append_after_main6_flag:
                st.markdown("**" + get_text_pdf_ui(texts, "pdf_options_column_charts", "Diagramme & Visualisierungen (Zusatzseiten)") + "**")
                if analysis_results and isinstance(analysis_results, dict):
                    available_chart_keys_form = _get_all_available_chart_keys(analysis_results, chart_key_to_friendly_name_map)
                    ordered_display_keys_form = [k_map for k_map in chart_key_to_friendly_name_map.keys() if k_map in available_chart_keys_form]
                    for k_avail_form in available_chart_keys_form: 
                        if k_avail_form not in ordered_display_keys_form: ordered_display_keys_form.append(k_avail_form)
                    current_selected_charts_in_state_form = st.session_state.pdf_inclusion_options.get("selected_charts_for_pdf", [])
                    selected_charts_in_form = []
                    for chart_key_form in ordered_display_keys_form:
                        friendly_name_form = chart_key_to_friendly_name_map.get(chart_key_form, chart_key_form.replace('_chart_bytes', '').replace('_', ' ').title())
                        if st.checkbox(friendly_name_form, value=(chart_key_form in current_selected_charts_in_state_form), key=f"pdf_include_chart_form_{chart_key_form}_v13_stable"):
                            selected_charts_in_form.append(chart_key_form)
                    st.session_state.pdf_inclusion_options["_temp_selected_charts_for_pdf"] = selected_charts_in_form
                else: 
                    st.caption(get_text_pdf_ui(texts, "pdf_no_charts_to_select", "Keine Diagrammdaten für PDF-Auswahl."))
            else:
                st.empty()
        
        #  ERWEITERTE PDF-FEATURES UI INTEGRATION
        st.markdown("---")
        st.markdown("###  ERWEITERTE PDF-FEATURES")
        
        st.markdown("---")
        submitted_generate_pdf = st.form_submit_button(label=f"**{get_text_pdf_ui(texts, 'pdf_generate_button', 'Angebots-PDF erstellen')}**", type="primary", disabled=submit_button_disabled)
        if submitted_generate_pdf: # Werte aus temporären Keys in die Haupt-Session-State-Keys übernehmen
            append_after_main6_flag_submit = bool(st.session_state.pdf_inclusion_options.get("append_additional_pages_after_main6", False))
            if append_after_main6_flag_submit:
                st.session_state.pdf_inclusion_options["company_document_ids_to_include"] = st.session_state.pdf_inclusion_options.pop("_temp_company_document_ids_to_include", [])
                st.session_state.pdf_selected_main_sections = st.session_state.pop("_temp_pdf_selected_main_sections", [])
                st.session_state.pdf_inclusion_options["selected_charts_for_pdf"] = st.session_state.pdf_inclusion_options.pop("_temp_selected_charts_for_pdf", [])
            else:
                # Zusatzauswahlen zurücksetzen, wenn Zusatzseiten deaktiviert sind
                st.session_state.pdf_inclusion_options.pop("_temp_company_document_ids_to_include", None)
                st.session_state.pop("_temp_pdf_selected_main_sections", None)
                st.session_state.pdf_inclusion_options.pop("_temp_selected_charts_for_pdf", None)
                st.session_state.pdf_inclusion_options["company_document_ids_to_include"] = []
                st.session_state.pdf_selected_main_sections = []
                st.session_state.pdf_inclusion_options["selected_charts_for_pdf"] = []
            
    if submitted_generate_pdf and not st.session_state.pdf_generating_lock_v1:
        st.session_state.pdf_generating_lock_v1 = True
        pdf_bytes = None 
        try:            # Datenvalidierung vor PDF-Erstellung
            try:
                from pdf_generator import _validate_pdf_data_availability, _create_no_data_fallback_pdf
                
                validation_result = _validate_pdf_data_availability(
                    project_data=project_data,
                    analysis_results=analysis_results,
                    texts=texts
                )
                
                # Zeige Validierungsstatus an
                if not validation_result['is_valid']:
                    st.warning(f" Unvollständige Daten erkannt: {', '.join(validation_result['missing_data_summary'])}")
                    st.info("Ein vereinfachtes Informations-PDF wird erstellt.")
                    
                    if validation_result['critical_errors'] > 0:
                        st.error(f" {validation_result['critical_errors']} kritische Fehler gefunden. Erstelle Fallback-PDF...")
                        
                        # Erstelle Fallback-PDF
                        pdf_bytes = create_fallback_pdf(
                            issues=validation_result['missing_data'],
                            warnings=validation_result['warnings'],
                            texts=texts
                        )
                        st.session_state.generated_pdf_bytes_for_download_v1 = pdf_bytes
                        st.success(" Fallback-PDF erfolgreich erstellt!")
                        return
                    else:
                        st.info(f"ℹ {validation_result['warnings']} Warnungen. PDF wird mit verfügbaren Daten erstellt.")
                else:
                    st.success(" Alle Daten vollständig verfügbar.")
                    
            except ImportError:
                st.warning("Datenvalidierung nicht verfügbar. Fahre mit normaler PDF-Erstellung fort.")
                
            with st.spinner(get_text_pdf_ui(texts, 'pdf_generation_spinner', 'PDF wird generiert, bitte warten...')):
                final_inclusion_options_to_pass = st.session_state.pdf_inclusion_options.copy()
                
                #  NEUE FEATURES AUS SESSION STATE HINZUFÜGEN
                final_inclusion_options_to_pass.update({
                    'financing_config': st.session_state.get('financing_config', {}),
                    'chart_config': st.session_state.get('chart_config', {}),
                    'custom_content_items': st.session_state.get('custom_content_items', []),
                    'pdf_editor_config': st.session_state.get('pdf_editor_config', {}),
                    'pdf_design_config': st.session_state.get('pdf_design_config', {}),
                    # Drag & Drop Reihenfolge der Sektionen (falls gesetzt)
                    'custom_section_order': st.session_state.get('pdf_section_order', [])
                })
                
                final_sections_to_include_to_pass = st.session_state.pdf_selected_main_sections[:]
                pdf_bytes = _generate_offer_pdf_safe(
                    project_data=project_data, 
                    analysis_results=analysis_results, 
                    company_info=company_info_for_pdf, 
                    company_logo_base64=company_logo_b64_for_pdf, 
                    selected_title_image_b64=st.session_state.selected_title_image_b64_data_doc_output, 
                    selected_offer_title_text=st.session_state.selected_offer_title_text_content_doc_output, 
                    selected_cover_letter_text=st.session_state.selected_cover_letter_text_content_doc_output, 
                    sections_to_include=final_sections_to_include_to_pass, 
                    inclusion_options=final_inclusion_options_to_pass, 
                    load_admin_setting_func=load_admin_setting_func, 
                    save_admin_setting_func=save_admin_setting_func, 
                    list_products_func=list_products_func, 
                    get_product_by_id_func=get_product_by_id_func, 
                    db_list_company_documents_func=db_list_company_documents_func, 
                    active_company_id=active_company_id_for_docs, 
                    texts=texts
                )
            st.session_state.generated_pdf_bytes_for_download_v1 = pdf_bytes
        except Exception as e_gen_final_outer: 
            st.error(f"{get_text_pdf_ui(texts, 'pdf_generation_exception_outer', 'Kritischer Fehler im PDF-Prozess (pdf_ui.py):')} {e_gen_final_outer}")
            st.text_area("Traceback PDF Erstellung (pdf_ui.py):", traceback.format_exc(), height=250)
            st.session_state.generated_pdf_bytes_for_download_v1 = None
        finally: 
            st.session_state.pdf_generating_lock_v1 = False
            st.session_state.selected_page_key_sui = "doc_output"
            st.rerun() 
    if 'generated_pdf_bytes_for_download_v1' in st.session_state:
        # Nicht poppen: Bytes im Session-State belassen, damit Button-Klicks (Reruns) weiterhin Zugriff haben
        pdf_bytes_to_download = st.session_state.get('generated_pdf_bytes_for_download_v1') 
        if pdf_bytes_to_download and isinstance(pdf_bytes_to_download, bytes):
            # Stabiler Timestamp/Dateiname über Reruns hinweg
            meta = st.session_state.get('generated_pdf_meta') or {}
            if not meta.get('timestamp') or not meta.get('file_name'):
                customer_name_for_file = customer_data_pdf.get('last_name', 'Angebot')
                file_name_customer_part = str(customer_name_for_file).replace(' ', '_') if customer_name_for_file and str(customer_name_for_file).strip() else "Photovoltaik_Angebot"
                timestamp_file = base64.b32encode(os.urandom(5)).decode('utf-8').lower()
                file_name = f"Angebot_{file_name_customer_part}_{timestamp_file}.pdf"
                meta = {'timestamp': timestamp_file, 'file_name': file_name}
                st.session_state['generated_pdf_meta'] = meta
            else:
                timestamp_file = meta['timestamp']
                file_name = meta['file_name']
            st.success(get_text_pdf_ui(texts, "pdf_generation_success", "PDF erfolgreich erstellt!"))
            st.download_button(
                label=get_text_pdf_ui(texts, "pdf_download_button", "PDF herunterladen"), 
                data=pdf_bytes_to_download, 
                file_name=file_name, 
                mime="application/pdf", 
                key=f"pdf_download_btn_final_{timestamp_file}_v13_final_stable"
            )

            # Sichtbares Feedback aus vorherigen CRM-Aktionen anzeigen
            _crm_feedback = st.session_state.get('_crm_feedback')
            if isinstance(_crm_feedback, dict) and _crm_feedback.get('msg'):
                if _crm_feedback.get('type') == 'success':
                    st.success(_crm_feedback['msg'])
                else:
                    st.error(_crm_feedback['msg'])

            # CRM: Kunde speichern + PDF in Kundenakte ablegen
            with st.expander(" CRM: Kunde speichern & PDF in Kundenakte ablegen", expanded=bool(st.session_state.get('_crm_expanded', False))):
                st.caption("Erstellt/aktualisiert den Kunden in der CRM Kundenverwaltung und speichert dieses PDF in der Kundenakte.")
                col_crm1, col_crm2 = st.columns([1,1])
                with col_crm1:
                    if st.button(" Kunde in CRM speichern", key=f"btn_crm_save_{timestamp_file}", type="primary"):
                        try:
                            import sqlite3
                            from database import get_db_connection, add_customer_document
                            from crm import save_customer, save_project, create_tables_crm
                            conn = get_db_connection()
                            if conn is None:
                                st.error("Keine DB-Verbindung für CRM.")
                                st.session_state['_crm_feedback'] = {'type': 'error', 'msg': 'Keine DB-Verbindung für CRM.'}
                            else:
                                with st.spinner("Speichere im CRM…"):
                                    conn.row_factory = sqlite3.Row
                                    create_tables_crm(conn)
                                cur = conn.cursor()
                                first_name = project_data.get('customer_data', {}).get('first_name', '')
                                last_name = project_data.get('customer_data', {}).get('last_name', '')
                                email_val = project_data.get('customer_data', {}).get('email', '')
                                cur.execute("SELECT id FROM customers WHERE first_name = ? AND last_name = ? AND (email = ? OR ? = '') LIMIT 1", (first_name, last_name, email_val, email_val))
                                row = cur.fetchone()
                                if row:
                                    created_customer_id = int(row[0])
                                else:
                                    cust_payload = {
                                        'salutation': project_data.get('customer_data', {}).get('salutation'),
                                        'title': project_data.get('customer_data', {}).get('title'),
                                        'first_name': first_name or 'Interessent',
                                        'last_name': last_name or 'Unbekannt',
                                        'company_name': project_data.get('customer_data', {}).get('company_name'),
                                        'address': project_data.get('customer_data', {}).get('address'),
                                        'house_number': project_data.get('customer_data', {}).get('house_number'),
                                        'zip_code': project_data.get('customer_data', {}).get('zip_code'),
                                        'city': project_data.get('customer_data', {}).get('city'),
                                        'state': project_data.get('customer_data', {}).get('state'),
                                        'region': project_data.get('customer_data', {}).get('region'),
                                        'email': email_val,
                                        'phone_landline': project_data.get('customer_data', {}).get('phone_landline') or project_data.get('customer_data', {}).get('phone'),
                                        'phone_mobile': project_data.get('customer_data', {}).get('phone_mobile'),
                                        'income_tax_rate_percent': float(project_data.get('customer_data', {}).get('income_tax_rate_percent') or 0.0),
                                        'creation_date': datetime.now().isoformat(),
                                    }
                                    created_customer_id = save_customer(conn, cust_payload)
                                created_project_id = None
                                if created_customer_id:
                                    proj_details = project_data.get('project_details', {})
                                    proj_payload = {
                                        'customer_id': created_customer_id,
                                        'project_name': proj_details.get('project_name') or f"PV Angebot {datetime.now().strftime('%Y-%m-%d')}",
                                        'project_status': 'Angebot',
                                        'roof_type': proj_details.get('roof_type'),
                                        'roof_covering_type': proj_details.get('roof_covering_type'),
                                        'free_roof_area_sqm': proj_details.get('free_roof_area_sqm'),
                                        'roof_orientation': proj_details.get('roof_orientation'),
                                        'roof_inclination_deg': proj_details.get('roof_inclination_deg'),
                                        'building_height_gt_7m': int(bool(proj_details.get('building_height_gt_7m'))),
                                        'annual_consumption_kwh': proj_details.get('annual_consumption_kwh') or project_data.get('consumption_data', {}).get('annual_consumption'),
                                        'costs_household_euro_mo': proj_details.get('costs_household_euro_mo'),
                                        'annual_heating_kwh': proj_details.get('annual_heating_kwh') or project_data.get('consumption_data', {}).get('consumption_heating_kwh_yr'),
                                        'costs_heating_euro_mo': proj_details.get('costs_heating_euro_mo'),
                                        'anlage_type': proj_details.get('anlage_type'),
                                        'feed_in_type': proj_details.get('feed_in_type'),
                                        'module_quantity': proj_details.get('module_quantity'),
                                        'selected_module_id': proj_details.get('selected_module_id'),
                                        'selected_inverter_id': proj_details.get('selected_inverter_id'),
                                        'include_storage': int(bool(proj_details.get('include_storage'))),
                                        'selected_storage_id': proj_details.get('selected_storage_id'),
                                        'selected_storage_storage_power_kw': proj_details.get('selected_storage_storage_power_kw'),
                                        'include_additional_components': int(bool(proj_details.get('include_additional_components'))),
                                        'visualize_roof_in_pdf': int(bool(proj_details.get('visualize_roof_in_pdf'))),
                                        'latitude': proj_details.get('latitude'),
                                        'longitude': proj_details.get('longitude'),
                                        'creation_date': datetime.now().isoformat(),
                                    }
                                    created_project_id = save_project(conn, proj_payload)
                                if created_customer_id:
                                    # PDF ablegen (stabiler Dateiname aus Meta verwenden)
                                    _ = add_customer_document(
                                        created_customer_id,
                                        pdf_bytes_to_download,
                                        display_name=file_name,
                                        doc_type="offer_pdf",
                                        project_id=created_project_id,
                                        suggested_filename=file_name,
                                    )
                                    # JSON-Snapshot ablegen
                                    snapshot = json.dumps(
                                        {"project_data": project_data, "analysis_results": analysis_results},
                                        ensure_ascii=False,
                                        default=str,
                                    ).encode("utf-8")
                                    json_name = f"Projekt_Snapshot_{timestamp_file}.json"
                                    _ = add_customer_document(
                                        created_customer_id,
                                        snapshot,
                                        display_name=json_name,
                                        doc_type="project_json",
                                        project_id=created_project_id,
                                        suggested_filename=json_name,
                                    )
                                    st.success("Kunde gespeichert und Dokumente in der Kundenakte abgelegt.")
                                    st.session_state["_last_saved_crm_customer_id"] = created_customer_id
                                    st.session_state["_last_saved_crm_project_id"] = created_project_id
                                    st.session_state['_crm_feedback'] = {
                                        'type': 'success',
                                        'msg': 'Kunde gespeichert und Dokumente in der Kundenakte abgelegt.'
                                    }
                                    st.session_state['_crm_expanded'] = True
                                    try:
                                        conn.close()
                                    except Exception:
                                        pass
                                else:
                                    st.error("Kunde konnte nicht gespeichert werden.")
                                    st.session_state['_crm_feedback'] = {'type': 'error', 'msg': 'Kunde konnte nicht gespeichert werden.'}
                        except Exception as e:
                            st.error(f"Fehler beim Speichern im CRM: {e}")
                            st.session_state['_crm_feedback'] = {'type': 'error', 'msg': f'Fehler beim Speichern im CRM: {e}'}
                with col_crm2:
                    if st.button(" Zur CRM Kundenverwaltung", key=f"btn_go_crm_{timestamp_file}"):
                        st.session_state['selected_page_key_sui'] = 'crm'
                        last_id = st.session_state.get('_last_saved_crm_customer_id')
                        if last_id:
                            st.session_state['selected_customer_id'] = last_id
                            st.session_state['crm_view_mode'] = 'view_customer'
                        st.rerun()
        elif pdf_bytes_to_download is None and not st.session_state.get('pdf_generating_lock_v1', True) : st.error(get_text_pdf_ui(texts, "pdf_generation_failed_no_bytes_after_rerun", "PDF-Generierung fehlgeschlagen (keine Daten nach Rerun)."))

# NEU: PDF-VORSCHAU & BEARBEITUNG FUNKTION (BOMBE!)
def show_advanced_pdf_preview(
    project_data: Dict[str, Any],
    analysis_results: Optional[Dict[str, Any]],
    texts: Dict[str, str],
    load_admin_setting_func: Callable = _dummy_load_admin_setting_pdf_ui,
    save_admin_setting_func: Callable = _dummy_save_admin_setting_pdf_ui,
    get_active_company_details_func: Callable = _dummy_get_active_company_details,
    list_products_func: Callable = lambda: [],
    get_product_by_id_func: Callable = lambda x: {},
    db_list_company_documents_func: Callable = _dummy_list_company_documents
) -> Optional[bytes]:
    """
    Erweiterte PDF-Vorschau mit Bearbeitungsmöglichkeiten und Seitenreihenfolge.
    Das wird BOMBE! 
    
    Args:
        project_data: Projektdaten
        analysis_results: Analyseergebnisse
        texts: Übersetzungstexte
        ... weitere Callback-Funktionen
    
    Returns:
        PDF-Bytes falls erfolgreich generiert, sonst None
    """
    
    if not _PDF_PREVIEW_AVAILABLE:
        st.error(" PDF-Vorschau-Modul ist nicht verfügbar!")
        st.info(" Installieren Sie die erforderlichen Abhängigkeiten für die PDF-Vorschau.")
        return None
    
    # Firmendaten abrufen
    company_details = get_active_company_details_func()
    if not company_details:
        st.warning(" Keine aktive Firma gefunden. Verwende Standardwerte.")
        company_details = {
            "name": "Ihre Solarfirma",
            "street": "Musterstraße 1",
            "zip_code": "12345",
            "city": "Musterstadt",
            "phone": "+49 123 456789",
            "email": "info@ihresolarfirma.de",
            "id": 1
        }
    
    company_logo_base64 = company_details.get('logo_base64')
    
    # PDF-Vorschau-Interface aufrufen
    return show_pdf_preview_interface(
        project_data=project_data,
        analysis_results=analysis_results,
        company_info=company_details,
        company_logo_base64=company_logo_base64,
        texts=texts,
        generate_pdf_func=lambda **kwargs: _generate_offer_pdf_safe(
            load_admin_setting_func=load_admin_setting_func,
            save_admin_setting_func=save_admin_setting_func,
            list_products_func=list_products_func,
            get_product_by_id_func=get_product_by_id_func,
            db_list_company_documents_func=db_list_company_documents_func,
            active_company_id=company_details.get('id', 1),
            **kwargs
        )
    )

# --- Debug-Bereich für PDF-Anhänge ---
def render_pdf_debug_section(
    texts: Dict[str, str],
    project_data: Dict[str, Any],
    analysis_results: Dict[str, Any],
    get_active_company_details_func: Callable,
    db_list_company_documents_func: Callable,
    get_product_by_id_func: Callable
):
    """Rendert einen Debug-Bereich für PDF-Anhänge"""
    with st.expander(" Debug: PDF-Anhänge-Prüfung", expanded=False):
        st.subheader("Systemstatus")
        
        # PyPDF Verfügbarkeit prüfen
        try:
            from pypdf import PdfReader, PdfWriter
            pypdf_status = " pypdf verfügbar"
        except ImportError:
            try:
                from PyPDF2 import PdfReader, PdfWriter
                pypdf_status = " PyPDF2 verfügbar (Fallback)"
            except ImportError:
                pypdf_status = " Keine PDF-Bibliothek verfügbar"
        
        st.write(f"**PDF-Bibliothek:** {pypdf_status}")
        
        # Aktive Firma prüfen
        active_company = get_active_company_details_func()
        if active_company:
            st.write(f"**Aktive Firma:** {active_company.get('name')} (ID: {active_company.get('id')})")
            
            # Firmendokumente prüfen
            company_docs = db_list_company_documents_func(active_company.get('id'), None)
            st.write(f"**Verfügbare Firmendokumente:** {len(company_docs)}")
            for doc in company_docs:
                doc_path = os.path.join(os.getcwd(), "data", "company_docs", doc.get("relative_db_path", ""))
                status = "" if os.path.exists(doc_path) else ""
                st.write(f"  {status} {doc.get('display_name')} (ID: {doc.get('id')})")
        else:
            st.write("**Aktive Firma:**  Keine aktive Firma")
        
        # Projektdetails prüfen
        project_details = project_data.get('project_details', {})
        st.write("**Ausgewählte Produkte:**")
        
        product_ids = [
            ('Modul', project_details.get('selected_module_id')),
            ('Wechselrichter', project_details.get('selected_inverter_id')),
            ('Batteriespeicher', project_details.get('selected_storage_id') if project_details.get('include_storage') else None)
        ]
        
        for comp_type, prod_id in product_ids:
            if prod_id:
                try:
                    product_info = get_product_by_id_func(prod_id)
                    if product_info:
                        datasheet_path = product_info.get("datasheet_link_db_path")
                        if datasheet_path:
                            full_path = os.path.join(os.getcwd(), "data", "product_datasheets", datasheet_path)
                            status = "" if os.path.exists(full_path) else ""
                            st.write(f"  {status} {comp_type}: {product_info.get('model_name')} (ID: {prod_id})")
                            if not os.path.exists(full_path):
                                st.write(f"     Datenblatt fehlt: {full_path}")
                        else:
                            st.write(f"   {comp_type}: {product_info.get('model_name')} (Kein Datenblatt-Pfad)")
                    else:
                        st.write(f"   {comp_type}: Produkt ID {prod_id} nicht in DB gefunden")
                except Exception as e:
                    st.write(f"   {comp_type}: Fehler beim Laden von ID {prod_id}: {e}")
            else:
                st.write(f"  - {comp_type}: Nicht ausgewählt")
        
        # Current PDF inclusion options anzeigen
        st.subheader("Aktuelle PDF-Einstellungen")
        if 'pdf_inclusion_options' in st.session_state:
            options = st.session_state.pdf_inclusion_options
            st.json(options)
        else:
            st.write("Keine PDF-Einstellungen in Session State")

# Änderungshistorie
# ... (vorherige Einträge)
# 2025-06-05, Gemini Ultra: TypeError bei `st.form_submit_button` in `pdf_ui.py` durch Entfernen des ungültigen `key`-Arguments behoben.
# 2025-06-05, Gemini Ultra: Buttons "Alles auswählen", "Alles abwählen" und Vorlagenmanagement (Laden/Speichern) in `pdf_ui.py` implementiert.
#                           Vorlagen werden als JSON unter dem Admin-Setting 'pdf_offer_presets' gespeichert.
#                           Callbacks für die Buttons aktualisieren `st.session_state.pdf_inclusion_options` und `st.session_state.pdf_selected_main_sections`.
#                           Checkbox-Logik angepasst, um Auswahl im Formular temporär zu sammeln und bei Submit in Session State zu schreiben.
# 2025-06-05, Gemini Ultra: TypeError beim Laden von PDF-Presets behoben. `json.loads` wird nicht mehr auf bereits geparste Listen angewendet.
#                           Sicherheitsprüfungen für geladene Presets hinzugefügt. Fallback für `active_company_id_for_docs` auf `None` korrigiert.
#                           Sicherere Initialisierung der Vorlagenauswahl im Session State.
# 2025-06-06, Gemini Ultra: Debug-Bereich für PDF-Anhänge hinzugefügt. Prüft Verfügbarkeit von PyPDF, aktive Firma, Firmendokumente und Projektdetails.
# 2025-06-07, Gemini Ultra: PDF-Vorschau-Integration hinzugefügt.
# 2025-06-07, Gemini Ultra: Erweiterte PDF-Vorschau-Funktion (BOMBE!) hinzugefügt.
# 2025-06-08, Gemini Ultra: Datenstatus-Anzeige und Fallback-PDF-Option hinzugefügt.