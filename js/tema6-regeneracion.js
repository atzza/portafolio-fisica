// Tema 6: balance de energía de un auto eléctrico en el ciclo urbano UDDS de la EPA.
// Las velocidades son datos reales; la energía la calculo con la física y un auto declarado.
const Regeneracion = (function () {
  const MPH = 0.44704, G = 9.81, J_A_WH = 1 / 3600;
  // Auto declarado (valores ilustrativos de un sedán eléctrico compacto, no de un modelo específico)
  const AUTO = { m: 1700, cda: 0.62, cr: 0.01, rho: 1.2, etaTraccion: 0.85, pMax: 50000, vMin: 5 / 3.6 };

  // Un paso por segundo con los datos de la EPA:
  //   F = m·a + ½·ρ·Cd·A·v² + Cr·m·g      P = F·v
  // Si P > 0 el motor empuja; si P < 0 hay energía de frenado que se puede recuperar.
  function calcular(etaRegen) {
    const filas = [];
    let ruedas = 0, aire = 0, rodadura = 0, freno = 0, recuperada = 0, salida = 0, metros = 0;
    for (let i = 0; i < UDDS.length; i++) {
      const v = (UDDS[i] / 10) * MPH;
      const vSig = i + 1 < UDDS.length ? (UDDS[i + 1] / 10) * MPH : v;
      const a = vSig - v, vm = (v + vSig) / 2; // paso de 1 s
      const fAire = 0.5 * AUTO.rho * AUTO.cda * vm * vm;
      const fRod = vm > 0 ? AUTO.cr * AUTO.m * G : 0;
      const p = (AUTO.m * a + fAire + fRod) * vm;
      aire += fAire * vm * J_A_WH;
      rodadura += fRod * vm * J_A_WH;
      metros += vm;
      if (p > 0) {
        ruedas += p * J_A_WH;
        salida += (p / AUTO.etaTraccion) * J_A_WH;
      } else if (p < 0) {
        const disponible = -p;
        freno += disponible * J_A_WH;
        // El motor solo recupera hasta su potencia máxima y por encima de una velocidad mínima
        if (vm > AUTO.vMin) recuperada += Math.min(disponible, AUTO.pMax) * etaRegen * J_A_WH;
      }
      filas.push({ t: i, kmh: v * 3.6, a, ruedas, aire, rodadura, freno, recuperada, salida, metros });
    }
    return filas;
  }
  return { calcular, AUTO, MPH, G };
})();

