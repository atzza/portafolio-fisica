// Tema 5: curva de fuerza contra desplazamiento de un gatillo con "resorte virtual",
// y un dibujo del gatillo que se aprieta con un control.
// Los valores son ilustrativos (los escogí yo); no son datos medidos del control.
(function () {
  const K_RETORNO = 0.15; // N/mm, resorte mecánico de retorno del gatillo
  const K_VIRTUAL = 1.0;  // N/mm, rigidez del resorte que simula el motor
  const X0 = 2;           // mm, punto donde el juego activa la resistencia
  const F_MAX = 5;        // N, fuerza máxima que puede dar el motor
  const X_MAX = 8;        // mm, recorrido total del gatillo

  function fuerza(x) {
    const f = K_RETORNO * x + (x > X0 ? K_VIRTUAL * (x - X0) : 0);
    return Math.min(f, F_MAX);
  }
  const X_TOPE = (F_MAX + K_VIRTUAL * X0) / (K_RETORNO + K_VIRTUAL); // donde se alcanza F_MAX
  const zona = (x) => (x <= X0 ? "libre (solo el resorte de retorno)" : x < X_TOPE ? "resorte virtual" : "límite del motor");

  const control = document.getElementById("gatillo-x");
  const xActual = () => +control.value;

  function dibujar() {
    const caja = document.getElementById("graf-resorte");
    caja.innerHTML = "";
    const W = caja.clientWidth, H = 300, m = { i: 44, d: 18, s: 30, b: 44 };
    const sx = (v) => m.i + (v / X_MAX) * (W - m.i - m.d), sy = (v) => H - m.b - (v / 8) * (H - m.s - m.b);
    const svg = Fis.svg("svg", { width: W, height: H, role: "img", "aria-label": caja.dataset.titulo }, caja);
    for (let v = 0; v <= 8; v += 2) {
      Fis.svg("line", { class: v ? "rejilla" : "eje", x1: m.i, x2: W - m.d, y1: sy(v), y2: sy(v) }, svg);
      Fis.svg("text", { x: m.i - 8, y: sy(v) + 4, "text-anchor": "end" }, svg).textContent = v;
      Fis.svg("text", { x: sx(v), y: H - m.b + 16, "text-anchor": "middle" }, svg).textContent = v;
    }
    Fis.svg("text", { x: (m.i + W - m.d) / 2, y: H - 6, "text-anchor": "middle" }, svg).textContent = "Desplazamiento del gatillo x (mm)";
    // Límites de las tres zonas
    [X0, X_TOPE].forEach((x) => Fis.svg("line", { class: "cursor", x1: sx(x), x2: sx(x), y1: m.s - 8, y2: sy(0) }, svg));
    const zonas = [["Libre", X0 / 2], ["Resorte virtual", (X0 + X_TOPE) / 2], ["Límite del motor", (X_TOPE + X_MAX) / 2]];
    zonas.forEach(([t, x]) => Fis.svg("text", { class: "etq", x: sx(x), y: m.s - 14, "text-anchor": "middle" }, svg).textContent = t);
    // Resorte ideal (ley de Hooke sin límite)
    Fis.svg("line", { class: "linea s2", "stroke-dasharray": "6 5", x1: sx(X_TOPE), y1: sy(F_MAX), x2: sx(X_MAX), y2: sy(K_RETORNO * X_MAX + K_VIRTUAL * (X_MAX - X0)) }, svg);
    // Fuerza que entrega el gatillo
    let pts = "";
    for (let x = 0; x <= X_MAX + 1e-9; x += 0.05) pts += sx(x).toFixed(1) + "," + sy(fuerza(x)).toFixed(1) + " ";
    Fis.svg("polyline", { class: "linea s1", points: pts }, svg);
    Fis.svg("text", { class: "etq", x: sx(4.3) + 10, y: sy(fuerza(4.3)) + 24 }, svg).textContent = "F = kᵣ·x + k·(x − x₀)";
    // Punto del gatillo en este momento, con guías hasta los ejes
    const x = xActual(), f = fuerza(x);
    Fis.svg("path", { class: "cursor", fill: "none", d: `M${sx(x)} ${sy(0)} V${sy(f)} H${m.i}` }, svg);
    Fis.svg("circle", { class: "f1 anillo", cx: sx(x), cy: sy(f), r: 7 }, svg);
    // Tocar la gráfica también aprieta el gatillo
    const sensible = Fis.svg("rect", { x: m.i, y: 0, width: W - m.i - m.d, height: H, fill: "transparent" }, svg);
    const mover = (ev) => {
      const px = ev.clientX - svg.getBoundingClientRect().left;
      const nuevo = Math.max(0, Math.min(X_MAX, Math.round((((px - m.i) / (W - m.i - m.d)) * X_MAX) / 0.05) * 0.05));
      if (nuevo !== xActual()) { control.value = nuevo; actualizar(); }
    };
    sensible.addEventListener("pointermove", mover);
    sensible.addEventListener("pointerdown", mover);
  }

  // Dibujo del gatillo visto de lado: gira sobre su eje y el dedo lo empuja desde la derecha
  const PIVOTE = [170, 74];
  const lienzo = document.getElementById("gatillo");
  const g = Fis.svg("svg", { viewBox: "0 0 300 270", role: "img", "aria-label": lienzo.dataset.titulo }, lienzo);
  Fis.svg("path", { d: "M10 74 V42 Q10 12 42 12 H232 Q264 12 264 44 V74 Z", fill: "var(--superficie)", stroke: "var(--tinta-2)", "stroke-width": 1.5 }, g);
  const motor = Fis.svg("g", { transform: "translate(84,43)" }, g);
  const cuerpoMotor = Fis.svg("circle", { r: 17, stroke: "var(--tinta-2)", "stroke-width": 1.5 }, motor);
  const engranaje = Fis.svg("g", {}, motor);
  for (let i = 0; i < 8; i++) Fis.svg("rect", { x: -2.5, y: -21, width: 5, height: 6, fill: "var(--tinta-2)", transform: `rotate(${i * 45})` }, engranaje);
  Fis.svg("circle", { r: 4, fill: "var(--tinta-2)" }, motor);
  Fis.svg("text", { x: 112, y: 48 }, g).textContent = "motor";
  const gatillo = Fis.svg("path", { d: "M-9 0 C-11 50 4 100 30 140 L46 131 C24 96 12 50 10 0 Z", fill: "var(--tinta-2)" }, g);
  Fis.svg("circle", { cx: PIVOTE[0], cy: PIVOTE[1], r: 4, fill: "var(--tinta)" }, g);
  const dedo = Fis.svg("g", {}, g);
  Fis.svg("rect", { x: 0, y: -15, width: 120, height: 30, rx: 15, fill: "var(--regla)", stroke: "var(--tinta-2)", "stroke-width": 1.5 }, dedo);
  Fis.svg("rect", { x: 5, y: -11, width: 16, height: 9, rx: 4, fill: "var(--superficie)", stroke: "var(--tinta-2)" }, dedo);
  Fis.svg("text", { x: 44, y: 4, "text-anchor": "middle" }, dedo).textContent = "dedo";
  const sobreGatillo = Fis.flecha(g, "flecha-tinta"), sobreDedo = Fis.flecha(g);
  const etqGatillo = Fis.svg("text", { class: "etq", "text-anchor": "middle" }, g);
  etqGatillo.textContent = "dedo → gatillo";
  const etqDedo = Fis.svg("text", { class: "etq", "text-anchor": "middle" }, g);
  etqDedo.textContent = "gatillo → dedo";

  function gatilloDibujo() {
    const x = xActual(), f = fuerza(x), ang = (x / X_MAX) * 24, rad = (ang * Math.PI) / 180;
    gatillo.setAttribute("transform", `translate(${PIVOTE[0]},${PIVOTE[1]}) rotate(${ang})`);
    engranaje.setAttribute("transform", `rotate(${-x * 45})`);
    cuerpoMotor.setAttribute("fill", x >= X_TOPE ? "var(--acento)" : "var(--fondo)");
    // Punto de contacto: un punto de la cara del gatillo, girado con él
    const [px, py] = [32, 112];
    const cx = PIVOTE[0] + px * Math.cos(rad) - py * Math.sin(rad), cy = PIVOTE[1] + px * Math.sin(rad) + py * Math.cos(rad);
    dedo.setAttribute("transform", `translate(${cx},${cy})`);
    // Tercera ley: mismas magnitudes, sentidos opuestos, actúan sobre cuerpos distintos (14 px por newton)
    const largo = f * 14;
    sobreGatillo.poner(cx, cy - 26, -largo, 0);
    sobreDedo.poner(cx, cy + 26, largo, 0);
    const hay = largo >= 6;
    etqGatillo.style.display = etqDedo.style.display = hay ? "" : "none";
    etqGatillo.setAttribute("x", cx); etqGatillo.setAttribute("y", cy - 36);
    etqDedo.setAttribute("x", cx); etqDedo.setAttribute("y", cy + 46);
  }

  function actualizar() {
    const x = xActual(), f = fuerza(x);
    document.getElementById("gatillo-x-valor").textContent = `${Fis.n(x)} mm`;
    document.getElementById("gatillo-lectura").innerHTML =
      `<span>x = ${Fis.n(x)} mm</span><span>F = ${Fis.n(f)} N</span><span>zona: ${zona(x)}</span>` +
      `<span>el dedo empuja el gatillo con ${Fis.n(f)} N y el gatillo empuja el dedo con ${Fis.n(f)} N</span>`;
    dibujar();
    gatilloDibujo();
  }
  control.addEventListener("input", actualizar);
  actualizar();
  let espera;
  window.addEventListener("resize", () => { clearTimeout(espera); espera = setTimeout(dibujar, 150); });
})();
