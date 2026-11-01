// Tema 9: rapidez de las Voyager respecto al Sol, con datos reales de NASA/JPL Horizons.
(function () {
  const UA = 1.495978707e8, GM = 1.32712440018e11; // km y km³/s²
  const ENCUENTROS = {
    2: [["Júpiter", 1979.52], ["Saturno", 1981.65], ["Urano", 1986.07], ["Neptuno", 1989.65]],
    1: [["Júpiter", 1979.17], ["Saturno", 1980.87]],
  };
  // Calculado con el dato de cada día de Horizons: [encuentro, v 60 días antes, pico, v 60 días después, E/m antes, E/m después]
  const TABLA = {
    2: [["Júpiter", 10.35, 25.79, 19.51, -121, 31], ["Saturno", 15.64, 25.09, 20.32, 26, 114], ["Urano", 17.92, 20.67, 19.67, 113, 148], ["Neptuno", 18.87, 20.19, 16.69, 148, 110]],
    1: [["Júpiter", 13.65, 31.7, 23.35, -88, 111], ["Saturno", 20.32, 30.75, 21.42, 108, 139]],
  };
  const DATOS = { 1: VOYAGER_1, 2: VOYAGER_2 };
  const X0 = 1977.6, X1 = 1990.05, Y1 = 40;
  const escape = (r) => Math.sqrt((2 * GM) / (r * UA));
  const energia = (v, r) => 0.5 * v * v - GM / (r * UA); // energía por unidad de masa, km²/s²
  const el = (id) => document.getElementById(id);
  let nave = 2, anioActual = 1979.6, cursor, sx, puntoEl, sy;

  function cercano(d, anio) {
    let m = d[0];
    for (const f of d) if (Math.abs(f[0] - anio) < Math.abs(m[0] - anio)) m = f;
    return m;
  }
  const fechaDe = (a) => {
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];
    return `${meses[Math.floor((a % 1) * 12)]} ${Math.floor(a)}`;
  };

  function dibujar() {
    const caja = el("graf-voyager");
    caja.innerHTML = "";
    const W = caja.clientWidth, H = 380, m = { i: 44, d: 14, s: 30, b: 44 };
    sx = (a) => m.i + ((a - X0) / (X1 - X0)) * (W - m.i - m.d);
    sy = (v) => m.s + (1 - v / Y1) * (H - m.s - m.b);
    const svg = Fis.svg("svg", { width: W, height: H, role: "img", "aria-label": caja.dataset.titulo }, caja);
    for (let v = 0; v <= Y1; v += 5) {
      Fis.svg("line", { class: v ? "rejilla" : "eje", x1: m.i, x2: W - m.d, y1: sy(v), y2: sy(v) }, svg);
      Fis.svg("text", { x: m.i - 8, y: sy(v) + 4, "text-anchor": "end" }, svg).textContent = v;
    }
    for (let a = 1978; a <= 1990; a += W < 500 ? 4 : 2) {
      Fis.svg("text", { x: sx(a), y: H - m.b + 16, "text-anchor": "middle" }, svg).textContent = a;
    }
    Fis.svg("text", { x: (m.i + W - m.d) / 2, y: H - 6, "text-anchor": "middle" }, svg).textContent = "Año";
    // Encuentros con cada planeta
    ENCUENTROS[nave].forEach(([n, a]) => {
      Fis.svg("line", { class: "rejilla", "stroke-dasharray": "3 3", x1: sx(a), x2: sx(a), y1: m.s - 6, y2: H - m.b }, svg);
      Fis.svg("text", { class: "etq", x: sx(a), y: m.s - 12, "text-anchor": "middle" }, svg).textContent = n;
    });
    const d = DATOS[nave];
    // Velocidad de escape del Sol en cada punto: por encima, la sonda ya no vuelve
    Fis.svg("polyline", { class: "linea s2", "stroke-dasharray": "6 5", points: d.map((f) => sx(f[0]).toFixed(1) + "," + sy(escape(f[2])).toFixed(1)).join(" ") }, svg);
    Fis.svg("polyline", { class: "linea s1", points: d.map((f) => sx(f[0]).toFixed(1) + "," + sy(f[1]).toFixed(1)).join(" ") }, svg);
    cursor = Fis.svg("line", { class: "cursor", y1: m.s, y2: H - m.b }, svg);
    puntoEl = Fis.svg("circle", { class: "f1 anillo", r: 6 }, svg);
    const zona = Fis.svg("rect", { x: m.i, y: 0, width: W - m.i - m.d, height: H, fill: "transparent" }, svg);
    const mover = (ev) => {
      const x = ev.clientX - svg.getBoundingClientRect().left;
      fijar(Math.max(X0, Math.min(X1, X0 + ((x - m.i) / (W - m.i - m.d)) * (X1 - X0))));
    };
    zona.addEventListener("pointermove", mover);
    zona.addEventListener("pointerdown", mover);
    fijar(anioActual);
    tabla();
  }

  function fijar(anio) {
    anioActual = anio;
    const f = cercano(DATOS[nave], anio);
    cursor.setAttribute("x1", sx(f[0]));
    cursor.setAttribute("x2", sx(f[0]));
    puntoEl.setAttribute("cx", sx(f[0]));
    puntoEl.setAttribute("cy", sy(f[1]));
    const e = energia(f[1], f[2]);
    el("voyager-lectura").innerHTML =
      `<span>${fechaDe(f[0])}</span><span>v = ${Fis.n(f[1])} km/s</span><span>r = ${Fis.n(f[2])} UA</span>` +
      `<span>v<sub>escape</sub> = ${Fis.n(escape(f[2]))} km/s</span>` +
      `<span>E/m = ${Fis.n(e, 0).replace("-", "−")} km²/s²</span>` +
      `<span>${f[1] > escape(f[2]) ? "ya no regresa al Sol" : "todavía atada al Sol"}</span>`;
  }

  // Tabla: 60 días antes y después, para separar la ganancia real del pico al pasar junto al planeta
  function tabla() {
    const cuerpo = document.querySelector("#voyager-tabla tbody");
    cuerpo.innerHTML = "";
    TABLA[nave].forEach(([n, antes, pico, despues, eAntes, eDespues]) => {
      const dif = despues - antes;
      const tr = document.createElement("tr");
      [n, Fis.n(antes), Fis.n(pico), Fis.n(despues), (dif >= 0 ? "+" : "−") + Fis.n(Math.abs(dif)),
        Fis.n(eAntes, 0).replace("-", "−"), Fis.n(eDespues, 0).replace("-", "−")].forEach((v) => {
        const td = document.createElement("td");
        td.textContent = v;
        tr.appendChild(td);
      });
      cuerpo.appendChild(tr);
    });
  }

  document.querySelectorAll("button[data-nave]").forEach((b) => b.addEventListener("click", () => {
    nave = +b.dataset.nave;
    document.querySelectorAll("button[data-nave]").forEach((o) => o.setAttribute("aria-pressed", o === b));
    dibujar();
  }));
  dibujar();
  let espera;
  window.addEventListener("resize", () => { clearTimeout(espera); espera = setTimeout(dibujar, 150); });
})();
