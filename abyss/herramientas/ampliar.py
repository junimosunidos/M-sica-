#!/usr/bin/env python3
"""Genera abyss/js/extras.js a partir de las listas de abyss/datos/*.txt.

Las listas de preguntas.js las eligió una persona: son las respuestas típicas, con su zona.
Estas listas amplían cada pregunta con cientos de respuestas válidas más, y su zona se calcula
con la frecuencia real de la palabra en español (librería wordfreq: Wikipedia, subtítulos,
noticias, webs y redes sociales). Una palabra que no está en las listas manuales ya es menos
típica, así que nunca cae en la Zona Soleada:

    frecuencia Zipf >= 3.5  ->  Zona Crepuscular  (45 m)
    2.5 <= Zipf < 3.5       ->  Zona de Medianoche (85 m)
    Zipf < 2.5              ->  Zona Abisal       (120 m)

(Zipf 3 = la palabra aparece unas 1 vez por millón de palabras; cada punto es ×10.)

Formato de cada .txt: primera línea «# <texto exacto de la pregunta>»; después respuestas
separadas por comas o saltos de línea; las variantes de una misma respuesta van con «|».

Uso:  pip install wordfreq && python3 abyss/herramientas/ampliar.py
"""
import json
import re
from pathlib import Path

from wordfreq import zipf_frequency

RAIZ = Path(__file__).resolve().parent.parent
DATOS = RAIZ / 'datos'
SALIDA = RAIZ / 'js' / 'extras.js'
UMBRALES = [(3.5, 1), (2.5, 2), (float('-inf'), 3)]  # (zipf mínimo, índice de zona)


def zona(variantes):
    f = max(zipf_frequency(v, 'es') for v in variantes)
    return next(z for minimo, z in UMBRALES if f >= minimo), f


def main():
    preguntas = set(re.findall(r"q: '([^']+)'", (RAIZ / 'js' / 'preguntas.js').read_text(encoding='utf-8')))
    extras, resumen = {}, []
    for txt in sorted(DATOS.glob('*.txt')):
        lineas = txt.read_text(encoding='utf-8').splitlines()
        cabecera = lineas[0].lstrip('#').strip()
        if cabecera not in preguntas:
            raise SystemExit(f'{txt.name}: «{cabecera}» no coincide con ninguna pregunta de preguntas.js')
        vistas, zonas = set(), [[], [], [], []]
        for item in re.split(r'[,\n]', '\n'.join(lineas[1:])):
            variantes = [v.strip() for v in item.split('|') if v.strip()]
            if not variantes or variantes[0].lower() in vistas:
                continue
            vistas.add(variantes[0].lower())
            z, _ = zona(variantes)
            zonas[z].append('|'.join(variantes))
        extras[cabecera] = [', '.join(l) for l in zonas]
        resumen.append(f'{len(vistas):5d}  {cabecera}  (45 m: {len(zonas[1])}, 85 m: {len(zonas[2])}, 120 m: {len(zonas[3])})')

    cuerpo = ',\n'.join(f'  {json.dumps(q, ensure_ascii=False)}: {json.dumps(z, ensure_ascii=False)}' for q, z in extras.items())
    SALIDA.write_text(
        '// Archivo generado por abyss/herramientas/ampliar.py a partir de abyss/datos/*.txt. No lo edites a mano.\n'
        '// Respuestas válidas adicionales por pregunta, con la zona calculada por frecuencia de uso.\n'
        '// Mismo formato que el campo z de preguntas.js (la primera posición, Zona Soleada, va vacía).\n'
        f'export const EXTRAS = {{\n{cuerpo},\n}};\n',
        encoding='utf-8',
    )
    print('\n'.join(resumen))
    print(f'Total: {sum(int(r.split()[0]) for r in resumen)} respuestas en {len(extras)} preguntas → {SALIDA.relative_to(RAIZ.parent)}')


if __name__ == '__main__':
    main()
