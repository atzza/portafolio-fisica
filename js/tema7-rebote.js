// Tema 7: simulación de una pelota que rebota. Se integra paso a paso, como un motor de física:
//   v = v − g·Δt     y = y + v·Δt     al chocar con el piso: v' = −e·v
// El piso es un cuerpo enorme que no se mueve, así que e = −(v₁' − v₂') / (v₁ − v₂) queda en v' = −e·v.
(function () {
  const G = 9.81, ALTURA = 3;          // m, altura desde la que se suelta
  const UMBRAL = 2;                    // m/s, valor por defecto de Physics.bounceThreshold en Unity
  const VENTANA = 8;                   // s que se ven en la gráfica
  const el = (id) => document.getElementById(id);
  const cE = el("rebote-e"), cUmbral = el("rebote-umbral"), cPaso = el("rebote-paso");
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let y, v, t, rebotes, ultimaAltura, cima, historia, detenida, acumulado, previo = null, anim = 0, visible = false;
  let pelota, sombra, trazo, puntos, sy, sxG, syG;

  function soltar() {
    y = ALTURA; v = 0; t = 0; rebotes = 0; ultimaAltura = null; cima = 0; detenida = false; acumulado = 0;
    historia = [[0, ALTURA]];
    dibujar();
    previo = null;
    arrancar();
  }

  // Un paso del motor de física con paso fijo dt
  function paso(dt, e) {
    if (detenida) { t += dt; return; }
    v -= G * dt;
    y += v * dt;
    if (v > 0 && y > cima) cima = y;
    if (y <= 0) {
      const impacto = -v;
      y = 0;
      if (rebotes > 0 || cima > 0) ultimaAltura = cima;
      // Por debajo del umbral el motor no rebota: la pelota se queda quieta de una vez.
      // Sin umbral, se da por detenida cuando el golpe es menor que lo que g le suma en dos pasos.
      if ((cUmbral.checked && impacto < UMBRAL) || e === 0 || (e < 1 && impacto < 2 * G * dt)) {
        v = 0;
        detenida = true;
      } else {
        v = e * impacto;
        rebotes++;
        cima = 0;
      }
    }
    t += dt;
  }

  function cuadro(ahora) {
    if (previo !== null) {
      const dt = 1 / +cPaso.value, e = +cE.value;
      acumulado += Math.min(0.1, (ahora - previo) / 1000);
      while (acumulado >= dt) { paso(dt, e); acumulado -= dt; if (t <= VENTANA) historia.push([t, y]); }
      actualizar();
    }
    previo = ahora;
    // A los 30 s se reinicia para no acumular sin fin si la pelota nunca se detiene
    if (t > 30) { soltar(); return; }
    anim = visible && !reducir ? requestAnimationFrame(cuadro) : 0;
  }
  function arrancar() {
    cancelAnimationFrame(anim);
    if (reducir) {
      const e = +cE.value;
      for (let i = 0; i < VENTANA * 240; i++) { paso(1 / 240, e); if (i % 4 === 0) historia.push([t, y]); }
      actualizar();
      return;
    }
    if (visible) anim = requestAnimationFrame(cuadro);
  }

  function dibujar() {
    // Escena: la pelota con una regla en metros
    const caja = el("rebote-escena");
    caja.innerHTML = "";
    const W = caja.clientWidth, H = 320, m = { s: 16, b: 26 };
    sy = (a) => H - m.b - (a / 4) * (H - m.s - m.b);
    const svg = Fis.svg("svg", { width: W, height: H, role: "img", "aria-label": caja.dataset.titulo }, caja);
    for (let a = 0; a <= 4; a++) {
      Fis.svg("line", { class: a ? "rejilla" : "eje", x1: 36, x2: W, y1: sy(a), y2: sy(a) }, svg);
      Fis.svg("text", { x: 30, y: sy(a) + 4, "text-anchor": "end" }, svg).textContent = a + " m";
    }
    sombra = Fis.svg("ellipse", { cx: 36 + (W - 36) / 2, cy: sy(0) + 5, fill: "var(--regla)" }, svg);
    pelota = Fis.svg("circle", { cx: 36 + (W - 36) / 2, r: 14, fill: "var(--acento)" }, svg);

    // Gráfica: altura contra tiempo, con las alturas que predice h' = e²·h
    const cajaG = el("rebote-grafica");
    cajaG.innerHTML = "";
    const WG = cajaG.clientWidth, HG = 320, mg = { i: 38, d: 12, s: 16, b: 40 };
    syG = (a) => HG - mg.b - (a / 4) * (HG - mg.s - mg.b);
    sxG = (s) => mg.i + (s / VENTANA) * (WG - mg.i - mg.d);
    const g = Fis.svg("svg", { width: WG, height: HG, role: "img", "aria-label": cajaG.dataset.titulo }, cajaG);
    for (let a = 0; a <= 4; a++) {
      Fis.svg("line", { class: a ? "rejilla" : "eje", x1: mg.i, x2: WG - mg.d, y1: syG(a), y2: syG(a) }, g);
      Fis.svg("text", { x: mg.i - 6, y: syG(a) + 4, "text-anchor": "end" }, g).textContent = a;
    }
    for (let s = 0; s <= VENTANA; s += 2) Fis.svg("text", { x: sxG(s), y: HG - mg.b + 16, "text-anchor": "middle" }, g).textContent = s;
    Fis.svg("text", { x: (mg.i + WG - mg.d) / 2, y: HG - 4, "text-anchor": "middle" }, g).textContent = "Tiempo t (s)";
    Fis.svg("text", { x: mg.i, y: 10 }, g).textContent = "Altura y (m)";
    // Alturas predichas por la ecuación: una marca por rebote
    const e = +cE.value;
    let h = ALTURA, tt = Math.sqrt((2 * ALTURA) / G);
    for (let n = 1; n <= 40 && tt < VENTANA && e > 0; n++) {
      const vuelo = 2 * e * Math.sqrt(2 * G * h);
      const hNueva = e * e * h;
      if (hNueva > 4) break;
      const cx = sxG(tt + vuelo / (2 * G));
      if (cx <= WG - mg.d) Fis.svg("line", { class: "s2", "stroke-width": 2, x1: cx - 7, x2: cx + 7, y1: syG(hNueva), y2: syG(hNueva) }, g);
      tt += vuelo / G;
      h = hNueva;
      if (h < 0.002) break;
    }
    trazo = Fis.svg("polyline", { class: "linea s1" }, g);
    actualizar();
  }

  function actualizar() {
    const ey = Math.min(y, 4.2);
    pelota.setAttribute("cy", sy(ey) - 14);
    const sq = 1 - Math.min(y, 4) / 8;
    sombra.setAttribute("rx", 18 * sq);
    sombra.setAttribute("ry", 4 * sq);
    // La gráfica muestra los primeros segundos, para compararlos con las marcas de la ecuación
    let pts = "";
    for (const [s, a] of historia) {
      if (s <= VENTANA) pts += sxG(s).toFixed(1) + "," + syG(Math.min(a, 4)).toFixed(1) + " ";
    }
    trazo.setAttribute("points", pts);

    const e = +cE.value;
    const energia = (G * y + 0.5 * v * v) / (G * ALTURA) * 100;
    el("rebote-e-valor").textContent = Fis.n(e);
    el("rebote-rebotes").textContent = rebotes;
    el("rebote-primera").textContent = Fis.n(e * e * ALTURA) + " m";
    el("rebote-medida").textContent = ultimaAltura === null ? "—" : Fis.n(ultimaAltura) + " m";
    el("rebote-energia").textContent = Fis.n(energia, 0) + " %";
    el("rebote-estado").textContent = mensaje(e);
  }

  function mensaje(e) {
    if (e > 1) return "e mayor que 1 es imposible: cada rebote crea energía de la nada y la pelota sube cada vez más. En un juego se ve como un error.";
    if (e === 1) return "Con e = 1 no se pierde energía: la pelota rebota para siempre. Se ve artificial, porque nada real rebota así.";
    if (detenida && cUmbral.checked && e > 0) return "El rebote quedó por debajo del umbral de 2 m/s: el motor la detiene de golpe, sin los últimos botecitos.";
    if (e < 0.35) return "Con e tan bajo la pelota casi no rebota: se siente muerta, como una bola de plastilina.";
    if (+cPaso.value < 240) return "Con un paso de física más largo, la pelota entra al piso entre un paso y otro y cada rebote queda más bajo de lo que dice la ecuación. Compará la curva con las marcas.";
    return "Rebote creíble: cada altura es casi e² veces la anterior y la curva llega a las marcas de la ecuación.";
  }

  cE.addEventListener("input", soltar);
  cUmbral.addEventListener("change", soltar);
  cPaso.addEventListener("change", soltar);
  el("rebote-soltar").addEventListener("click", soltar);
  document.querySelectorAll("[data-rebote]").forEach((b) => b.addEventListener("click", () => {
    cE.value = b.dataset.rebote;
    soltar();
  }));

  // Solo corre mientras se ve
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(anim);
    previo = null;
    if (visible && !reducir) anim = requestAnimationFrame(cuadro);
  }).observe(el("rebote-escena"));

  soltar();
  let espera;
  window.addEventListener("resize", () => { clearTimeout(espera); espera = setTimeout(dibujar, 150); });
})();
