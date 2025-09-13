#!/usr/bin/env python3
# python_bridge.py - Bridge between Electron App and calculations.py
"""
Python Bridge für die Solar Calculator Electron App
Verbindet die TypeScript/Electron Anwendung mit der bestehenden calculations.py Engine
"""

import sys
import json
import os
import argparse
from typing import Dict, Any, List
import traceback
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

try:
    # Import the existing calculation engine
    from calculations import perform_calculations, AdvancedCalculationsIntegrator
    
    # Import localization
    import de  # German texts
    
    # Try to import database functions
    try:
        from database import (
            get_product_by_id,
            load_admin_setting,
            get_all_products_by_category
        )
        DATABASE_AVAILABLE = True
    except ImportError:
        DATABASE_AVAILABLE = False
        
except ImportError as e:
    print(f"ERROR: Failed to import required modules: {e}", file=sys.stderr)
    sys.exit(1)

class PythonCalculationBridge:
    """Bridge class to handle communication between Electron and Python calculations"""
    
    def __init__(self):
        self.texts = getattr(de, 'TEXTS', {}) if hasattr(de, 'TEXTS') else {}
        self.advanced_calc = AdvancedCalculationsIntegrator()
        
    def validate_input_data(self, data: Dict[str, Any]) -> List[str]:
        """Validate input data and return list of validation errors"""
        errors = []
        
        # Validate required fields
        if not data.get('project_details'):
            errors.append("project_details is required")
            return errors
            
        project_details = data['project_details']
        
        # Basic validation
        if not isinstance(project_details.get('module_quantity'), (int, float)) or project_details.get('module_quantity', 0) <= 0:
            errors.append("module_quantity must be a positive number")
            
        if not isinstance(project_details.get('annual_consumption_kwh_yr'), (int, float)) or project_details.get('annual_consumption_kwh_yr', 0) < 0:
            errors.append("annual_consumption_kwh_yr must be a non-negative number")
            
        if not isinstance(project_details.get('electricity_price_kwh'), (int, float)) or project_details.get('electricity_price_kwh', 0) <= 0:
            errors.append("electricity_price_kwh must be a positive number")
            
        # Validate coordinates if provided
        lat = project_details.get('latitude')
        lon = project_details.get('longitude')
        if lat is not None and (not isinstance(lat, (int, float)) or not -90 <= lat <= 90):
            errors.append("latitude must be between -90 and 90")
            
        if lon is not None and (not isinstance(lon, (int, float)) or not -180 <= lon <= 180):
            errors.append("longitude must be between -180 and 180")
            
        return errors
        
    def mock_database_functions(self):
        """Provide mock database functions when real database is not available"""
        
        def mock_get_product_by_id(product_id: int) -> Dict[str, Any]:
            """Mock product data based on ID"""
            if product_id == 1:
                return {
                    'id': 1,
                    'capacity_w': 400,
                    'power_kw': 10,
                    'storage_power_kw': 10,
                    'additional_cost_netto': 0,
                    'model_name': 'Standard Modul 400W',
                    'usable_capacity_kwh': 10,
                    'max_cycles': 6000
                }
            elif product_id == 2:
                return {
                    'id': 2,
                    'capacity_w': 500,
                    'power_kw': 12,
                    'storage_power_kw': 5,
                    'additional_cost_netto': 50,
                    'model_name': 'Premium Modul 500W',
                    'usable_capacity_kwh': 5,
                    'max_cycles': 8000
                }
            return None
            
        def mock_load_admin_setting(key: str, default=None):
            """Mock admin settings"""
            mock_settings = {
                'global_constants': {
                    'vat_rate_percent': 19.0,
                    'electricity_price_increase_annual_percent': 3.0,
                    'simulation_period_years': 20,
                    'inflation_rate_percent': 2.0,
                    'loan_interest_rate_percent': 4.0,
                    'annual_module_degradation_percent': 0.5,
                    'default_specific_yield_kwh_kwp': 950.0,
                    'pvgis_enabled': False,  # Disable PVGIS for testing
                    'direct_self_consumption_factor_of_production': 0.25,
                    'storage_efficiency': 0.9,
                    'storage_cycles_per_year': 250,
                    'einspeiseverguetung_period_years': 20,
                    'marktwert_strom_eur_per_kwh_after_eeg': 0.03,
                    'maintenance_costs_base_percent': 1.5,
                    'co2_emission_factor_kg_per_kwh': 0.474,
                    'specific_yields_by_orientation_tilt': {
                        'Süd_30': 1000.0,
                        'Süd_35': 1020.0,
                        'Süd_45': 980.0,
                        'Südost_30': 950.0,
                        'Südwest_30': 950.0,
                    },
                    'monthly_production_distribution': [
                        0.04, 0.06, 0.09, 0.12, 0.13, 0.14,  # Jan-Jun
                        0.15, 0.13, 0.10, 0.07, 0.04, 0.03   # Jul-Dec
                    ],
                    'monthly_consumption_distribution': [1/12] * 12
                },
                'feed_in_tariffs': {
                    'parts': [
                        {'kwp_min': 0.0, 'kwp_max': 10.0, 'ct_per_kwh': 8.2},
                        {'kwp_min': 10.01, 'kwp_max': 40.0, 'ct_per_kwh': 7.1},
                        {'kwp_min': 40.01, 'kwp_max': 100.0, 'ct_per_kwh': 5.8}
                    ],
                    'full': [
                        {'kwp_min': 0.0, 'kwp_max': 10.0, 'ct_per_kwh': 13.0},
                        {'kwp_min': 10.01, 'kwp_max': 100.0, 'ct_per_kwh': 10.9}
                    ]
                },
                'price_matrix_csv_data': '',
                'price_matrix_excel_bytes': None
            }
            return mock_settings.get(key, default)
            
        # Monkey patch the functions
        import calculations
        calculations.real_get_product_by_id = mock_get_product_by_id
        calculations.real_load_admin_setting = mock_load_admin_setting
        
    def calculate(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main calculation method"""
        try:
            # Validate input
            errors = self.validate_input_data(input_data)
            if errors:
                return {
                    'success': False,
                    'errors': errors,
                    'message': 'Input validation failed'
                }
            
            # Setup mock database if real one not available
            if not DATABASE_AVAILABLE:
                self.mock_database_functions()
                
            # Prepare error list for calculations
            calculation_errors = []
            
            # Call the main calculation function
            results = perform_calculations(
                project_data=input_data,
                texts=self.texts,
                errors_list=calculation_errors
            )
            
            # Add advanced calculations if requested
            if input_data.get('include_advanced_calculations', False):
                try:
                    # Add some advanced analyses
                    advanced_results = {}
                    
                    # Degradation analysis
                    advanced_results['degradation_analysis'] = self.advanced_calc.calculate_degradation_analysis(results)
                    
                    # CO2 analysis
                    advanced_results['co2_analysis'] = self.advanced_calc.calculate_detailed_co2_analysis(results)
                    
                    # Optimization suggestions
                    advanced_results['optimization_suggestions'] = self.advanced_calc.generate_optimization_suggestions(results, input_data)
                    
                    # Subsidy scenarios
                    advanced_results['subsidy_scenarios'] = self.advanced_calc.calculate_subsidy_scenarios(results)
                    
                    results['advanced_calculations'] = advanced_results
                    
                except Exception as e:
                    calculation_errors.append(f"Advanced calculations failed: {str(e)}")
            
            # Return successful result
            return {
                'success': True,
                'data': results,
                'errors': calculation_errors,
                'calculation_timestamp': self._get_timestamp(),
                'python_version': f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
                'database_available': DATABASE_AVAILABLE
            }
            
        except Exception as e:
            # Return error result
            error_trace = traceback.format_exc()
            return {
                'success': False,
                'error': str(e),
                'error_trace': error_trace,
                'message': 'Calculation failed with unexpected error'
            }
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()

def main():
    """Main entry point for command line usage"""
    parser = argparse.ArgumentParser(description='Python Bridge for Solar Calculator')
    parser.add_argument('--calculate', action='store_true', help='Perform calculation')
    parser.add_argument('--input-file', type=str, help='Input JSON file path')
    parser.add_argument('--output-file', type=str, help='Output JSON file path')
    parser.add_argument('--stdin', action='store_true', help='Read from stdin')
    parser.add_argument('--test', action='store_true', help='Run test calculation')
    
    args = parser.parse_args()
    
    bridge = PythonCalculationBridge()
    
    if args.test:
        # Run test calculation
        test_data = {
            'customer_data': {
                'income_tax_rate_percent': 25,
                'type': 'Privat'
            },
            'project_details': {
                'annual_consumption_kwh_yr': 4000,
                'consumption_heating_kwh_yr': 0,
                'electricity_price_kwh': 0.30,
                'module_quantity': 20,
                'selected_module_id': 1,
                'selected_inverter_id': 1,
                'include_storage': False,
                'roof_orientation': 'Süd',
                'roof_inclination_deg': 30,
                'latitude': 48.13,
                'longitude': 11.57,
                'feed_in_type': 'Teileinspeisung',
                'free_roof_area_sqm': 100,
                'building_height_gt_7m': False
            },
            'economic_data': {
                'simulation_period_years': 20,
                'electricity_price_increase_annual_percent': 3.0,
                'custom_costs_netto': 0
            },
            'include_advanced_calculations': True
        }
        
        result = bridge.calculate(test_data)
        print(json.dumps(result, indent=2, ensure_ascii=False, default=str))
        
    elif args.calculate:
        # Read input data
        if args.input_file:
            with open(args.input_file, 'r', encoding='utf-8') as f:
                input_data = json.load(f)
        elif args.stdin:
            input_data = json.load(sys.stdin)
        else:
            # Try to read from second command line argument
            if len(sys.argv) > 2:
                input_data = json.loads(sys.argv[2])
            else:
                print("ERROR: No input data provided", file=sys.stderr)
                sys.exit(1)
        
        # Perform calculation
        result = bridge.calculate(input_data)
        
        # Output result
        if args.output_file:
            with open(args.output_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False, default=str)
        else:
            print(json.dumps(result, indent=2, ensure_ascii=False, default=str))
    
    else:
        parser.print_help()

if __name__ == '__main__':
    main()