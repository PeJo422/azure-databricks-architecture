"""Ljudspår till klippet "Fråga datan själv": 19 takter i 100 slag per minut, 45,6 s.

    python3 klipp_audio.py <ut.wav>

Instrument och effekter kommer från ljud.py.
"""
import sys, wave, pathlib
import numpy as np
import ljud as A

DUR = 45.6
A.DUR = DUR
A.N = int((DUR + 1.5) * A.SR)
BAR, BEAT, put = A.BAR, A.BEAT, A.put
T = dict(intro=0.0, claude=2.4, copilot=21.6, close=40.8)   # samma som i klipp.js

BARS = {}
for i, b in enumerate(range(1, 9)):
    BARS[b] = ["F", "C", "Dm", "Bb"][i % 4]
for i, b in enumerate(range(9, 17)):
    BARS[b] = ["Dm", "Bb", "F", "C"][i % 4]
BARS[17] = "F"


def music():
    drums, bass, arp, pad, lead, hits = (A.new() for _ in range(6))
    K, CL, HC, HO, SN = A.kick(), A.clap(), A.hat(), A.hat(True), A.snare()
    kicks = []
    put(hits, A.stab([60, 64, 67], 2.2, 2400), 0.15, 0.45)           # intro: ett slag på C som leder in i F
    for bar, name in BARS.items():
        root, notes = A.CH[name]
        t0 = bar * BAR
        if bar == 17:
            put(pad, A.pad_chord(notes, 2 * BAR + 1.5, 1500), t0 - 0.1, 0.5)
            put(hits, A.stab([n + 12 for n in notes], 3.0, 3400), t0, 0.45)
            put(bass, A.bass_note(root, 3.5), t0, 0.6)
            put(drums, K, t0, 1.0)
            kicks.append(t0)
            tones = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[0] + 24]
            for s, idx in enumerate(A.ARP * 2):
                put(arp, A.pluck(tones[idx], 2600), t0 + s * 0.15, 0.2 * (1 - s / 34), pan=(-0.45 if s % 2 else 0.45))
            continue
        put(pad, A.pad_chord(notes, BAR + 0.5, 1300 if bar < 9 else 1500), t0 - 0.1, 0.36)
        tones = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[0] + 24]
        for s, idx in enumerate(A.ARP):
            m = tones[idx] + (12 if (bar >= 9 and s % 4 == 3) else 0)
            put(arp, A.pluck(m, 2300 if bar < 9 else 3000), t0 + s * 0.15, (0.26 if bar < 9 else 0.3) * (1.0 if s % 4 == 0 else 0.72), pan=(-0.45 if s % 2 else 0.45))
        for s in range(8):
            put(bass, A.bass_note(root + (12 if s in (3, 7) else 0), 0.27), t0 + s * 0.3, 0.5 if s % 2 == 0 else 0.4)
        for b in range(4):
            put(drums, K, t0 + b * BEAT, 0.95)
            kicks.append(t0 + b * BEAT)
        if bar >= 3:
            for s in range(8):
                put(drums, HO if (s == 7 and bar % 2 == 0) else HC, t0 + s * 0.3, 0.24 if s % 2 else 0.15, pan=0.25)
            for b in (1, 3):
                put(drums, CL, t0 + b * BEAT, 0.5)
        if bar >= 9:
            for s in range(16):
                if s % 2:
                    put(drums, HC, t0 + s * 0.15, 0.1, pan=-0.3)
        if bar in (8, 16):
            for s in range(8):
                put(drums, SN, t0 + 1.2 + s * 0.15, 0.2 + 0.4 * s / 7, pan=0.1)
        if bar >= 5:
            for beat, m in A.LEAD[name]:
                put(lead, A.bell(m + 12, 1.5), t0 + beat * BEAT, 0.14, pan=0.15)
    sc = np.ones(A.N)
    t = A.tt(A.N)
    for tk in kicks:
        i = int(tk * A.SR)
        j = min(A.N, i + int(0.5 * A.SR))
        sc[i:j] = np.minimum(sc[i:j], 1 - 0.55 * np.exp(-(t[i:j] - tk) * 9))
    pad *= sc[:, None]
    bass *= (0.4 + 0.6 * sc)[:, None]
    arp *= (0.5 + 0.5 * sc)[:, None]
    return {"trummor": A.reverb(drums, A.IR_ROOM, 0.06), "bas": bass, "arpeggio": A.reverb(A.pingpong(arp, 0.45), A.IR_HALL, 0.16),
            "matta": A.hp(A.reverb(pad, A.IR_HALL, 0.3), 170), "melodi": A.reverb(A.pingpong(lead, 0.45, 0.3, 0.3), A.IR_HALL, 0.4), "slag": A.reverb(hits, A.IR_HALL, 0.35)}


def typing(fx, t0, t1, n, gain=0.2):
    for k in range(n):
        put(fx, A.tick(), t0 + (t1 - t0) * k / n, gain + 0.06 * (k % 3), -0.1 + 0.2 * (k % 2))


