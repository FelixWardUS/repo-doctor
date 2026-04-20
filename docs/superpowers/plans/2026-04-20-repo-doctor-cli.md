# Repo Doctor CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript CLI that scans a local repository and reports basic project health with terminal and JSON output.

**Architecture:** The CLI delegates filesystem discovery to a scanner, applies deterministic health rules in a rules module, and formats results through reporter functions. The implementation stays local-only with no GitHub API or network calls.

**Tech Stack:** Node.js, TypeScript, Commander, Vitest, GitHub Actions.

---

## File Structure

- `package.json`: npm package metadata, CLI bin, scripts, runtime and dev dependencies.
- `tsconfig.json`: strict TypeScript configuration for source and tests.
- `vitest.config.ts`: Vitest test configuration.
- `src/types.ts`: shared types for scans, checks, reports, and severities.
- `src/scanner.ts`: reads a target directory and returns normalized repository facts.
- `src/rules.ts`: converts repository facts into health checks and a score.
- `src/reporter.ts`: formats health reports as terminal text or JSON.
- `src/cli.ts`: Commander command entrypoint for `repo-doctor scan`.
- `tests/fixtures/*`: small fixture repositories used by tests.
- `tests/*.test.ts`: scanner, rules, reporter, and CLI tests.
- `examples/sample-report.json`: committed example JSON output.
- `.github/workflows/ci.yml`: install, typecheck, test, and build workflow.
- `README.md`: project overview, install, usage, output examples, and development commands.

## Tasks

### Task 1: Project Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`

- [ ] Add npm scripts: `build`, `typecheck`, `test`, and `dev`.
- [ ] Configure `bin.repo-doctor` to point at `dist/cli.js`.
- [ ] Use TypeScript strict mode and ESM output.

### Task 2: Scanner Tests

**Files:**
- Create: `tests/fixtures/healthy-node-repo/*`
- Create: `tests/fixtures/minimal-repo/*`
- Create: `tests/scanner.test.ts`
- Create: `src/scanner.ts` after the failing test is observed.

- [ ] Write tests showing that scanner detects README, LICENSE, `.gitignore`, `package.json`, package scripts, and README sections.
- [ ] Run `npm test -- tests/scanner.test.ts` and confirm the test fails because scanner code is missing.
- [ ] Implement the scanner and rerun the test.

### Task 3: Rule Engine Tests

**Files:**
- Create: `tests/rules.test.ts`
- Create: `src/types.ts`
- Create: `src/rules.ts` after the failing test is observed.

- [ ] Write tests for scoring a healthy Node repo and recommending fixes for a minimal repo.
- [ ] Run `npm test -- tests/rules.test.ts` and confirm the test fails because rule code is missing.
- [ ] Implement deterministic checks and scoring, then rerun the test.

### Task 4: Reporter Tests

**Files:**
- Create: `tests/reporter.test.ts`
- Create: `src/reporter.ts` after the failing test is observed.

- [ ] Write tests for human-readable terminal output and pretty JSON output.
- [ ] Run `npm test -- tests/reporter.test.ts` and confirm the test fails because reporter code is missing.
- [ ] Implement formatters and rerun the test.

### Task 5: CLI Tests

**Files:**
- Create: `tests/cli.test.ts`
- Create: `src/cli.ts` after the failing test is observed.

- [ ] Write tests for `scan <path>` and `scan <path> --json`.
- [ ] Run `npm test -- tests/cli.test.ts` and confirm the test fails because CLI code is missing.
- [ ] Implement the Commander entrypoint and rerun the test.

### Task 6: Documentation and CI

**Files:**
- Replace: `README.md`
- Create: `LICENSE`
- Create: `examples/sample-report.json`
- Create: `.github/workflows/ci.yml`

- [ ] Document install, usage, JSON output, scoring rules, and development commands.
- [ ] Add MIT license text.
- [ ] Add a CI workflow that runs install, typecheck, tests, and build.

### Task 7: Final Verification

- [ ] Run `npm install`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run `node dist/cli.js scan .`.
- [ ] Run `node dist/cli.js scan . --json`.
