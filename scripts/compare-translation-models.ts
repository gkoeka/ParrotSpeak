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

const MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-5.6-luna"] as const;

// Per-1M-token pricing, USD - re-verified 2026-08-18 against OpenAI's pricing page.
// gpt-5.6-luna price reflects the 2026-07-30 cut ($0.20/$1.20, down from launch pricing).
const PRICING: Record<(typeof MODELS)[number], { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-5.6-luna": { input: 0.2, output: 1.2 },
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
const RUN_LABEL =
  "RUN 3: RUN 2's idiom set (top 10 languages by speakers + top 10 travel-destination languages) " +
  "+ new EN<->ES-419 Colombian-slang set matching ParrotSpeak's actual daily real-world usage";

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

// Added 2026-08-18: real-world daily use case (EN<->ES-419, Colombia) rather than one-off
// idiom generalities - covers Colombian-specific slang, bidirectional flow, and a
// formal/informal register check, since that's the pairing ParrotSpeak's actual daily
// user relies on. "Notes" in each case explain the slang for whoever is scoring the output.
const COLOMBIAN_SLANG_CASES: TestCase[] = [
  {
    label: "ES-419->EN (Colombian slang: 'parce' = buddy/dude, casual greeting)",
    text: "Parce, ¿todo bien o qué?",
    sourceLanguage: "es-419",
    targetLanguage: "en-US",
  },
  {
    label: "ES-419->EN (Colombian slang: 'chimba' = awesome/cool)",
    text: "Qué chimba de plan, nos vemos ahora mismo.",
    sourceLanguage: "es-419",
    targetLanguage: "en-US",
  },
  {
    label: "ES-419->EN (Colombian idiom: 'dar papaya' = make yourself an easy target)",
    text: "No dé papaya en la calle, guarde el celular.",
    sourceLanguage: "es-419",
    targetLanguage: "en-US",
  },
  {
    label: "ES-419->EN (Colombian usage: 'tinto' = black coffee, 'regalar' used colloquially for 'give me')",
    text: "¿Me regalas un tinto, porfa?",
    sourceLanguage: "es-419",
    targetLanguage: "en-US",
  },
  {
    label: "ES-419->EN (Colombian slang: 'full' borrowed as an intensifier, like 'super')",
    text: "Estoy full cansado, hoy no hago nada más.",
    sourceLanguage: "es-419",
    targetLanguage: "en-US",
  },
  {
    label: "EN->ES-419 (travel/practical: haggling, 'ripped off')",
    text: "Can you haggle the price a bit? I don't want to get ripped off.",
    sourceLanguage: "en-US",
    targetLanguage: "es-419",
  },
  {
    label: "EN->ES-419 (travel/practical: 'sketchy' slang)",
    text: "That street food stall looked sketchy, let's find somewhere else.",
    sourceLanguage: "en-US",
    targetLanguage: "es-419",
  },
  {
    label: "EN->ES-419 (casual idiom: 'grab a bite')",
    text: "I'm starving, let's grab a bite before the bus leaves.",
    sourceLanguage: "en-US",
    targetLanguage: "es-419",
  },
  {
    label: "ES-419->EN (formal register check - should NOT come out casual)",
    text: "¿Podría usted indicarme cómo llegar a la estación, por favor?",
    sourceLanguage: "es-419",
    targetLanguage: "en-US",
  },
];

TEST_CASES.push(...COLOMBIAN_SLANG_CASES);

async function run() {
  console.log("\n" + "#".repeat(80));
  console.log(`${RUN_LABEL}`);
  console.log(`Run at: ${new Date().toISOString()}`);
  console.log("#".repeat(80));

  const totals: Record<(typeof MODELS)[number], { cost: number; ms: number }> = {
    "gpt-4o": { cost: 0, ms: 0 },
    "gpt-4o-mini": { cost: 0, ms: 0 },
    "gpt-5.6-luna": { cost: 0, ms: 0 },
  };

  for (const testCase of TEST_CASES) {
    console.log("\n" + "=".repeat(80));
    console.log(`${testCase.label}`);
    console.log(`  ${testCase.sourceLanguage} -> ${testCase.targetLanguage}: "${testCase.text}"`);
    console.log("=".repeat(80));

    const prompt = buildTranslationPrompt(testCase.text, testCase.sourceLanguage, testCase.targetLanguage);

    for (const model of MODELS) {
      const start = Date.now();
      // gpt-5.6-luna rejects any non-default temperature ("Only the default (1) value is
      // supported") - found live 2026-08-18 running this script. gpt-4o/gpt-4o-mini still
      // accept the production 0.3 value, so this is per-model, not a blanket removal.
      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        ...(model === "gpt-5.6-luna" ? {} : { temperature: 0.3 }),
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
  for (const model of ["gpt-4o-mini", "gpt-5.6-luna"] as const) {
    const savingsPct = ((totals["gpt-4o"].cost - totals[model].cost) / totals["gpt-4o"].cost) * 100;
    console.log(`${model} cost savings vs. gpt-4o baseline on this run: ${savingsPct.toFixed(1)}%`);
  }
}

run().catch((error) => {
  console.error("Comparison run failed:", error);
  process.exit(1);
});
