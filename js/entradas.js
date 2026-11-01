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

  const flecha = Fis.flecha;

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

  // ---------- Tema 4: un Fórmula 1 entra a toda velocidad y frena por fricción ----------
  ESCENAS.f1 = function (svg, W, H) {
    const rad = Math.PI / 180;
    const s = W < 560 ? 0.72 : 1.35;                  // escala del auto
    const asfalto = H - 46, contacto = asfalto + 22;  // donde las llantas tocan la pista
    // Pista: valla al fondo, piano rojo y blanco, asfalto
    let valla = `M0 ${asfalto - 34} H${W}`;
    for (let x = 20; x < W; x += 60) valla += ` M${x} ${asfalto - 34} V${asfalto - 6}`;
    S("path", { class: "l-regla", d: valla, "stroke-width": 2 }, svg);
    S("rect", { class: "e-sup", x: 0, y: asfalto, width: W, height: 34 }, svg);
    for (let x = 0, i = 0; x < W; x += 22, i++) S("rect", { class: i % 2 ? "e-tinta" : "e-acento", x, y: asfalto - 6, width: 22, height: 6 }, svg);
    S("line", { class: "l-regla", x1: 0, x2: W, y1: asfalto + 34, y2: asfalto + 34, "stroke-width": 2 }, svg);

    // Frenado con desaceleración constante a = μ·g: v² = v₀² − 2·a·d
    let v0 = W * (W < 560 ? 1.15 : 1), tb = 0.9;
    const xStop = W * (W < 560 ? 0.5 : 0.56), xIn = -120 * s - 20;
    let xB = xStop - (v0 * tb) / 2;
    if (xB < xIn) { xB = xIn; tb = (2 * (xStop - xIn)) / v0; }
    const a = v0 / tb, tE = (xB - xIn) / v0, PARA = tE + tb;
    function mov(t) {
      if (t < tE) return { x: xIn + v0 * t, v: v0 };
      if (t < PARA) { const τ = t - tE; return { x: xB + v0 * τ - 0.5 * a * τ * τ, v: v0 - a * τ }; }
      return { x: xStop, v: 0 };
    }

    const velocidad = S("path", { class: "l-2", fill: "none", "stroke-width": 2, "stroke-linecap": "round" }, svg);
    // Auto visto de lado, mirando a la derecha; (0, 0) es el suelo bajo el centro
    const auto = S("g", {}, svg);
    const chasis = S("g", {}, auto);
    S("rect", { class: "e-tinta-2", x: -100, y: -50, width: 5, height: 30 }, chasis);
    S("rect", { class: "e-tinta", x: -108, y: -54, width: 26, height: 5 }, chasis);
    S("rect", { class: "e-tinta", x: -106, y: -46, width: 20, height: 3 }, chasis);
    S("path", { class: "e-acento", d: "M-96 -12 L-96 -26 L-70 -28 L-44 -40 L-30 -46 L-18 -44 L-8 -32 L18 -30 L40 -24 L98 -15 L100 -12 Z" }, chasis);
    S("rect", { class: "e-tinta-2", x: -92, y: -12, width: 186, height: 4 }, chasis);
    S("path", { class: "l-fondo", fill: "none", d: "M-88 -16 H60", "stroke-width": 2 }, chasis);
    S("text", { class: "e-fondo", x: -36, y: -24, "text-anchor": "middle", style: "font: 700 13px var(--f-dato)" }, chasis).textContent = "4";
    S("rect", { class: "e-tinta", x: 80, y: -9, width: 28, height: 4 }, chasis);
    S("rect", { class: "e-tinta", x: 104, y: -15, width: 3, height: 10 }, chasis);
    S("circle", { class: "e-tinta-2", cx: 2, cy: -35, r: 5.5 }, chasis);
    S("path", { class: "l-tinta", fill: "none", d: "M-8 -33 Q4 -45 20 -31", "stroke-width": 2.6, "stroke-linecap": "round" }, chasis);
    // Llantas: ruedan sin deslizar, así que giran un ángulo θ = x / r
    const ruedas = [[-62, 18], [64, 16]].map(([x, r]) => {
      const g = S("g", { transform: `translate(${x},${-r})` }, auto);
      S("circle", { class: "e-fondo l-tinta", r, "stroke-width": 2 }, g);
      const gira = S("g", {}, g);
      S("circle", { class: "l-acento", r: r * 0.78, fill: "none", "stroke-width": 1.5, "stroke-dasharray": `${r * 0.9} ${r * 0.6}` }, gira);
      S("circle", { class: "e-sup l-2", r: r * 0.52, "stroke-width": 1 }, gira);
      let d = "";
      for (let i = 0; i < 5; i++) d += `M0 0 L${r * 0.5 * Math.cos(i * 72 * rad)} ${r * 0.5 * Math.sin(i * 72 * rad)} `;
      S("path", { class: "l-2", d, "stroke-width": 1.5 }, gira);
      const brillo = S("circle", { class: "e-acento", r: r * 0.36, opacity: 0 }, g);
      return { x, r, gira, brillo };
    });
    // Fuerza de fricción en cada llanta: apunta hacia atrás mientras frena
    const fuerzas = ruedas.map(() => flecha(svg, "flecha-tinta"));
    const etqF = S("text", { class: "hud", "text-anchor": "middle" }, svg);
    etqF.textContent = "f = μ·N";
    const [hud1, hud2] = hud(svg, 2);

    return {
      dur: PARA + 0.7,
      impacto: PARA,
      cuadro(t) {
        const m = mov(t), frena = t >= tE && t < PARA, d = t - PARA;
        auto.setAttribute("transform", `translate(${m.x},${contacto}) scale(${s})`);
        // Al frenar, el peso pasa adelante y la nariz baja; al detenerse, la suspensión oscila y se calma
        const cabeceo = frena ? 1.6 : d >= 0 ? 1.6 * Math.exp(-6 * d) * Math.cos(16 * d) : 0;
        chasis.setAttribute("transform", `rotate(${cabeceo},0,-20)`);
        ruedas.forEach((r) => {
          r.gira.setAttribute("transform", `rotate(${m.x / (r.r * s) / rad})`);
          r.brillo.setAttribute("opacity", frena ? 0.75 : d >= 0 ? Math.max(0, 0.75 - d * 1.2) : 0);
        });
        fuerzas.forEach((f, i) => f.poner(m.x + ruedas[i].x * s, contacto + 5, frena ? -34 * s : 0, 0));
        etqF.style.display = frena ? "" : "none";
        etqF.setAttribute("x", m.x - 16 * s);
        etqF.setAttribute("y", contacto + 9);
        // Líneas de velocidad detrás del auto
        const largo = 150 * (m.v / v0), atras = m.x - 112 * s;
        velocidad.setAttribute("d", largo < 4 ? "" : [10, 22, 34].map((y, i) => `M${atras - 8 - i * 14} ${contacto - y * s} h${-largo * (1 - i * 0.2)}`).join(" "));
        velocidad.style.opacity = m.v / v0;
        hud1.textContent = `v = ${Fis.n((m.v / v0) * 300, 0)} km/h`;
        hud2.textContent = frena ? "frenando: a = −μ·g" : d >= 0 ? "detenido por la fricción" : "";
      },
    };
  };

  // ---------- Tema 5: el cursor estira un resorte, lo suelta y oscila con F = −k·x ----------
  ESCENAS.resorte = function (svg, W, H) {
    const piso = H - 40, L = H < 220 ? 44 : 54;        // superficie sin fricción y lado del bloque
    const xPared = 30, xEq = Math.round(W * (W < 560 ? 0.42 : 0.36));
    const A = Math.min(W * 0.26, 200), yc = piso - L / 2;
    const SUELTA = 1.1, OMEGA = (2 * Math.PI) / 0.62, GAMMA = 1.8, CRUCE = SUELTA + Math.PI / 2 / OMEGA;
    // Desplazamiento x desde el equilibrio (px): se estira y luego oscila amortiguado
    function desp(t) {
      if (t < 0.4) return 0;
      if (t < SUELTA) return tramo(0, A, t - 0.4, 0.7);
      return A * Math.exp(-GAMMA * (t - SUELTA)) * Math.cos(OMEGA * (t - SUELTA));
    }
    function resorte(xa, xb) {
      const n = W < 560 ? 8 : 12, recto = 10, paso = (xb - xa - 2 * recto) / (2 * n);
      const pts = [[xa, yc], [xa + recto, yc]];
      for (let i = 1; i <= 2 * n; i++) pts.push([xa + recto + (i - 0.5) * paso, yc + (i % 2 ? -11 : 11)]);
      pts.push([xb - recto, yc], [xb, yc]);
      return pts.map(([a, b]) => a.toFixed(1) + "," + b).join(" ");
    }

    // Pared y piso con rayado, como en los diagramas de clase
    let d = `M${xPared} ${piso - 100} V${piso} H${W - 10}`;
    for (let y = piso - 96; y <= piso; y += 12) d += ` M${xPared} ${y} l-10 10`;
    for (let x = xPared + 14; x < W - 10; x += 14) d += ` M${x} ${piso} l-8 9`;
    S("path", { class: "l-2", fill: "none", d, "stroke-width": 1.5 }, svg);
    S("line", { class: "l-2", x1: xEq, x2: xEq, y1: piso, y2: piso - L - 44, "stroke-dasharray": "4 4" }, svg);
    S("text", { x: xEq, y: piso - L - 50, "text-anchor": "middle" }, svg).textContent = "x = 0";

    const espiral = S("polyline", { class: "l-tinta", fill: "none", "stroke-width": 2, "stroke-linejoin": "round" }, svg);
    const bloque = S("g", {}, svg);
    S("rect", { class: "e-acento", x: -L / 2, y: -L, width: L, height: L, rx: 6 }, bloque);
    S("text", { class: "e-fondo", x: 0, y: -L / 2 + 6, "text-anchor": "middle", style: "font: 700 17px var(--f-dato)" }, bloque).textContent = "m";
    const llave = S("path", { class: "l-tinta", fill: "none", "stroke-width": 1.5 }, svg);
    const etqX = S("text", { class: "hud", "text-anchor": "middle" }, svg);
    etqX.textContent = "x";
    const fuerza = flecha(svg);
    const etqF = S("text", { class: "hud", "text-anchor": "middle" }, svg);
    etqF.textContent = "F = −k·x";
    // Cursor del mouse que agarra el bloque
    const cursor = S("path", { class: "e-tinta l-fondo", d: "M0 0 V17 L4.5 13 L7.5 20 L10 19 L7 12.5 H12.5 Z", "stroke-width": 1.2, transform: "scale(1.3)" }, svg);
    const [hud1, hud2] = hud(svg, 2);

    const K = 90 / A; // largo de la flecha por cada px de desplazamiento
    return {
      dur: SUELTA + 2.4,
      impacto: CRUCE,
      cuadro(t) {
        const fin = t >= SUELTA + 2.4, x = fin ? 0 : desp(t), bx = xEq + x;
        bloque.setAttribute("transform", `translate(${bx},${piso})`);
        espiral.setAttribute("points", resorte(xPared, bx - L / 2));
        // Desplazamiento x medido desde el equilibrio
        const hay = Math.abs(x) > 6;
        llave.setAttribute("d", hay ? `M${xEq} ${piso + 12} v9 M${xEq} ${piso + 16} H${bx} M${bx} ${piso + 12} v9` : "");
        etqX.style.display = hay ? "" : "none";
        etqX.setAttribute("x", xEq + x / 2);
        etqX.setAttribute("y", piso + 32);
        // Fuerza del resorte sobre el bloque: siempre hacia el equilibrio
        fuerza.poner(bx, piso - L - 14, -K * x, 0);
        etqF.style.display = hay ? "" : "none";
        etqF.setAttribute("x", bx - (K * x) / 2);
        etqF.setAttribute("y", piso - L - 22);
        // El cursor llega, estira y suelta
        const agarre = [xEq + L / 2 - 3, yc - 4];
        let c, op = 1;
        if (t < 0.4) c = [tramo(W - 40, agarre[0], t, 0.4), tramo(26, agarre[1], t, 0.4)];
        else if (t < SUELTA) c = [agarre[0] + x, agarre[1]];
        else { const τ = t - SUELTA; c = [agarre[0] + A + 40 * τ, agarre[1] - 70 * τ]; op = Math.max(0, 1 - τ / 0.3); }
        cursor.setAttribute("transform", `translate(${c[0]},${c[1]}) scale(1.3)`);
        cursor.style.opacity = op;
        // Datos: k = 50 N/m y el estiramiento máximo equivale a 5 cm
        const cm = (x / A) * 5;
        hud1.textContent = `x = ${Fis.n(cm, 1)} cm · F = ${Fis.n(-0.5 * cm, 2).replace("-", "−")} N`;
        hud2.textContent = t < 0.4 ? "k = 50 N/m" : t < SUELTA ? "estirando el resorte" : fin ? "en equilibrio: x = 0, F = 0" : "suelto: F = −k·x lo regresa";
      },
    };
  };

  // Estrellas pseudoaleatorias: siempre quedan en el mismo lugar
  function estrellas(svg, W, H, semilla) {
    const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < W / 8; i++) {
      S("circle", { class: "e-tinta", cx: azar() * W, cy: azar() * H, r: 0.5 + azar() * 1.1, opacity: 0.2 + azar() * 0.6 }, svg);
    }
  }

  // ---------- Tema 6: el auto frena y su energía cinética vuelve a la batería ----------
  ESCENAS.regen = function (svg, W, H) {
    const s = W < 560 ? 0.72 : 1.2;
    const piso = H - 26;
    const MASA = 1700, V_REAL = 50 / 3.6, ETA = 0.7;  // kg, m/s y eficiencia de recuperación
    const K0 = (0.5 * MASA * V_REAL * V_REAL) / 3600; // energía cinética inicial en Wh
    // Frenado con desaceleración constante, igual que en el tema 4
    const xStop = W * (W < 560 ? 0.42 : 0.42), v0 = W * 0.85, tb = 1.3, xIn = -110 * s;
    const d = (v0 * tb) / 2, xB = xStop - d, tE = Math.max(0, (xB - xIn) / v0), PARA = tE + tb;
    const mov = (t) => {
      if (t < tE) return { x: xIn + v0 * t, v: v0 };
      if (t < PARA) { const τ = t - tE; return { x: xB + v0 * τ - (0.5 * v0 / tb) * τ * τ, v: v0 * (1 - τ / tb) }; }
      return { x: xStop, v: 0 };
    };

    S("line", { class: "l-2", x1: 0, x2: W, y1: piso, y2: piso, "stroke-width": 2 }, svg);
    S("line", { class: "l-regla", x1: 0, x2: W, y1: piso + 12, y2: piso + 12, "stroke-width": 2, "stroke-dasharray": "22 16" }, svg);

    // Batería que se llena con lo recuperado
    const bx = Math.min(W - 92, xStop + 130 * s), by = 26, bw = 78, bh = 36;
    S("rect", { class: "e-sup l-tinta", x: bx, y: by, width: bw, height: bh, rx: 5, "stroke-width": 2 }, svg);
    S("rect", { class: "e-tinta", x: bx + bw, y: by + 11, width: 5, height: 14 }, svg);
    const carga = S("rect", { class: "e-acento", x: bx + 4, y: by + 4, height: bh - 8, rx: 2 }, svg);
    const etqBat = S("text", { x: bx + bw / 2, y: by + bh + 16, "text-anchor": "middle" }, svg);
    // Energía que viaja de la rueda a la batería
    const chispas = [0, 1, 2, 3, 4].map(() => S("circle", { class: "e-acento", r: 3.5 }, svg));

    // Auto eléctrico visto de lado; (0, 0) es el suelo bajo el centro
    const auto = S("g", {}, svg), chasis = S("g", {}, auto);
    S("path", { class: "e-tinta", d: "M-88 -12 V-30 Q-86 -38 -72 -40 L-46 -44 Q-24 -66 12 -66 Q34 -66 52 -44 L78 -38 Q90 -34 90 -24 V-12 Z" }, chasis);
    S("path", { class: "e-fondo", d: "M-36 -44 Q-20 -60 -2 -60 V-44 Z M6 -60 Q28 -60 42 -44 H6 Z" }, chasis);
    S("rect", { class: "e-acento", x: 80, y: -32, width: 9, height: 5, rx: 2 }, chasis);
    S("path", { class: "e-acento", d: "M-6 -36 L-14 -22 H-7 L-11 -12 L2 -27 H-5 L0 -36 Z" }, chasis);
    const ruedas = [-54, 54].map((x) => {
      const g = S("g", { transform: `translate(${x},-15)` }, auto);
      S("circle", { class: "e-fondo l-tinta", r: 15, "stroke-width": 2 }, g);
      const gira = S("g", {}, g);
      S("path", { class: "l-2", d: "M-9 0 H9 M0 -9 V9 M-6 -6 L6 6 M6 -6 L-6 6", "stroke-width": 1.5 }, gira);
      return { x, gira };
    });
    const fuerza = flecha(svg, "flecha-tinta");
    const velocidad = S("path", { class: "l-2", fill: "none", "stroke-width": 2, "stroke-linecap": "round" }, svg);
    const [hud1, hud2] = hud(svg, 2);

    return {
      dur: PARA + 0.6,
      impacto: PARA - 0.15,
      cuadro(t) {
        const m = mov(t), frena = t >= tE && t < PARA;
        auto.setAttribute("transform", `translate(${m.x},${piso}) scale(${s})`);
        const d2 = t - PARA;
        const cabeceo = frena ? 1.4 : d2 >= 0 ? 1.4 * Math.exp(-6 * d2) * Math.cos(16 * d2) : 0;
        chasis.setAttribute("transform", `rotate(${cabeceo},0,-20)`);
        ruedas.forEach((r) => r.gira.setAttribute("transform", `rotate(${(m.x / (15 * s)) * 57.3})`));
        fuerza.poner(m.x + 40 * s, piso - 72 * s, frena ? -44 * s : 0, 0);
        const largo = 110 * (m.v / v0), atras = m.x - 96 * s;
        velocidad.setAttribute("d", largo < 4 ? "" : [16, 30, 44].map((y, i) => `M${atras - i * 12} ${piso - y * s} h${-largo * (1 - i * 0.2)}`).join(" "));
        // K = ½·m·v²: lo que pierde el auto al frenar, multiplicado por η, entra a la batería
        const vReal = V_REAL * (m.v / v0), k = (0.5 * MASA * vReal * vReal) / 3600;
        const recuperada = (K0 - k) * ETA;
        carga.setAttribute("width", Math.max(0, (bw - 8) * (recuperada / (K0 * ETA))));
        etqBat.textContent = `+${Fis.n(recuperada, 1)} Wh`;
        chispas.forEach((c, i) => {
          const u = (t * 1.8 + i / 5) % 1;
          const x0 = m.x + 54 * s, y0 = piso - 16 * s, x1 = bx + 8, y1 = by + bh / 2;
          c.setAttribute("cx", x0 + (x1 - x0) * u);
          c.setAttribute("cy", y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * 26);
          c.style.display = frena ? "" : "none";
        });
        hud1.textContent = `v = ${Fis.n(vReal * 3.6, 0)} km/h · K = ${Fis.n(k, 1)} Wh`;
        hud2.textContent = frena ? `E recuperada = η·ΔK (η = 70 %)` : d2 >= 0 ? "detenido: K se transformó" : "acercándose al alto";
      },
    };
  };

  // ---------- Tema 7: la misma pelota con un rebote creíble y con uno imposible ----------
  ESCENAS.pelota = function (svg, W, H) {
    const piso = H - 22, G = H < 220 ? 760 : 980, H0 = piso - 58, R = H < 220 ? 11 : 14;
    // Altura sobre el piso al tiempo t: cae y rebota con v' = e·v, con e menor o mayor que 1
    function altura(t, e) {
      let v = Math.sqrt(2 * G * H0), caida = v / G;
      if (t < caida) return { y: H0 - 0.5 * G * t * t, n: 0 };
      t -= caida;
      for (let n = 1; n < 30; n++) {
        v *= e;
        if (v < 18) return { y: 0, n };
        const vuelo = (2 * v) / G;
        if (t < vuelo) return { y: v * t - 0.5 * G * t * t, n, dt: t, vuelo };
        t -= vuelo;
      }
      return { y: 0, n: 30 };
    }
    S("line", { class: "l-2", x1: 0, x2: W, y1: piso, y2: piso, "stroke-width": 2 }, svg);
    const buena = W * 0.34, mala = W * 0.7;
    // Alturas que predice h' = e²·h para el rebote creíble
    for (let n = 1, h = H0 * 0.64; n <= 3; n++, h *= 0.64) {
      S("line", { class: "l-acento", x1: buena - 26, x2: buena + 26, y1: piso - h - R, y2: piso - h - R, "stroke-width": 1.5, "stroke-dasharray": "3 3" }, svg);
    }
    S("text", { x: buena, y: piso + 16, "text-anchor": "middle" }, svg).textContent = "e = 0,80";
    S("text", { x: mala, y: piso + 16, "text-anchor": "middle" }, svg).textContent = "e = 1,10 (imposible)";
    const b1 = S("ellipse", { class: "e-acento" }, svg), b2 = S("ellipse", { class: "e-tinta-2" }, svg);
    const [hud1, hud2] = hud(svg, 2);
    hud1.textContent = "v′ = −e·v · h′ = e²·h";
    const poner = (el, x, a, t, e) => {
      const r = altura(t, e);
      const aplasta = r.y < 8 && r.n > 0 ? 0.72 + (0.28 * r.y) / 8 : 1;
      el.setAttribute("cx", x);
      el.setAttribute("cy", piso - r.y - R * aplasta);
      el.setAttribute("rx", R / Math.sqrt(aplasta));
      el.setAttribute("ry", R * aplasta);
      return r;
    };
    return {
      dur: 3.4,
      impacto: 1.5,
      cuadro(t) {
        const r1 = poner(b1, buena, 0, t, 0.8);
        poner(b2, mala, 0, t, 1.1);
        hud2.textContent = `rebotes de la pelota creíble: ${r1.n}`;
      },
    };
  };

  // ---------- Tema 8: el satélite gira para apuntar a una estrella usando su rueda ----------
  ESCENAS.satelite = function (svg, W, H) {
    estrellas(svg, W, H, 23);
    const k = H < 220 ? 0.62 : 0.95, cx = W * 0.5, cy = H * 0.56;
    const T = 2.6, GIRO = -62;                        // s y grados: acelera la primera mitad y frena la segunda
    const I_S = 1500, I_R = 0.08, ACELERADA = 25;     // la escena va 25 veces más rápido que el giro real
    const rumbo = ((-90 + GIRO) * Math.PI) / 180;     // el telescopio empieza hacia arriba y termina aquí
    const objetivo = { x: cx + 112 * k * Math.cos(rumbo), y: cy + 112 * k * Math.sin(rumbo) };
    const estrella = S("path", { class: "e-acento", d: "M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5 Z", transform: `translate(${objetivo.x},${objetivo.y})` }, svg);
    const haz = S("line", { class: "l-acento", "stroke-width": 1.5, "stroke-dasharray": "4 4" }, svg);
    const cuerpo = S("g", {}, svg);
    [-1, 1].forEach((l) => {
      S("rect", { class: "e-sup l-2", x: l > 0 ? 50 * k : -130 * k, y: -15 * k, width: 80 * k, height: 30 * k, "stroke-width": 1 }, cuerpo);
      S("line", { class: "l-2", x1: l * 36 * k, x2: l * 50 * k, y1: 0, y2: 0, "stroke-width": 3 }, cuerpo);
    });
    S("rect", { class: "e-regla l-tinta", x: -36 * k, y: -36 * k, width: 72 * k, height: 72 * k, rx: 5, "stroke-width": 1.5 }, cuerpo);
    // Tubo del telescopio, en la parte superior del cuerpo
    S("rect", { class: "e-sup l-tinta", x: -11 * k, y: -60 * k, width: 22 * k, height: 24 * k, "stroke-width": 1.5 }, cuerpo);
    const rueda = S("g", {}, cuerpo);
    S("circle", { class: "l-acento", r: 24 * k, fill: "none", "stroke-width": 3.5 }, rueda);
    S("path", { class: "l-acento", d: `M0 ${-24 * k} V${24 * k} M${-24 * k} 0 H${24 * k}`, "stroke-width": 1.5 }, rueda);
    S("circle", { class: "e-tinta", cy: -24 * k, r: 3 }, rueda);
    const [hud1, hud2] = hud(svg, 2);
    const omegaS = (t) => (t <= 0 || t >= T ? 0 : vTramo(0, (GIRO * Math.PI) / 180, t, T));
    return {
      dur: T + 0.5,
      impacto: T - 0.2,
      cuadro(t) {
        const ang = tramo(0, GIRO, t, T);
        cuerpo.setAttribute("transform", `translate(${cx},${cy}) rotate(${ang})`);
        // Conservación del momento angular: ω_r = −(I_s / I_r)·ω_s, con los valores reales del giro
        const ws = omegaS(t) / ACELERADA, wr = (-I_S / I_R) * ws, rpmReal = (wr * 60) / (2 * Math.PI);
        // Giro dibujado de la rueda: proporcional a la integral de ω_s, relativo al cuerpo
        rueda.setAttribute("transform", `rotate(${-ang * 7})`);
        const listo = t >= T - 0.1;
        haz.style.display = listo ? "" : "none";
        estrella.style.opacity = listo ? 1 : 0.45;
        const rad = ((ang - 90) * Math.PI) / 180;
        haz.setAttribute("x1", cx + 62 * k * Math.cos(rad));
        haz.setAttribute("y1", cy + 62 * k * Math.sin(rad));
        haz.setAttribute("x2", objetivo.x);
        haz.setAttribute("y2", objetivo.y);
        hud1.textContent = `ωᵣ = ${Fis.n(rpmReal, 0)} rpm · ωₛ = ${Fis.n((ws * 180) / Math.PI, 2).replace("-", "−")} °/s`;
        hud2.textContent = listo ? "apuntando: la rueda frenó y L total sigue en 0" : "Iₛ·ωₛ + Iᵣ·ωᵣ = 0 (25 veces más rápido que lo real)";
      },
    };
  };

  // ---------- Tema 9: una sonda pasa detrás de un planeta en movimiento y sale más rápido ----------
  ESCENAS.voyager = function (svg, W, H) {
    estrellas(svg, W, H, 31);
    const u = Math.min(H, W / 2.5);                  // unidad de longitud de la escena
    const T = 2.8, TE = 1.25, PASO = 1 / 240;        // duración, instante del encuentro y paso de cálculo
    const V = 0.9 * u, VREL = 0.95 * u, ALFA = (58 * Math.PI) / 180, B = 0.36 * u;
    const GM = 0.75 * B * VREL * VREL;               // gravedad del planeta: da unos 75° de desvío
    const cx = W * 0.5, cy = H * 0.5;
    const planeta = (t) => ({ x: cx + V * (t - TE), y: cy + 0.05 * u });
    // Velocidad relativa al planeta al llegar, y posición inicial para pasar por detrás de él
    const dir = { x: -Math.cos(ALFA), y: -Math.sin(ALFA) }, nor = { x: -Math.sin(ALFA), y: Math.cos(ALFA) };
    const p0 = planeta(0);
    let r = { x: p0.x - dir.x * VREL * TE * 1.25 + nor.x * B, y: p0.y - dir.y * VREL * TE * 1.25 + nor.y * B };
    let v = { x: dir.x * VREL + V, y: dir.y * VREL };
    // Se integra de una vez F = G·M·m/r², y luego solo se muestran los resultados
    const estados = [];
    for (let i = 0; i <= Math.ceil(T / PASO); i++) {
      const t = i * PASO, p = planeta(t);
      const dx = p.x - r.x, dy = p.y - r.y, d3 = Math.pow(dx * dx + dy * dy, 1.5);
      v = { x: v.x + (GM * dx / d3) * PASO, y: v.y + (GM * dy / d3) * PASO };
      r = { x: r.x + v.x * PASO, y: r.y + v.y * PASO };
      estados.push({ x: r.x, y: r.y, sol: Math.hypot(v.x, v.y), rel: Math.hypot(v.x - V, v.y) });
    }
    const estado = (t) => estados[Math.max(0, Math.min(estados.length - 1, Math.round(t / PASO)))];
    const KM_S = 13 / V; // escala: el planeta se mueve a 13 km/s, como Júpiter

    const R = 0.15 * u;
    const pl = S("g", {}, svg);
    S("circle", { class: "e-acento", r: R, opacity: 0.9 }, pl);
    [-0.55, -0.15, 0.3, 0.65].forEach((f, i) => {
      const y = f * R, a = Math.sqrt(R * R - y * y);
      S("line", { class: "l-fondo", x1: -a, x2: a, y1: y, y2: y, "stroke-width": i % 2 ? 3 : 1.5, opacity: 0.55 }, pl);
    });
    const velPlaneta = flecha(svg);
    const estela = S("polyline", { class: "l-2", fill: "none", "stroke-width": 1.5, "stroke-dasharray": "2 5" }, svg);
    const sonda = S("g", {}, svg);
    S("circle", { class: "e-tinta", r: 3.5 }, sonda);
    S("path", { class: "l-tinta", d: "M-7 -5 Q-2 0 -7 5", fill: "none", "stroke-width": 1.5 }, sonda);
    const velSonda = flecha(svg, "flecha-tinta");
    const [hud1, hud2] = hud(svg, 2);
    return {
      dur: T,
      impacto: TE + 0.45,
      cuadro(t) {
        const p = planeta(t), e = estado(t), previo = estado(t - 0.02);
        pl.setAttribute("transform", `translate(${p.x},${p.y})`);
        velPlaneta.poner(p.x, p.y + R + 10, 0.4 * V, 0);
        sonda.setAttribute("transform", `translate(${e.x},${e.y}) rotate(${(Math.atan2(e.y - previo.y, e.x - previo.x) * 180) / Math.PI})`);
        const dvx = (e.x - previo.x) / 0.02, dvy = (e.y - previo.y) / 0.02;
        velSonda.poner(e.x, e.y, dvx * 0.14, dvy * 0.14);
        const pts = [];
        for (let s = 0; s <= t; s += 0.03) { const q = estado(s); pts.push(q.x.toFixed(1) + "," + q.y.toFixed(1)); }
        estela.setAttribute("points", pts.join(" "));
        hud1.textContent = `respecto al Sol: ${Fis.n(e.sol * KM_S, 1)} km/s`;
        hud2.textContent = `respecto al planeta: ${Fis.n(e.rel * KM_S, 1)} km/s`;
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
