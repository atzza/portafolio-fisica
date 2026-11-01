// Tema 8: el diagrama del satélite responde a la velocidad de la rueda de reacción.
// Sin torques externos, I_s·ω_s + I_r·ω_r = 0: lo que gana la rueda lo pierde el satélite.
(function () {
  const I_S = 1500, I_R = 0.08;   // kg·m², valores ilustrativos declarados en la página
  const RPM_MAX = 6000;
  const VISUAL_SAT = 10;          // el giro del satélite se dibuja 10 veces más rápido
  const VISUAL_RUEDA = 1080 / RPM_MAX; // °/s dibujados por cada rpm: 6000 rpm se ven como 3 vueltas por segundo
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = (id) => document.getElementById(id);
  const cuerpo = el("sat-cuerpo"), rueda = el("sat-rueda");

  let rpm = 0, objetivo = 0, angS = 0, angR = 0, previo = null, anim = 0;

  const omegaR = (r) => (r * 2 * Math.PI) / 60;       // rad/s
  const omegaS = (r) => -(I_R * omegaR(r)) / I_S;     // rad/s

  function mostrar() {
    const wr = omegaR(rpm), ws = omegaS(rpm), lr = I_R * wr;
    const grados = (ws * 180) / Math.PI, sat = rpm >= RPM_MAX - 0.5;
    el("sat-texto-ls").textContent = `Lₛ = Iₛ·ωₛ = ${Fis.n(I_S * ws)} N·m·s`.replace("-", "−");
    el("sat-texto-lr").textContent = `Lᵣ = Iᵣ·ωᵣ = +${Fis.n(lr)} N·m·s`;
    el("sat-texto-ws").textContent = `ωₛ = ${Fis.n(grados)} °/s`.replace("-", "−");
    el("sat-texto-wr").textContent = `ωᵣ = ${Fis.n(rpm, 0)} rpm`;
    // Barras del intercambio: las dos miden lo mismo y apuntan en sentidos opuestos
    const escala = 150 / (I_R * omegaR(RPM_MAX));
    const largo = lr * escala;
    el("sat-barra-s").setAttribute("x", 190 - largo);
    el("sat-barra-s").setAttribute("width", largo);
    el("sat-barra-r").setAttribute("width", largo);
    el("sat-suma").textContent = `L total = ${Fis.n(Math.abs(I_S * ws + lr))} N·m·s`;
    el("sat-limite").setAttribute("class", sat ? "d-acento" : "");
    el("sat-lectura").innerHTML =
      `<span>${Fis.n(rpm, 0)} rpm</span><span>ω<sub>r</sub> = ${Fis.n(wr, 1)} rad/s</span><span>L<sub>r</sub> = ${Fis.n(lr)} N·m·s</span>` +
      `<span>ω<sub>s</sub> = ${Fis.n(grados).replace("-", "−")} °/s</span>` + (sat ? "<span>Rueda saturada: ya no puede absorber más</span>" : `<span>margen: ${Fis.n(I_R * omegaR(RPM_MAX) - lr)} N·m·s</span>`);
  }

  function escoger(r) {
    objetivo = r;
    document.querySelectorAll("button[data-sat]").forEach((b) => b.setAttribute("aria-pressed", +b.dataset.sat === r));
    if (reducir) { rpm = r; mostrar(); }
  }
  document.querySelectorAll("[data-sat]").forEach((b) => b.addEventListener("click", () => escoger(+b.dataset.sat)));

  // La rueda cambia de velocidad en poco más de un segundo: mientras tanto el motor aplica un torque
  function cuadro(ahora) {
    if (previo !== null) {
      const dt = Math.min(0.1, (ahora - previo) / 1000);
      const dif = objetivo - rpm, tasa = 4000 * dt;
      rpm = Math.abs(dif) <= tasa ? objetivo : rpm + Math.sign(dif) * tasa;
      angS += ((omegaS(rpm) * 180) / Math.PI) * VISUAL_SAT * dt;
      angR += rpm * VISUAL_RUEDA * dt;
      cuerpo.setAttribute("transform", `rotate(${angS.toFixed(2)} 210 210)`);
      // La rueda va dentro del cuerpo: su ángulo se dibuja relativo a él
      rueda.setAttribute("transform", `rotate(${(angR - angS).toFixed(2)} 210 210)`);
      mostrar();
    }
    previo = ahora;
    anim = requestAnimationFrame(cuadro);
  }
  new IntersectionObserver(([e]) => {
    cancelAnimationFrame(anim);
    previo = null;
    if (e.isIntersecting && !reducir) anim = requestAnimationFrame(cuadro);
  }).observe(el("sat-dibujo"));

  escoger(1000);
  rpm = 1000;
  mostrar();
})();
