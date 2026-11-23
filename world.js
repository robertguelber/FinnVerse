// ===================== FinnVerse — mundo 3D (casa) =====================
// Depende de THREE e OrbitControls (importados no topo do módulo final).

const STATUS_COR = { bom: '#34d399', atencao: '#fbbf24', critico: '#f43f5e' };
function corEstado(id, estado) {
  if (id === 'paineis' && estado === 'critico') return '#a78bfa'; // "em construção", não alarme
  return STATUS_COR[estado];
}

const PALETAS = {
  dia:        { top: '#4f9dff', bottom: '#d4ecff', sun: '#fff3dd', sunI: 3.2, hemiSky: '#d8ecff', hemiGround: '#7a6a8a', hemiI: 1.2, sunPos: [14, 24, 10], night: 0,
                stTop: '#5d6675', stBottom: '#9aa3ae' },
  entardecer: { top: '#4b3d8f', bottom: '#ffb38a', sun: '#ffb36b', sunI: 2.7, hemiSky: '#ffc8b0', hemiGround: '#4b3a6e', hemiI: 0.95, sunPos: [-18, 9, 14], night: 0.35,
                stTop: '#55506a', stBottom: '#8a7f8c' },
  noite:      { top: '#0c0d2e', bottom: '#352c6e', sun: '#b9c8ff', sunI: 1.5, hemiSky: '#7f8ae0', hemiGround: '#3a3266', hemiI: 0.95, sunPos: [-12, 20, 16], night: 1,
                stTop: '#171a28', stBottom: '#30334a' },
};

