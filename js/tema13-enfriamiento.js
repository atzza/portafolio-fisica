// Tema 13: velocidad y presión del refrigerante a lo largo del circuito de un rack con enfriamiento líquido.
//   Continuidad: Q = A·v (y el caudal se reparte entre las bandejas)
//   Bernoulli (horizontal): P₁ + ½·ρ·v₁² = P₂ + ½·ρ·v₂²
//   Fricción (Darcy-Weisbach): ΔP = f·(L/D)·½·ρ·v², con f = 64/Re (laminar) o 0,316·Re^−0,25 (Blasius)
//   Energía: ΔT = P / (ρ·c·Q)
(function () {
  const RHO = 1020, CP = 3900, MU = 1.6e-3;  // agua con 25 % de propilenglicol (valores supuestos)
  const POT = 115000;                        // W, enfriamiento líquido de un rack GB200 NVL72 (QCT)
  const P0 = 250;                            // kPa manométricos a la salida de la CDU (supuesto)
  const BANDEJAS = 18;
  const CANALES = 40, LADO = 0.001;          // placa fría: 40 microcanales de 1 mm × 1 mm
  const el = (id) => document.getElementById(id);
  const cQ = el("frio-q"), cD = el("frio-d");

  function circuito() {
    const Q = +cQ.value / 60000;             // L/min → m³/s
    const Dm = +cD.value / 1000;             // mm → m
    const Qi = Q / BANDEJAS;
    const tubo = (nombre, corto, D, L, q) => ({ nombre, corto, D, L, q, A: (Math.PI * D * D) / 4, dh: D, tipo: `${Fis.n(D * 1000, 1)} mm` });
    const tramos = [
      tubo("Tubería de suministro (CDU → rack)", "Suministro", 0.05, 8, Q),
      tubo("Colector del rack (entrada)", "Colector", 0.04, 2, Q),
      tubo("Manguera de una bandeja (ida)", "Manguera", Dm, 1.5, Qi),
      { nombre: "Microcanales de la placa fría", corto: "Placa fría", D: LADO, dh: LADO, L: 0.08, q: Qi, A: CANALES * LADO * LADO, tipo: "40 × (1 × 1) mm" },
      tubo("Manguera de una bandeja (vuelta)", "Manguera", Dm, 1.5, Qi),
      tubo("Colector del rack (salida)", "Colector", 0.04, 2, Q),
      tubo("Tubería de retorno (rack → CDU)", "Retorno", 0.05, 8, Q),
    ];
    let P = P0, Pid = P0, vPrev = null;
    tramos.forEach((t) => {
      t.v = t.q / t.A;
      t.re = (RHO * t.v * t.dh) / MU;
      const f = t.re < 2300 ? 64 / t.re : 0.316 * t.re ** -0.25;
      t.dp = (f * (t.L / t.dh) * 0.5 * RHO * t.v * t.v) / 1000;   // kPa
      if (vPrev !== null) {
        const cambio = (0.5 * RHO * (vPrev * vPrev - t.v * t.v)) / 1000; // Bernoulli en el cambio de sección
        P += cambio; Pid += cambio;
      }
      t.pIni = P; t.pIdIni = Pid;
      P -= t.dp;
      t.pFin = P; t.pIdFin = Pid;
      vPrev = t.v;
    });
    return { Q, Qi, Dm, tramos, bomba: P0 - P };
  }

  function velocidad(c) {
    const caja = el("frio-velocidad");
    caja.innerHTML = "";
    const W = caja.clientWidth, H = 280, m = { i: 40, d: 14, s: 16, b: 42 };
    // Eje x logarítmico: las secciones van de 40 mm² a casi 2000 mm²
    const LX0 = Math.log10(10), LX1 = Math.log10(3000);
    const sx = (Amm) => m.i + ((Math.log10(Amm) - LX0) / (LX1 - LX0)) * (W - m.i - m.d);
    const VMAX = 8;
    const sy = (v) => H - m.b - (Math.min(v, VMAX) / VMAX) * (H - m.s - m.b);
    const svg = Fis.svg("svg", { width: W, height: H, role: "img", "aria-label": caja.dataset.titulo }, caja);
    for (let v = 0; v <= VMAX; v += 2) {
      Fis.svg("line", { class: v ? "rejilla" : "eje", x1: m.i, x2: W - m.d, y1: sy(v), y2: sy(v) }, svg);
      Fis.svg("text", { x: m.i - 6, y: sy(v) + 4, "text-anchor": "end" }, svg).textContent = v;
    }
    [10, 30, 100, 300, 1000, 3000].forEach((a) => {
      Fis.svg("line", { class: "rejilla", x1: sx(a), x2: sx(a), y1: m.s, y2: H - m.b }, svg);
      Fis.svg("text", { x: sx(a), y: H - m.b + 16, "text-anchor": "middle" }, svg).textContent = a;
    });
    Fis.svg("text", { x: (m.i + W - m.d) / 2, y: H - 4, "text-anchor": "middle" }, svg).textContent = "Área de la sección A (mm², escala logarítmica)";
    Fis.svg("text", { x: m.i, y: 10 }, svg).textContent = "Velocidad v (m/s)";
    // Hipérbolas v = Q/A para el caudal total y para el de una bandeja
    [[c.Q, "s1", "caudal total"], [c.Qi, "s1", "caudal de una bandeja"]].forEach(([q, cls, nombre], i) => {
      let pts = "";
      for (let j = 0; j <= 200; j++) {
        const Amm = 10 ** (LX0 + ((LX1 - LX0) * j) / 200);
        pts += `${sx(Amm).toFixed(1)},${sy(q / (Amm * 1e-6)).toFixed(1)} `;
      }
      Fis.svg("polyline", { class: "linea " + cls, points: pts, opacity: i ? 0.55 : 1, "stroke-dasharray": i ? "5 4" : "" }, svg);
      const Aet = i ? 22 : 420;
      const vEt = q / (Aet * 1e-6);
      if (vEt < VMAX) Fis.svg("text", { class: "etq", x: sx(Aet) + 6, y: sy(vEt) - 6 }, svg).textContent = W < 600 ? (i ? "Q bandeja" : "Q total") : `v = Q/A, ${nombre}`;
    });
    // Un punto por tramo distinto del circuito de ida
    c.tramos.slice(0, 4).forEach((t) => {
      const Amm = t.A * 1e6;
      const p = Fis.svg("circle", { class: "f2 anillo", cx: sx(Amm), cy: sy(t.v), r: 6 }, svg);
      Fis.svg("title", {}, p).textContent = `${t.nombre}: A = ${Fis.n(Amm, 0)} mm², v = ${Fis.n(t.v, 2)} m/s`;
      Fis.svg("text", { x: sx(Amm), y: sy(t.v) + 18, "text-anchor": "middle" }, svg).textContent = t.corto;
    });
  }

  function presion(c) {
    const caja = el("frio-presion");
    caja.innerHTML = "";
    const W = caja.clientWidth, H = 280, m = { i: 44, d: 12, s: 16, b: 42 };
    const n = c.tramos.length;
    const sx = (k) => m.i + (k / n) * (W - m.i - m.d);           // cada tramo ocupa el mismo ancho
    const pMin = Math.min(150, Math.floor((P0 - c.bomba - 10) / 50) * 50), pMax = 260;
    const sy = (p) => H - m.b - ((p - pMin) / (pMax - pMin)) * (H - m.s - m.b);
    const svg = Fis.svg("svg", { width: W, height: H, role: "img", "aria-label": caja.dataset.titulo }, caja);
    for (let p = pMin; p <= pMax; p += 25) {
      Fis.svg("line", { class: "rejilla", x1: m.i, x2: W - m.d, y1: sy(p), y2: sy(p) }, svg);
      Fis.svg("text", { x: m.i - 6, y: sy(p) + 4, "text-anchor": "end" }, svg).textContent = p;
    }
    c.tramos.forEach((t, k) => {
      Fis.svg("line", { class: "rejilla", x1: sx(k), x2: sx(k), y1: m.s, y2: H - m.b, "stroke-dasharray": "2 4" }, svg);
      if (W > 520 || k % 2 === 0) Fis.svg("text", { x: (sx(k) + sx(k + 1)) / 2, y: H - m.b + 16, "text-anchor": "middle" }, svg).textContent = t.corto;
    });
    Fis.svg("text", { x: (m.i + W - m.d) / 2, y: H - 4, "text-anchor": "middle" }, svg).textContent = "Tramo del circuito (de la salida de la CDU a su entrada)";
    Fis.svg("text", { x: m.i, y: 10 }, svg).textContent = "Presión manométrica (kPa)";
    let real = "", ideal = "";
    c.tramos.forEach((t, k) => {
      real += `${sx(k)},${sy(t.pIni)} ${sx(k + 1)},${sy(t.pFin)} `;
      ideal += `${sx(k)},${sy(t.pIdIni)} ${sx(k + 1)},${sy(t.pIdFin)} `;
    });
    Fis.svg("polyline", { class: "linea s2", points: ideal, "stroke-dasharray": "5 4" }, svg);
    Fis.svg("polyline", { class: "linea s1", points: real }, svg);
    const cursor = Fis.svg("line", { class: "cursor", y1: m.s, y2: H - m.b, x1: -10, x2: -10 }, svg);
    const zona = Fis.svg("rect", { x: m.i, y: 0, width: W - m.i - m.d, height: H, fill: "transparent" }, svg);
    const leer = (ev) => {
      const b = svg.getBoundingClientRect();
      const k = Math.max(0, Math.min(n - 1, Math.floor(((ev.clientX - b.left - m.i) / (W - m.i - m.d)) * n)));
      const t = c.tramos[k];
      cursor.setAttribute("x1", (sx(k) + sx(k + 1)) / 2); cursor.setAttribute("x2", (sx(k) + sx(k + 1)) / 2);
      el("frio-lectura").innerHTML = `<span>${t.nombre}</span><span>v = ${Fis.n(t.v, 2)} m/s</span>` +
        `<span>presión: ${Fis.n(t.pIni, 1)} → ${Fis.n(t.pFin, 1)} kPa</span><span>Re = ${Fis.n(t.re, 0)} (${t.re < 2300 ? "laminar" : "turbulento"})</span>`;
    };
    zona.addEventListener("pointermove", leer);
    zona.addEventListener("pointerdown", leer);
  }

  function tabla(c) {
    const cuerpo = document.querySelector("#frio-tabla tbody");
    cuerpo.innerHTML = "";
    c.tramos.forEach((t) => {
      const tr = document.createElement("tr");
      [t.nombre, t.tipo, Fis.n(t.L, 2), Fis.n(t.q * 60000, 1), Fis.n(t.v, 2), Fis.n(t.re, 0), Fis.n(t.dp, 2)].forEach((v, i) => {
        const td = document.createElement("td");
        td.textContent = v;
        if (!i) td.style.textAlign = "left";
        tr.append(td);
      });
      cuerpo.append(tr);
    });
  }

  function todo() {
    const c = circuito();
    el("frio-q-valor").textContent = `${cQ.value} L/min`;
    el("frio-d-valor").textContent = `${Fis.n(+cD.value, 1)} mm`;
    el("frio-qi").textContent = `${Fis.n(c.Qi * 60000, 1)} L/min`;
    el("frio-vm").textContent = `${Fis.n(c.tramos[2].v, 2)} m/s`;
    el("frio-bomba").textContent = `${Fis.n(c.bomba, 1)} kPa`;
    el("frio-dt").textContent = `${Fis.n(POT / (RHO * CP * c.Q), 1)} °C`;
    const dT = POT / (RHO * CP * c.Q), avisos = [];
    if (P0 - c.bomba < 0) avisos.push("La presión al final queda por debajo de la atmosférica: con 250 kPa la bomba no alcanza; habría que subir la presión de la CDU o usar mangueras más anchas.");
    if (dT > 20) avisos.push(`Con este caudal el refrigerante se calienta ${Fis.n(dT, 1)} °C, más que los 20 °C que hay entre la entrada máxima (45 °C) y el retorno máximo (65 °C): los chips se sobrecalentarían.`);
    el("frio-lectura").innerHTML = avisos.length
      ? avisos.map((a) => `<span>⚠ ${a}</span>`).join("")
      : "<span>Pasá el cursor por la gráfica de presión para ver cada tramo.</span>";
    velocidad(c);
    presion(c);
    tabla(c);
  }
  cQ.addEventListener("input", todo);
  cD.addEventListener("input", todo);
  let ancho = innerWidth, espera;
  addEventListener("resize", () => {
    if (innerWidth === ancho) return;
    ancho = innerWidth;
    clearTimeout(espera);
    espera = setTimeout(todo, 150);
  });
  todo();
})();