def sfx():
    fx, wet = A.new(), A.new()
    W = A.whoosh(0.62)
    for name in ("claude", "copilot", "close"):
        put(fx, W, T[name] - 0.05, 0.42)
    put(wet, A.impact(), 0.15, 0.7)
    put(fx, A.riser(2.2), 0.2, 0.3)
    put(wet, A.impact(0.8), T["copilot"] + 0.22, 0.45)
    put(wet, A.impact(), T["close"] + 0.22, 0.7)
    put(fx, A.riser(2.4), T["copilot"] - 2.4, 0.3)
    put(fx, A.riser(2.4), T["close"] - 2.4, 0.32)

    c = T["claude"]
    typing(fx, c + 0.5, c + 3.0, 46)
    put(fx, A.blip(560, 0.9, 0.07), c + 3.3, 0.2, -0.5)
    put(fx, A.blip(620, 0.9, 0.07), c + 4.0, 0.2, -0.5)
    for k, lt in enumerate((4.8, 5.4, 6.0, 7.2, 8.4)):               # diagrammen landar
        f = 392 * 2 ** ((0, 2, 4, 7, 9)[k] / 12)
        put(fx, A.blip(f, 0.6, 0.14), c + lt, 0.34, -0.2 + k * 0.15)
        put(wet, A.blip(f * 2, 0.8, 0.1), c + lt + 0.02, 0.1)
    for k in range(12):
        put(fx, A.tick(), c + 4.9 + k * 0.08, 0.18, 0.2)
    put(wet, A.ding(84), c + 9.45, 0.3, -0.4)
    put(fx, A.blip(700, 0.9, 0.06), c + 11.7, 0.25, 0.4)             # SQL-knappen
    put(fx, A.whoosh(0.5), c + 12.0, 0.26)
    for k in range(5):
        typing(fx, c + 12.5 + k * 0.45, c + 12.95 + k * 0.45, 7, 0.12)
    put(fx, A.whoosh(0.4), c + 16.2, 0.18)
    typing(fx, c + 17.0, c + 17.8, 14)
    put(fx, A.whoosh(0.8), c + 18.0, 0.24)

    p = T["copilot"]
    typing(fx, p + 0.5, p + 2.8, 40)
    put(fx, A.blip(660, 0.9, 0.08), p + 3.0, 0.22, 0.5)
    put(fx, A.blip(440, 0.6, 0.14), p + 4.6, 0.32, 0.5)
    for k in range(3):
        put(fx, A.blip(330 + k * 50, 0.9, 0.1), p + 4.9 + k * 0.15, 0.16, 0.5)
    put(fx, A.blip(760, 0.92, 0.05), p + 6.6, 0.28, 0.5)             # växla till tabell
    put(fx, A.blip(860, 0.92, 0.05), p + 8.0, 0.28, 0.5)             # växla till DAX
    put(fx, A.whoosh(0.5), p + 9.55, 0.26)
    for k, lt in enumerate((10.6, 11.0, 11.4)):                       # fält, mått och filter tänds
        put(fx, A.blip(523 * 2 ** (k * 2 / 12), 0.8, 0.1), p + lt, 0.3, -0.4 + k * 0.3)
        put(wet, A.ding(79 + k * 2), p + lt, 0.12, -0.3)
    put(fx, A.whoosh(0.4), p + 14.2, 0.2)
    typing(fx, p + 14.7, p + 15.6, 18)
    put(fx, A.blip(440, 0.6, 0.14), p + 15.9, 0.32, 0.5)
    put(wet, A.ding(88), p + 16.35, 0.42, 0.4)                       # godkänt svar
    put(fx, A.clunk(), p + 17.4, 0.4, 0.5)                           # lägg till på sidan
    put(fx, A.whoosh(0.8), p + 17.4, 0.3)
    put(fx, A.blip(392, 0.6, 0.16), p + 18.2, 0.36, -0.2)

    e = T["close"]
    put(fx, A.whoosh(0.9), e + 0.3, 0.2)
    put(fx, A.blip(523, 0.7, 0.12), e + 1.3, 0.26, -0.4)
    put(fx, A.blip(587, 0.7, 0.12), e + 1.5, 0.26, 0.4)
    put(wet, A.ding(81), e + 2.0, 0.3)
    return {"effekter": fx, "effekter_rum": A.reverb(wet, A.IR_HALL, 0.5)}


def main():
    out = pathlib.Path(sys.argv[1])
    gains = {"trummor": 0.62, "bas": 0.55, "arpeggio": 0.98, "matta": 0.7, "melodi": 0.9, "slag": 0.8, "effekter": 0.95, "effekter_rum": 0.6}
    bed = np.zeros((A.N, 2))
    for k, x in {**music(), **sfx()}.items():
        print("%-13s topp %.2f  rms %6.1f dB" % (k, np.abs(x).max() * gains[k], A.rms_db(x * gains[k])))
        bed += x * gains[k]
    t = A.tt(A.N)
    bed *= (np.clip((DUR + 0.6 - t) / 3.2, 0, 1) ** 1.2)[:, None]
    bed = bed + A.hp(bed, 2800) * 0.55
    mix = (np.tanh(bed * 0.62) / 0.62)[: int(DUR * A.SR)]
    mix = mix / np.abs(mix).max() * 0.89
    with wave.open(str(out), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(A.SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    print("längd %.2f s" % (len(mix) / A.SR))


main()
