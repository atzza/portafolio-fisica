// Tema 1: perfiles de posición, velocidad y aceleración de un dron de reparto.
// Los datos se generan aquí mismo a partir de la ruta declarada en la página.
(function () {
  // Ruta declarada: cada fase tiene duración (s) y aceleración constante (m/s²)
  const FASES = [
    { dur: 5,  ax: 2,  ay: 0,  nombre: "Acelera hacia el este" },
    { dur: 30, ax: 0,  ay: 0,  nombre: "Crucero hacia el este" },
    { dur: 5,  ax: -2, ay: 2,  nombre: "Giro al norte" },
    { dur: 25, ax: 0,  ay: 0,  nombre: "Crucero hacia el norte" },
    { dur: 5,  ax: 0,  ay: -2, nombre: "Frena sobre el punto de entrega" },
  ];
  const DT = 0.1;

  // Con aceleración constante en cada paso, estas ecuaciones son exactas:
  //   r = r0 + v·Δt + ½·a·Δt²      v = v0 + a·Δt
  function generar() {
    const d = [];
    let t = 0, x = 0, y = 0, vx = 0, vy = 0;
    for (const f of FASES) {
      const pasos = Math.round(f.dur / DT);
      for (let i = 0; i < pasos; i++) {
        d.push({ t, x, y, vx, vy, ax: f.ax, ay: f.ay, fase: f.nombre });
        x += vx * DT + 0.5 * f.ax * DT * DT;
        y += vy * DT + 0.5 * f.ay * DT * DT;
        vx += f.ax * DT; vy += f.ay * DT; t += DT;
      }
    }
    d.push({ t, x, y, vx, vy, ax: 0, ay: 0, fase: "Entrega" });
    return d;
  }
  const datos = generar();
  const T_MAX = datos[datos.length - 1].t;

  const PANELES = [
    { id: "graf-pos", a: "x", b: "y", min: 0, max: 400, marcas: [0, 200, 400], ea: ["x", 68, -8], eb: ["y", 68, 14] },
    { id: "graf-vel", a: "vx", b: "vy", min: 0, max: 10, marcas: [0, 5, 10], ea: ["vₓ", 20, -8], eb: ["vᵧ", 52, -8] },
    { id: "graf-ace", a: "ax", b: "ay", min: -2, max: 2, marcas: [-2, 0, 2], ea: ["aₓ", 2.5, -8], eb: ["aᵧ", 37.5, -8], ejeT: true },
  ];
  let tActual = 37.5;
  const cursores = [];

  function enT(t) { return datos[Math.max(0, Math.min(datos.length - 1, Math.round(t / DT)))]; }

  function dibujarPanel(p) {
    const caja = document.getElementById(p.id);
    caja.innerHTML = "";
    const W = caja.clientWidth, H = p.ejeT ? 176 : 150;
    const m = { i: 40, d: 14, s: 20, b: p.ejeT ? 40 : 14 };
    const sx = (t) => m.i + (t / T_MAX) * (W - m.i - m.d);
    const sy = (v) => m.s + (1 - (v - p.min) / (p.max - p.min)) * (H - m.s - m.b);
    const svg = Fis.svg("svg", { width: W, height: H, role: "img", "aria-label": caja.dataset.titulo }, caja);

    p.marcas.forEach((v) => {
      Fis.svg("line", { class: v === 0 ? "eje" : "rejilla", x1: m.i, x2: W - m.d, y1: sy(v), y2: sy(v) }, svg);
      Fis.svg("text", { x: m.i - 8, y: sy(v) + 4, "text-anchor": "end" }, svg).textContent = v;
    });
    if (p.ejeT) {
      for (let t = 0; t <= T_MAX; t += 10) {
        Fis.svg("text", { x: sx(t), y: H - m.b + 16, "text-anchor": "middle" }, svg).textContent = t;
      }
      Fis.svg("text", { x: (m.i + W - m.d) / 2, y: H - 4, "text-anchor": "middle" }, svg).textContent = "Tiempo t (s)";
    }
    [[p.a, "s1"], [p.b, "s2"]].forEach(([k, cls]) => {
      const pts = datos.map((r) => sx(r.t).toFixed(1) + "," + sy(r[k]).toFixed(1)).join(" ");
      Fis.svg("polyline", { class: "linea " + cls, points: pts }, svg);
    });
    [[p.a, p.ea], [p.b, p.eb]].forEach(([k, e]) => {
      const r = enT(e[1]);
      Fis.svg("text", { class: "etq", x: sx(r.t), y: sy(r[k]) + e[2], "text-anchor": "middle" }, svg).textContent = e[0];
    });
    const cur = Fis.svg("line", { class: "cursor", y1: m.s, y2: H - m.b }, svg);
    cursores.push({ linea: cur, sx });
    // Zona sensible: todo el panel
    const zona = Fis.svg("rect", { x: m.i, y: 0, width: W - m.i - m.d, height: H, fill: "transparent" }, svg);
    const mover = (ev) => {
      const r = svg.getBoundingClientRect();
      const t = ((ev.clientX - r.left - m.i) / (W - m.i - m.d)) * T_MAX;
      fijar(Math.max(0, Math.min(T_MAX, t)));
    };
    zona.addEventListener("pointermove", mover);
    zona.addEventListener("pointerdown", mover);
  }

  let puntoMapa, escalaMapa;
  function dibujarMapa() {
    const caja = document.getElementById("graf-ruta");
    caja.innerHTML = "";
    const W = caja.clientWidth;
    const m = { i: 44, d: 20, s: 22, b: 40 };
    const esc = (W - m.i - m.d) / 400;            // misma escala en x e y
    const H = m.s + 350 * esc + m.b;
    const sx = (x) => m.i + x * esc, sy = (y) => H - m.b - y * esc;
    escalaMapa = { sx, sy };
    const svg = Fis.svg("svg", { width: W, height: H, role: "img", "aria-label": caja.dataset.titulo }, caja);
    for (let v = 0; v <= 400; v += 100) {
      Fis.svg("line", { class: v ? "rejilla" : "eje", x1: sx(v), x2: sx(v), y1: sy(0), y2: sy(350) }, svg);
      Fis.svg("text", { x: sx(v), y: sy(0) + 16, "text-anchor": "middle" }, svg).textContent = v;
    }
    for (let v = 0; v <= 300; v += 100) {
      Fis.svg("line", { class: v ? "rejilla" : "eje", x1: sx(0), x2: sx(400), y1: sy(v), y2: sy(v) }, svg);
      Fis.svg("text", { x: sx(0) - 8, y: sy(v) + 4, "text-anchor": "end" }, svg).textContent = v;
    }
    Fis.svg("text", { x: sx(200), y: H - 6, "text-anchor": "middle" }, svg).textContent = "x: este (m)";
    Fis.svg("text", { x: sx(0) - 4, y: sy(350) + 4 }, svg).textContent = "y: norte (m)";
    const pts = datos.map((r) => sx(r.x).toFixed(1) + "," + sy(r.y).toFixed(1)).join(" ");
    Fis.svg("polyline", { class: "linea t-ruta", points: pts, stroke: "var(--tinta)" }, svg);
    Fis.svg("text", { class: "etq", x: sx(0) + 8, y: sy(0) - 10 }, svg).textContent = "Bodega (0, 0)";
    Fis.svg("text", { class: "etq", x: sx(350) - 8, y: sy(300) - 12, "text-anchor": "end" }, svg).textContent = "Entrega (350, 300)";
    Fis.svg("circle", { cx: sx(350), cy: sy(300), r: 4, fill: "var(--tinta)" }, svg);
    puntoMapa = Fis.svg("circle", { r: 7, fill: "var(--acento)", class: "anillo" }, svg);
  }

  function fijar(t) {
    tActual = t;
    const r = enT(t);
    cursores.forEach((c) => { c.linea.setAttribute("x1", c.sx(r.t)); c.linea.setAttribute("x2", c.sx(r.t)); });
    puntoMapa.setAttribute("cx", escalaMapa.sx(r.x));
    puntoMapa.setAttribute("cy", escalaMapa.sy(r.y));
    document.getElementById("dron-lectura").innerHTML =
      `<span>t = ${Fis.n(r.t, 1)} s</span><span>r = (${Fis.n(r.x, 1)}; ${Fis.n(r.y, 1)}) m</span>` +
      `<span>v = (${Fis.n(r.vx, 1)}; ${Fis.n(r.vy, 1)}) m/s</span>` +
      `<span>|v| = ${Fis.n(Math.hypot(r.vx, r.vy), 1)} m/s</span>` +
      `<span>a = (${Fis.n(r.ax, 0)}; ${Fis.n(r.ay, 0)}) m/s²</span><span>${r.fase}</span>`;
  }

  function tabla() {
    const cuerpo = document.querySelector("#dron-tabla tbody");
    for (let t = 0; t <= T_MAX + 0.01; t += 5) {
      const r = enT(t);
      const tr = document.createElement("tr");
      [[r.t, 0], [r.x, 1], [r.y, 1], [r.vx, 1], [r.vy, 1], [r.ax, 0], [r.ay, 0]].forEach(([v, dec]) => {
        const td = document.createElement("td"); td.textContent = Fis.n(v, dec); tr.appendChild(td);
      });
      cuerpo.appendChild(tr);
    }
  }

  function todo() {
    cursores.length = 0;
    dibujarMapa();
    PANELES.forEach(dibujarPanel);
    fijar(tActual);
  }
  tabla();
  todo();
  let espera;
  window.addEventListener("resize", () => { clearTimeout(espera); espera = setTimeout(todo, 150); });
})();
