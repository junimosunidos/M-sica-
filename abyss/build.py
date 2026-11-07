#!/usr/bin/env python3
"""Genera abyss/dist/abyss-artifact.html: ABYSS en un solo archivo, listo para usarlo como
artefacto de Claude (todo el CSS y el JS van dentro; sin <html>/<head>/<body>, que añade Claude).

Uso:  python3 abyss/build.py
"""
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
SALIDA = RAIZ / 'dist' / 'abyss-artifact.html'
MODULOS = ['js/preguntas.js', 'js/motor.js', 'js/juego.js']  # en orden de dependencia


def js_sin_modulos(texto: str) -> str:
    texto = re.sub(r'^import\s[^;]*?;\s*$', '', texto, flags=re.M | re.S)
    texto = re.sub(r'^export\s+', '', texto, flags=re.M)
    return texto


def main() -> None:
    html = (RAIZ / 'index.html').read_text(encoding='utf-8')
    css = (RAIZ / 'css' / 'abyss.css').read_text(encoding='utf-8')
    js = '\n'.join(js_sin_modulos((RAIZ / m).read_text(encoding='utf-8')) for m in MODULOS)
    js, n = re.subn(r'const EN_ARTEFACTO = false;', 'const EN_ARTEFACTO = true;', js)
    assert n == 1, 'no se encontró EN_ARTEFACTO en juego.js'

    titulo = re.search(r'<title>.*?</title>', html, re.S).group(0)
    descripcion = re.search(r'<meta name="description"[^>]*>', html).group(0)
    cuerpo = re.search(r'<body>(.*)</body>', html, re.S).group(1)
    cuerpo = re.sub(r'\s*<script[^>]*src=[^>]*></script>', '', cuerpo)
    # El enlace de vuelta al reproductor solo tiene sentido dentro del repositorio.
    cuerpo = re.sub(r'<a [^>]*data-solo-repo[^>]*>.*?</a>', '<span class="volver"></span>', cuerpo)

    salida = f"""{titulo}
<meta name="claude:viewport-fit-sides" content="cover">
{descripcion}
<!-- Archivo generado por abyss/build.py a partir de abyss/. No lo edites a mano. -->
<style>
html, body {{ height: 100%; }}
{css}
</style>
{cuerpo.strip()}
<script type="module">
{js}
</script>
"""
    SALIDA.parent.mkdir(exist_ok=True)
    SALIDA.write_text(salida, encoding='utf-8')
    print(f'{SALIDA.relative_to(RAIZ.parent)} ({len(salida.encode()) // 1024} KB)')


if __name__ == '__main__':
    main()
