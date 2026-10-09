// Entradas animadas: al llegar a cada tema se reproduce una escena corta y después
// aparece el título. Cada escena se mueve con las ecuaciones de su propio tema.
const Entradas = (function () {
  const S = Fis.svg;
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Física compartida por las escenas ----------

  // Ir de p0 a p1 en un tiempo T: acelera la primera mitad y frena la segunda (MRUA por tramos)
  function tramo(p0, p1, t, T) {
    const u = Math.max(0, Math.min(1, t / T));
    return p0 + (p1 - p0) * (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u));
  }
  // Velocidad del tramo anterior (su derivada)
  function vTramo(p0, p1, t, T) {
    const u = t / T;
    if (u <= 0 || u >= 1) return 0;
    return ((p1 - p0) / T) * (u < 0.5 ? 4 * u : 4 * (1 - u));
  }

  // Altura sobre el piso de algo que cae desde h0 y rebota con coeficiente de restitución e
  function rebote(t, h0, g, e) {
    let v = Math.sqrt(2 * g * h0);
    const caida = v / g;
    if (t < caida) return h0 - 0.5 * g * t * t;
    t -= caida;
    for (v *= e; v > 25; v *= e) {
      const vuelo = (2 * v) / g;
      if (t < vuelo) return v * t - 0.5 * g * t * t;
      t -= vuelo;
    }
    return 0;
  }
  function duracionRebote(h0, g, e) {
    let v = Math.sqrt(2 * g * h0), total = v / g;
    for (v *= e; v > 25; v *= e) total += (2 * v) / g;
    return total;
  }

  // Flecha de un vector: se coloca con su origen y sus componentes en pixeles
  function flecha(padre, clase = "flecha") {
    const g = S("g", { class: clase }, padre);
    const linea = S("line", { x1: 0, y1: 0, y2: 0, "stroke-width": 2.5, "stroke-linecap": "round" }, g);
    const punta = S("path", { d: "M0 0 L-9 -5 L-9 5 Z" }, g);
    return {
      poner(x, y, dx, dy) {
        const largo = Math.hypot(dx, dy);
        g.style.display = largo < 6 ? "none" : "";
        if (largo < 6) return;
        g.setAttribute("transform", `translate(${x},${y}) rotate(${(Math.atan2(dy, dx) * 180) / Math.PI})`);
        linea.setAttribute("x2", largo - 6);
        punta.setAttribute("transform", `translate(${largo},0)`);
      },
    };
  }

  // Texto de datos en la esquina, como la consola de un programa
  function hud(svg, lineas) {
    return Array.from({ length: lineas }, (_, i) => S("text", { class: "hud", x: 0, y: 14 + i * 18 }, svg));
  }

  // Cada escena recibe el svg y su tamaño, y devuelve { dur, impacto, cuadro(t) }:
  // cuadro(t) dibuja el instante t; en "impacto" aparece el título del tema.
  const ESCENAS = {};

  // ---------- Tema 1: el dron despega, vuela al este, baja y suelta el paquete ----------
  ESCENAS.dron = function (svg, W, H) {
    const piso = H - 24;
    const k = W >= 700 ? 1.35 : 1;                    // tamaño del dron y del paquete
    const xB = 58, xE = W - Math.min(170, W * 0.32); // bodega y punto de entrega
    const y0 = piso - 48 - 27 * k;                    // posado sobre el techo de la bodega
    const yC = Math.round(H * 0.3);                   // altura de crucero
    const yD = piso - 44 - 27 * k;                    // suelta el paquete a 44 px del suelo
    // Tramo horizontal con aceleración constante: acelera, crucero y frena (como la ruta del tema)
    const D = xE - xB, TV = 1.5, TA = 0.45, VMAX = D / (TV - TA), A = VMAX / TA;
    const xVuelo = (τ) => τ <= 0 ? 0 : τ < TA ? 0.5 * A * τ * τ : τ < TV - TA ? 0.5 * A * TA * TA + VMAX * (τ - TA) : τ < TV ? D - 0.5 * A * (TV - τ) ** 2 : D;
    const vxVuelo = (τ) => τ <= 0 || τ >= TV ? 0 : τ < TA ? A * τ : τ < TV - TA ? VMAX : A * (TV - τ);
    const G = 1400, SOLTAR = 2.45, IMPACTO = SOLTAR + Math.sqrt((2 * 44) / G);

    function estado(t) {
      if (t < 0.5) return { x: xB, y: tramo(y0, yC, t, 0.5), vx: 0, vy: vTramo(y0, yC, t, 0.5), inclina: 0, fase: "Despega" };
      if (t < 0.5 + TV) {
        const τ = t - 0.5;
        const fase = τ < TA ? "Acelera hacia el este" : τ < TV - TA ? "Crucero a 10 m/s" : "Frena sobre la entrega";
        return { x: xB + xVuelo(τ), y: yC, vx: vxVuelo(τ), vy: 0, inclina: τ < TA ? 9 : τ < TV - TA ? 0 : -9, fase };
      }
      if (t < SOLTAR) return { x: xE, y: tramo(yC, yD, t - 2, 0.45), vx: 0, vy: vTramo(yC, yD, t - 2, 0.45), inclina: 0, fase: "Baja" };
      return { x: xE, y: tramo(yD, yD - 26, t - SOLTAR, 0.65), vx: 0, vy: vTramo(yD, yD - 26, t - SOLTAR, 0.65), inclina: 0, fase: t < IMPACTO ? "Suelta el paquete" : "¡Entregado!" };
    }

    // Suelo, bodega y casa de entrega
    S("line", { class: "l-2", x1: 0, x2: W, y1: piso, y2: piso, "stroke-width": 1.5 }, svg);
    S("rect", { class: "e-sup l-2", x: xB - 34, y: piso - 48, width: 68, height: 48, "stroke-width": 1.5 }, svg);
    S("rect", { class: "e-regla", x: xB - 14, y: piso - 28, width: 28, height: 28 }, svg);
    S("path", { class: "l-2", d: `M${xB - 14} ${piso - 21} h28 M${xB - 14} ${piso - 14} h28 M${xB - 14} ${piso - 7} h28`, "stroke-width": 1 }, svg);
    S("text", { x: xB, y: piso + 17, "text-anchor": "middle" }, svg).textContent = "Bodega";
    const xC = xE + 32;
    S("rect", { class: "e-sup l-2", x: xC, y: piso - 34, width: 44, height: 34, "stroke-width": 1.5 }, svg);
    S("path", { class: "e-regla l-2", d: `M${xC - 5} ${piso - 34} L${xC + 22} ${piso - 54} L${xC + 49} ${piso - 34} Z`, "stroke-width": 1.5 }, svg);
    S("rect", { class: "e-acento", x: xC + 8, y: piso - 25, width: 10, height: 9 }, svg);
    S("rect", { class: "e-regla", x: xC + 26, y: piso - 18, width: 10, height: 18 }, svg);
    S("ellipse", { class: "l-acento", cx: xE, cy: piso, rx: 17, ry: 4, fill: "none", "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg);
    S("text", { x: xE, y: piso + 17, "text-anchor": "middle" }, svg).textContent = "Entrega";

    const estela = S("polyline", { class: "l-2", fill: "none", "stroke-width": 1.2, "stroke-dasharray": "2 5" }, svg);
    const [hud1, hud2] = hud(svg, 2);

    // Paquete (va aparte porque cae solo)
    const paquete = S("g", {}, svg);
    S("rect", { class: "e-acento", x: -8, y: 0, width: 16, height: 13, rx: 2 }, paquete);
    S("line", { class: "l-fondo", x1: 0, x2: 0, y1: 0, y2: 13, "stroke-width": 1.5 }, paquete);
    const polvo = S("path", { class: "l-2", fill: "none", "stroke-width": 1.5, "stroke-linecap": "round",
      d: `M${xE - 12} ${piso - 2} l-7 -3 M${xE - 12} ${piso - 6} l-5 -6 M${xE + 12} ${piso - 2} l7 -3 M${xE + 12} ${piso - 6} l5 -6` }, svg);

    // Dron visto de lado
    const dron = S("g", {}, svg);
    const cuerpo = S("g", {}, dron);
    const cuerda = S("line", { class: "l-2", x1: 0, x2: 0, y1: 4, y2: 14, "stroke-width": 1.2 }, cuerpo);
    S("path", { class: "l-tinta", fill: "none", d: "M-24 -4 H24 M-22 -4 V-9 M22 -4 V-9", "stroke-width": 3, "stroke-linecap": "round" }, cuerpo);
    S("path", { class: "l-tinta", fill: "none", d: "M-8 4 L-12 11 M8 4 L12 11", "stroke-width": 2, "stroke-linecap": "round" }, cuerpo);
    const helices = [-22, 22].map((x) => S("ellipse", { class: "e-acento", cx: x, cy: -10, rx: 13, ry: 2.2 }, cuerpo));
    S("rect", { class: "e-tinta", x: -13, y: -8, width: 26, height: 12, rx: 5 }, cuerpo);
    S("circle", { class: "e-fondo", cx: 7, cy: -2, r: 2.4 }, cuerpo);
    const vel = flecha(svg);
    const etqV = S("text", { class: "hud" }, svg);
    etqV.textContent = "v";

    const ESCALA = 46 / VMAX; // pixeles de flecha por cada px/s
    return {
      dur: 3.1,
      impacto: IMPACTO,
      cuadro(t) {
        const e = estado(t);
        dron.setAttribute("transform", `translate(${e.x},${e.y}) scale(${k})`);
        cuerpo.setAttribute("transform", `rotate(${e.inclina})`);
        const girando = t > 0 && t < 3.1 && Math.floor(t * 60) % 2;
        helices.forEach((h) => h.setAttribute("rx", girando ? 5 : 13));
        // Vector velocidad
        const dx = e.vx * ESCALA, dy = e.vy * ESCALA;
        vel.poner(e.x, e.y, dx, dy);
        const largo = Math.hypot(dx, dy);
        etqV.style.display = largo < 6 ? "none" : "";
        etqV.setAttribute("x", e.x + dx + (dx >= 0 ? 6 : -14));
        etqV.setAttribute("y", e.y + dy + (dy > 0 ? 14 : -4));
        // Estela: la posición en pasos de 0,05 s hasta ahora
        const pts = [];
        for (let s = 0; s <= t; s += 0.05) { const p = estado(s); pts.push(p.x.toFixed(1) + "," + p.y.toFixed(1)); }
        estela.setAttribute("points", pts.join(" "));
        // Paquete: colgado del dron hasta que lo suelta; luego cae con g y rebota un poco
        cuerda.style.display = t < SOLTAR ? "" : "none";
        const yP = t < SOLTAR ? e.y + 14 * k : piso - 13 * k - rebote(t - SOLTAR, 44, G, 0.3);
        paquete.setAttribute("transform", `translate(${t < SOLTAR ? e.x : xE},${yP}) scale(${k})`);
        polvo.style.opacity = t >= IMPACTO && t < IMPACTO + 0.35 ? 1 : 0;
        // Datos
        const rapidez = (Math.hypot(e.vx, e.vy) / VMAX) * 10;
        hud1.textContent = e.fase;
        hud2.textContent = `|v| = ${Fis.n(rapidez, 1)} m/s`;
      },
    };
  };

  // ---------- Tema 2: un personaje de videojuego salta un hueco con la gravedad del juego ----------
  ESCENAS.salto = function (svg, W, H) {
    const M = H < 220 ? 24 : 40;                     // pixeles por metro: el personaje mide 1 m
    const G = 32.65 * M, V0 = 11.43 * M, VX = 4 * M; // el salto de diseño del tema: 2 m en 0,35 s
    const TAIRE = (2 * V0) / G, CORRE = 1.0, DESPUES = 0.55;
    const piso = H - 30;
    const xSalto = Math.round(W * (W < 560 ? 0.36 : 0.42)), x0 = xSalto - VX * CORRE;
    const alcance = VX * TAIRE;
    const hueco = [xSalto + 0.6 * M, xSalto + alcance - 0.6 * M];
    const altura = (τ) => V0 * τ - 0.5 * G * τ * τ;  // y = v₀·t − ½·g·t²

    // Nubes de pixeles
    [[W * 0.56, 44], [W * 0.82, 74]].forEach(([x, y]) => {
      const n = S("g", { class: "e-regla", transform: `translate(${Math.round(x)},${y})` }, svg);
      [[0, 10, 56, 12], [10, 2, 22, 10], [28, 5, 18, 7]].forEach(([a, b, c, d]) => S("rect", { x: a, y: b, width: c, height: d }, n));
    });
    // Suelo de ladrillos con un hueco
    [[0, hueco[0]], [hueco[1], W]].forEach(([a, b]) => {
      S("rect", { class: "e-regla", x: a, y: piso, width: b - a, height: 22 }, svg);
      let d = `M${a} ${piso + 11} H${b}`;
      for (let x = a + M; x < b; x += M) d += ` M${x} ${piso} v11`;
      for (let x = a + M / 2; x < b; x += M) d += ` M${x} ${piso + 11} v11`;
      S("path", { class: "l-fondo", d, "stroke-width": 1.5 }, svg);
      S("line", { class: "l-acento", x1: a, x2: b, y1: piso, y2: piso, "stroke-width": 3 }, svg);
    });
    // Marca de la altura máxima
    const cima = S("g", {}, svg);
    S("line", { class: "l-2", x1: xSalto + alcance / 2 - 28, x2: xSalto + alcance / 2 + 28, y1: piso - 2 * M, y2: piso - 2 * M, "stroke-dasharray": "3 3" }, cima);
    S("text", { x: xSalto + alcance / 2 + 34, y: piso - 2 * M + 4 }, cima).textContent = "h = 2,00 m";

    // Puntos de la trayectoria de los pies cada 0,05 s, como en la simulación del tema
    const puntos = [];
    for (let s = 0; s <= TAIRE; s += 0.05) puntos.push({ s, c: S("circle", { class: "e-tinta-2", cx: xSalto + VX * s, cy: piso - altura(s), r: 2.5 }, svg) });
    // Monedas sobre la trayectoria
    const monedas = [0.3, 0.5, 0.7].map((f) => {
      const s = f * TAIRE, g = S("g", {}, svg);
      S("ellipse", { class: "e-acento", rx: 0.2 * M, ry: 0.3 * M }, g);
      S("rect", { class: "e-fondo", x: -0.04 * M, y: -0.17 * M, width: 0.08 * M, height: 0.34 * M }, g);
      return { s, g, x: xSalto + VX * s, y: piso - altura(s) - M / 2 };
    });
    // Personaje: el mismo bloque de 1 m de la simulación
    const pj = S("g", {}, svg), cuerpo = S("g", {}, pj);
    S("rect", { class: "e-acento", x: -0.35 * M, y: -M, width: 0.7 * M, height: M, rx: 0.12 * M }, cuerpo);
    S("circle", { class: "e-fondo", cx: 0.02 * M, cy: -0.68 * M, r: 0.07 * M }, cuerpo);
    S("circle", { class: "e-fondo", cx: 0.22 * M, cy: -0.68 * M, r: 0.07 * M }, cuerpo);
    const [hud1, hud2] = hud(svg, 2);
    hud1.textContent = "Physics.gravity.y = −32,65 m/s²";

    return {
      dur: CORRE + TAIRE + DESPUES,
      impacto: CORRE + TAIRE,
      cuadro(t) {
        const τ = t - CORRE;
        let x, y, sx = 1, sy = 1;
        if (τ < 0) { x = x0 + VX * t; y = t > 0 ? Math.abs(Math.sin(t * 18)) * 2 : 0; }
        else if (τ < TAIRE) {
          x = xSalto + VX * τ; y = altura(τ);
          sy = 1 + 0.12 * ((V0 - G * τ) / V0); sx = 1 / sy;   // se estira al subir y se aplasta al bajar
        } else {
          const d = τ - TAIRE;
          x = xSalto + alcance + VX * Math.min(d, DESPUES); y = 0;
          if (d < 0.12) { sy = 0.78 + 0.22 * (d / 0.12); sx = 1 / sy; }  // aterrizaje
          else if (d < DESPUES) y = Math.abs(Math.sin(d * 18)) * 2;
        }
        pj.setAttribute("transform", `translate(${x},${piso - y})`);
        cuerpo.setAttribute("transform", `scale(${sx},${sy})`);
        puntos.forEach((p) => (p.c.style.display = τ >= p.s ? "" : "none"));
        monedas.forEach((m) => {
          const d = τ - m.s;
          m.g.setAttribute("transform", `translate(${m.x},${m.y - (d > 0 ? d * 90 : 0)})`);
          m.g.style.opacity = d > 0 ? Math.max(0, 1 - d / 0.25) : 1;
        });
        cima.style.display = τ >= TAIRE / 2 ? "" : "none";
        hud2.textContent = τ < 0 ? "y = 0,00 m (en el piso)"
          : τ < TAIRE ? `y = ${Fis.n(y / M)} m · t = ${Fis.n(τ)} s`
          : `aterrizó: ${Fis.n(TAIRE)} s en el aire`;
      },
    };
  };

  // ---------- Tema 3: el hábitat llega girando entre estrellas y se estabiliza en 2 rpm ----------
  ESCENAS.anillo = function (svg, W, H) {
    const rad = Math.PI / 180;
    // Estrellas pseudoaleatorias: siempre quedan en el mismo lugar
    let semilla = 11;
    const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < W / 8; i++) {
      S("circle", { class: "e-tinta", cx: azar() * W, cy: azar() * H, r: 0.5 + azar() * 1.1, opacity: 0.2 + azar() * 0.6 }, svg);
    }
    // Borde de un planeta con su atmósfera
    S("circle", { class: "e-sup l-acento", cx: W * 0.12, cy: H + 854, r: 900, "stroke-width": 2, "stroke-opacity": 0.6 }, svg);

    const R = Math.min(H * 0.34, 84), cx = W * 0.64, cy = H * 0.52;
    const estacion = S("g", {}, svg);
    // Sentido de giro: antihorario, como en el diagrama del tema
    const ra = R + 14, a1 = -55 * rad, a2 = -125 * rad;
    S("path", { class: "l-acento", fill: "none", "stroke-width": 2,
      d: `M${ra * Math.cos(a1)} ${ra * Math.sin(a1)} A${ra} ${ra} 0 0 0 ${ra * Math.cos(a2)} ${ra * Math.sin(a2)}` }, estacion);
    S("path", { class: "e-acento", d: "M0 0 L-9 -5 L-9 5 Z",
      transform: `translate(${ra * Math.cos(a2)},${ra * Math.sin(a2)}) rotate(${Math.atan2(-Math.cos(a2), Math.sin(a2)) / rad})` }, estacion);
    S("text", { class: "hud", x: 0, y: -ra - 8, "text-anchor": "middle" }, estacion).textContent = "ω";

    // El anillo: "giro" es la entrada calculada aquí; "lento" es el giro continuo de 2 rpm (CSS)
    const giro = S("g", {}, estacion);
    const lento = S("g", { class: "esc-gira" }, giro);
    S("circle", { class: "l-regla", r: 0.89 * R, fill: "none", "stroke-width": 0.22 * R }, lento);
    S("circle", { class: "l-2", r: R, fill: "none", "stroke-width": 1.5 }, lento);
    S("circle", { class: "l-2", r: 0.78 * R, fill: "none", "stroke-width": 1.5 }, lento);
    [90, 210, 330].forEach((a) => S("line", { class: "l-2", "stroke-width": 3,
      x1: 0.14 * R * Math.cos(a * rad), y1: 0.14 * R * Math.sin(a * rad), x2: 0.78 * R * Math.cos(a * rad), y2: 0.78 * R * Math.sin(a * rad) }, lento));
    for (let i = 0; i < 18; i++) {
      S("rect", { class: "e-acento", x: -3, y: -1.6, width: 6, height: 3.2, transform: `rotate(${i * 20}) translate(${0.89 * R},0) rotate(90)` }, lento);
    }
    S("circle", { class: "e-sup l-tinta", r: 0.14 * R, "stroke-width": 1.5 }, lento);
    // Persona de pie sobre la cara interior, con la cabeza hacia el eje
    const ri = 0.78 * R;
    S("path", { class: "l-tinta", fill: "none", "stroke-width": 1.6, "stroke-linecap": "round",
      d: `M0 ${ri - 9} V${ri - 4} L-3 ${ri} M0 ${ri - 4} L3 ${ri} M-3 ${ri - 7.5} H3` }, lento);
    S("circle", { class: "l-tinta", fill: "none", "stroke-width": 1.6, cx: 0, cy: ri - 12, r: 2.6 }, lento);

    const [hud1, hud2] = hud(svg, 2);
    // Llega frenando (posición) y su giro extra decae exponencialmente hasta quedar en 2 rpm
    const LLEGA = 1.3, TAU = 0.45, EXTRA = 300, xIni = W + R + 30;
    return {
      dur: 2.0,
      impacto: 1.0,
      cuadro(t) {
        const u = Math.min(1, t / LLEGA);
        estacion.setAttribute("transform", `translate(${xIni + (cx - xIni) * (1 - (1 - u) ** 3)},${cy})`);
        const fin = t >= 2.0;
        giro.setAttribute("transform", `rotate(${-EXTRA * (fin ? 1 : 1 - Math.exp(-t / TAU))})`);
        const rpm = 2 + (fin ? 0 : (EXTRA / TAU) * Math.exp(-t / TAU) / 6); // 1 rpm = 6 °/s
        hud1.textContent = `ω = ${Fis.n(rpm, 1)} rpm`;
        hud2.textContent = `T = ${Fis.n(60 / rpm, 1)} s por vuelta`;
      },
    };
  };

  // ---------- Motor: decide cuándo se reproduce cada escena ----------
  const escenas = [...document.querySelectorAll(".escena")].map((el) => ({
    el, seccion: el.closest(".tema"), activa: false, visible: false, jugada: false, anim: 0,
  }));

  function revelar(e) { e.seccion.classList.add("revelado"); }

  function construir(e) {
    const crear = ESCENAS[e.el.dataset.escena];
    e.el.querySelector("svg")?.remove();
    if (!crear) { e.escena = null; revelar(e); return; }
    const W = e.el.clientWidth, H = e.el.clientHeight;
    const svg = S("svg", { width: W, height: H, role: "img", "aria-label": e.el.dataset.titulo });
    e.el.prepend(svg);
    e.escena = crear(svg, W, H);
    e.escena.cuadro(e.jugada || reducir ? e.escena.dur : 0);
  }

  function jugar(e) {
    if (!e.escena) return;
    cancelAnimationFrame(e.anim);
    e.jugada = true;
    if (reducir) { e.escena.cuadro(e.escena.dur); revelar(e); return; }
    e.el.classList.remove("terminada");
    let inicio;
    const paso = (ahora) => {
      inicio ??= ahora;
      const t = (ahora - inicio) / 1000;
      e.escena.cuadro(Math.min(t, e.escena.dur));
      if (t >= e.escena.impacto) revelar(e);
      if (t < e.escena.dur) e.anim = requestAnimationFrame(paso);
      else e.el.classList.add("terminada");
    };
    e.anim = requestAnimationFrame(paso);
  }

  // Se reproduce la primera vez que el tema está activo y su escena se ve
  function revisar(e) { if (e.activa && e.visible && !e.jugada) jugar(e); }

  escenas.forEach((e) => {
    construir(e);
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "escena__repetir";
    boton.textContent = "↻ Repetir";
    e.el.append(boton);
    e.el.addEventListener("click", () => jugar(e));
  });

  const observador = new IntersectionObserver(
    (entradas) => entradas.forEach((en) => {
      const e = escenas.find((x) => x.el === en.target);
      e.visible = en.intersectionRatio >= 0.4;
      e.el.classList.toggle("visible", en.isIntersecting);
      revisar(e);
    }),
    { threshold: [0, 0.4] }
  );
  escenas.forEach((e) => observador.observe(e.el));

  // base.js avisa cuando cambia el tema en pantalla
  document.addEventListener("mundo", (ev) => {
    escenas.forEach((e) => {
      e.activa = e.seccion === ev.detail;
      if (!e.activa) return;
      // Si se llega desde abajo, la escena no se ve: el título aparece de una vez
      if (!e.visible) revelar(e);
      setTimeout(() => revelar(e), 4000); // respaldo
      revisar(e);
    });
  });

  let ancho = innerWidth, espera;
  addEventListener("resize", () => {
    if (innerWidth === ancho) return;
    ancho = innerWidth;
    clearTimeout(espera);
    espera = setTimeout(() => escenas.forEach((e) => {
      cancelAnimationFrame(e.anim);
      if (e.jugada) { revelar(e); e.el.classList.add("terminada"); }
      construir(e);
    }), 150);
  });

  // ---------- Portada: las palabras del título caen con la misma g y rebotan ----------
  (function portada() {
    if (reducir) return;
    const caja = document.querySelector(".portada"), h1 = caja.querySelector("h1");
    const texto = h1.textContent.trim();
    h1.setAttribute("aria-label", texto);
    h1.textContent = "";
    const palabras = texto.split(" ").map((p, i, todas) => {
      const s = document.createElement("span");
      s.className = "palabra";
      s.textContent = p;
      s.setAttribute("aria-hidden", "true");
      h1.append(s, i < todas.length - 1 ? " " : "");
      return s;
    });
    // La pelota con los colores de los cinco temas hace de punto final
    const pelota = document.createElement("span");
    pelota.className = "pelota";
    palabras[palabras.length - 1].append(pelota);

    const G = 4200; // px/s², igual para todas: en caída libre g no depende de la masa
    let anim;
    function caer() {
      cancelAnimationFrame(anim);
      palabras.forEach((s) => (s.style.transform = ""));
      pelota.style.transform = "";
      // Cada palabra arranca justo arriba del borde de la pantalla
      const datos = palabras.map((s, i) => ({ s, h0: Math.min(600, s.getBoundingClientRect().bottom + 30), t0: i * 0.08, e: 0.32 }));
      const ultima = datos[datos.length - 1];
      const bola = { h0: Math.min(600, pelota.getBoundingClientRect().bottom + 30), e: 0.62 };
      bola.t0 = ultima.t0 + duracionRebote(ultima.h0, G, ultima.e) - 0.1;
      const fin = bola.t0 + duracionRebote(bola.h0, G, bola.e);
      const cuadro = (t) => {
        datos.forEach((d) => (d.s.style.transform = `translateY(${-rebote(Math.max(0, t - d.t0), d.h0, G, d.e)}px)`));
        const tb = Math.min(Math.max(0, t - bola.t0), fin - bola.t0);
        pelota.style.transform = `translateY(${-rebote(tb, bola.h0, G, bola.e)}px) rotate(${tb * 420}deg)`;
      };
      cuadro(0);
      caja.classList.add("lista");
      let inicio;
      const paso = (ahora) => {
        inicio ??= ahora;
        const t = (ahora - inicio) / 1000;
        cuadro(Math.min(t, fin));
        if (t < fin) anim = requestAnimationFrame(paso);
      };
      anim = requestAnimationFrame(paso);
    }
    caer();
    h1.addEventListener("click", caer);
  })();

  return { ESCENAS };
})();
