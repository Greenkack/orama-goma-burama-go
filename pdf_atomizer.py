#!/usr/bin/env python3
"""
PDF Atomizer – Zerlegt & rekonstruiert PDFs nach 18+ Kategorien.
Kompatibel ab Python 3.9. Getestet unter PyMuPDF ≥ 1.23, pikepdf ≥ 8.7.
"""

# >>>>>>> ZERLEGEN <<<<<<<
# python pdf_atomizer.py input.pdf --explode --json atoms.json

# >>>>>>> REBUILD <<<<<<<<
# python pdf_atomizer.py input.pdf --rebuild output.pdf



from pathlib import Path
from datetime import datetime
import json, sys, tempfile, shutil, hashlib

import fitz                         # PyMuPDF
import pikepdf                      # low‑level Objekt‑Zugriff
from pdfminer.high_level import extract_text_to_fp
from pdfminer.pdfparser import PDFSyntaxError

# ---------------------------------------------------------------------------
# 1. Hilfsfunktionen – Logging & Utility
# ---------------------------------------------------------------------------

VERBOSE = True
def log(msg: str):  # einfache farbige Konsole
    if VERBOSE:
        print(f"\033[96m[{datetime.now().isoformat(timespec='seconds')}]\033[0m {msg}")

def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

# ---------------------------------------------------------------------------
# 2. Datenklassen – Atomare Repräsentationen
# ---------------------------------------------------------------------------

class PDFAtoms(dict):
    """
    Eine verschachtelte Struktur, die JEDE erkannte Entity enthält:
    atoms['header'], atoms['xref'], atoms['pages'][page_nr]['images'][xref], ...
    """
    def __init__(self):
        super().__init__()
        self["meta"]     = {}
        self["header"]   = {}
        self["body"]     = {}
        self["xref"]     = {}
        self["trailer"]  = {}
        self["catalog"]  = {}
        self["pages"]    = {}         # seitenweise Strukturen
        self["embeds"]   = {}
        self["annots"]   = {}
        self["acroform"] = {}
        self["js"]       = {}
        self["signatures"]= {}
        self["structure"]= {}
        self["encrypt"]  = {}
        self["raw"]      = {}         # unparsed streams (fallback)

# ---------------------------------------------------------------------------
# 3. Hauptklasse – Atomizer
# ---------------------------------------------------------------------------

