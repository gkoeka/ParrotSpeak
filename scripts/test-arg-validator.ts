#!/usr/bin/env tsx
/**
 * Unit tests for the argument validator
 * Demonstrates that only safe, short flags are permitted
 */

// Copy of the validator function for testing
function validateExtraArgs(args: string[], scenarioId: string): { valid: boolean; error?: string } {
  // Special handling for exec scenarios that need code snippets
  if (scenarioId === 'tsx-exec' || scenarioId === 'node-exec') {
    // For exec scenarios, we expect a single code string
    if (args.length !== 1) {
      return { valid: false, error: 'Exec scenarios must have exactly one code argument' };
    }
    // Code snippets can be longer but still have a reasonable limit
    if (args[0].length > 5000) {
      return { valid: false, error: 'Code argument exceeds 5000 character limit' };
    }
    return { valid: true };
  }
  
  // For non-exec scenarios, strict validation
  const MAX_ARGS = 6;
  const MAX_ARG_LENGTH = 200;
  const MAX_TOTAL_LENGTH = 500;
  
  // Check arg count
  if (args.length > MAX_ARGS) {
    return { valid: false, error: `Too many arguments (${args.length} > ${MAX_ARGS})` };
  }
  
  // Check total length
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
  
  // Valid flag patterns
  const FLAG_PATTERN = /^--[a-zA-Z0-9-]+(=[a-zA-Z0-9_\-\.\/]+)?$/;
  const SHORT_FLAG_PATTERN = /^-[a-zA-Z0-9]$/;
  const FILE_PATH_PATTERN = /^[a-zA-Z0-9_\-\.\/]+$/;
  
  for (const arg of args) {
    // Check length
    if (arg.length > MAX_ARG_LENGTH) {
      return { valid: false, error: `Argument too long: "${arg.substring(0, 50)}..."` };
    }
    
    // Check for forbidden characters
    for (const char of FORBIDDEN_CHARS) {
      if (arg.includes(char)) {
        return { valid: false, error: `Forbidden character '${char}' in argument: "${arg}"` };
      }
    }
    
    // Check if it matches valid patterns
    const isValidFlag = FLAG_PATTERN.test(arg) || SHORT_FLAG_PATTERN.test(arg) || FILE_PATH_PATTERN.test(arg);
    if (!isValidFlag) {
      return { valid: false, error: `Invalid argument format: "${arg}"` };
    }
  }
  
  return { valid: true };
}

console.log('🔒 Argument Validator Unit Tests\n');
console.log('=' .repeat(60));

// Test cases
interface TestCase {
  name: string;
  args: string[];
  scenarioId: string;
  expectValid: boolean;
  description: string;
}