(function () {
  const control = document.getElementById("regen-eta");
  let datos, tActual = 400;
  const T_MAX = UDDS.length - 1;
  const cursores = [];

  function ejes(caja, H, m, yMax, marcas, conTiempo) {
    caja.innerHTML = "";
    const W = caja.clientWidth;
    const sx = (t) => m.i + (t / T_MAX) * (W - m.i - m.d);
    const sy = (v) => m.s + (1 - v / yMax) * (H - m.s - m.b);
    const svg = Fis.svg("svg", { width: W, height: H, role: "img", "aria-label": caja.dataset.titulo }, caja);
    marcas.forEach((v) => {
      Fis.svg("line", { class: v === 0 ? "eje" : "rejilla", x1: m.i, x2: W - m.d, y1: sy(v), y2: sy(v) }, svg);
      Fis.svg("text", { x: m.i - 8, y: sy(v) + 4, "text-anchor": "end" }, svg).textContent = v;
    });
    if (conTiempo) {
      for (let t = 0; t <= T_MAX; t += W < 500 ? 400 : 200) {
        Fis.svg("text", { x: sx(t), y: H - m.b + 16, "text-anchor": "middle" }, svg).textContent = t;
      }
      Fis.svg("text", { x: (m.i + W - m.d) / 2, y: H - 4, "text-anchor": "middle" }, svg).textContent = "Tiempo t (s)";
    }
    return { svg, sx, sy, W };
  }

  function sensible(g, H, m) {
    const zona = Fis.svg("rect", { x: m.i, y: 0, width: g.W - m.i - m.d, height: H, fill: "transparent" }, g.svg);
    const mover = (ev) => {
      const x = ev.clientX - g.svg.getBoundingClientRect().left;
      fijar(Math.max(0, Math.min(T_MAX, Math.round(((x - m.i) / (g.W - m.i - m.d)) * T_MAX))));
    };
    zona.addEventListener("pointermove", mover);
    zona.addEventListener("pointerdown", mover);
    cursores.push({ linea: Fis.svg("line", { class: "cursor", y1: m.s, y2: H - m.b }, g.svg), sx: g.sx });
  }

  function dibujar() {
    cursores.length = 0;
    datos = Regeneracion.calcular(+control.value / 100);
    const final = datos[T_MAX];

    // Velocidad: los datos de la EPA tal cual
    const cajaV = document.getElementById("graf-regen-v");
    const mV = { i: 44, d: 14, s: 12, b: 10 }, HV = 130;
    const gv = ejes(cajaV, HV, mV, 100, [0, 50, 100], false);
    Fis.svg("polyline", { class: "linea s3", points: datos.map((r) => gv.sx(r.t).toFixed(1) + "," + gv.sy(r.kmh).toFixed(1)).join(" ") }, gv.svg);
    sensible(gv, HV, mV);

    // Energía acumulada
    const cajaE = document.getElementById("graf-regen-e");
    const mE = { i: 44, d: 14, s: 14, b: 40 }, HE = 280;
    const yMax = Math.ceil(final.ruedas / 200) * 200;
    const marcas = [];
    for (let v = 0; v <= yMax; v += yMax > 1000 ? 400 : 200) marcas.push(v);
    const ge = ejes(cajaE, HE, mE, yMax, marcas, true);
    [["ruedas", "s1", "Entregada a las ruedas", -7], ["freno", "s2", "De frenado", 16], ["recuperada", "s4", "Recuperada", 16]].forEach(([k, cls, etq, dy]) => {
      Fis.svg("polyline", { class: "linea " + cls, points: datos.map((r) => ge.sx(r.t).toFixed(1) + "," + ge.sy(r[k]).toFixed(1)).join(" ") }, ge.svg);
      Fis.svg("text", { class: "etq", x: ge.sx(T_MAX) - 4, y: ge.sy(final[k]) + dy, "text-anchor": "end" }, ge.svg).textContent = etq;
    });
    const medio = datos[Math.round(T_MAX * 0.5)];
    Fis.svg("polyline", { class: "linea s3", "stroke-dasharray": "5 4", points: datos.map((r) => ge.sx(r.t).toFixed(1) + "," + ge.sy(r.aire + r.rodadura).toFixed(1)).join(" ") }, ge.svg);
    Fis.svg("text", { class: "etq", x: ge.sx(medio.t), y: ge.sy(medio.aire + medio.rodadura) - 9, "text-anchor": "middle" }, ge.svg).textContent = "Aire + rodadura";
    sensible(ge, HE, mE);

    resumen(final);
    fijar(tActual);
  }

  function resumen(f) {
    const km = f.metros / 1000;
    const sinRegen = f.salida / km, conRegen = (f.salida - f.recuperada) / km;
    const el = (id) => document.getElementById(id);
    el("regen-eta-valor").textContent = control.value + " %";
    el("regen-sin").textContent = Fis.n(sinRegen, 0) + " Wh/km";
    el("regen-con").textContent = Fis.n(conRegen, 0) + " Wh/km";
    el("regen-ahorro").textContent = Fis.n((1 - conRegen / sinRegen) * 100, 1) + " %";
    el("regen-fraccion").textContent = Fis.n((f.freno / f.ruedas) * 100, 0) + " %";
    const cierre = f.ruedas - f.aire - f.rodadura - f.freno;
    el("regen-balance").textContent =
      `Balance al final del ciclo (${Fis.n(km, 1)} km): a las ruedas ${Fis.n(f.ruedas, 0)} Wh = aire ${Fis.n(f.aire, 0)} Wh + rodadura ${Fis.n(f.rodadura, 0)} Wh + ` +
      `frenado ${Fis.n(f.freno, 0)} Wh (diferencia: ${Fis.n(Math.abs(cierre), 1)} Wh). De esos ${Fis.n(f.freno, 0)} Wh de frenado, ${Fis.n(f.recuperada, 0)} Wh vuelven a la batería y ${Fis.n(f.freno - f.recuperada, 0)} Wh se disipan como calor.`;
  }

  function fijar(t) {
    tActual = t;
    const r = datos[t];
    cursores.forEach((c) => { const x = c.sx(t); c.linea.setAttribute("x1", x); c.linea.setAttribute("x2", x); });
    document.getElementById("regen-lectura").innerHTML =
      `<span>t = ${t} s</span><span>v = ${Fis.n(r.kmh, 1)} km/h</span><span>a las ruedas: ${Fis.n(r.ruedas, 0)} Wh</span>` +
      `<span>frenado: ${Fis.n(r.freno, 0)} Wh</span><span>recuperada: ${Fis.n(r.recuperada, 0)} Wh</span>`;
  }

  control.addEventListener("input", dibujar);
  dibujar();
  let espera;
  window.addEventListener("resize", () => { clearTimeout(espera); espera = setTimeout(dibujar, 150); });
})();
