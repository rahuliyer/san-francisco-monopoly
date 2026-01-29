# CI Verification

Run the full verification suite (build, unit tests, and e2e tests) and report the results.

## Instructions

Execute the following verification steps in order, collecting results for a final summary:

### 1. Build Check
Run `pnpm build` to verify the production build succeeds.
- Record: pass/fail and any error messages

### 2. Unit Tests
Run `pnpm test` to execute all Jest unit tests.
- Record: pass/fail, number of test suites, number of tests, and any failures

### 3. E2E Tests
Run `pnpm test:e2e` to execute all Playwright end-to-end tests.
- Record: pass/fail, number of tests, and any failures

## Output Format

After running all checks, provide a clear summary report:

```
## Verification Results

| Check      | Status | Details |
|------------|--------|---------|
| Build      | ✅/❌  | ...     |
| Unit Tests | ✅/❌  | X suites, Y tests |
| E2E Tests  | ✅/❌  | X tests |

### Overall: PASS/FAIL
```

If any check fails, include the relevant error output to help diagnose the issue.

## Notes
- Run checks sequentially (build must pass before tests make sense)
- If build fails, still attempt to run tests to gather full diagnostic information
- Use appropriate timeouts: build (2min), unit tests (2min), e2e tests (5min)
