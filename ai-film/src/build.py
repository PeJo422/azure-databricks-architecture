"""Bygger index.html av page.html, core.js, klipp.js och typsnitten.

    python3 src/build.py [mapp med node_modules] [ut.html]
"""
import base64, pathlib, sys
src = pathlib.Path(__file__).parent
fonts_dir = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else src.parent
out = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else src.parent / "index.html"
faces = [
    ("Schibsted Grotesk", 500, "@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-500-normal.woff2"),
    ("Schibsted Grotesk", 800, "@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-800-normal.woff2"),
    ("Schibsted Grotesk", 900, "@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-900-normal.woff2"),
    ("JetBrains Mono", 500, "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2"),
]
css = []
for fam, w, p in faces:
    b = base64.b64encode((fonts_dir / "node_modules" / p).read_bytes()).decode()
    css.append('@font-face{font-family:"%s";font-style:normal;font-weight:%d;font-display:block;src:url(data:font/woff2;base64,%s) format("woff2")}' % (fam, w, b))
code = (src / "core.js").read_text(encoding="utf-8") + "\n" + (src / "klipp.js").read_text(encoding="utf-8")
page = (src / "page.html").read_text(encoding="utf-8").replace("/*FONTS*/", "\n".join(css)).replace("/*FILM*/", code)
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(page, encoding="utf-8")
print("skrev", out, len(page) // 1024, "kB")
