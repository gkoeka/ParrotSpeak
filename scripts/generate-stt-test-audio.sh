#!/bin/bash
# Generates the synthetic test audio used by scripts/compare-transcription-models.ts.
# macOS-only (uses `say` and `afconvert`, both built in). Not committed - output goes to
# .scratch/stt-audio/, which is gitignored. Re-run any time to regenerate.
set -e

OUT_DIR="$(dirname "$0")/../.scratch/stt-audio"
mkdir -p "$OUT_DIR"
cd "$OUT_DIR"

say -v Samantha -o 01_en_pharmacy.aiff "Can you point me to the nearest pharmacy?"
say -v Paulina  -o 02_es_parce.aiff "Parce, ¿todo bien o qué?"
say -v Paulina  -o 03_es_papaya.aiff "No dé papaya en la calle, guarde el celular."
say -v Daniel   -o 04_en_coffee.aiff "I would like to order two coffees and a croissant, please."
say -v Monica   -o 05_es_formal.aiff "¿Podría usted indicarme cómo llegar a la estación, por favor?"
say -v Aman     -o 06_en_sketchy.aiff "That street food stall looked sketchy, let's find somewhere else."

for f in *.aiff; do
  afconvert -f WAVE -d LEI16 "$f" "${f%.aiff}.wav"
done

# Rough street-noise stand-in: mixes in white noise at a fixed ratio via pure-Python wave
# manipulation (no numpy/ffmpeg/sox available in this environment). Not a substitute for a
# real noisy-environment recording - see the caveat in compare-transcription-models.ts.
python3 "$(dirname "$0")/mix_noise.py" 01_en_pharmacy.wav 01_en_pharmacy_noisy.wav 0.15
python3 "$(dirname "$0")/mix_noise.py" 02_es_parce.wav 02_es_parce_noisy.wav 0.15

echo "Generated test audio in $OUT_DIR"