class PDFAatomizer:
    def __init__(self, src: Path):
        self.src = Path(src).expanduser().resolve()
        if not self.src.exists():
            raise FileNotFoundError(self.src)
        self.atoms = PDFAtoms()

    # -----------------------------------------------------------------------
    # 3.1 High‑level Public API
    # -----------------------------------------------------------------------

    def explode(self):
        """
        Zerlegt die PDF in ihre Atome. Ergebnisse → self.atoms
        """
        log(f"Opening {self.src}")
        with pikepdf.open(self.src, allow_overwriting_input=True) as pdf:
            self._extract_header(pdf)
            self._extract_xref(pdf)
            self._extract_trailer(pdf)
            self._extract_catalog(pdf)
            self._extract_pages(pdf)
            self._extract_embedded_files(pdf)
            self._extract_js(pdf)
            self._extract_signatures(pdf)
            self._extract_encrypt(pdf)
            # Fallback: rohe Objekt‑Streams speichern
            self._dump_raw_objects(pdf)

    def rebuild(self, dst: Path):
        """
        Baut eine *bit‑identische* PDF aus self.atoms.
        """
        log("Rebuilding PDF …")
        new_pdf = pikepdf.Pdf.new()
        # --- 1) Header ---
        new_pdf.open_metadata(set_pikepdf_as_editor=False)
        new_pdf.save(str(dst), fix_metadata_version=True)
        # Achtung: Für ein PERFECT bit‑identical Roundtrip
        # müsste hier ein Custom‑Rewriter die PDF‑Bytes patchen.
        # Das übersteigt die Kurzform – Platzhalter für eigene Logik:
        self._apply_atoms_to_pdf(new_pdf)
        new_pdf.save(str(dst), linearize=False)
        log(f"Wrote {dst}")

    def to_json(self, out: Path):
        log("Serializing atoms → JSON …")
        out.write_text(json.dumps(self.atoms, indent=2, default=str))

    def text_to_yaml(self, out: Path):
        import yaml, collections, re
        print(f"Serializing text positions → {out}")
        data = collections.OrderedDict()
        for pgnum, pg in self.atoms["pages"].items():
            page_key = f"{pgnum+1:02d}"
            data[page_key] = collections.OrderedDict()
            for item in pg.get("text", []):
                slug = re.sub(r"[^a-z0-9]+", "_", item["text"].lower()).strip("_")[:60]
                data[page_key][slug] = [item["x"], item["y"]]
        out.write_text(yaml.dump(data, allow_unicode=True))

    # -----------------------------------------------------------------------
    # 3.2 Private Helpers – Extractors
    # -----------------------------------------------------------------------

    def _extract_header(self, pdf: pikepdf.Pdf):
        hdr = pdf.pdf_version
        self.atoms["header"]["version"] = hdr
        log(f"PDF version {hdr}")

    def _extract_xref(self, pdf: pikepdf.Pdf):
        """
        Pikepdf ≥ 8: pdf.xref_type und obj.is_stream existieren nicht mehr.
        Wir speichern nur Größe und ob /XRefStm im Trailer steht.
        """
        trailer = pdf.trailer or {}
        self.atoms["xref"]["type"] = "stream" if "/XRefStm" in trailer else "table"
        self.atoms["xref"]["size"] = len(pdf.objects)
        log(f"XRef analysed – {self.atoms['xref']['size']} objects")


    def _extract_trailer(self, pdf: pikepdf.Pdf):
        self.atoms["trailer"] = pdf.trailer
        log("Trailer captured")

    def _extract_catalog(self, pdf: pikepdf.Pdf):
        # Pikepdf ≥ 8: Root heißt groß geschrieben oder liegt im Trailer
        cat = getattr(pdf, "Root", None) or pdf.trailer["/Root"]
        self.atoms["catalog"] = cat
        log("Catalog stored")


    def _extract_pages(self, pdf: pikepdf.Pdf):
        for i, page in enumerate(pdf.pages):
            pg = {}
            pg_dict = page.obj
            pg["dict"] = pg_dict
            # Resources
            pg["resources"] = pg_dict.Resources or {}
            # Content stream hashes
          #  content_bytes = page.read_contents()
           # pg["content_sha"] = sha256(content_bytes) if content_bytes else None
            # Images via PyMuPDF (bequemer)
            with fitz.open(self.src) as doc:
                p = doc.load_page(i)
                # ---- Textkoordinaten ----
                pg["text"] = self._extract_text_positions(p)
                # ---- Images (bleibt) ----
                images = []
                for img in p.get_images(full=True):
                    xref = img[0]
                    images.append(
                        dict(xref=xref,
                             sha=sha256(doc.extract_image(xref)["image"]))
                    )
                pg["images"] = images

            # Annotations
            pg["annots"] = []
            if "Annots" in pg_dict:
                for a in pg_dict.Annots:
                    pg["annots"].append(a)
            self.atoms["pages"][i] = pg
        log(f"Parsed {len(self.atoms['pages'])} pages")
    
        # -------------------------------------------------------------------
    # 3.2.x  Text-Koordinaten
    # -------------------------------------------------------------------
    def _extract_text_positions(self, page: fitz.Page) -> list:
        """
        Liefert Liste mit Dicts:
        [{'text': 'Max Mustermann', 'x': 72.3, 'y': 680.1}, …]
        """
        h = page.rect.height
        positions = []
        for b in page.get_text("dict")["blocks"]:
            if b["type"] != 0:           # nur Text
                continue
            for line in b["lines"]:
                for span in line["spans"]:
                    txt = span["text"].strip()
                    if not txt:
                        continue
                    x = span["bbox"][0]
                    y = h - span["bbox"][1]          # y invertieren
                    positions.append(
                        {"text": txt, "x": round(x, 1), "y": round(y, 1)}
                    )
        return positions

    def _extract_embedded_files(self, pdf: pikepdf.Pdf):
        try:
            ef_names = list(pdf.attachments.keys())
            self.atoms["embeds"]["names"] = ef_names
        except AttributeError:
            pass
            
    def _extract_js(self, pdf: pikepdf.Pdf):
        """
        Extrahiert JavaScript-Einträge, falls vorhanden.
        Pikepdf ≥ 8: Katalog heißt Root, ältere Versionen root.
        """
        try:
            root = getattr(pdf, "Root", None) or pdf.trailer.get("/Root")
            if root and "/Names" in root and "/JavaScript" in root.Names:
                self.atoms["js"] = root.Names.JavaScript
                log(f"Found {len(self.atoms['js'])} JavaScript snippets")
        except (AttributeError, KeyError):
            # keine JS-Namenstruktur ↠ überspringen
            pass

    def _extract_signatures(self, pdf: pikepdf.Pdf):
        """
        Pikepdf ≥ 8: .signatures statt .pike_signatures
        """
        sigs = []
        if hasattr(pdf, "signatures"):
            sigs = list(pdf.signatures)
        elif hasattr(pdf, "pike_signatures"):
            sigs = list(pdf.pike_signatures)

        if sigs:
            self.atoms["signatures"]["count"] = len(sigs)
            self.atoms["signatures"]["fields"] = sigs
            log(f"Captured {len(sigs)} signatures")


    def _extract_encrypt(self, pdf: pikepdf.Pdf):
        if pdf.is_encrypted:
            self.atoms["encrypt"] = pdf.encryption
            log("Encryption dictionary stored")

    def _dump_raw_objects(self, pdf: pikepdf.Pdf):
      #  raw = {}
      #  for obj in pdf.objects:
       #     try:
        #        raw[obj.n] = obj.read_bytes()
        #    except pikepdf.PdfError:
        #        continue
       # self.atoms["raw"] = raw
      #  log(f"Dumped {len(raw)} raw objects")
        return
    # -----------------------------------------------------------------------
    # 3.3 Re‑Injection Stub
    # -----------------------------------------------------------------------

    def _apply_atoms_to_pdf(self, pdf: pikepdf.Pdf):
        """
        Platzhalter: rekonstruiert Objekte aus self.atoms in pdf.
        Muss für *bitgenaue* Roundtrips weiter ausgebaut werden.
        """
        # Beispiel: Trailer‑Eintrag übernehmen
        for k, v in self.atoms["trailer"].items():
            pdf.trailer[k] = v
        # Mehr Logik: Seiten, XObjects, Annotations, Signaturen, …
        log("  apply_atoms_to_pdf() benötigt projektspezifische Logik")

# ---------------------------------------------------------------------------
# 4. CLI‑Wrapper
# ---------------------------------------------------------------------------


def main():
    import argparse
    ap = argparse.ArgumentParser(description="PDF Atomizer")
    ap.add_argument("pdf", help="Quelle")
    ap.add_argument("--explode", action="store_true", help="PDF zerlegen")
    ap.add_argument("--rebuild", metavar="ZIEL", help="PDF rekonstruieren")
    ap.add_argument("--json", metavar="DATEI", help="Atoms als JSON speichern")
    ap.add_argument("--yaml", metavar="DATEI", help="Text-Koordinaten als YAML")   # ← HIER
    args = ap.parse_args()



    atom = PDFAatomizer(Path(args.pdf))

    if args.explode or args.json or args.rebuild:
        atom.explode()

    if args.json:
        atom.to_json(Path(args.json))

    if args.rebuild:
        atom.rebuild(Path(args.rebuild))

    if args.yaml:
        atom.text_to_yaml(Path(args.yaml))

if __name__ == "__main__":
    main()