const testCases: TestCase[] = [
  // ✅ GOOD CASES (5)
  {
    name: 'Valid long flag with value',
    args: ['--output=dist/build.js'],
    scenarioId: 'tsc',
    expectValid: true,
    description: 'Standard flag with path value'
  },
  {
    name: 'Valid short flags',
    args: ['-v', '-h'],
    scenarioId: 'lint',
    expectValid: true,
    description: 'Common short flags'
  },
  {
    name: 'Valid file path',
    args: ['src/index.ts'],
    scenarioId: 'node-file',
    expectValid: true,
    description: 'Simple file path argument'
  },
  {
    name: 'Valid multiple flags',
    args: ['--max-warnings=0', '--fix', '--cache'],
    scenarioId: 'lint',
    expectValid: true,
    description: 'Multiple ESLint-style flags'
  },
  {
    name: 'Valid exec code snippet',
    args: ['console.log("Hello, World!");'],
    scenarioId: 'tsx-exec',
    expectValid: true,
    description: 'Code snippet for tsx -e execution'
  },
  
  // ❌ BAD CASES (5+)
  {
    name: 'Command injection attempt 1',
    args: ['--out="; rm -rf /"'],
    scenarioId: 'tsc',
    expectValid: false,
    description: 'Semicolon injection attempt'
  },
  {
    name: 'Command injection attempt 2',
    args: ['--file=$(whoami)'],
    scenarioId: 'lint',
    expectValid: false,
    description: 'Command substitution attempt'
  },
  {
    name: 'Pipe injection',
    args: ['--output=file.txt | cat /etc/passwd'],
    scenarioId: 'tsc',
    expectValid: false,
    description: 'Pipe character injection'
  },
  {
    name: 'Backtick injection',
    args: ['--name=`id`'],
    scenarioId: 'lint',
    expectValid: false,
    description: 'Backtick command execution'
  },
  {
    name: 'Redirect injection',
    args: ['--log=test.log > /etc/passwd'],
    scenarioId: 'route-check',
    expectValid: false,
    description: 'Output redirect attempt'
  },
  {
    name: 'Too many arguments',
    args: ['--flag1', '--flag2', '--flag3', '--flag4', '--flag5', '--flag6', '--flag7'],
    scenarioId: 'lint',
    expectValid: false,
    description: 'Exceeds maximum arg count (6)'
  },
  {
    name: 'Argument too long',
    args: ['--file=' + 'a'.repeat(250)],
    scenarioId: 'tsc',
    expectValid: false,
    description: 'Single argument exceeds 200 char limit'
  },
  {
    name: 'Quotes injection',
    args: ['--name="test"; echo "pwned"'],
    scenarioId: 'lint',
    expectValid: false,
    description: 'Quote escape attempt'
  },
  {
    name: 'Wildcard injection',
    args: ['--path=/tmp/*'],
    scenarioId: 'route-check',
    expectValid: false,
    description: 'Wildcard expansion attempt'
  },
  {
    name: 'Newline injection',
    args: ['--text=line1\nrm -rf /'],
    scenarioId: 'tsc',
    expectValid: false,
    description: 'Newline character injection'
  }
];

// Run tests
let passCount = 0;
let failCount = 0;

testCases.forEach((test, index) => {
  const result = validateExtraArgs(test.args, test.scenarioId);
  const passed = result.valid === test.expectValid;
  
  if (passed) {
    passCount++;
    console.log(`\n✅ Test ${index + 1}: ${test.name}`);
  } else {
    failCount++;
    console.log(`\n❌ Test ${index + 1}: ${test.name}`);
  }
  
  console.log(`   Description: ${test.description}`);
  console.log(`   Args: ${JSON.stringify(test.args)}`);
  console.log(`   Expected: ${test.expectValid ? 'VALID' : 'INVALID'}`);
  console.log(`   Result: ${result.valid ? 'VALID' : 'INVALID'}`);
  
  if (!result.valid) {
    console.log(`   Rejection reason: ${result.error}`);
  }
  
  if (!passed) {
    console.log(`   ⚠️ TEST FAILED: Expected ${test.expectValid ? 'VALID' : 'INVALID'} but got ${result.valid ? 'VALID' : 'INVALID'}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Results: ${passCount} passed, ${failCount} failed\n`);

if (failCount === 0) {
  console.log('🎉 All tests passed! The validator correctly:');
  console.log('   ✅ Accepts safe, standard flag patterns');
  console.log('   ✅ Rejects command injection attempts');
  console.log('   ✅ Blocks dangerous metacharacters');
  console.log('   ✅ Enforces length and count limits');
  console.log('   ✅ Prevents shell expansion attacks');
} else {
  console.log('⚠️ Some tests failed. Please review the validator logic.');
  process.exit(1);
}

console.log('\n🔒 Security Features Summary:');
console.log('   • Forbidden characters: ; | & > < $ ` \' " ( ) { } [ ] * ? ~ \\n \\r \\t \\\\');
console.log('   • Max arguments: 6');
console.log('   • Max arg length: 200 chars');
console.log('   • Max total length: 500 chars');
console.log('   • Allowed patterns: --flag, --flag=value, -f, filepath');
console.log('   • Special handling for tsx/node -e code execution');