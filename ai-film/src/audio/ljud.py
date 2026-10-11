"""Instrument, ljudeffekter och mixverktyg för klippets ljudspår. Används av klipp_audio.py.

Tempot är 100 slag per minut. Ett slag är 0,6 s och en takt 2,4 s.
"""
import sys, wave, pathlib
import numpy as np
from scipy import signal

SR = 44100
BEAT = 0.6
BAR = 2.4
DUR = 98.4
N = int((DUR + 1.5) * SR)
rng = np.random.default_rng(11)


# ---------- grundstenar ----------
def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(n):
    return np.arange(n) / SR


def osc(f, n, kind="saw", harm=16, phase=0.0):
    t = tt(n)
    kmax = max(1, min(harm, int(SR / 2.2 / f)))
    x = np.zeros(n)
    for k in range(1, kmax + 1):
        if kind == "saw":
            x += np.sin(2 * np.pi * k * (f * t + phase)) / k * (1 if k % 2 else -1)
        elif kind == "square":
            if k % 2:
                x += np.sin(2 * np.pi * k * (f * t + phase)) / k
        elif kind == "sine":
            x += np.sin(2 * np.pi * (f * t + phase))
            break
    return x * (2 / np.pi)


def filt(x, kind, fc, order=2):
    sos = signal.butter(order, fc, btype=kind, fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def lp(x, fc, order=2):
    return filt(x, "low", min(fc, SR * 0.45), order)


def hp(x, fc, order=2):
    return filt(x, "high", fc, order)


def bp(x, lo, hi, order=2):
    return filt(x, "band", [lo, min(hi, SR * 0.45)], order)


def edges(x, a=0.003, r=0.02):
    n = len(x)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e = np.ones(n)
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return x * e if x.ndim == 1 else x * e[:, None]


def stereo(x, pan=0.0):
    if x.ndim == 2:
        return x
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1) * 1.2


def new():
    return np.zeros((N, 2))


def put(buf, x, t, gain=1.0, pan=0.0):
    x = stereo(x, pan) * gain
    i = int(round(t * SR))
    if i < 0:
        x = x[-i:]
        i = 0
    j = min(N, i + len(x))
    if j > i:
        buf[i:j] += x[: j - i]


def make_ir(dur=2.2, decay=2.6, tone=5200):
    n = int(dur * SR)
    t = tt(n)
    ir = rng.standard_normal((n, 2)) * np.exp(-t * decay)[:, None]
    ir = lp(ir, tone)
    ir[: int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))[:, None]
    return ir / np.sqrt((ir ** 2).sum(0)).mean()


IR_HALL = make_ir()
IR_ROOM = make_ir(0.5, 9.0, 7000)


def reverb(x, ir, wet):
    y = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in (0, 1)], 1)
    return x + y * wet


def pingpong(x, delay, fb=0.35, mix=0.35, taps=5):
    y = np.zeros_like(x)
    d = int(delay * SR)
    for k in range(1, taps + 1):
        g = mix * fb ** (k - 1)
        src = x[: len(x) - k * d]
        if k % 2:
            y[k * d:, 0] += src.mean(1) * g
        else:
            y[k * d:, 1] += src.mean(1) * g
    return x + y


# ---------- trummor ----------
def kick():
    n = int(0.45 * SR)
    t = tt(n)
    f = 46 + 125 * np.exp(-t * 32)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(n), 1500) * np.exp(-t * 420) * 0.18
    return edges(np.tanh((x + click) * 1.7), 0.001, 0.03)


def clap():
    n = int(0.32 * SR)
    t = tt(n)
    nz = bp(rng.standard_normal(n), 900, 3800)
    e = np.zeros(n)
    for d in (0.0, 0.011, 0.023):
        e += (t >= d) * np.exp(-np.clip(t - d, 0, None) * 95)
    e += (t >= 0.03) * np.exp(-np.clip(t - 0.03, 0, None) * 20) * 0.7
    return edges(nz * e * 0.55)


