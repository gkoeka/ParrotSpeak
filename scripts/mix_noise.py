import wave, random, sys, struct

src, dst, noise_amp = sys.argv[1], sys.argv[2], float(sys.argv[3])

with wave.open(src, 'rb') as w:
    params = w.getparams()
    frames = w.readframes(w.getnframes())

n_channels, sampwidth, framerate = params.nchannels, params.sampwidth, params.framerate
assert sampwidth == 2, "expects 16-bit PCM"

samples = list(struct.unpack("<%dh" % (len(frames)//2), frames))
noisy = []
for s in samples:
    n = random.randint(-32767, 32767)
    mixed = int(s * (1 - noise_amp) + n * noise_amp)
    mixed = max(-32768, min(32767, mixed))
    noisy.append(mixed)

out_frames = struct.pack("<%dh" % len(noisy), *noisy)
with wave.open(dst, 'wb') as w:
    w.setnchannels(n_channels)
    w.setsampwidth(sampwidth)
    w.setframerate(framerate)
    w.writeframes(out_frames)

print(f"wrote {dst}")
