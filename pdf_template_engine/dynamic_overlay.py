"""
pdf_template_engine/dynamic_overlay.py

Erzeugt Text-Overlays für sechs statische Template-Seiten anhand von Koordinaten
aus coords/seite1.yml … seite6.yml und verschmilzt sie mit den Dateien
pdf_templates_static/notext/nt_nt_01.pdf … nt_nt_06.pdf.
"""

from __future__ import annotations
import io
import re
from pathlib import Path
from typing import Dict, List, Any, Optional

from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import base64
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import Color
from pypdf import PdfReader, PdfWriter, Transformation
try:
    # PageObject ist optional (ältere pypdf-Versionen können es anders exportieren)
    from pypdf import PageObject  # type: ignore
except Exception:  # pragma: no cover
    PageObject = None  # type: ignore
from pathlib import Path

from .placeholders import PLACEHOLDER_MAPPING

# Optional: Admin-Settings laden, um Overlay-Verhalten dynamisch zu steuern
try:
    from database import load_admin_setting  # type: ignore
except Exception:  # Fallback, wenn DB nicht verfügbar ist (z. B. Tests)
    def load_admin_setting(key: str, default=None):  # type: ignore
        return default


def _to_bool(val: Any, default: bool = False) -> bool:
    try:
        if isinstance(val, bool):
            return val
        if isinstance(val, (int, float)):
            return bool(val)
        if isinstance(val, str):
            return val.strip().lower() in {"1", "true", "yes", "on"}
    except Exception:
        pass
    return default


def _draw_global_watermark(c: canvas.Canvas, page_width: float, page_height: float) -> None:
    """Zeichnet optional ein globales Wasserzeichen (aus Admin-Settings) diagonal über die Seite."""
    enabled = _to_bool(load_admin_setting("pdf_global_watermark_enabled", False), False)
    if not enabled:
        return
    text = load_admin_setting("pdf_global_watermark_text", "VERTRAULICH") or "VERTRAULICH"
    # Opazität optional (0..1); wenn nicht unterstützt, dann sehr helle Farbe
    opacity = load_admin_setting("pdf_global_watermark_opacity", 0.10)
    try:
        opacity = float(opacity)
    except Exception:
        opacity = 0.10

    c.saveState()
    try:
        # Sehr helle graublaue Farbe, ggf. mit Alpha
        col = Color(0.6, 0.65, 0.75)
        try:
            c.setFillAlpha(max(0.02, min(0.3, opacity)))  # ReportLab 3.6+
        except Exception:
            pass
        c.setFillColor(col)
        c.setFont("Helvetica-Bold", 64)
        # Diagonal drehen und wiederholt zeichnen
        c.translate(page_width * 0.15, page_height * 0.25)
        c.rotate(30)
        # Kacheln über die Seite verteilen
        step_x = 380
        step_y = 260
        for iy in range(0, int(page_height * 1.2), step_y):
            for ix in range(0, int(page_width * 1.2), step_x):
                try:
                    c.drawString(ix, iy, text)
                except Exception:
                    pass
    finally:
        c.restoreState()


def parse_coords_file(path: Path) -> List[Dict[str, Any]]:
    """Liest eine seiteX.yml und gibt eine Liste von Einträgen zurück.

    Einträge sind durch eine Zeile beginnend mit '-' oder '---' getrennt.
    Unterstützte Felder: Text, Position(x0,y0,x1,y1), Schriftart, Schriftgröße, Farbe
    """
    elements: List[Dict[str, Any]] = []
    current: Dict[str, Any] = {}
    if not path.exists():
        return elements
    with path.open(encoding="utf-8", errors="ignore") as f:
        for raw in f:
            line = raw.strip()
            if not line:
                continue
            # Einträge sind durch Linien aus '-' getrennt (z.B. "----------------------------------------")
            if (line.startswith("---") or (set(line) == {"-"} and len(line) >= 3)) and current:
                elements.append(current)
                current = {}
                continue
            if line.startswith("Text:"):
                current["text"] = line.split(":", 1)[1].strip()
            elif line.startswith("Position:"):
                # Zahlen extrahieren (auch mit Komma als Dezimaltrenner)
                nums = re.findall(r"[-+]?[0-9]*[\.,]?[0-9]+", line)
                nums = [n.replace(",", ".") for n in nums]
                if len(nums) >= 4:
                    current["position"] = tuple(float(n) for n in nums[:4])
            elif line.startswith("Schriftart:"):
                current["font"] = line.split(":", 1)[1].strip()
            elif line.lower().startswith("schriftgröße:") or line.lower().startswith("schriftgroesse:"):
                try:
                    val = line.split(":", 1)[1].strip().replace(",", ".")
                    current["font_size"] = float(val)
                except Exception:
                    current["font_size"] = 10.0
            elif line.startswith("Farbe:"):
                try:
                    val = line.split(":", 1)[1].strip()
                    if val.lower().startswith("0x"):
                        current["color"] = int(val, 16)
                    else:
                        current["color"] = int(val)
                except Exception:
                    current["color"] = 0
        if current:
            elements.append(current)
    return elements