function createWorld(container, handlers) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  const mobile = Math.min(window.innerWidth, window.innerHeight) < 600;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd3e4f7, 30, 130);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  const HOME = { pos: new THREE.Vector3(16, 11, 18), target: new THREE.Vector3(0, 2.2, 0) };
  const HOME_RETRATO = new THREE.Vector3(19, 14, 15); // tela vertical: mais longe para caber o lote
  const homePos = () => (camera.aspect < 0.8 ? HOME_RETRATO : HOME.pos);
  camera.position.set(36, 26, 42); // começa longe: entrada cinematográfica

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(HOME.target);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 8; controls.maxDistance = 44;
  controls.minPolarAngle = 0.25; controls.maxPolarAngle = 1.42;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.45;
  controls.addEventListener('start', () => { tween = null; handlers.onUserMove && handlers.onUserMove(); });

  // ---------- helpers ----------
  const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...o });
  const pickables = [];
  function mesh(geo, mat, x, y, z, parent) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
    (parent || scene).add(m); return m;
  }
  const box = (w, h, d, mat, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
  // caixa com bordas arredondadas: tira o aspecto de "bloco" dos volumes principais
  const rbox = (w, h, d, mat, x, y, z, parent, r = 0.09) =>
    mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, Math.min(w, h, d) / 2 - 0.005)), mat, x, y, z, parent);
  function tag(obj, id) { obj.traverse(o => { if (o.isMesh) { o.userData.el = id; pickables.push(o); } }); }
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---------- luzes ----------
  const hemi = new THREE.HemisphereLight(0xd8ecff, 0x7a6a8a, 1.2); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3dd, 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 1, far: 90 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  scene.add(sun); scene.add(sun.target);

  // ---------- céu ----------
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#4f9dff') }, bottom: { value: new THREE.Color('#d4ecff') },
      sunDir: { value: new THREE.Vector3(0.5, 0.7, 0.4) }, sunCol: { value: new THREE.Color('#fff3dd') }, sunAmt: { value: 1 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vP,1.0); }',
    fragmentShader: [
      'uniform vec3 top; uniform vec3 bottom; uniform vec3 sunDir; uniform vec3 sunCol; uniform float sunAmt; varying vec3 vP;',
      'void main(){ vec3 d = normalize(vP); float t = clamp(d.y*1.8+0.12,0.0,1.0); vec3 c = mix(bottom,top,t);',
      '  float s = max(dot(d, normalize(sunDir)), 0.0);',
      '  c += sunCol * sunAmt * (pow(s, 900.0)*7.0 + pow(s, 24.0)*0.12);',
      '  gl_FragColor = vec4(c,1.0);',
      '#include <tonemapping_fragment>',
      '#include <colorspace_fragment>',
      '}'].join('\n'),
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), skyMat); scene.add(sky);

  // reflexos do céu: o ambiente da cena é gerado a partir do próprio céu (muda com hora e clima)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), skyMat));
  let envRT = null, envKey = '', envTimer = 0;
  function rebuildEnv() {
    try {
      const rt = pmrem.fromScene(envScene, 0.03); scene.environment = rt.texture; if (envRT) envRT.dispose(); envRT = rt;
      // reflexo sutil: realça volumes sem lavar as cores
      scene.traverse((o) => { if (o.isMesh && o.material && o.material.isMeshStandardMaterial && o.material.userData.envSet !== true) {
        o.material.envMapIntensity = o.material.metalness > 0.3 || o.material.roughness < 0.3 ? 0.8 : 0.22; o.material.userData.envSet = true; } });
    }
    catch (e) { console.warn('ambiente não gerado', e); }
  }

  const starGeo = new THREE.BufferGeometry();
  { const p = []; for (let i = 0; i < 600; i++) { const th = rnd(0, Math.PI * 2), ph = rnd(0.08, 1.4); p.push(140 * Math.cos(th) * Math.cos(ph), 140 * Math.sin(ph), 140 * Math.sin(th) * Math.cos(ph)); }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); }
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.9, transparent: true, opacity: 0, fog: false, depthWrite: false });
  scene.add(new THREE.Points(starGeo, starMat));

  // ---------- chão, rua e bairro ----------
  const ground = mesh(new THREE.CircleGeometry(200, 48), M('#57506e'), 0, 0, 0); ground.rotation.x = -Math.PI / 2; ground.castShadow = false;
  box(220, 0.04, 4.4, M('#2b2838'), 0, 0.02, 11.6).castShadow = false;
  for (let x = -100; x < 100; x += 3.2) box(1.4, 0.05, 0.14, M('#e9e2ff', { roughness: 0.6 }), x, 0.04, 11.6).castShadow = false;
  box(220, 0.12, 1.6, M('#a49cb8'), 0, 0.06, 8.9).castShadow = false;
  box(220, 0.12, 1.6, M('#a49cb8'), 0, 0.06, 14.4).castShadow = false;

  // texturas de janelas (fachada e luzes noturnas)
  function windowTextures() {
    const w = 64, h = 128;
    const a = document.createElement('canvas'); a.width = w; a.height = h;
    const b = document.createElement('canvas'); b.width = w; b.height = h;
    const ca = a.getContext('2d'), cb = b.getContext('2d');
    ca.fillStyle = '#8c86a8'; ca.fillRect(0, 0, w, h);
    cb.fillStyle = '#000'; cb.fillRect(0, 0, w, h);
    for (let y = 4; y < h - 4; y += 10) for (let x = 4; x < w - 4; x += 12) {
      const lit = Math.random() < 0.3;
      ca.fillStyle = lit ? '#ffe2a8' : '#3c3858'; ca.fillRect(x, y, 7, 6);
      if (lit) { cb.fillStyle = Math.random() < 0.8 ? '#ffcf86' : '#9fe7ff'; cb.fillRect(x, y, 7, 6); }
    }
    const ta = new THREE.CanvasTexture(a), tb = new THREE.CanvasTexture(b);
    ta.colorSpace = THREE.SRGBColorSpace; tb.colorSpace = THREE.SRGBColorSpace;
    for (const t of [ta, tb]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; }
    return [ta, tb];
  }
  const [facTex, litTex] = windowTextures();
  const cityMats = [];
  const cityColors = ['#4a4470', '#3b3d66', '#5a4a7a', '#43506f', '#6a5584'];
  for (let i = 0; i < 52; i++) {
    const ang = (i / 52) * Math.PI * 2 + rnd(-0.04, 0.04);
    const r = rnd(50, 88);
    const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
    if (z > 8 && Math.abs(x) < 40) continue; // deixa a vista frontal aberta para a rua
    const w = rnd(4, 8), d = rnd(4, 8), h = rnd(7, 30);
    const map = facTex.clone(), em = litTex.clone();
    map.repeat.set(Math.max(1, Math.round(w / 3)), Math.max(1, Math.round(h / 4)));
    em.repeat.copy(map.repeat);
    const mat = new THREE.MeshStandardMaterial({ color: cityColors[i % cityColors.length], map, emissive: '#ffffff', emissiveMap: em, emissiveIntensity: 0, roughness: 0.9 });
    cityMats.push(mat);
    const b = box(w, h, d, mat, x, h / 2, z); b.castShadow = false; b.lookAt(0, h / 2, 0);
  }

  // colinas no horizonte (silhuetas que a névoa tinge com a cor do céu)
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2, r = rnd(105, 125);
    const hill = mesh(new THREE.IcosahedronGeometry(1, 1), M(i % 2 ? '#4a3f6e' : '#3f4a6e'), Math.cos(a) * r, -4, Math.sin(a) * r);
    hill.scale.set(rnd(22, 34), rnd(10, 20), rnd(16, 26)); hill.castShadow = false; hill.receiveShadow = false;
  }

  // sombras de contato (imitam oclusão de ambiente: escurecem onde objetos tocam o chão)
  const blobTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
  })();
  function blob(x, z, sx, sz, op = 0.5, y = 0.262) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, color: '#1a1030', transparent: true, opacity: op, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.scale.set(sx, sz, 1); m.renderOrder = 1; scene.add(m); return m;
  }

  // ---------- lote / gramado ----------
  const lawnMat = M('#7fcf8a');
  rbox(22, 0.25, 17, lawnMat, 0, 0.125, 0, null, 0.1).castShadow = false;
  box(22.2, 0.18, 17.2, M('#8a7a9a'), 0, 0.09, 0).castShadow = false; // meio-fio
  const Y = 0.25; // topo do gramado

  // cerca (instanciada)
  {
    const pts = [];
    for (let x = -10.7; x <= 10.7; x += 0.55) { if (x < -0.4 || x > 2.0) pts.push([x, 8.2]); pts.push([x, -8.2]); }
    for (let z = -8.2; z <= 8.2; z += 0.55) { pts.push([-10.7, z]); pts.push([10.7, z]); }
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.7, 0.1), M('#f6f1ff'), pts.length);
    const o = new THREE.Object3D();
    pts.forEach((p, i) => { o.position.set(p[0], Y + 0.35, p[1]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.castShadow = true; scene.add(im);
  }

  // árvores decorativas
  function tree(x, z, s, c1, c2, parent) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
    mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.4, 6), M('#7a5240'), 0, 0.7, 0, g);
    mesh(new THREE.IcosahedronGeometry(1.15, 0), M(c1), 0, 2.0, 0, g);
    mesh(new THREE.IcosahedronGeometry(0.8, 0), M(c2), 0.25, 2.8, 0.1, g);
    (parent || scene).add(g); return g;
  }
  [[-13, -6, 1.2], [-14, 3, 1], [13.5, -5, 1.3], [14, 4, 0.9], [-8, -11, 1.1], [7, -11.5, 1.25], [-2, -12, 0.95], [18, -1, 1.1], [-18, -2, 1.2]]
    .forEach(([x, z, s], i) => tree(x, z, s, i % 2 ? '#4fb3a0' : '#62b878', i % 2 ? '#7fd6b8' : '#8ad08f'));

  // postes
  const bulbMat = M('#fff2c8', { emissive: '#ffcf86', emissiveIntensity: 0 });
  const lampLights = [];
  for (const x of [-4.5, 7.5]) {
    box(0.16, 4.2, 0.16, M('#3a3550'), x, 2.1, 9.6);
    box(1.0, 0.12, 0.16, M('#3a3550'), x - 0.42, 4.15, 9.6);
    mesh(new THREE.SphereGeometry(0.2, 8, 6), bulbMat, x - 0.85, 4.0, 9.6).castShadow = false;
    const pl = new THREE.PointLight('#ffcf86', 0, 13, 2); pl.position.set(x - 0.85, 3.8, 9.6); scene.add(pl); lampLights.push(pl);
  }

  // ---------- casa ----------
  const F = { x: -1.0, w: 10.6, d: 6.8, h: 0.5 };
  const Y0 = Y + F.h; // topo da fundação

  // FUNDAÇÃO (reserva de emergência)
  const fundGroup = new THREE.Group(); scene.add(fundGroup);
  const fundMat = M('#c9bfd6');
  rbox(F.w, F.h, F.d, fundMat, F.x, Y + F.h / 2, 0, fundGroup, 0.1);
  box(F.w + 0.2, 0.08, F.d + 0.2, M('#a99dbb'), F.x, Y0 - 0.02, 0, fundGroup);
  const crackMat = M('#2a2238');
  const cracks = [];
  [[-5.2, 0.1], [-3.4, -0.25], [-1.3, 0.3], [0.9, -0.2], [2.6, 0.25], [3.6, -0.1]].forEach(([x, rot], i) => {
    const c = new THREE.Group(); c.position.set(x, Y + F.h / 2, F.d / 2 + 0.01);
    box(0.05, 0.32, 0.03, crackMat, 0, 0.04, 0, c).rotation.z = rot;
    box(0.04, 0.18, 0.03, crackMat, 0.06, -0.1, 0, c).rotation.z = -rot * 1.6;
    c.visible = false; fundGroup.add(c); cracks.push(c);
  });
  tag(fundGroup, 'fundacao');

  // grupo da casa (pode inclinar quando a fundação está fraca)
  const house = new THREE.Group(); house.position.set(F.x, Y0, 0); scene.add(house);
  const H = (x) => x - F.x; // converte x do mundo para local da casa

  const wallMat = M('#f4e9de');
  const trimMat = M('#ffffff', { roughness: 0.6 });
  const accentMat = M('#7c5cd6');
  const glassMat = new THREE.MeshStandardMaterial({ color: '#9fd8ff', roughness: 0.15, metalness: 0.1, emissive: '#ffc277', emissiveIntensity: 0 });

  const B = { x: 0.8, w: 6.4, d: 6.0, h: 3.6 };
  const body = new THREE.Group(); house.add(body);
  rbox(B.w, B.h, B.d, wallMat, H(B.x), B.h / 2, 0, body, 0.12);
  box(B.w + 0.06, 0.22, B.d + 0.06, accentMat, H(B.x), 0.11, 0, body);
  // porta
  box(1.15, 2.1, 0.12, accentMat, H(B.x), 1.05, B.d / 2 + 0.04, body);
  box(1.35, 0.14, 0.18, trimMat, H(B.x), 2.15, B.d / 2 + 0.05, body);
  mesh(new THREE.SphereGeometry(0.06, 6, 4), M('#ffcc66', { metalness: 0.6, roughness: 0.3 }), H(B.x) + 0.38, 1.0, B.d / 2 + 0.13, body);
  // degrau
  box(1.8, 0.18, 0.7, M('#b8acc9'), H(B.x), -0.09 + 0.09, B.d / 2 + 0.38, body);
  function windowAt(x, y, z, w, h, axis, parent) {
    const g = new THREE.Group(); g.position.set(x, y, z); if (axis === 'x') g.rotation.y = Math.PI / 2;
    box(w + 0.2, h + 0.2, 0.08, trimMat, 0, 0, 0, g);
    box(w, h, 0.1, glassMat, 0, 0, 0.02, g);
    box(0.06, h, 0.12, trimMat, 0, 0, 0.03, g);
    box(w + 0.3, 0.1, 0.25, trimMat, 0, -h / 2 - 0.12, 0.1, g);
    parent.add(g); return g;
  }
  windowAt(H(B.x) - 1.9, 1.9, B.d / 2 + 0.03, 1.3, 1.1, 'z', body);
  windowAt(H(B.x) + 1.9, 1.9, B.d / 2 + 0.03, 1.3, 1.1, 'z', body);
  windowAt(H(B.x) + B.w / 2 + 0.03, 1.9, -1.2, 1.3, 1.1, 'x', body);
  windowAt(H(B.x) + B.w / 2 + 0.03, 1.9, 1.4, 1.0, 1.1, 'x', body);
  { const wb = windowAt(H(B.x) - 1.2, 1.9, -B.d / 2 - 0.03, 1.3, 1.1, 'z', body); wb.rotation.y = Math.PI; }
  { const wb = windowAt(H(B.x) + 1.6, 1.9, -B.d / 2 - 0.03, 1.3, 1.1, 'z', body); wb.rotation.y = Math.PI; }
  const porchBulb = new THREE.MeshStandardMaterial({ color: '#fff2c8', emissive: '#ffcf86', emissiveIntensity: 0 });
  mesh(new THREE.SphereGeometry(0.09, 10, 8), porchBulb, H(B.x) + 0.85, 2.4, B.d / 2 + 0.14, body).castShadow = false;
  const porch = new THREE.PointLight('#ffcf86', 0, 5, 2); porch.position.set(H(B.x), 1.9, B.d / 2 + 1.6); body.add(porch);
  tag(body, 'casa');

  // TELHADO (dívidas)
  const R = { rise: 2.3, half: B.w / 2 + 0.55, depth: B.d + 0.9, th: 0.22 };
  const slopeAng = Math.atan2(R.rise, R.half);
  const slopeLen = Math.hypot(R.half, R.rise) + 0.15;
  const roofGroup = new THREE.Group(); roofGroup.position.set(H(B.x), B.h, 0); house.add(roofGroup);
  // linha de baixo da água do telhado: y(x) = rise*(half - |x|)/half + 0.12 - (th/2)/cos(ângulo)
  const under = (x) => R.rise * (R.half - Math.abs(x)) / R.half + 0.12 - (R.th / 2) / Math.cos(Math.atan2(R.rise, R.half)) - 0.02;
  const gableShape = new THREE.Shape([
    new THREE.Vector2(-B.w / 2, 0), new THREE.Vector2(B.w / 2, 0), new THREE.Vector2(B.w / 2, under(B.w / 2)),
    new THREE.Vector2(0, under(0)), new THREE.Vector2(-B.w / 2, under(B.w / 2)),
  ]);
  const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: B.d, bevelEnabled: false }); gableGeo.translate(0, 0, -B.d / 2);
  mesh(gableGeo, wallMat, 0, 0, 0, roofGroup);
  const roofMat = M('#c76a7e');
  const slabs = [];
  for (const s of [1, -1]) {
    const slab = rbox(slopeLen, R.th, R.depth, roofMat, s * R.half / 2, R.rise / 2 + 0.12, 0, roofGroup, 0.07);
    slab.rotation.z = -s * slopeAng; slabs.push(slab);
  }
  box(0.35, 0.3, R.depth + 0.05, M('#9c4c62'), 0, R.rise + 0.12, 0, roofGroup);
  // acabamento: testeiras brancas nas beiradas e forro sob o beiral (fecha visualmente a junção)
  const fasciaMat = M('#fbf7ff', { roughness: 0.6 });
  const eaveY = 0.12 - Math.sin(Math.atan2(R.rise, R.half)) * 0.075 - 0.08;
  for (const sx of [1, -1]) {
    box(0.1, 0.2, R.depth + 0.04, fasciaMat, sx * (R.half + 0.06), eaveY, 0, roofGroup);
    box(R.half - B.w / 2 + 0.08, 0.05, R.depth - 0.1, M('#e6dcef'), sx * (B.w / 2 + (R.half - B.w / 2) / 2 + 0.02), -0.03, 0, roofGroup);
  }
  // testeiras inclinadas nas empenas (frente e fundos)
  for (const sz of [1, -1]) for (const sx of [1, -1]) {
    const b = box(slopeLen, 0.18, 0.08, fasciaMat, sx * R.half / 2, R.rise / 2 + 0.06, sz * (R.depth / 2 + 0.02), roofGroup);
    b.rotation.z = -sx * slopeAng;
  }
  // rachaduras e lona (estado das dívidas) — ficam no lado -x (o +x tem os painéis)
  const roofDamage = [];
  const leftSlab = slabs[1];
  [[-0.6, -1.8], [0.7, 0.4], [-0.2, 2.1], [0.9, -2.6]].forEach(([u, z]) => {
    const p = box(0.7, 0.03, 0.5, M('#4a2a3a'), u, R.th / 2 + 0.01, z, leftSlab); p.visible = false; roofDamage.push(p);
  });
  const tarp = box(1.8, 0.04, 1.6, M('#3fa3e0', { roughness: 0.5 }), 0.2, R.th / 2 + 0.03, -0.6, leftSlab); tarp.visible = false;
  tag(roofGroup, 'telhado');

  // PAINÉIS SOLARES (renda passiva) — sobre a água +x
  const panelGroup = new THREE.Group();
  panelGroup.position.copy(slabs[0].position); panelGroup.rotation.copy(slabs[0].rotation); roofGroup.add(panelGroup);
  const panelOn = new THREE.MeshStandardMaterial({ color: '#2a4fd6', roughness: 0.25, metalness: 0.5, emissive: '#3ad1ff', emissiveIntensity: 0.35 });
  const panelOff = new THREE.MeshStandardMaterial({ color: '#4a4a5a', roughness: 0.6, metalness: 0.2 });
  const panels = [];
  for (const u of [-0.95, 0.95]) for (const z of [-2.1, 0, 2.1]) {
    const pn = new THREE.Group(); pn.position.set(u, R.th / 2 + 0.07, z);
    box(1.7, 0.06, 1.85, M('#d9d6e6', { roughness: 0.4 }), 0, 0, 0, pn);
    const cell = box(1.56, 0.05, 1.7, panelOff, 0, 0.02, 0, pn);
    pn.userData.cell = cell; panelGroup.add(pn); panels.push(pn);
  }
  tag(panelGroup, 'paineis');

  // COZINHA (despesas variáveis) — anexo à esquerda
  const K = { x: -4.2, w: 3.6, d: 4.6, h: 2.8, z: 0.5 };
  const kitchen = new THREE.Group(); house.add(kitchen);
  rbox(K.w, K.h, K.d, M('#efdcef'), H(K.x), K.h / 2, K.z, kitchen, 0.12);
  rbox(K.w + 0.4, 0.26, K.d + 0.4, M('#5a4f8a'), H(K.x), K.h + 0.13, K.z, kitchen, 0.08);
  const kitchenGlass = new THREE.MeshStandardMaterial({ color: '#ffe3b0', roughness: 0.2, emissive: '#ffb56b', emissiveIntensity: 0.25 });
  { const g = new THREE.Group(); g.position.set(H(K.x), 1.5, K.z + K.d / 2 + 0.03);
    box(2.6, 1.5, 0.08, trimMat, 0, 0, 0, g); box(2.4, 1.3, 0.1, kitchenGlass, 0, 0, 0.02, g);
    box(0.06, 1.3, 0.12, trimMat, 0, 0, 0.03, g); kitchen.add(g); }
  // toldo listrado
  const awning = new THREE.Group(); awning.position.set(H(K.x), 2.45, K.z + K.d / 2 + 0.45); awning.rotation.x = 0.45;
  for (let i = 0; i < 6; i++) box(0.46, 0.05, 0.9, M(i % 2 ? '#ffffff' : '#ff8fb1'), -1.15 + i * 0.46, 0, 0, awning);
  kitchen.add(awning);
  rbox(0.65, 1.5, 0.65, M('#9c8fb8'), H(K.x) - 0.8, K.h + 0.75, K.z - 1.1, kitchen, 0.06);
  box(0.8, 0.14, 0.8, M('#7d6f9c'), H(K.x) - 0.8, K.h + 1.52, K.z - 1.1, kitchen);
  tag(kitchen, 'cozinha');
  const chimneyTop = new THREE.Vector3(K.x - 0.8, Y0 + K.h + 1.6, K.z - 1.1);
  const smokeMat = new THREE.MeshStandardMaterial({ color: '#f1eef8', roughness: 1, transparent: true, opacity: 0.8, flatShading: true });
  const smoke = [];
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), smokeMat.clone());
    s.userData.t = i / 10; s.visible = false; scene.add(s); smoke.push(s);
  }

  // PADRÃO DE ENERGIA (despesas fixas)
  const meter = new THREE.Group(); meter.position.set(6.2, Y, 6.6); scene.add(meter);
  rbox(0.9, 1.9, 0.55, M('#d8d0e4'), 0, 0.95, 0, meter, 0.08);
  box(0.7, 0.8, 0.12, M('#f6f3fb'), 0, 1.35, 0.31, meter);
  const dial = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 20), M('#ffffff', { roughness: 0.4 }), 0, 1.4, 0.39, meter); dial.rotation.x = Math.PI / 2;
  const needlePivot = new THREE.Group(); needlePivot.position.set(0, 1.32, 0.43); meter.add(needlePivot);
  box(0.035, 0.24, 0.02, M('#2a2238'), 0, 0.11, 0, needlePivot);
  const meterLamp = mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#34d399' }), 0.23, 1.68, 0.38, meter);
  box(0.08, 3.6, 0.08, M('#6f6690'), 0.3, 2.6, -0.2, meter);
  box(0.5, 0.06, 0.06, M('#6f6690'), 0.3, 4.3, -0.2, meter);
  tag(meter, 'medidor');

  // CAIXA D'ÁGUA (liquidez)
  const tank = new THREE.Group(); tank.position.set(7.6, Y, 1.0); scene.add(tank);
  const legMat = M('#6f6690');
  for (const [lx, lz] of [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]]) box(0.16, 4.2, 0.16, legMat, lx, 2.1, lz, tank);
  for (const y of [1.4, 2.8]) { box(1.66, 0.08, 0.08, legMat, 0, y, 0.75, tank); box(1.66, 0.08, 0.08, legMat, 0, y, -0.75, tank); box(0.08, 0.08, 1.66, legMat, 0.75, y, 0, tank); box(0.08, 0.08, 1.66, legMat, -0.75, y, 0, tank); }
  rbox(2.0, 0.16, 2.0, M('#5a4f8a'), 0, 4.28, 0, tank, 0.05);
  const TY = 4.36;
  const water = mesh(new THREE.CylinderGeometry(0.88, 0.88, 1.5, 24).translate(0, 0.75, 0),
    new THREE.MeshStandardMaterial({ color: '#2ad4c4', roughness: 0.2, emissive: '#0fa3a0', emissiveIntensity: 0.35 }), 0, TY + 0.03, 0, tank);
  const shellMat = new THREE.MeshStandardMaterial({ color: '#cfe9ff', roughness: 0.1, transparent: true, opacity: 0.28, depthWrite: false });
  const shell = mesh(new THREE.CylinderGeometry(0.96, 0.96, 1.6, 24, 1, true), shellMat, 0, TY + 0.8, 0, tank); shell.castShadow = false;
  for (const y of [0.05, 0.8, 1.58]) mesh(new THREE.TorusGeometry(0.97, 0.045, 6, 24), M('#7c5cd6'), 0, TY + y, 0, tank).rotation.x = Math.PI / 2;
  mesh(new THREE.ConeGeometry(1.08, 0.5, 24), M('#7c5cd6'), 0, TY + 1.85, 0, tank);
  for (let i = 0; i < 8; i++) box(0.5, 0.05, 0.05, legMat, 0, 0.4 + i * 0.5, 0.95, tank);
  tag(tank, 'caixa');

  // JARDIM (saldo do mês)
  const garden = new THREE.Group(); scene.add(garden);
  for (let i = 0; i < 7; i++) box(0.9, 0.08, 0.6, M('#d8cfe6'), 0.8 + (i % 2 ? 0.12 : -0.12), Y + 0.04, 4.0 + i * 0.62, garden).castShadow = false;
  const bedMat = M('#7a5a4a');
  box(4.6, 0.18, 1.4, bedMat, -3.2, Y + 0.09, 5.4, garden); box(4.6, 0.18, 1.4, bedMat, 4.6, Y + 0.09, 4.6, garden);
  const flowerCols = ['#ff8fb1', '#ffc857', '#b794ff', '#ff6f91', '#7ae0d0', '#ffd36e'];
  const flowers = [];
  const spots = [];
  for (let i = 0; i < 7; i++) spots.push([-5.1 + i * 0.62, 5.4 + (i % 2 ? 0.3 : -0.3)]);
  for (let i = 0; i < 7; i++) spots.push([2.7 + i * 0.62, 4.6 + (i % 2 ? -0.3 : 0.3)]);
  spots.forEach(([x, z], i) => {
    const f = new THREE.Group(); f.position.set(x, Y + 0.18, z);
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 4), M('#4f9a5f'), 0, 0.25, 0, f);
    mesh(new THREE.IcosahedronGeometry(0.17, 0), M(flowerCols[i % flowerCols.length]), 0, 0.55, 0, f);
    f.visible = false; f.userData.s = 0; garden.add(f); flowers.push(f);
  });
  const bushMat = M('#5cb87a');
  const bushes = [[-8.5, 2.5], [-8.8, -1.5], [9.0, 1.2], [-6.8, -5.8], [8.2, 5.6]].map(([x, z]) => mesh(new THREE.IcosahedronGeometry(0.85, 0), bushMat, x, Y + 0.5, z, garden));
  const gardenTree = tree(-7.2, 5.6, 1, '#5cbf7a', '#8fe09a', garden);
  tag(garden, 'jardim');

  // sombras de contato
  blob(F.x, 0, F.w + 3.5, F.d + 3.2, 0.55);
  blob(7.6, 1.0, 3.4, 3.4, 0.45); blob(6.2, 6.6, 2.0, 1.6, 0.4); blob(-7.2, 5.6, 3.4, 3.4, 0.4);
  [[-8.5, 2.5], [-8.8, -1.5], [9.0, 1.2], [-6.8, -5.8], [8.2, 5.6]].forEach(([x, z]) => blob(x, z, 2.4, 2.4, 0.35));

  // poças que aparecem com chuva (refletem o céu)
  const puddleMat = new THREE.MeshStandardMaterial({ color: '#4a5a8a', roughness: 0.04, metalness: 0.6, transparent: true, opacity: 0, depthWrite: false });
  const puddles = [[-2.5, 7.2, 1.6, 1.0, Y + 0.012], [4.2, 7.4, 1.2, 0.8, Y + 0.012], [-6.5, 11.2, 2.6, 1.2, 0.05], [3.5, 12.2, 3.2, 1.3, 0.05], [9.0, 10.8, 1.8, 0.9, 0.05], [-9.5, -3.5, 1.4, 1.0, Y + 0.012]]
    .map(([x, z, sx, sz, y]) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), puddleMat); m.rotation.x = -Math.PI / 2; m.position.set(x, y + 0.004, z); m.scale.set(sx, sz, 1); m.renderOrder = 2; scene.add(m); return m; });
  const roadMats = new Set();
  scene.traverse((o) => { if (o.isMesh && o.material && (o.material === lawnMat || (o.material.color && o.material.color.getHexString() === '2b2838'))) roadMats.add(o.material); });

  // partículas de conquista (quando um indicador melhora)
  const sparkCount = 60;
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sparkCount * 3), 3));
  const sparkMat = new THREE.PointsMaterial({ color: '#ffe08a', size: 0.22, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const sparks = new THREE.Points(sparkGeo, sparkMat); sparks.frustumCulled = false; scene.add(sparks);
  const sparkVel = new Float32Array(sparkCount * 3); let sparkLife = 0;
  function celebrate(id) {
    const p = PINS[id]; if (!p) return;
    const a = sparkGeo.attributes.position.array;
    for (let i = 0; i < sparkCount; i++) {
      a.set([p[0], p[1] - 0.5, p[2]], i * 3);
      const th = rnd(0, Math.PI * 2), up = rnd(1.5, 4.5), sp = rnd(1, 3);
      sparkVel.set([Math.cos(th) * sp, up, Math.sin(th) * sp], i * 3);
    }
    sparkGeo.attributes.position.needsUpdate = true; sparkLife = 1.4;
  }

  // ---------- nuvens, chuva, goteiras ----------
  const cloudMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true, transparent: true, opacity: 0.95 });
  const clouds = [];
  for (let i = 0; i < 15; i++) {
    const g = new THREE.Group();
    const n = 4 + (i % 3);
    for (let j = 0; j < n; j++) {
      const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), cloudMat);
      c.position.set(j * 1.3 - n * 0.65, rnd(-0.3, 0.4), rnd(-0.6, 0.6)); c.scale.set(rnd(1.2, 1.9), rnd(0.8, 1.2), rnd(1.0, 1.4));
      g.add(c);
    }
    g.userData = { ang: rnd(0, Math.PI * 2), r: rnd(5, 22), y: rnd(9, 12.5), sp: rnd(0.008, 0.02) }; g.scale.setScalar(rnd(0.8, 1.3));
    g.visible = false; scene.add(g); clouds.push(g);
  }

  const DROPS = 1500;
  const rainPos = new Float32Array(DROPS * 6);
  for (let i = 0; i < DROPS; i++) { const x = rnd(-26, 26), y = rnd(0, 26), z = rnd(-26, 26); rainPos.set([x, y, z, x - 0.05, y - 0.6, z], i * 6); }
  const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: '#b9cdf5', transparent: true, opacity: 0 });
  const rain = new THREE.LineSegments(rainGeo, rainMat); rain.frustumCulled = false; rain.visible = false; scene.add(rain);

  const dripMat = new THREE.MeshBasicMaterial({ color: '#7fd3ff' });
  const drips = [];
  for (let i = 0; i < 12; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), dripMat);
    const side = i % 2 ? 1 : -1;
    d.userData = { x: B.x + side * (R.half + 0.05), z: -2.8 + (i >> 1) * 1.1, t: Math.random() };
    d.visible = false; scene.add(d); drips.push(d);
  }

  // ---------- pinos de interação ----------
  const PINS = {
    fundacao: [F.x - 2.6, Y0 + 0.9, F.d / 2 + 0.6],
    casa: null,
    caixa: [7.6, Y + 7.2, 1.0],
    medidor: [6.2, Y + 2.9, 6.6],
    cozinha: [K.x - 0.8, Y0 + K.h + 3.0, K.z - 1.1],
    telhado: [B.x - 2.0, Y0 + B.h + R.rise + 1.0, -1.6],
    paineis: [B.x + 2.0, Y0 + B.h + R.rise + 0.6, 1.4],
    jardim: [-7.2, Y + 4.6, 5.6],
  };
  const FOCO = { // deslocamento da câmera em relação ao alvo
    fundacao: [3, 6, 14], caixa: [10, 3, 9], medidor: [7, 5, 11], cozinha: [-10, 6, 11],
    telhado: [-11, 8, 7], paineis: [12, 8, 8], jardim: [-6, 6, 12], casa: [10, 7, 13],
  };
  const pins = {};
  for (const id in PINS) {
    if (!PINS[id]) continue;
    const g = new THREE.Group(); g.position.set(...PINS[id]);
    // alfinete de mapa: cabeça + ponta + halo voltado para a câmera
    const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 1, toneMapped: false });
    const haloMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, toneMapped: false, depthWrite: false, side: THREE.DoubleSide });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 14), mat); head.position.y = 0.36;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.44, 18), mat); tip.rotation.x = Math.PI; tip.position.y = 0.08;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, toneMapped: false }));
    dot.position.set(0, 0.36, 0.2);
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.4, 36), haloMat); halo.position.y = 0.36;
    g.add(head, tip, dot, halo);
    for (const m of [head, tip, dot, halo]) { m.userData.el = id; pickables.push(m); }
    g.userData = { mat, haloMat, halo, dot, base: PINS[id][1], phase: rnd(0, 6) };
    scene.add(g); pins[id] = g;
  }

  // ---------- estado visual (alvos + valores atuais para transições suaves) ----------
  const target = { water: 0.5, tilt: 0, needle: 0, smoke: 0.4, panels: 0, flowers: 0, lush: 1, treeS: 1, cracks: 0, roofDmg: 0, tarp: false, drip: 0, w: 0, rain: 0 };
  const cur = { ...target };
  let selected = null, hoverId = null;
  const env = {
    top: new THREE.Color(), bottom: new THREE.Color(), sun: new THREE.Color(), hemiSky: new THREE.Color(), hemiGround: new THREE.Color(),
    sunI: 3, hemiI: 1.2, night: 0, sunPos: new THREE.Vector3(14, 24, 10),
  };
  const envT = { top: new THREE.Color(), bottom: new THREE.Color(), sun: new THREE.Color(), hemiSky: new THREE.Color(), hemiGround: new THREE.Color(),
    sunI: 3, hemiI: 1.2, night: 0, sunPos: new THREE.Vector3() };
  let tempo = 'entardecer';
  function computeEnvTarget() {
    const p = PALETAS[tempo], w = target.w;
    envT.top.set(p.top).lerp(new THREE.Color(p.stTop), w * 0.85);
    envT.bottom.set(p.bottom).lerp(new THREE.Color(p.stBottom), w * 0.85);
    envT.sun.set(p.sun); envT.hemiSky.set(p.hemiSky).lerp(new THREE.Color(p.stBottom), w * 0.5); envT.hemiGround.set(p.hemiGround);
    envT.sunI = p.sunI * (1 - 0.72 * w); envT.hemiI = p.hemiI * 0.8 * (1 - 0.2 * w); envT.night = p.night;
    envT.sunPos.set(...p.sunPos);
  }
  computeEnvTarget();
  for (const k of ['top', 'bottom', 'sun', 'hemiSky', 'hemiGround']) env[k].copy(envT[k]);
  env.sunI = envT.sunI; env.hemiI = envT.hemiI; env.night = envT.night; env.sunPos.copy(envT.sunPos);

  const lushCol = new THREE.Color('#7fcf8a'), dryCol = new THREE.Color('#c2ad72');
  const bushLush = new THREE.Color('#5cb87a'), bushDry = new THREE.Color('#9a8a5a');
  const roofBase = new THREE.Color('#c76a7e'), roofBad = new THREE.Color('#8a5a66');

  function applyState(calc) {
    const e = calc.elementos;
    target.water = Math.max(0.03, e.caixa.nivel);
    target.tilt = e.fundacao.estado === 'critico' ? 0.022 : 0;
    target.cracks = e.fundacao.estado === 'bom' ? 0 : e.fundacao.estado === 'atencao' ? 2 : cracks.length;
    target.needle = (0.5 - e.medidor.nivel) * 2.4; // +1.2 rad (esq) a -1.2 rad (dir)
    target.smoke = e.cozinha.nivel;
    target.roofDmg = e.telhado.estado === 'bom' ? 0 : e.telhado.estado === 'atencao' ? 2 : roofDamage.length;
    target.tarp = e.telhado.estado === 'critico';
    target.drip = e.telhado.estado === 'bom' ? 0 : e.telhado.estado === 'atencao' ? 0.4 : 1;
    target.panels = Math.round(e.paineis.nivel * panels.length);
    target.flowers = Math.round(e.jardim.nivel * flowers.length);
    target.lush = calc.saldoMensal < 0 ? 0 : 0.35 + 0.65 * e.jardim.nivel;
    target.treeS = 0.55 + 0.55 * Math.max(0, e.jardim.nivel);
    target.w = calc.clima.intensidade;
    target.rain = calc.clima.id === 'tempestade' ? 1 : calc.clima.id === 'chuva' ? 0.6 : 0;
    meterLamp.material.color.set(STATUS_COR[e.medidor.estado]);
    for (const id in pins) {
      const est = id === 'casa' ? 'bom' : e[id].estado;
      pins[id].userData.mat.color.set(corEstado(id, est));
      pins[id].userData.alerta = est !== 'bom' && id !== 'paineis';
    }
    computeEnvTarget();
  }

  function setTime(t) { if (PALETAS[t]) { tempo = t; computeEnvTarget(); } }

  // ---------- câmera ----------
  let tween = null;
  function flyTo(pos, tgt) {
    tween = { t: 0, p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: tgt.clone() };
  }
  function focus(id) {
    selected = id;
    if (!id) return;
    const p = PINS[id] ? new THREE.Vector3(...PINS[id]) : HOME.target.clone();
    const portrait = camera.aspect < 0.8;
    const tgt = p.clone(); tgt.y -= id === 'caixa' ? 2.2 : 1.2;
    const off = new THREE.Vector3(...(FOCO[id] || [8, 5, 10])).multiplyScalar(portrait ? 1.25 : 1);
    controls.autoRotate = false;
    flyTo(tgt.clone().add(off), tgt);
  }
  function resetView() { selected = null; flyTo(homePos(), HOME.target); }
  function setAutoRotate(b) { controls.autoRotate = b; }

  // ---------- interação ----------
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  function pick(clientX, clientY) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables, false);
    for (const h of hits) { const id = h.object.userData.el; if (id && id !== 'casa') return id; if (id === 'casa') return null; }
    return null;
  }
  let down = null;
  renderer.domElement.addEventListener('pointerdown', (ev) => { down = { x: ev.clientX, y: ev.clientY }; });
  renderer.domElement.addEventListener('pointerup', (ev) => {
    if (!down) return;
    const moved = Math.hypot(ev.clientX - down.x, ev.clientY - down.y); down = null;
    if (moved > 6) return;
    const id = pick(ev.clientX, ev.clientY);
    handlers.onPick && handlers.onPick(id);
  });
  renderer.domElement.addEventListener('pointermove', (ev) => {
    if (ev.pointerType !== 'mouse' || ev.buttons) return;
    const id = pick(ev.clientX, ev.clientY);
    if (id !== hoverId) { hoverId = id; renderer.domElement.style.cursor = id ? 'pointer' : 'grab'; handlers.onHover && handlers.onHover(id); }
  });
  renderer.domElement.addEventListener('pointerleave', () => { hoverId = null; handlers.onHover && handlers.onHover(null); });

  const tmpV = new THREE.Vector3();
  function screenPos(id) {
    if (!pins[id]) return null;
    tmpV.copy(pins[id].position).project(camera);
    const r = renderer.domElement.getBoundingClientRect();
    return { x: (tmpV.x * 0.5 + 0.5) * r.width, y: (-tmpV.y * 0.5 + 0.5) * r.height, visible: tmpV.z < 1 };
  }

  // ---------- pós-processamento (bloom, miniatura, cor e vinheta) ----------
  const GradeShader = {
    uniforms: { tDiffuse: { value: null }, sat: { value: 1.18 }, contrast: { value: 1.14 }, tint: { value: new THREE.Vector3(1.02, 1.0, 1.03) }, vig: { value: 0.22 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: [
      'uniform sampler2D tDiffuse; uniform float sat; uniform float contrast; uniform vec3 tint; uniform float vig; varying vec2 vUv;',
      'void main(){ vec4 c = texture2D(tDiffuse, vUv);',
      '  float l = dot(c.rgb, vec3(0.2126,0.7152,0.0722));',
      '  c.rgb = mix(vec3(l), c.rgb, sat);',
      '  c.rgb = max((c.rgb - 0.18) * contrast + 0.18, 0.0) * tint;',
      '  float d = distance(vUv, vec2(0.5));',
      '  c.rgb *= mix(1.0, smoothstep(0.95, 0.3, d), vig);',
      '  gl_FragColor = c; }'].join('\n'),
  };
  let composer = null, bloom = null, tiltH = null, tiltV = null;
  let quality = mobile ? 'media' : 'alta';
  try {
    const rt = new THREE.WebGLRenderTarget(256, 256, { type: THREE.HalfFloatType, samples: 4 }); // HDR + antisserrilhado
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.35, 0.4, 1.0); // só o que é luz forte (janelas, postes, sol) brilha
    composer.addPass(bloom);
    tiltH = new ShaderPass(HorizontalTiltShiftShader); tiltV = new ShaderPass(VerticalTiltShiftShader);
    composer.addPass(tiltH); composer.addPass(tiltV);
    composer.addPass(new ShaderPass(GradeShader));
    composer.addPass(new OutputPass());
  } catch (e) { console.warn('pós-processamento indisponível', e); composer = null; quality = 'baixa'; }

  function applyQuality() {
    const dpr = window.devicePixelRatio || 1;
    const pr = quality === 'alta' ? Math.min(dpr, 2) : quality === 'media' ? Math.min(dpr, 2) : Math.min(dpr, 1.5);
    renderer.setPixelRatio(pr);
    sun.shadow.mapSize.set(quality === 'alta' ? 2048 : 1024, quality === 'alta' ? 2048 : 1024);
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    if (composer) composer.setPixelRatio(pr);
    resize();
  }
  function setQuality(q) { if (q === quality) return; if (!composer && q !== 'baixa') return; quality = q; applyQuality(); }

  // ---------- redimensionamento ----------
  let bottomInset = 0; // px cobertos pelo painel no celular: desloca o enquadramento para cima
  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 46 : 38; // mais campo de visão em telas verticais
    if (bottomInset > 0) camera.setViewOffset(w, h, 0, bottomInset / 2, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    if (composer) {
      composer.setSize(w, h);
      const div = quality === 'alta' ? 1 : 2; // bloom em meia resolução no nível médio
      if (bloom) bloom.setSize(Math.round(w / div), Math.round(h / div));
      // faixa nítida do efeito miniatura acompanha o centro visível (acima da gaveta no celular)
      const focusY = 0.5 + bottomInset / (2 * h) - 0.02;
      const blur = w < 700 ? 0.55 : 1.1;
      if (tiltH) { tiltH.uniforms.h.value = blur / w; tiltH.uniforms.r.value = focusY; }
      if (tiltV) { tiltV.uniforms.v.value = blur / h; tiltV.uniforms.r.value = focusY; }
    }
  }
  function setBottomInset(px) { if (Math.abs(px - bottomInset) > 1) { bottomInset = px; resize(); } }
  new ResizeObserver(resize).observe(container); applyQuality();
  flyTo(homePos(), HOME.target); // entrada: a câmera desce até a casa

  // ---------- loop ----------
  const clock = new THREE.Clock();
  let flash = 0, nextFlash = 3, elapsed = 0, fpsAcc = 0, fpsN = 0, autoQuality = true;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05); elapsed += dt;
    const k = 1 - Math.exp(-dt * 3);

    if (tween) {
      tween.t = Math.min(1, tween.t + dt / 1.1); const e = ease(tween.t);
      camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.t0, tween.t1, e);
      if (tween.t >= 1) tween = null;
    }
    controls.update();

    // transições
    for (const key of ['water', 'tilt', 'needle', 'smoke', 'lush', 'treeS', 'w', 'rain', 'drip']) cur[key] += (target[key] - cur[key]) * k;
    water.scale.y = cur.water;
    house.rotation.z = cur.tilt;
    needlePivot.rotation.z = cur.needle + Math.sin(elapsed * 7) * 0.015;
    cracks.forEach((c, i) => { c.visible = i < target.cracks; });
    roofDamage.forEach((p, i) => { p.visible = i < target.roofDmg; });
    tarp.visible = target.tarp;
    roofMat.color.copy(roofBase).lerp(roofBad, target.roofDmg / roofDamage.length * 0.6);
    panels.forEach((p, i) => { p.userData.cell.material = i < target.panels ? panelOn : panelOff; });
    panelOn.emissiveIntensity = 0.25 + 0.15 * Math.sin(elapsed * 2);
    flowers.forEach((f, i) => {
      const want = i < target.flowers ? 1 : 0; f.userData.s += (want - f.userData.s) * k;
      f.visible = f.userData.s > 0.02; f.scale.setScalar(Math.max(0.001, f.userData.s));
    });
    lawnMat.color.copy(dryCol).lerp(lushCol, cur.lush);
    bushMat.color.copy(bushDry).lerp(bushLush, cur.lush);
    gardenTree.scale.setScalar(cur.treeS);

    // fumaça da chaminé
    const smokeN = Math.round(2 + cur.smoke * 8);
    smoke.forEach((s, i) => {
      s.userData.t += dt * (0.25 + cur.smoke * 0.25); if (s.userData.t > 1) s.userData.t -= 1;
      const t = s.userData.t; s.visible = i < smokeN;
      s.position.set(chimneyTop.x + Math.sin(t * 5 + i) * 0.3 + t * 0.8, chimneyTop.y + t * 3.2, chimneyTop.z + t * 0.4);
      s.scale.setScalar(0.4 + t * (0.8 + cur.smoke));
      s.material.opacity = (1 - t) * 0.75;
      s.material.color.set(cur.smoke > 0.8 ? '#cfc8d8' : '#f1eef8');
    });

    // goteiras
    drips.forEach((d, i) => {
      d.visible = cur.drip > 0.05 && i / drips.length < target.drip;
      if (!d.visible) return;
      d.userData.t += dt * 0.9; if (d.userData.t > 1) d.userData.t = 0;
      const t = d.userData.t; const top = Y0 + B.h + 0.05;
      d.position.set(d.userData.x, top - t * t * (top - Y), d.userData.z);
    });

    // clima
    computeEnvTarget();
    for (const c of ['top', 'bottom', 'sun', 'hemiSky', 'hemiGround']) env[c].lerp(envT[c], k);
    env.sunI += (envT.sunI - env.sunI) * k; env.hemiI += (envT.hemiI - env.hemiI) * k; env.night += (envT.night - env.night) * k;
    env.sunPos.lerp(envT.sunPos, k);

    if (cur.rain > 0.8 && target.rain === 1) {
      nextFlash -= dt;
      if (nextFlash <= 0) { flash = 1; nextFlash = rnd(2.5, 6.5); }
    }
    flash = Math.max(0, flash - dt * 6);
    const fl = flash > 0 ? (Math.sin(flash * 40) > 0 ? flash : flash * 0.3) : 0;

    skyMat.uniforms.top.value.copy(env.top); skyMat.uniforms.bottom.value.copy(env.bottom);
    if (fl) { skyMat.uniforms.top.value.lerp(new THREE.Color('#e8ecff'), fl * 0.6); skyMat.uniforms.bottom.value.lerp(new THREE.Color('#ffffff'), fl * 0.6); }
    scene.fog.color.copy(env.bottom);
    scene.fog.near = 45 - 20 * cur.w; scene.fog.far = 170 - 70 * cur.w;
    sun.color.copy(env.sun); sun.intensity = env.sunI; sun.position.copy(env.sunPos).normalize().multiplyScalar(40);
    skyMat.uniforms.sunDir.value.copy(env.sunPos).normalize();
    skyMat.uniforms.sunCol.value.copy(env.sun);
    skyMat.uniforms.sunAmt.value = (1 - cur.w * 0.95) * (0.55 + 0.45 * (1 - env.night));

    // reflexos: regenera o ambiente quando hora/clima mudam (depois que a transição assenta)
    const key = tempo + '|' + target.w.toFixed(2);
    if (key !== envKey) { envKey = key; envTimer = 1.4; }
    if (envTimer > 0) { envTimer -= dt; if (envTimer <= 0 || !envRT) { envTimer = 0; rebuildEnv(); } }

    // chão molhado e poças
    puddleMat.opacity = cur.rain * 0.75;
    puddles.forEach((p) => { p.visible = cur.rain > 0.03; });
    roadMats.forEach((m) => { m.roughness = 0.85 - 0.5 * cur.rain; });

    // partículas de conquista
    if (sparkLife > 0) {
      sparkLife -= dt; const a = sparkGeo.attributes.position.array;
      for (let i = 0; i < sparkCount; i++) {
        sparkVel[i * 3 + 1] -= 6 * dt;
        a[i * 3] += sparkVel[i * 3] * dt; a[i * 3 + 1] += sparkVel[i * 3 + 1] * dt; a[i * 3 + 2] += sparkVel[i * 3 + 2] * dt;
      }
      sparkGeo.attributes.position.needsUpdate = true;
      sparkMat.opacity = Math.max(0, Math.min(1, sparkLife));
    } else sparkMat.opacity = 0;
    hemi.color.copy(env.hemiSky); hemi.groundColor.copy(env.hemiGround); hemi.intensity = env.hemiI + fl * 4;
    renderer.toneMappingExposure = 1 + env.night * 0.3;

    const night = env.night;
    glassMat.emissiveIntensity = night * 1.4;
    kitchenGlass.emissiveIntensity = 0.25 + night * 1.6;
    bulbMat.emissiveIntensity = night > 0.3 ? night * 3 : 0;
    lampLights.forEach((l) => { l.intensity = night * 30; });
    const nightOnly = Math.max(0, (night - 0.6) / 0.4); // só acende de noite, não no entardecer
    porch.intensity = nightOnly * 2.5; porchBulb.emissiveIntensity = nightOnly * 0.9;
    cityMats.forEach((m) => { m.emissiveIntensity = night * 1.3; });
    starMat.opacity = Math.max(0, night - 0.4) * 1.6 * (1 - cur.w);

    // nuvens
    const nClouds = Math.round(3 + cur.w * 12);
    const cloudC = new THREE.Color('#ffffff').lerp(new THREE.Color('#6b7080'), cur.w * 0.85);
    if (night > 0.6) cloudC.lerp(new THREE.Color('#4a4f80'), 0.75);
    cloudMat.color.copy(cloudC);
    clouds.forEach((c, i) => {
      c.visible = i < nClouds;
      const u = c.userData; u.ang += u.sp * dt * (1 + cur.w * 2);
      c.position.set(Math.cos(u.ang) * u.r, u.y - cur.w * 3, Math.sin(u.ang) * u.r);
      c.rotation.y = -u.ang;
    });

    // chuva
    rain.visible = cur.rain > 0.03;
    if (rain.visible) {
      rainMat.opacity = cur.rain * 0.55;
      const speed = 22 * dt, a = rainGeo.attributes.position.array;
      for (let i = 0; i < DROPS; i++) {
        const o = i * 6; a[o + 1] -= speed; a[o + 4] -= speed;
        if (a[o + 4] < 0) { a[o + 1] += 26; a[o + 4] += 26; }
      }
      rainGeo.attributes.position.needsUpdate = true;
    }

    // pinos
    for (const id in pins) {
      const g = pins[id], u = g.userData;
      g.position.y = u.base + Math.sin(elapsed * 2 + u.phase) * 0.12;
      g.quaternion.copy(camera.quaternion); // sempre de frente para a câmera
      const pulse = (Math.sin(elapsed * 2.4 + u.phase) + 1) / 2;
      u.halo.scale.setScalar(1 + pulse * 0.35); u.haloMat.opacity = u.alerta ? 0.45 * (1 - pulse * 0.7) : 0;
      const isSel = selected === id, isHover = hoverId === id;
      const dist = THREE.MathUtils.clamp(camera.position.distanceTo(g.position) / 21, 0.5, 1.3); // tamanho constante na tela
      const s = dist * (isSel ? 0.7 : isHover ? 1.25 : 1);
      g.scale.setScalar(g.scale.x + (s - g.scale.x) * Math.min(1, k * 3));
      const op = isSel ? 0.55 : selected ? 0.35 : 1;
      u.mat.opacity = op; u.dot.material.opacity = op;
    }

    if (composer && quality !== 'baixa') {
      try { composer.render(dt); } catch (e) { console.warn(e); composer = null; quality = 'baixa'; applyQuality(); }
    } else renderer.render(scene, camera);

    // desempenho: se o aparelho não acompanhar, reduz a qualidade sozinho
    if (elapsed > 4 && autoQuality) {
      fpsAcc += dt; fpsN++;
      if (fpsAcc >= 3) {
        const fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0;
        const next = fps < 24 && quality === 'media' ? 'baixa' : fps < 32 && quality === 'alta' ? 'media' : null;
        if (next) { setQuality(next); handlers.onQuality && handlers.onQuality(next, true); }
      }
    }
    handlers.onFrame && handlers.onFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    applyState, setBottomInset, setTime, focus, resetView, setAutoRotate, screenPos, celebrate,
    setQuality: (q) => { autoQuality = false; setQuality(q); }, get quality() { return quality; }, get hasEffects() { return !!composer; },
    get autoRotate() { return controls.autoRotate; },
  };
}
