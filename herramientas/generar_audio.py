"""Genera las dos muestras de audio del tema 11 (misma nota, distinto timbre).

y(t) = Σ b_n · sen(2π · n · f0 · t), con f0 = 220 Hz (La3) y 20 armónicos.
  - la220-impares.wav: b_n = 1/n solo para n impar (onda casi cuadrada)
  - la220-todos.wav:   b_n = 1/n para todo n (diente de sierra)
Las dos se normalizan a la misma intensidad eficaz (RMS) para que la diferencia sea de timbre.
Uso: python herramientas/generar_audio.py   (necesita numpy)
"""
import wave
import numpy as np

FS, F0, DURACION, N = 22050, 220.0, 2.0, 20
t = np.arange(int(FS * DURACION)) / FS
# Envolvente: sube en 30 ms y se apaga en los últimos 250 ms, para que no haya clics
envolvente = np.minimum(1, t / 0.03) * np.minimum(1, (DURACION - t) / 0.25)

MUESTRAS = {
    "impares": {n: 1 / n for n in range(1, N + 1, 2)},
    "todos": {n: 1 / n for n in range(1, N + 1)},
}

for nombre, coeficientes in MUESTRAS.items():
    y = sum(b * np.sin(2 * np.pi * n * F0 * t) for n, b in coeficientes.items())
    y = y / np.sqrt(np.mean(y ** 2)) * 0.22 * envolvente
    with wave.open(f"audio/la220-{nombre}.wav", "wb") as archivo:
        archivo.setnchannels(1)
        archivo.setsampwidth(2)
        archivo.setframerate(FS)
        archivo.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
    print(f"audio/la220-{nombre}.wav listo")