def int_to_color(value: int) -> Color:
    """Wandelt einen Integer (0xRRGGBB) in reportlab Color um."""
    r = ((value >> 16) & 0xFF) / 255.0
    g = ((value >> 8) & 0xFF) / 255.0
    b = (value & 0xFF) / 255.0
    return Color(r, g, b)


def _draw_company_logo(c: canvas.Canvas, dynamic_data: Dict[str, str], page_width: float, page_height: float) -> None:
    """Zeichnet das Firmenlogo links oben, wenn company_logo_b64 vorhanden ist."""
    b64 = dynamic_data.get("company_logo_b64") or ""
    if not b64:
        return
    try:
        img_bytes = base64.b64decode(b64)
        img = ImageReader(io.BytesIO(img_bytes))
        # Zielfläche: max Breite/Höhe
        max_w, max_h = 120, 50  # Punkte
        c.saveState()
        # Hintergrund-Logo-Bereich abdecken (weißes Rechteck), um falsche Logos aus Templates zu maskieren
        try:
            c.setFillColorRGB(1, 1, 1)
            c.setStrokeColorRGB(1, 1, 1)
            c.rect(15, page_height - 20 - max_h - 5, max_w + 20, max_h + 10, stroke=0, fill=1)
        except Exception:
            pass
        c.drawImage(img, 20, page_height - 20 - max_h, width=max_w, height=max_h, preserveAspectRatio=True, mask='auto')
        c.restoreState()
    except Exception:
        return

def _parse_percent(value: str | float | int) -> float:
    try:
        if isinstance(value, (int, float)):
            return max(0.0, min(100.0, float(value)))
        s = str(value).strip().replace('%', '').replace(',', '.').replace(' ', '')
        return max(0.0, min(100.0, float(s)))
    except Exception:
        return 0.0

def _first_valid_percent(dynamic_data: Dict[str, str], keys: list[str]) -> float:
    for k in keys:
        if k in dynamic_data and dynamic_data.get(k) not in (None, ""):
            v = _parse_percent(dynamic_data.get(k))
            if v > 0:
                return v
    return 0.0

def _draw_donut(c: canvas.Canvas, cx: float, cy: float, pct: float, outer_r: float, inner_r: float,
                color_fg: Color, color_bg: Color) -> None:
    """Zeichnet einen Donut (Ring) mit farbigem Anteil pct in % (0-100)."""
    from reportlab.lib.colors import white
    # Voller Hintergrund-Ring
    c.saveState()
    # Hintergrund-Kreis (voll)
    c.setFillColor(color_bg)
    c.circle(cx, cy, outer_r, stroke=0, fill=1)
    # Vordergrund-Wedge (Anteil)
    extent = -360.0 * (pct / 100.0)  # im Uhrzeigersinn
    try:
        c.setFillColor(color_fg)
        c.wedge(cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r, 90, extent, stroke=0, fill=1)
    except Exception:
        pass
    # Loch stanzen
    c.setFillColor(white)
    c.circle(cx, cy, inner_r, stroke=0, fill=1)
    c.restoreState()

