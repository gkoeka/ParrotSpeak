// One-off comparison: gpt-transcribe (current production model, server/services/openai.ts)
// vs gpt-4o-mini-transcribe (new candidate surfaced 2026-08-18 while refreshing cost-saving
// research - a pure server-side swap, no native/on-device engineering risk unlike whisper.rn).
//
// whisper.rn itself is NOT tested here - there's no way to run the actual on-device model
// from a plain script (it's a React Native native module, not a CLI tool), consistent with
// the existing roadmap note that whisper.rn is still blocked on a real device/simulator build.
//
// Audio is synthetic (macOS `say`, converted to 16-bit PCM WAV via afconvert), not real
// recordings - there's no sample audio anywhere in this repo. Two of the six cases have a
// noisy variant (white noise mixed in via .scratch/mix_noise.py at a fixed ratio) as a rough
// stand-in for real travel/street noise; this is a synthetic approximation, not a substitute
// for a real accented/noisy-environment recording.
//
// Run with an OPENAI_API_KEY available in the environment, e.g.:
//   npx tsx --env-file=.env.local scripts/compare-transcription-models.ts

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not set in the environment. Aborting - no key was read or logged.");
  process.exit(1);
}

import fs from "fs";
import path from "path";

const OpenAI = (await import("openai")).default;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODELS = ["gpt-transcribe", "gpt-4o-mini-transcribe"] as const;

// Per-minute pricing, USD - re-verified 2026-08-18.
const PRICING: Record<(typeof MODELS)[number], number> = {
  "gpt-transcribe": 0.0045,
  "gpt-4o-mini-transcribe": 0.003,
};

const AUDIO_DIR = path.join(process.cwd(), ".scratch", "stt-audio");

interface TestCase {
  label: string;
  file: string;
  groundTruth: string;
  languageHint: string;
}

const TEST_CASES: TestCase[] = [
  {
    label: "EN (clean, en_US voice) - pharmacy",
    file: "01_en_pharmacy.wav",
    groundTruth: "Can you point me to the nearest pharmacy?",
    languageHint: "en",
  },
  {
    label: "EN (street-noise variant) - pharmacy",
    file: "01_en_pharmacy_noisy.wav",
    groundTruth: "Can you point me to the nearest pharmacy?",
    languageHint: "en",
  },
  {
    label: "ES-419 (clean, es_MX voice proxy for Colombian) - 'parce' slang",
    file: "02_es_parce.wav",
    groundTruth: "Parce, ¿todo bien o qué?",
    languageHint: "es",
  },
  {
    label: "ES-419 (street-noise variant) - 'parce' slang",
    file: "02_es_parce_noisy.wav",
    groundTruth: "Parce, ¿todo bien o qué?",
    languageHint: "es",
  },
  {
    label: "ES-419 (clean, es_MX voice proxy) - 'dar papaya' safety idiom",
    file: "03_es_papaya.wav",
    groundTruth: "No dé papaya en la calle, guarde el celular.",
    languageHint: "es",
  },
  {
    label: "EN (clean, en_GB voice) - coffee order",
    file: "04_en_coffee.wav",
    groundTruth: "I would like to order two coffees and a croissant, please.",
    languageHint: "en",
  },
  {
    label: "ES (clean, es_ES voice) - formal register",
    file: "05_es_formal.wav",
    groundTruth: "¿Podría usted indicarme cómo llegar a la estación, por favor?",
    languageHint: "es",
  },
  {
    label: "EN (clean, en_IN accented voice) - 'sketchy' slang",
    file: "06_en_sketchy.wav",
    groundTruth: "That street food stall looked sketchy, let's find somewhere else.",
    languageHint: "en",
  },
];

// Simple word-level Levenshtein distance -> WER, case/punctuation-insensitive since we only
// care whether meaning-bearing words were transcribed correctly, not exact punctuation.
function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[¿?¡!.,]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function wordErrorRate(reference: string, hypothesis: string): number {
  const ref = normalize(reference);
  const hyp = normalize(hypothesis);
  const dp: number[][] = Array.from({ length: ref.length + 1 }, () => new Array(hyp.length + 1).fill(0));
  for (let i = 0; i <= ref.length; i++) dp[i][0] = i;
  for (let j = 0; j <= hyp.length; j++) dp[0][j] = j;
  for (let i = 1; i <= ref.length; i++) {
    for (let j = 1; j <= hyp.length; j++) {
      if (ref[i - 1] === hyp[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return ref.length === 0 ? 0 : dp[ref.length][hyp.length] / ref.length;
}

function wavDurationSeconds(filePath: string): number {
  const buf = fs.readFileSync(filePath);
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  return dataSize / byteRate;
}

async function run() {
  console.log("\n" + "#".repeat(80));
  console.log("Transcription comparison: gpt-transcribe vs gpt-4o-mini-transcribe");
  console.log(`Run at: ${new Date().toISOString()}`);
  console.log("#".repeat(80));

  const totals: Record<(typeof MODELS)[number], { cost: number; ms: number; wer: number; n: number }> = {
    "gpt-transcribe": { cost: 0, ms: 0, wer: 0, n: 0 },
    "gpt-4o-mini-transcribe": { cost: 0, ms: 0, wer: 0, n: 0 },
  };

  for (const testCase of TEST_CASES) {
    const filePath = path.join(AUDIO_DIR, testCase.file);
    if (!fs.existsSync(filePath)) {
      console.log(`\nSkipping "${testCase.label}" - audio file not found at ${filePath}`);
      continue;
    }
    const durationMin = wavDurationSeconds(filePath) / 60;

    console.log("\n" + "=".repeat(80));
    console.log(`${testCase.label}`);
    console.log(`  ground truth: "${testCase.groundTruth}"`);
    console.log("=".repeat(80));

    for (const model of MODELS) {
      const start = Date.now();
      try {
        const response = await openai.audio.transcriptions.create({
          file: fs.createReadStream(filePath),
          model,
          response_format: "json",
          // gpt-transcribe accepts a `languages` hint array (see server/services/openai.ts);
          // gpt-4o-mini-transcribe's documented param is a single `language` string instead -
          // passed per-model rather than assuming they share a request shape.
          ...(model === "gpt-transcribe" ? { languages: [testCase.languageHint] } : { language: testCase.languageHint }),
        } as any);
        const ms = Date.now() - start;

        const text = (response as any).text || "";
        const wer = wordErrorRate(testCase.groundTruth, text);
        const cost = durationMin * PRICING[model];

        totals[model].cost += cost;
        totals[model].ms += ms;
        totals[model].wer += wer;
        totals[model].n += 1;

        console.log(`\n[${model}] (${ms}ms, $${cost.toFixed(6)}, WER ${(wer * 100).toFixed(1)}%)`);
        console.log(`  transcribed: "${text}"`);
      } catch (error) {
        console.log(`\n[${model}] FAILED: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("TOTALS across all test cases");
  console.log("=".repeat(80));
  for (const model of MODELS) {
    const t = totals[model];
    if (t.n === 0) continue;
    console.log(
      `${model}: $${t.cost.toFixed(6)} total, ${t.ms}ms total, ${(t.ms / t.n).toFixed(0)}ms avg, ` +
        `${((t.wer / t.n) * 100).toFixed(1)}% avg WER across ${t.n} cases`
    );
  }
}

run().catch((error) => {
  console.error("Comparison run failed:", error);
  process.exit(1);
});
