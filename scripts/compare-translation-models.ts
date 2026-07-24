// One-off comparison: gpt-4o (current production model) vs gpt-4o-mini, using the exact
// production prompt (server/services/translation.ts's buildTranslationPrompt), across cases
// chosen to stress the things that prompt explicitly asks for: tone, slang, and regional
// dialect. Run with an OPENAI_API_KEY available in the environment, e.g.:
//   npx tsx --env-file=.env.local scripts/compare-translation-models.ts
//
// This only prints outputs + cost/latency side by side — it does not declare a winner.
// Translation quality across slang/tone/dialect is a judgment call for a native/fluent
// speaker, not something to auto-score.

// Import is dynamic (not top-level) so this check runs, and prints, before
// translation.ts's top-level `new OpenAI(...)` throws its own less-friendly error.
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not set in the environment. Aborting - no key was read or logged.");
  process.exit(1);
}

const OpenAI = (await import("openai")).default;
const { buildTranslationPrompt } = await import("../server/services/translation.ts");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODELS = ["gpt-4o", "gpt-4o-mini"] as const;

// Per-1M-token pricing, USD, as of this writing - source: platform.openai.com/docs/pricing
const PRICING: Record<(typeof MODELS)[number], { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};

interface TestCase {
  label: string;
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

// RUN 2 - idiom-focused: an English idiom translated into each of the top 10 languages by
// number of speakers (Mandarin, Hindi, Spanish, French, Arabic, Bengali, Portuguese, Russian,
// Urdu - English itself is the source language here, so no separate case for it) plus the top
// 10 travel-destination languages (French, Spanish, Italian, Mandarin, Turkish, Thai, German,
// Greek, Japanese, Indonesian - again excluding English). Spanish is tested in both its Spain
// and Latin America dialects since that split matters for this app; other language overlaps
// between the two lists (French, Mandarin) are tested once, with a fresh idiom vs. RUN 1 where
// applicable, rather than skipped, to maximize idiom-handling data collected per run.
const RUN_LABEL = "RUN 2: idiom-focused - top 10 languages by speakers + top 10 travel-destination languages";

const TEST_CASES: TestCase[] = [
  {
    label: "EN->ZH-CN (Mandarin, top by speakers + travel destination)",
    text: "Don't count your chickens before they hatch.",
    sourceLanguage: "en-US",
    targetLanguage: "zh-CN",
  },
  {
    label: "EN->HI-IN (Hindi, top by speakers)",
    text: "The early bird catches the worm.",
    sourceLanguage: "en-US",
    targetLanguage: "hi-IN",
  },
  {
    label: "EN->ES-419 (Spanish, Latin America - top by speakers)",
    text: "Actions speak louder than words.",
    sourceLanguage: "en-US",
    targetLanguage: "es-419",
  },
  {
    label: "EN->ES-ES (Spanish, Spain - travel destination)",
    text: "Break a leg out there tonight!",
    sourceLanguage: "en-US",
    targetLanguage: "es-ES",
  },
  {
    label: "EN->FR-FR (French, top by speakers + travel destination)",
    text: "That's the last straw, I'm done waiting around.",
    sourceLanguage: "en-US",
    targetLanguage: "fr-FR",
  },
  {
    label: "EN->AR-SA (Arabic, top by speakers)",
    text: "It's not rocket science, just follow the instructions.",
    sourceLanguage: "en-US",
    targetLanguage: "ar-SA",
  },
  {
    label: "EN->BN-BD (Bengali, top by speakers)",
    text: "Better late than never, I'm glad you made it.",
    sourceLanguage: "en-US",
    targetLanguage: "bn-BD",
  },
  {
    label: "EN->PT-BR (Portuguese, top by speakers)",
    text: "That only happens once in a blue moon around here.",
    sourceLanguage: "en-US",
    targetLanguage: "pt-BR",
  },
  {
    label: "EN->RU-RU (Russian, top by speakers)",
    text: "Don't beat around the bush, just tell me what happened.",
    sourceLanguage: "en-US",
    targetLanguage: "ru-RU",
  },
  {
    label: "EN->UR (Urdu, top by speakers)",
    text: "Let's not beat a dead horse, we've made our decision.",
    sourceLanguage: "en-US",
    targetLanguage: "ur",
  },
  {
    label: "EN->IT-IT (Italian, travel destination)",
    text: "He's had a chip on his shoulder ever since he lost that game.",
    sourceLanguage: "en-US",
    targetLanguage: "it-IT",
  },
  {
    label: "EN->TR-TR (Turkish, travel destination)",
    text: "That hotel costs an arm and a leg for one night.",
    sourceLanguage: "en-US",
    targetLanguage: "tr-TR",
  },
  {
    label: "EN->TH-TH (Thai, travel destination)",
    text: "Just bite the bullet and ask her out already.",
    sourceLanguage: "en-US",
    targetLanguage: "th-TH",
  },
  {
    label: "EN->DE-DE (German, travel destination)",
    text: "I'm feeling a bit under the weather today.",
    sourceLanguage: "en-US",
    targetLanguage: "de-DE",
  },
  {
    label: "EN->EL-GR (Greek, travel destination)",
    text: "We can kill two birds with one stone if we go today.",
    sourceLanguage: "en-US",
    targetLanguage: "el-GR",
  },
  {
    label: "EN->JA-JP (Japanese, travel destination)",
    text: "Don't worry, this next part is a piece of cake.",
    sourceLanguage: "en-US",
    targetLanguage: "ja-JP",
  },
  {
    label: "EN->ID-ID (Indonesian, travel destination)",
    text: "When pigs fly, maybe he'll actually apologize.",
    sourceLanguage: "en-US",
    targetLanguage: "id-ID",
  },
];

async function run() {
  console.log("\n" + "#".repeat(80));
  console.log(`${RUN_LABEL}`);
  console.log(`Run at: ${new Date().toISOString()}`);
  console.log("#".repeat(80));

  const totals: Record<(typeof MODELS)[number], { cost: number; ms: number }> = {
    "gpt-4o": { cost: 0, ms: 0 },
    "gpt-4o-mini": { cost: 0, ms: 0 },
  };

  for (const testCase of TEST_CASES) {
    console.log("\n" + "=".repeat(80));
    console.log(`${testCase.label}`);
    console.log(`  ${testCase.sourceLanguage} -> ${testCase.targetLanguage}: "${testCase.text}"`);
    console.log("=".repeat(80));

    const prompt = buildTranslationPrompt(testCase.text, testCase.sourceLanguage, testCase.targetLanguage);

    for (const model of MODELS) {
      const start = Date.now();
      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });
      const ms = Date.now() - start;

      const parsed = JSON.parse(response.choices[0].message.content || "{}");
      const usage = response.usage;
      const cost = usage
        ? (usage.prompt_tokens / 1_000_000) * PRICING[model].input +
          (usage.completion_tokens / 1_000_000) * PRICING[model].output
        : 0;

      totals[model].cost += cost;
      totals[model].ms += ms;

      console.log(`\n[${model}] (${ms}ms, $${cost.toFixed(6)})`);
      console.log(`  translation: ${parsed.translation}`);
      if (parsed.notes) console.log(`  notes: ${parsed.notes}`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("TOTALS across all test cases");
  console.log("=".repeat(80));
  for (const model of MODELS) {
    console.log(
      `${model}: $${totals[model].cost.toFixed(6)} total, ${totals[model].ms}ms total, ${(
        totals[model].ms / TEST_CASES.length
      ).toFixed(0)}ms avg`
    );
  }
  const savingsPct =
    ((totals["gpt-4o"].cost - totals["gpt-4o-mini"].cost) / totals["gpt-4o"].cost) * 100;
  console.log(`\ngpt-4o-mini cost savings on this run: ${savingsPct.toFixed(1)}%`);
}

run().catch((error) => {
  console.error("Comparison run failed:", error);
  process.exit(1);
});