def _draw_page1_kpi_donuts(c: canvas.Canvas, dynamic_data: Dict[str, str], page_width: float, page_height: float) -> None:
    """Zeichnet zwei Donut-Diagramme (Unabhängigkeit, Eigenverbrauch) auf Seite 1 unterhalb der KPI-Überschrift."""
    # Werte aus dynamic_data ziehen (formatiert wie "54%" / "42%")
    # Robuste Ermittlung mit Fallback-Keys
    pct_autark = _first_valid_percent(dynamic_data, [
        "self_supply_rate_percent",
        "self_sufficiency_percent",
        "autarky_percent",
    ])
    pct_ev = _first_valid_percent(dynamic_data, [
        "self_consumption_percent",
        # Seite 2 abgeleiteter Wert (nur Zahl): direkter Deckungsanteil am Verbrauch
        "direct_cover_consumption_percent_number",
    ])
    if pct_autark <= 0 and pct_ev <= 0:
        return
    c.saveState()
    # Positionen grob unter "KENNZAHLEN IHRES PV-SYSTEMS" (YAML liegt bei ~494pt Höhe)
    # Position: weiter links und etwas nach unten, größer
    cy = 440.0
    left_cx = 95.0
    # Rechtsen Donut weiter nach rechts, zentriert über "EIGENVERBRAUCH"
    right_cx = 210.0
    outer_r = 40.0
    inner_r = 26.0
    # Farben (beide Donuts in Blau, Hintergrund hellgrau)
    from reportlab.lib.colors import Color
    bg = Color(0.85, 0.88, 0.90)
    fg_blue = Color(0.07, 0.34, 0.60)
    if pct_autark > 0:
        _draw_donut(c, left_cx, cy, pct_autark, outer_r, inner_r, fg_blue, bg)
        # Zentrumstext
        txt = dynamic_data.get("self_supply_rate_percent", f"{int(round(pct_autark))}%")
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(fg_blue)
        tw = c.stringWidth(txt, "Helvetica-Bold", 12)
        c.drawString(left_cx - tw/2, cy - 6, txt)
    if pct_ev > 0:
        _draw_donut(c, right_cx, cy, pct_ev, outer_r, inner_r, fg_blue, bg)
        txt = dynamic_data.get("self_consumption_percent", f"{int(round(pct_ev))}%")
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(fg_blue)
        tw = c.stringWidth(txt, "Helvetica-Bold", 12)
        c.drawString(right_cx - tw/2, cy - 6, txt)
    c.restoreState()

def _draw_top_right_triangle(c: canvas.Canvas, page_width: float, page_height: float, size: float = 36.0) -> None:
    """Zeichnet ein kleines, gefülltes Dreieck oben rechts (nur Seite 1).

    Farbe: identisch zum Blau der Fußzeilen/Charts (dezentes Dunkelblau).
    Das Dreieck wird vor den Texten gezeichnet, damit Beschriftungen nicht verdeckt werden.
    """
    # Akzentfarbe wie in Fußzeilen (#1B3670)
    accent = Color(27/255.0, 54/255.0, 112/255.0)
    c.saveState()
    try:
        # Punkte: Ecke oben rechts und zwei Katheten entlang der Ränder
        x0, y0 = page_width, page_height
        path = c.beginPath()
        path.moveTo(x0, y0)  # oben rechts
        path.lineTo(x0 - size, y0)  # nach links
        path.lineTo(x0, y0 - size)  # nach unten
        path.close()
        c.setFillColor(accent)
        c.setStrokeColor(accent)
        c.drawPath(path, stroke=0, fill=1)
    finally:
        c.restoreState()

