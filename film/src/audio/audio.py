"""Bygger filmens ljudspår: musik och ljudeffekter, synkat mot scenerna i film.js.

    python3 audio.py <ut.wav>

Tempot är 100 slag per minut. Ett slag är 0,6 s och en takt 2,4 s. Scenerna i film.js börjar på taktslag.
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

# Scenernas starttider, samma som i film.js
T = dict(open=0.0, question=6.0, title=9.6, build=14.4, gives=48.0, one=50.4, cars=57.6, ask=69.6, ai=79.2, end=88.8)

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
BARS = {4: "Dm", 5: "Bb"}
for i, b in enumerate(range(6, 20)):
    BARS[b] = ["Dm", "Bb", "F", "C"][i % 4]
BARS[20] = "C"
for i, b in enumerate(range(21, 33)):
    BARS[b] = ["F", "C", "Dm", "Bb"][i % 4]
BARS.update({33: "Bb", 34: "C", 35: "Dm", 36: "F", 37: "F", 38: "F", 39: "F"})
ARP = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 2, 1, 3]
LEAD = {"F": [(0, 69), (1.5, 72), (3, 69)], "C": [(0, 67), (1.5, 64), (3, 67)], "Dm": [(0, 65), (1.5, 69), (3, 74)], "Bb": [(0, 74), (1.5, 72), (3, 70)]}


def build_music():
    drums, bass, arp, pad, lead, hits = new(), new(), new(), new(), new(), new()
    K, CL, HC, HO, SN = kick(), clap(), hat(), hat(True), snare()
    kicks = []

    def bt(bar, beat):
        return bar * BAR + beat * BEAT

    # inledning: klockslag och mörk ton fram till titeln
    put(pad, drone(9.9), 0.0, 0.55)
    wb = woodblock()
    for k in range(16):
        put(hits, wb, k * BEAT, 0.16 if k % 2 == 0 else 0.1, pan=-0.3 if k % 2 == 0 else 0.3)

    for bar, name in BARS.items():
        root, notes = CH[name]
        t0 = bar * BAR
        groove = (6 <= bar <= 19) or (21 <= bar <= 32)
        # stråkmatta
        if bar <= 36:
            put(pad, pad_chord(notes, BAR + 0.5, 1150 if bar < 21 else 1500), t0 - 0.1, 0.36 if bar != 20 else 0.5)
        elif bar == 37:
            put(pad, pad_chord(notes, 3 * BAR + 2.0, 1500), t0 - 0.1, 0.5)
        # arpeggio
        if bar in (4, 5) or groove or bar in (37, 38):
            tones = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[0] + 24]
            bright = 1700 if bar < 6 else 2300 if bar < 14 else 3000
            g = 0.2 if bar < 6 else 0.26 if bar < 21 else 0.3
            if bar >= 37:
                g = 0.16 if bar == 37 else 0.09
            for s, idx in enumerate(ARP):
                m = tones[idx] + (12 if (bar >= 14 and s % 4 == 3) else 0)
                put(arp, pluck(m, bright), t0 + s * 0.15, g * (1.0 if s % 4 == 0 else 0.72), pan=(-0.45 if s % 2 else 0.45))
        # bas
        if (5 <= bar <= 19) or (21 <= bar <= 32):
            for s in range(8):
                put(bass, bass_note(root + (12 if s in (3, 7) else 0), 0.27), t0 + s * 0.3, 0.5 if s % 2 == 0 else 0.4)
        if 33 <= bar <= 37:
            put(bass, bass_note(root, 2.2 if bar < 37 else 3.5), t0, 0.6)
        if bar == 20:
            put(bass, bass_note(root, 2.2), t0, 0.5)
        # trummor
        if groove:
            for b in range(4):
                put(drums, K, bt(bar, b), 0.95)
                kicks.append(bt(bar, b))
            if bar >= 8:
                for s in range(8):
                    put(drums, HO if (s == 7 and bar % 2 == 1 and bar >= 10) else HC, t0 + s * 0.3, 0.24 if s % 2 else 0.15, pan=0.25)
            if bar >= 29:
                for s in range(16):
                    if s % 2:
                        put(drums, HC, t0 + s * 0.15, 0.1, pan=-0.3)
            if bar >= 10:
                for b in (1, 3):
                    put(drums, CL, bt(bar, b), 0.5)
        if bar in (19, 32):  # virvel in i nästa del
            for s in range(8):
                put(drums, SN, t0 + 1.2 + s * 0.15, 0.2 + 0.4 * s / 7, pan=0.1)
        if 33 <= bar <= 36:  # AI: halvtempo, ett ackordslag per bild
            put(drums, K, t0, 1.0)
            kicks.append(t0)
            put(drums, K, t0 + 1.5 * BEAT, 0.8)
            kicks.append(t0 + 1.5 * BEAT)
            put(drums, SN, t0 + 2 * BEAT, 0.65)
            put(drums, CL, t0 + 2 * BEAT, 0.45)
            for s in range(8):
                put(drums, HC, t0 + s * 0.3, 0.1, pan=0.25)
            put(hits, stab([n + 12 for n in notes], 2.2, 2600 + (bar - 33) * 500), t0, 0.42)
            if bar == 36:
                for s, f in enumerate((210, 180, 150, 120)):
                    put(drums, tom(f), t0 + 1.8 + s * 0.15, 0.6, pan=-0.5 + s * 0.33)
        if bar == 37:
            put(drums, K, t0, 1.0)
            kicks.append(t0)
            put(hits, stab([n + 12 for n in notes], 3.0, 3400), t0, 0.45)
        # melodi i andra halvan
        if 21 <= bar <= 32:
            for beat, m in LEAD[name]:
                put(lead, bell(m + 12, 1.5), bt(bar, beat), 0.14, pan=0.15)

    # titeln och pausen före "Och vad ger det?"
    put(hits, stab([62, 65, 69], 2.6, 2400), T["title"], 0.45)
    put(hits, stab([60, 64, 67], 2.2, 2200), T["gives"], 0.45)

    # pump: matta, bas och arpeggio viker undan för varje baskaggeslag
    sc = np.ones(N)
    t = tt(N)
    for tk in kicks:
        i = int(tk * SR)
        j = min(N, i + int(0.5 * SR))
        sc[i:j] = np.minimum(sc[i:j], 1 - 0.55 * np.exp(-(t[i:j] - tk) * 9))
    pad *= sc[:, None]
    bass *= (0.4 + 0.6 * sc)[:, None]
    arp *= (0.5 + 0.5 * sc)[:, None]

    arp = reverb(pingpong(arp, 0.45), IR_HALL, 0.16)
    pad = hp(reverb(pad, IR_HALL, 0.3), 170)
    lead = reverb(pingpong(lead, 0.45, 0.3, 0.3), IR_HALL, 0.4)
    hits = reverb(hits, IR_HALL, 0.35)
    drums = reverb(drums, IR_ROOM, 0.06)
    return {"trummor": drums, "bas": bass, "arpeggio": arp, "matta": pad, "melodi": lead, "slag": hits}


def build_sfx():
    fx, wet = new(), new()
    W = whoosh(0.62)
    IM = impact()
    for name in ("question", "title", "build", "gives", "one", "cars", "ask", "end"):
        put(fx, W, T[name] - 0.05, 0.42)
    # övergångar som behöver tyngd
    for name, g in (("question", 0.75), ("title", 0.6), ("gives", 0.6), ("one", 0.4), ("end", 0.7)):
        put(wet, IM, T[name] + 0.22, g)
    put(fx, riser(2.4), T["title"] - 2.4, 0.4)
    put(fx, riser(2.4), T["gives"] - 2.4, 0.32)
    put(fx, riser(2.4), T["one"] - 2.4, 0.3)
    put(fx, riser(4.8), T["end"] - 4.8, 0.3)

    # öppningen
    o = T["open"]
    put(fx, blip(420), o + 0.3, 0.3, -0.4)
    put(fx, blip(470), o + 0.75, 0.3, 0.4)
    put(fx, whoosh(0.45), o + 1.65, 0.2)
    put(wet, stab([50, 51, 57], 0.9, 1700), o + 3.6, 0.5)
    put(fx, buzz(), o + 3.6, 0.3)
    put(wet, impact(0.7), o + 3.6, 0.45)

    # så är den byggd
    b = T["build"]
    for k in range(4):
        put(fx, blip(430 + k * 45), b + 0.2 + k * 0.12, 0.22, -0.5)
    for lt, f, pan in ((1.3, 300, -0.2), (4.9, 330, 0.2), (7.0, 370, 0.3), (10.6, 415, 0.1), (16.7, 495, 0.2), (21.3, 440, 0.0), (22.3, 555, 0.3)):
        put(fx, blip(f, 0.6, 0.14), b + lt, 0.34, pan)
        put(wet, blip(f * 2, 0.8, 0.1), b + lt + 0.02, 0.1, pan)
    put(fx, clunk(), b + 13.9, 0.55)
    put(fx, whoosh(1.0), b + 3.6, 0.2)       # taket ritas
    put(fx, whoosh(0.8), b + 20.4, 0.18)     # Fabric ritas
    for lt in (15.6, 19.2):                    # kort som stoppas i testet
        put(fx, buzz(), b + lt + 0.05, 0.3, 0.2)
    for k in range(12):                        # siffran räknas upp
        put(fx, tick(), b + 23.0 + k * 0.08, 0.22, 0.4)
    put(wet, ding(88), b + 24.25, 0.4, 0.3)
    put(fx, whoosh(1.7), b + 25.2, 0.3)       # kameran backar
    put(fx, whoosh(0.5), b + 27.1, 0.16)
    put(fx, whoosh(0.5), b + 27.5, 0.16)
    put(fx, clunk(), b + 30.05, 0.75, -0.6)   # låset

    # en siffra per nyckeltal
    s = T["one"]
    put(fx, whoosh(0.8), s + 0.9, 0.26)
    put(wet, impact(0.8), s + 1.75, 0.5)
    put(wet, ding(88), s + 2.05, 0.45, 0.2)

    # lagerbilar
    c = T["cars"]
    for i in range(18):
        put(fx, blip(520 + (i % 6) * 40, 0.8, 0.05), c + 0.5 + i * 0.05, 0.12, -0.6 + (i % 6) * 0.24)
    for k in range(30):
        put(fx, tick(), c + 1.3 + 2.4 * (1 - (1 - k / 30) ** 1.6), 0.12, 0.0)
    put(fx, whoosh(1.0), c + 5.0, 0.24)
    for k in range(3):
        put(fx, blip(392 * 2 ** (k * 2 / 12), 0.7, 0.12), c + 6.1 + k * 0.35, 0.3, 0.1)
        put(wet, ding(81 + k * 2), c + 6.15 + k * 0.35, 0.14, 0.2)

    # frågan
    a = T["ask"]
    nchar = 41
    for k in range(nchar):
        put(fx, tick(), a + 0.6 + 1.9 * k / nchar, 0.2 + 0.06 * (k % 3), -0.1 + 0.2 * (k % 2))
    put(fx, blip(660, 0.9, 0.08), a + 2.6, 0.25)
    put(fx, whoosh(0.5), a + 2.85, 0.18)
    for k in range(3):
        put(fx, blip(330 + k * 50, 0.9, 0.1), a + 3.4 + k * 0.15, 0.18, 0.3)
        put(fx, blip(600 + k * 60, 0.9, 0.06), a + 4.5 + k * 0.15, 0.16, -0.3 + k * 0.3)

    # AI i fyra steg: ett slag per bild
    for k in range(4):
        put(wet, impact(0.9), T["ai"] + k * BAR, 0.42)
        put(fx, whoosh(0.3), T["ai"] + k * BAR - 0.12, 0.2)
    put(wet, ding(84), T["ai"] + 3 * BAR + 1.0, 0.2, 0.3)

    # avslutet
    e = T["end"]
    put(fx, whoosh(1.0), e + 0.3, 0.2)
    put(wet, ding(81), e + 2.3, 0.3)
    return {"effekter": fx, "effekter_rum": reverb(wet, IR_HALL, 0.5)}


def rms_db(x):
    return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)


def main():
    out = pathlib.Path(sys.argv[1])
    music = build_music()
    sfx = build_sfx()
    gains = {"trummor": 0.62, "bas": 0.55, "arpeggio": 0.98, "matta": 0.7, "melodi": 0.9, "slag": 0.8, "effekter": 0.95, "effekter_rum": 0.6}
    bed = np.zeros((N, 2))
    for k, x in {**music, **sfx}.items():
        g = gains[k]
        print("%-13s topp %.2f  rms %6.1f dB" % (k, np.abs(x).max() * g, rms_db(x * g)))
        bed += x * g
    # toning ut i slutet
    t = tt(N)
    bed *= (np.clip((DUR + 0.6 - t) / 3.2, 0, 1) ** 1.2)[:, None]
    bed = bed + hp(bed, 2800) * 0.55            # lite luft i diskanten
    mix = np.tanh(bed * 0.62) / 0.62
    mix = mix[: int(DUR * SR)]
    peak = np.abs(mix).max()
    mix = mix / peak * 0.89
    print("mix topp före normalisering %.2f, längd %.2f s" % (peak, len(mix) / SR))
    with wave.open(str(out), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())


main()
