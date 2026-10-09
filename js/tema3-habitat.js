// Tema 3: el diagrama del hábitat responde a la velocidad de giro escogida.
// Para cada rpm se despeja el radio que da 1 g con a_c = ω²·r = g, y las marcas
// del anillo giran en tiempo real a esa velocidad (2 rpm = una vuelta cada 30 s).
(function () {
  const G = 9.81;
  const CX = 230, CY = 235, R_MARCAS = 169; // centro del anillo y radio de las marcas en el SVG
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const marcas = document.getElementById("habitat-marcas");
  const lectura = document.getElementById("habitat-lectura");
  let actual = 2;

  // Marcas sobre el casco: sin ellas un anillo girando se ve igual que uno quieto
  for (let i = 0; i < 16; i++) {
    const a = (i * 22.5 * Math.PI) / 180;
    Fis.svg("rect", { class: "d-marca", x: -5, y: -2.5, width: 10, height: 5,
      transform: `translate(${CX + R_MARCAS * Math.cos(a)},${CY + R_MARCAS * Math.sin(a)}) rotate(${i * 22.5 + 90})` }, marcas);
  }

  function escoger(rpm) {
    actual = rpm;
    const w = (rpm * 2 * Math.PI) / 60, r = G / (w * w), v = w * r;
    document.querySelectorAll("button[data-rpm]").forEach((b) => b.setAttribute("aria-pressed", +b.dataset.rpm === rpm));
    document.querySelectorAll("tr[data-rpm]").forEach((tr) => tr.classList.toggle("activa", +tr.dataset.rpm === rpm));
    document.getElementById("habitat-r").textContent = `r = ${Fis.n(r, 1)} m`;
    document.getElementById("habitat-v").textContent = `v = ω·r = ${Fis.n(v, 1)} m/s`;
    lectura.innerHTML =
      `<span>${rpm} rpm</span><span>ω = ${Fis.n(w, 4)} rad/s</span><span>T = ${Fis.n(60 / rpm, 0)} s por vuelta</span>` +
      `<span>r = ${Fis.n(r, 1)} m</span><span>v = ${Fis.n(v, 1)} m/s</span><span>a<sub>c</sub> = ω²·r = 9,81 m/s² = 1 g</span>`;
  }
  document.querySelectorAll("[data-rpm]").forEach((el) => el.addEventListener("click", () => escoger(+el.dataset.rpm)));
  escoger(actual);

  // Giro en tiempo real (antihorario, como la flecha ω): ángulo = ω·t
  let angulo = 0, previo = null, anim = 0;
  function girar(ahora) {
    if (previo !== null) angulo -= actual * 6 * ((ahora - previo) / 1000); // 1 rpm = 6 °/s
    previo = ahora;
    marcas.setAttribute("transform", `rotate(${angulo.toFixed(2)} ${CX} ${CY})`);
    anim = requestAnimationFrame(girar);
  }
  // Solo gira mientras el diagrama se ve
  new IntersectionObserver(([e]) => {
    cancelAnimationFrame(anim);
    previo = null;
    if (e.isIntersecting && !reducir) anim = requestAnimationFrame(girar);
  }).observe(marcas.closest(".diagrama"));
})();
