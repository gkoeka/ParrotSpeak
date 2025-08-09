# Security Policy

## Scenario Runner Hardening

The `scripts/verifyAllScenarios.ts` script uses defense-in-depth security to prevent command injection:

- **Command Allowlist**: Only pre-approved commands (tsx, node, npx) can execute via `ALLOWED_COMMANDS` mapping
- **Argument Validator**: Blocks 19 dangerous metacharacters (`;|&><$\`'"(){}[]?*~\n\r\t\\`), path traversal (`../`), and enforces strict limits (6 args max, 200 chars/arg)
- **No Shell Execution**: `spawn()` runs with `shell: false` - commands execute directly without shell interpretation
- **Environment Isolation**: Minimal env vars (PATH, NODE_ENV, HOME, USER) - no secrets or API keys exposed
- **Resource Limits**: 60-second timeout, 100KB output cap, locked to repo root directory
- **Validation-First**: All inputs validated BEFORE spawn() - if validation fails, no process is created

This multi-layer approach ensures even whitelisted tools cannot be exploited for arbitrary command execution.
For implementation details, see `scripts/verifyAllScenarios.ts` and test coverage in `scripts/test-injection-prevention.ts`.

## Reporting Security Vulnerabilities

If you discover a security vulnerability in ParrotSpeak, please report it to security@parrotspeak.com.
Please do not create public GitHub issues for security vulnerabilities.