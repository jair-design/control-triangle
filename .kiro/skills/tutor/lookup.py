#!/usr/bin/env python3
"""
Búsqueda de resultado esperado por código de prompt, para el skill `tutor`.

Dado un código (<CURSO>-M##-G##-I##-P<LETRA>[-<SUB>], p. ej. CT-M03-G03-I01-PA), recorre
los JSON compilados en `courses/<code>/data/` y devuelve el **resultado esperado** de ese prompt.

Uso:
    python3 .kiro/skills/tutor/lookup.py CT-M03-G03-I01-PA

Salida:
- Si el código existe y tiene resultado esperado: imprime ese texto (código de salida 0).
- Si el código existe pero no tiene resultado esperado (vacío): imprime una nota y
  código de salida 0 (no hay referencia; responder normalmente).
- Si el código no existe: imprime aviso a stderr y código de salida 1.
"""

import json
import re
import sys
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent
# Catálogo de cursos: una carpeta por curso con su ficha (index.md) y su data/.
COURSES_DIR = SKILL_DIR / "courses"
CODE_RE = re.compile(r"^[A-Z][A-Z0-9]+-M\d{2}-G\d{2}-I\d{2}-P[A-Z](?:-[A-Z])?$")


def find(code):
    """Devuelve (encontrado, valor). valor puede ser '' si el prompt no tiene RE."""
    # Índices por curso: courses/<code>/data/<módulo>/<guion>.json
    for json_file in sorted(COURSES_DIR.glob("*/data/*/*.json")):
        data = json.loads(json_file.read_text(encoding="utf-8"))
        if code in data:
            return True, data[code]
    return False, None


def main(argv):
    if len(argv) != 2 or not CODE_RE.match(argv[1]):
        print("Uso: python3 lookup.py <CURSO>-M##-G##-I##-P<LETRA>[-<SUB>]", file=sys.stderr)
        return 2

    code = argv[1]
    found, value = find(code)
    if not found:
        print(f"[tutor] Código no encontrado: {code}", file=sys.stderr)
        return 1
    if not value:
        print(f"[tutor] {code}: sin resultado esperado (responder normalmente).")
        return 0
    print(value)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