def hat(open_=False):
    n = int((0.22 if open_ else 0.06) * SR)
    t = tt(n)
    return edges(hp(rng.standard_normal(n), 7500, 4) * np.exp(-t * (16 if open_ else 75)), 0.0005, 0.01)


def snare():
    n = int(0.2 * SR)
    t = tt(n)
    return edges(bp(rng.standard_normal(n), 1400, 6500) * np.exp(-t * 26) * 0.7 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 34) * 0.5)


def tom(f0):
    n = int(0.35 * SR)
    t = tt(n)
    f = f0 * (0.6 + 0.4 * np.exp(-t * 14))
    return edges(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9))


# ---------- tonande instrument ----------
_cache = {}


def bass_note(m, dur):
    key = ("b", m, dur)
    if key not in _cache:
        f = midi(m)
        n = int(dur * SR)
        t = tt(n)
        x = lp(osc(f, n, "saw", 10) * 0.55, 520) + np.sin(2 * np.pi * f * t) * 0.8
        _cache[key] = edges(x * np.exp(-t * 2.6), 0.004, 0.03)
    return _cache[key]


def pluck(m, bright=2600):
    key = ("p", m, bright)
    if key not in _cache:
        f = midi(m)
        n = int(0.5 * SR)
        t = tt(n)
        x = osc(f, n, "saw", 14) * 0.7 + osc(f, n, "square", 9) * 0.3
        y = lp(x, bright) * np.exp(-t * 13) + lp(x, 750) * np.exp(-t * 5.5) * 0.6
        _cache[key] = edges(y, 0.002, 0.04)
    return _cache[key]


def pad_chord(notes, dur, bright=1300):
    key = ("pad", tuple(notes), dur, bright)
    if key not in _cache:
        n = int(dur * SR)
        ch = []
        for side in (0, 1):
            x = np.zeros(n)
            for m in list(notes) + [notes[0] + 12]:
                for det in (-9, 0, 8):
                    x += osc(midi(m) * 2 ** (det / 1200), n, "saw", 12, phase=rng.random())
            ch.append(lp(x, bright) / 9)
        _cache[key] = edges(np.stack(ch, 1), 0.35, 0.55)
    return _cache[key]


def stab(notes, dur=1.9, bright=3200):
    n = int(dur * SR)
    t = tt(n)
    ch = []
    for side in (0, 1):
        x = np.zeros(n)
        for m in list(notes) + [notes[0] + 12, notes[1] + 12]:
            for det in (-10, 9):
                x += osc(midi(m) * 2 ** (det / 1200), n, "saw", 18, phase=rng.random())
        ch.append((lp(x, bright) * np.exp(-t * 5) + lp(x, 900) * np.exp(-t * 1.6) * 0.7) / 8)
    return edges(np.stack(ch, 1), 0.003, 0.25)


def bell(m, dur=1.6):
    f = midi(m)
    n = int(dur * SR)
    t = tt(n)
    mod = np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 7) * 1.6
    return edges(np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 3.0), 0.002, 0.1)


# ---------- ljudeffekter ----------
def sweep_noise(dur, shape="whoosh", lo=250, hi=9000, bands=7):
    n = int(dur * SR)
    t = tt(n) / dur
    nz = rng.standard_normal(n)
    fr = np.geomspace(lo, hi, bands + 1)
    pos = (t ** 1.4 if shape == "rise" else np.sin(np.pi * np.clip(t, 0, 1) * 0.5) ** 1.2) * (bands - 1)
    y = np.zeros(n)
    for k in range(bands):
        y += bp(nz, fr[k], fr[k + 1]) * np.clip(1 - np.abs(pos - k), 0, 1)
    amp = t ** 2.2 if shape == "rise" else np.sin(np.pi * t) ** 2
    return y * amp


