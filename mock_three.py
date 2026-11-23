import re, pathlib
h = pathlib.Path('docs/index.html').read_text()
names = sorted(set(re.findall(r'THREE\.(\w+)', h)))
core = r'''
const handler = {
  get(t, p) { if (p === Symbol.toPrimitive) return () => 0; if (p === Symbol.iterator) return function* () {};
    if (p === 'then') return undefined; if (!(p in t.store)) t.store[p] = make(); return t.store[p]; },
  set(t, p, v) { t.store[p] = v; return true; },
  apply() { return make(); },
  construct(t, args) { const o = make(); if (t.isRenderer) o.domElement = document.createElement('canvas'); return o; },
};
export function make(isRenderer) { const f = function () {}; f.store = {}; f.isRenderer = !!isRenderer; return new Proxy(f, handler); }
'''
lines = [core]
for n in names:
    lines.append(f"export const {n} = make({'true' if n=='WebGLRenderer' else 'false'});")
pathlib.Path('test/three.mock.js').write_text('\n'.join(lines))
addon_names = sorted(set(re.findall(r'import \{ (\w+) \} from .three/addons', h)))
pathlib.Path('test/orbit.mock.js').write_text(core + '\n' + '\n'.join(f'export const {n} = make(false);' for n in addon_names))
print('addons:', addon_names)
print(len(names), 'exports')
