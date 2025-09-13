#!/usr/bin/env python3
# de.py - German localization module
"""
German localization module for Solar Calculator
Provides German text strings for the application
"""

import json
import os
from pathlib import Path

# Load German texts from JSON file
def load_texts():
    """Load German texts from de.json file"""
    current_dir = Path(__file__).parent
    json_file = current_dir / "de.json"
    
    if json_file.exists():
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"ERROR loading de.json: {e}")
            return {}
    else:
        print(f"WARNING: de.json not found at {json_file}")
        return {}

# Load texts on module import
TEXTS = load_texts()

def get(key: str, default: str = None) -> str:
    """Get German text by key"""
    return TEXTS.get(key, default or key)

def texts():
    """Get all texts dictionary"""
    return TEXTS

# Common German error messages
ERROR_MESSAGES = {
    "module_not_found": "Modul nicht gefunden",
    "import_error": "Import-Fehler",
    "calculation_error": "Berechnungsfehler",
    "database_error": "Datenbankfehler",
    "file_not_found": "Datei nicht gefunden",
    "invalid_input": "Ungültige Eingabe",
    "network_error": "Netzwerkfehler",
    "permission_error": "Berechtigungsfehler"
}

def get_error(key: str) -> str:
    """Get German error message by key"""
    return ERROR_MESSAGES.get(key, f"Unbekannter Fehler: {key}")