def whoosh(dur=0.6):
    x = sweep_noise(dur)
    p = np.linspace(-0.8, 0.8, len(x))
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1)


def riser(dur):
    n = int(dur * SR)
    t = tt(n) / dur
    x = sweep_noise(dur, "rise", 400, 11000)
    f = 110 * 2 ** (t * 2.0)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * t ** 2 * 0.25
    return edges(x * 0.9 + tone, 0.01, 0.01)


def impact(depth=1.0):
    n = int(1.7 * SR)
    t = tt(n)
    f = 30 + 75 * np.exp(-t * 9)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.0) * depth
    nz = lp(rng.standard_normal(n), 1100) * np.exp(-t * 9) * 0.45
    return edges(np.tanh((x + nz) * 1.3), 0.001, 0.2)


def blip(f=520, drop=0.72, dur=0.09):
    n = int(dur * SR)
    t = tt(n)
    fr = f * (drop + (1 - drop) * np.exp(-t * 40))
    return edges(np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 34), 0.002, 0.02)


def tick():
    n = int(0.02 * SR)
    t = tt(n)
    return edges(hp(rng.standard_normal(n), 2500) * np.exp(-t * 420) * 0.6 + np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 300) * 0.5, 0.0003, 0.004)


def ding(m=88):
    n = int(1.4 * SR)
    t = tt(n)
    x = np.zeros(n)
    for note, d in ((m, 0.0), (m + 5, 0.07)):
        f = midi(note)
        on = (t >= d)
        td = np.clip(t - d, 0, None)
        x += on * (np.sin(2 * np.pi * f * td) + 0.4 * np.sin(2 * np.pi * f * 2.76 * td) * np.exp(-td * 9) + 0.2 * np.sin(2 * np.pi * f * 5.4 * td) * np.exp(-td * 14)) * np.exp(-td * 4.6)
    return edges(x * 0.5, 0.001, 0.1)


def buzz():
    n = int(0.3 * SR)
    t = tt(n)
    x = lp(osc(98, n, "square", 20) + osc(104, n, "square", 20), 1300)
    gate = ((t < 0.09) | ((t > 0.14) & (t < 0.25))).astype(float)
    return edges(x * gate * 0.5, 0.003, 0.02)


def clunk():
    n = int(0.22 * SR)
    t = tt(n)
    f = 60 + 60 * np.exp(-t * 40)
    return edges(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22) + bp(rng.standard_normal(n), 2400, 5200) * np.exp(-t * 110) * 0.5)


def woodblock():
    n = int(0.06 * SR)
    t = tt(n)
    return edges(np.sin(2 * np.pi * 1750 * t) * np.exp(-t * 90) + np.sin(2 * np.pi * 2630 * t) * np.exp(-t * 130) * 0.4, 0.0005, 0.01)


def drone(dur):
    n = int(dur * SR)
    t = tt(n)
    x = np.sin(2 * np.pi * midi(26) * t) * 0.7 + lp(osc(midi(38), n, "saw", 8), 230) * 0.5 + lp(osc(midi(45) * 1.003, n, "saw", 8), 320) * 0.18
    air = bp(rng.standard_normal(n), 3000, 8000) * 0.02 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.21 * t))
    return (x * (0.75 + 0.25 * np.sin(2 * np.pi * 0.42 * t)) + air) * np.clip(t / 3.0, 0, 1) ** 1.3


# ---------- arrangemang ----------
CH = {"Dm": (38, [50, 53, 57]), "Bb": (34, [46, 50, 53]), "F": (41, [53, 57, 60]), "C": (36, [48, 52, 55])}
ARP = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 2, 1, 3]
LEAD = {"F": [(0, 69), (1.5, 72), (3, 69)], "C": [(0, 67), (1.5, 64), (3, 67)], "Dm": [(0, 65), (1.5, 69), (3, 74)], "Bb": [(0, 74), (1.5, 72), (3, 70)]}


def rms_db(x):
    return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
