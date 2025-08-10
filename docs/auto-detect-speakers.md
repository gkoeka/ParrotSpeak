# Auto-detect Speakers Setting

## Behavior
**ON (Default):** Automatically routes translation based on the detected spoken language. If you speak English, it translates to Spanish. If you speak Spanish, it translates to English. Creates natural ping-pong conversations.

**OFF:** Forces manual A→B translation direction regardless of detected language. Always translates from participant A's language to participant B's language unless manually swapped.

## Confidence Fallback
When auto-detect is ON and confidence < 0.75 or language is undefined ('und'), the system falls back to: opposite of last speaker (ping-pong) or default A→B if no previous turn exists. Logs: `[Route] low-confidence fallback used`.

## Edge Cases
- Unsupported languages: Existing voice fallback mechanisms handle TTS failures
- Mixed language input: Detection uses majority language in utterance
- Silent/noise input: Falls back to A→B with low confidence warning