def generate_overlay(coords_dir: Path, dynamic_data: Dict[str, str], total_pages: int = 6) -> bytes:
    """Erzeugt ein Overlay-PDF für sechs Seiten anhand der coords-Dateien.

    total_pages steuert die Fußzeilen-Nummerierung als "Seite x von XX".
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    page_width, page_height = A4
    for i in range(1, 7):
        yml_path = coords_dir / f"seite{i}.yml"
        elements = parse_coords_file(yml_path)
        # Firmenlogo für jede Seite zuerst zeichnen
        _draw_company_logo(c, dynamic_data, page_width, page_height)
        # Dreieck oben rechts auf allen Seiten 1-6
        _draw_top_right_triangle(c, page_width, page_height, size=36.0)
        # Zusätzliche Diagramme auf Seite 1
        if i == 1:
            _draw_page1_kpi_donuts(c, dynamic_data, page_width, page_height)
        # Produktbilder auf Seite 4 (optional aus Produkt-DB)
        if i == 4:
            _draw_page4_component_images(c, dynamic_data, page_width, page_height)
        # Keys, die innerhalb ihrer Box horizontal zentriert werden sollen (Seite 2 Pfeile)
        center_keys = {
            "direct_consumption_quote_prod_percent",
            "battery_use_quote_prod_percent",
            "feed_in_quote_prod_percent_number",
            "battery_cover_consumption_percent",
            "grid_consumption_rate_percent",
            "direct_cover_consumption_percent_number",
        }

        for elem in elements:
            text = elem.get("text", "")
            key = PLACEHOLDER_MAPPING.get(text)
            draw_text = dynamic_data.get(key, text) if key else text
            pos = elem.get("position", (0, 0, 0, 0))
            if len(pos) == 4:
                x0, y0, x1, y1 = pos
                draw_x = x0
                draw_y = page_height - y1  # Koordinaten invertieren (oben links)
            else:
                draw_x = 0
                draw_y = 0
            font_name = elem.get("font", "Helvetica")
            font_size = float(elem.get("font_size", 10.0))
            try:
                c.setFont(font_name, font_size)
            except Exception:
                c.setFont("Helvetica", font_size)
            color_int = int(elem.get("color", 0))
            c.setFillColor(int_to_color(color_int))
            # Auf Seite 1 die großen KPI-%-Texte (54%, 42%) nicht zusätzlich zeichnen,
            # da diese jetzt im Donut-Zentrum erscheinen sollen.
            if i == 1 and key in {"self_supply_rate_percent", "self_consumption_percent"}:
                continue
            # Dynamische Seitennummerierung unten rechts ersetzen
            # Heuristik: Originaleintrag ist die Ziffer der Seite ("1".."6") in Weiß nahe der Fußzeile rechts.
            try:
                raw = (text or "").strip()
                is_footer_num = (
                    not key and raw.isdigit() and int(raw) == i and
                    len(pos) == 4 and (pos[3] >= 780.0) and  # y1 nahe Fußzeile
                    (pos[0] >= 520.0) and  # rechtsbündiger Bereich
                    color_int == 0xFFFFFF
                )
            except Exception:
                is_footer_num = False

            if is_footer_num:
                page_num_text = f"Seite {i} von {int(total_pages) if isinstance(total_pages, (int, float)) else total_pages}"
                # Rechtsbündig an x1 ausrichten
                try:
                    c.drawRightString(x1, draw_y, page_num_text)
                except Exception:
                    c.drawString(draw_x, draw_y, page_num_text)
            else:
                if key in center_keys and len(pos) == 4:
                    try:
                        tw = c.stringWidth(str(draw_text), font_name, font_size)
                        mid_x = (x0 + x1) / 2.0
                        c.drawString(mid_x - tw / 2.0, draw_y, str(draw_text))
                    except Exception:
                        c.drawString(draw_x, draw_y, str(draw_text))
                else:
                    c.drawString(draw_x, draw_y, str(draw_text))
        c.showPage()
    c.save()
    return buffer.getvalue()


def _draw_page4_component_images(c: canvas.Canvas, dynamic_data: Dict[str, str], page_width: float, page_height: float) -> None:
    """Zeigt bis zu drei Produktbilder (Module, WR, Speicher) auf Seite 4 an.

    Erwartet Base64 in Keys: module_image_b64, inverter_image_b64, storage_image_b64.
    Positionierung: linke Spalte Bilderblöcke oberhalb/links der jeweiligen Textblöcke,
    sodass die bestehenden Textfelder (aus seite4.yml) nicht überlagert werden.
    """
    try:
        images = [
            (dynamic_data.get("module_image_b64"), {
                "x": 50.0, "y_top": page_height - 250.0, "max_w": 140.0, "max_h": 90.0
            }),
            (dynamic_data.get("inverter_image_b64"), {
                "x": 50.0, "y_top": page_height - 440.0, "max_w": 140.0, "max_h": 90.0
            }),
            (dynamic_data.get("storage_image_b64"), {
                "x": 50.0, "y_top": page_height - 630.0, "max_w": 140.0, "max_h": 90.0
            }),
        ]
        for img_b64, pos in images:
            if not img_b64:
                continue
            try:
                raw = base64.b64decode(img_b64)
                img = ImageReader(io.BytesIO(raw))
            except Exception:
                continue
            max_w = float(pos.get("max_w", 140.0))
            max_h = float(pos.get("max_h", 90.0))
            x = float(pos.get("x", 50.0))
            y_top = float(pos.get("y_top", page_height - 250.0))
            try:
                iw, ih = img.getSize()  # type: ignore
                scale = min(max_w / iw, max_h / ih)
                dw, dh = iw * scale, ih * scale
            except Exception:
                dw, dh = max_w, max_h
            y = y_top - dh
            c.saveState()
            try:
                c.drawImage(img, x, y, width=dw, height=dh, preserveAspectRatio=True, mask='auto')
            finally:
                c.restoreState()
    except Exception:
        return


def merge_with_background(overlay_bytes: bytes, bg_dir: Path) -> bytes:
    """Verschmilzt das Overlay mit nt_nt_01.pdf … nt_nt_06.pdf aus bg_dir."""
    overlay_reader = PdfReader(io.BytesIO(overlay_bytes))
    writer = PdfWriter()
    for page_num in range(1, 7):
        # Unterstütze beide Muster: nt_nt_XX.pdf und nt_XX.pdf
        candidates = [bg_dir / f"nt_nt_{page_num:02d}.pdf", bg_dir / f"nt_{page_num:02d}.pdf"]
        bg_page = None
        for cand in candidates:
            if cand.exists():
                try:
                    bg_reader = PdfReader(str(cand))
                    bg_page = bg_reader.pages[0]
                    break
                except Exception:
                    continue
        # Fallback: Wenn kein Hintergrund vorhanden/lesbar ist, füge nur Overlay-Seite ein
        ov_page = overlay_reader.pages[page_num - 1]

        # Optional: Auf Seite 1 zusätzlich eine weitere statische PDF (haus.pdf) mergen
        # Reihenfolge: Basis (nt_nt_01.pdf) -> haus.pdf -> Overlay
        extra_bg_page = None
        if page_num == 1:
            haus_path = bg_dir / "haus.pdf"
            if haus_path.exists():
                try:
                    haus_reader = PdfReader(str(haus_path))
                    extra_bg_page = haus_reader.pages[0]
                except Exception:
                    extra_bg_page = None

        # Falls kein Standard-Hintergrund vorhanden ist, aber haus.pdf existiert, nutze diese als Basis
        base_page = bg_page
        if base_page is None and extra_bg_page is not None:
            base_page = extra_bg_page
            extra_bg_page = None  # bereits als Basis gesetzt

        if base_page is not None:
            # Falls eine zusätzliche Haus-Seite vorhanden ist, zuerst darüber legen (skaliert 30% und zentriert)
            if extra_bg_page is not None:
                try:
                    bw = float(base_page.mediabox.width)
                    bh = float(base_page.mediabox.height)
                    hw = float(extra_bg_page.mediabox.width)
                    hh = float(extra_bg_page.mediabox.height)
                    scale = 0.3  # 70% kleiner
                    tx = (bw - hw * scale) / 2.0
                    ty = (bh - hh * scale) / 2.0
                    t = Transformation().scale(scale, scale).translate(tx, ty)
                    base_page.merge_transformed_page(extra_bg_page, t)
                except Exception:
                    # Fallback: unskaliert mergen
                    try:
                        base_page.merge_page(extra_bg_page)
                    except Exception:
                        pass
            # Overlay über den zusammengesetzten Hintergrund legen
            base_page.merge_page(ov_page)
            writer.add_page(base_page)
        else:
            # Kein Standard-Hintergrund: nur haus.pdf (falls vorhanden) als Basis, skaliert, dann Overlay
            if extra_bg_page is not None and PageObject is not None:
                try:
                    # Erzeuge leere Basis-Seite in A4 (oder Größe des Overlay)
                    try:
                        bw = float(ov_page.mediabox.width)
                        bh = float(ov_page.mediabox.height)
                    except Exception:
                        bw, bh = A4
                    base = PageObject.create_blank_page(width=bw, height=bh)  # type: ignore
                    hw = float(extra_bg_page.mediabox.width)
                    hh = float(extra_bg_page.mediabox.height)
                    scale = 0.3
                    tx = (bw - hw * scale) / 2.0
                    ty = (bh - hh * scale) / 2.0
                    t = Transformation().scale(scale, scale).translate(tx, ty)
                    base.merge_transformed_page(extra_bg_page, t)
                    base.merge_page(ov_page)
                    writer.add_page(base)
                    continue
                except Exception:
                    pass
            # Fallback: nur Overlay
            writer.add_page(ov_page)
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def append_additional_pages(base_pdf: bytes, additional_pdf: Optional[bytes]) -> bytes:
    """Hängt optional weitere Seiten hinten an."""
    if not additional_pdf:
        return base_pdf
    base_reader = PdfReader(io.BytesIO(base_pdf))
    add_reader = PdfReader(io.BytesIO(additional_pdf))
    writer = PdfWriter()
    for p in base_reader.pages:
        writer.add_page(p)
    for p in add_reader.pages:
        writer.add_page(p)
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def generate_custom_offer_pdf(
    coords_dir: Path,
    bg_dir: Path,
    dynamic_data: Dict[str, str],
    additional_pdf: Optional[bytes] = None,
) -> bytes:
    """End-to-End-Erzeugung des Angebots: Overlay -> Merge -> Optional anhängen."""
    # Bestimme Gesamtseiten für Fußzeile (6 + ggf. Zusatzseiten)
    total_pages = 6
    if additional_pdf:
        try:
            add_reader = PdfReader(io.BytesIO(additional_pdf))
            total_pages = 6 + len(add_reader.pages)
        except Exception:
            total_pages = 6

    overlay = generate_overlay(coords_dir, dynamic_data, total_pages=total_pages)
    fused = merge_with_background(overlay, bg_dir)
    return append_additional_pages(fused, additional_pdf)
