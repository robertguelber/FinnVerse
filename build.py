import pathlib
src = pathlib.Path(__file__).parent / 'src'
t = (src/'index.template.html').read_text()
for k, f in [('/*CALC*/', 'calc.js'), ('/*WORLD*/', 'world.js'), ('/*APP*/', 'app.js')]:
    t = t.replace(k, (src/f).read_text())
out = pathlib.Path(__file__).parent / 'docs' / 'index.html'
out.parent.mkdir(exist_ok=True); out.write_text(t)
print(out, len(t))
