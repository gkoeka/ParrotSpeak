#!/bin/bash
# Security regression tests for CI/CD pipeline
# Run this as part of your build process to prevent security regressions

set -e  # Exit on any error

echo "🔒 Running Security Regression Tests"
echo "===================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0

# Test 1: Injection Prevention
echo -e "\n${YELLOW}1. Testing Injection Prevention...${NC}"
if npx tsx scripts/test-injection-prevention.ts > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Injection prevention tests passed${NC}"
else
    echo -e "${RED}❌ Injection prevention tests FAILED${NC}"
    FAILED=1
fi

# Test 2: Argument Validator
echo -e "\n${YELLOW}2. Testing Argument Validator...${NC}"
if npx tsx scripts/test-arg-validator.ts > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Argument validator tests passed${NC}"
else
    echo -e "${RED}❌ Argument validator tests FAILED${NC}"
    FAILED=1
fi

# Test 3: Blast Radius Reduction
echo -e "\n${YELLOW}3. Testing Blast Radius Reduction...${NC}"
if npx tsx scripts/test-blast-radius.ts > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Blast radius tests passed${NC}"
else
    echo -e "${RED}❌ Blast radius tests FAILED${NC}"
    FAILED=1
fi

# Test 4: Code Security Checks
echo -e "\n${YELLOW}4. Verifying Security Implementation...${NC}"

# Check for shell: false
if grep -q "shell: false" scripts/verifyAllScenarios.ts; then
    echo -e "${GREEN}✅ Shell execution disabled${NC}"
else
    echo -e "${RED}❌ Shell execution not explicitly disabled${NC}"
    FAILED=1
fi

# Check for ALLOWED_COMMANDS
if grep -q "ALLOWED_COMMANDS" scripts/verifyAllScenarios.ts; then
    echo -e "${GREEN}✅ Command allowlist present${NC}"
else
    echo -e "${RED}❌ Command allowlist missing${NC}"
    FAILED=1
fi

# Check for validateExtraArgs
if grep -q "validateExtraArgs" scripts/verifyAllScenarios.ts; then
    echo -e "${GREEN}✅ Argument validator present${NC}"
else
    echo -e "${RED}❌ Argument validator missing${NC}"
    FAILED=1
fi

# Check for environment stripping
if grep -q "minimalEnv" scripts/verifyAllScenarios.ts; then
    echo -e "${GREEN}✅ Environment isolation present${NC}"
else
    echo -e "${RED}❌ Environment isolation missing${NC}"
    FAILED=1
fi

# Summary
echo -e "\n===================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All security tests passed!${NC}"
    echo "Security measures are properly implemented and working."
    exit 0
else
    echo -e "${RED}❌ Security tests failed!${NC}"
    echo "Security regression detected. Fix issues before deploying."
    exit 1
fi