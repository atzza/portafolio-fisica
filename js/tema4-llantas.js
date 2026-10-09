// Tema 4: dos gráficas con datos reales sobre el agarre de una llanta de carreras.
(function () {
  const LBF_A_N = 4.44822;
  // Datos reales: llanta de carreras, Milliken y Milliken, Race Car Vehicle Dynamics, figura 2.9
  // (carga vertical en lbf y coeficiente máximo Fy/Fz), reproducidos en Wikipedia.
  const MEDIDO = [
    { lbf: 900, mu: 1.10 },
    { lbf: 1350, mu: 1.08 },
    { lbf: 1800, mu: 0.97 },
  ].map((d) => ({ ...d, fz: (d.lbf * LBF_A_N) / 1000, fy: (d.lbf * LBF_A_N * d.mu) / 1000 })); // kN
  const MU_SIMPLE = MEDIDO[0].mu; // modelo simple: el coeficiente de la carga más baja se queda fijo

  // Datos reales: ventanas de trabajo de los compuestos Pirelli de F1, comunicado del 18 de febrero de 2019
  const VENTANAS = [
    { c: "C1 (más duro)", lo: 110, hi: 140 },
    { c: "C2", lo: 110, hi: 135 },
    { c: "C3", lo: 105, hi: 135 },
    { c: "C4", lo: 90, hi: 120 },
    { c: "C5 (más blando)", lo: 85, hi: 115 },
  ];

  function carga() {
    const caja = document.getElementById("graf-carga");
    caja.innerHTML = "";
    // Los ejes no empiezan en cero para que se note la separación entre las dos líneas
    const X0 = 3, X1 = 9, Y0 = 4, Y1 = 10;
    const W = caja.clientWidth, H = 320, m = { i: 46, d: 18, s: 16, b: 44 };
    const sx = (v) => m.i + ((v - X0) / (X1 - X0)) * (W - m.i - m.d);
    const sy = (v) => H - m.b - ((v - Y0) / (Y1 - Y0)) * (H - m.s - m.b);
    const svg = Fis.svg("svg", { width: W, height: H, role: "img", "aria-label": caja.dataset.titulo }, caja);
    for (let v = Y0; v <= Y1; v += 2) {
      Fis.svg("line", { class: "rejilla", x1: m.i, x2: W - m.d, y1: sy(v), y2: sy(v) }, svg);
      Fis.svg("text", { x: m.i - 8, y: sy(v) + 4, "text-anchor": "end" }, svg).textContent = v;
    }
    for (let v = 4; v <= 8; v += 2) Fis.svg("text", { x: sx(v), y: H - m.b + 16, "text-anchor": "middle" }, svg).textContent = v;
    Fis.svg("text", { x: (m.i + W - m.d) / 2, y: H - 6, "text-anchor": "middle" }, svg).textContent = "Carga vertical Fz (kN)";
    // Modelo simple: Fy = μ·Fz con μ fijo
    Fis.svg("line", { class: "linea s2", "stroke-dasharray": "6 5", x1: sx(Y0 / MU_SIMPLE), y1: sy(Y0), x2: sx(X1), y2: sy(X1 * MU_SIMPLE) }, svg);
    Fis.svg("text", { class: "etq", x: sx(6.9), y: sy(6.9 * MU_SIMPLE) - 14, "text-anchor": "end" }, svg).textContent = "Modelo simple (μ fijo)";
    // Diferencia en la carga más alta
    const u = MEDIDO[2], falta = (1 - u.mu / MU_SIMPLE) * 100;
    Fis.svg("line", { class: "cursor", x1: sx(u.fz), x2: sx(u.fz), y1: sy(u.fz * MU_SIMPLE), y2: sy(u.fy) }, svg);
    // Datos medidos
    Fis.svg("polyline", { class: "linea s1", points: MEDIDO.map((d) => sx(d.fz) + "," + sy(d.fy)).join(" ") }, svg);
    MEDIDO.forEach((d) => {
      const c = Fis.svg("circle", { class: "f1 anillo", cx: sx(d.fz), cy: sy(d.fy), r: 6 }, svg);
      Fis.svg("title", {}, c).textContent = `Fz = ${Fis.n(d.fz)} kN, Fy máx = ${Fis.n(d.fy)} kN, μ = ${Fis.n(d.mu)}`;
    });
    Fis.svg("text", { class: "etq", x: sx(u.fz) + 8, y: sy(u.fz * MU_SIMPLE) - 12, "text-anchor": "end" }, svg).textContent = `${Fis.n(falta, 1)} % menos que el modelo`;
  }

  function ventanas() {
    const caja = document.getElementById("graf-ventanas");
    caja.innerHTML = "";
    const W = caja.clientWidth, fila = 34, m = { i: 112, d: 16, s: 8, b: 40 };
    const H = m.s + VENTANAS.length * fila + m.b;
    const sx = (v) => m.i + ((v - 80) / 65) * (W - m.i - m.d);
    const svg = Fis.svg("svg", { width: W, height: H, role: "img", "aria-label": caja.dataset.titulo }, caja);
    for (let v = 80; v <= 140; v += 20) {
      Fis.svg("line", { class: "rejilla", x1: sx(v), x2: sx(v), y1: m.s, y2: H - m.b }, svg);
      Fis.svg("text", { x: sx(v), y: H - m.b + 16, "text-anchor": "middle" }, svg).textContent = v;
    }
    Fis.svg("text", { x: (m.i + W - m.d) / 2, y: H - 4, "text-anchor": "middle" }, svg).textContent = "Temperatura de la banda de rodadura (°C)";
    VENTANAS.forEach((v, i) => {
      const y = m.s + i * fila + 8;
      Fis.svg("text", { class: "etq", x: m.i - 10, y: y + 13, "text-anchor": "end" }, svg).textContent = v.c;
      const r = Fis.svg("rect", { class: "f1", x: sx(v.lo), y, width: sx(v.hi) - sx(v.lo), height: 18, rx: 4 }, svg);
      Fis.svg("title", {}, r).textContent = `${v.c}: de ${v.lo} a ${v.hi} °C`;
      Fis.svg("text", { x: sx(v.lo) - 6, y: y + 13, "text-anchor": "end" }, svg).textContent = v.lo;
      Fis.svg("text", { x: sx(v.hi) + 6, y: y + 13 }, svg).textContent = v.hi;
    });
  }

  // Tabla con los mismos datos de la gráfica de carga
  const cuerpo = document.querySelector("#llanta-tabla tbody");
  MEDIDO.forEach((d) => {
    const tr = document.createElement("tr");
    [d.lbf, Fis.n(d.fz), Fis.n(d.mu), Fis.n(d.fy), Fis.n(d.fz * MU_SIMPLE)].forEach((v) => {
      const td = document.createElement("td"); td.textContent = v; tr.appendChild(td);
    });
    cuerpo.appendChild(tr);
  });

  const todo = () => { carga(); ventanas(); };
  todo();
  let espera;
  window.addEventListener("resize", () => { clearTimeout(espera); espera = setTimeout(todo, 150); });
})();
