# === AUTO-GENERATED INSERT PATCH ===
# target_module: test_pdf_logos.py
# insert_blocks follow; keep formatting unchanged

# --- REQUIRED IMPORT SUGGESTIONS (dedupe on apply) ---
import os
import sys
from pdf_generator import generate_offer_pdf
import tempfile

# --- DEF BLOCK START: func test_pdf_with_logos ---
def test_pdf_with_logos():
    """Teste PDF-Generierung mit Logos"""
    print("🔧 TESTE PDF-GENERIERUNG MIT LOGOS")
    print("=" * 50)
    
    # Test-Daten mit bekannten Logo-Herstellern
    project_data = {
        "customer_data": {
            "first_name": "Max",
            "last_name": "Mustermann",
            "address": "Musterstraße 1",
            "zip_code": "12345",
            "city": "Musterstadt",
            "email": "max@beispiel.de"
        },
        "project_details": {
            "roof_area": 50,
            "roof_orientation": "Süd"
        },
        "selected_products": {
            "module": {
                "product_id": 1,
                "brand_name": "Huawei",
                "product_name": "SUN2000-8KTL-M1"
            },
            "inverter": {
                "product_id": 2,
                "brand_name": "GoodWe", 
                "product_name": "GW8K-ET"
            },
            "storage": {
                "product_id": 3,
                "brand_name": "BYD",
                "product_name": "Battery-Box Premium HVM"
            }
        }
    }
    
    analysis_results = {
        "total_investment_netto": 15000,
        "total_investment_brutto": 17850,
        "anlage_kwp": 8.5,
        "annual_pv_production_kwh": 8500,
        "final_price": 15000
    }
    
    company_info = {
        "name": "Solar GmbH",
        "street": "Solarweg 123",
        "zip_code": "54321",
        "city": "Sonnenstein",
        "phone": "0123-456789",
        "email": "info@solar-gmbh.de"
    }
    
    # Optionen für PDF-Generierung
    options = {
        "include_main_template": True,
        "include_classic_template": False,
        "template_selection": "6seiten"
    }
    
    try:
        # Temporäre Datei für PDF
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
            temp_pdf_path = tmp_file.name
        
        print(f"📄 Erstelle PDF: {temp_pdf_path}")
        
        # PDF generieren
        result = generate_offer_pdf(
            project_data=project_data,
            analysis_results=analysis_results, 
            company_info=company_info,
            output_path=temp_pdf_path,
            options=options
        )
        
        if result and os.path.exists(temp_pdf_path):
            file_size = os.path.getsize(temp_pdf_path)
            print(f"✅ PDF erfolgreich erstellt!")
            print(f"   Datei: {temp_pdf_path}")
            print(f"   Größe: {file_size:,} Bytes")
            print(f"\n💡 Öffne die PDF-Datei und prüfe Seite 4 auf die Logos!")
            return temp_pdf_path
        else:
            print("❌ PDF-Generierung fehlgeschlagen")
            return None
            
    except Exception as e:
        print(f"❌ Fehler bei PDF-Generierung: {e}")
        import traceback
        traceback.print_exc()
        return None
# --- DEF BLOCK END ---

