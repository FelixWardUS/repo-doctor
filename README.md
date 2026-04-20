# repo-doctor

A local repository health check CLI for README quality, licensing, CI readiness, and Node package basics.

`repo-doctor` scans a project directory and prints a health report with a score, passed checks, failed checks, and concrete next steps. The default scan works offline and does not require a GitHub token.

## Features

- Checks for `README.md`, `LICENSE`, `.gitignore`, and GitHub Actions workflows
- Reviews README sections for installation, usage, testing, and command examples
- Detects `package.json` metadata when scanning Node projects
- Checks Node `test` and `build` scripts only when `package.json` exists
- Checks whether GitHub Actions workflows actually run Node test and build scripts
- Shows per-check next steps for missing README sections, scripts, CI commands, and metadata
- Optionally checks npm audit and outdated dependency risk with `--include-dependencies`
- Outputs terminal text, pretty JSON, or Markdown for GitHub summaries and PR comments
- Fails CI below a configured score with `--fail-under`
- Reads `.repo-doctor.json` for output defaults, score thresholds, and rule overrides
- Includes focused unit tests and CI configuration

## Installation

Install dependencies after cloning the repository:

```bash
npm install
```

Build the CLI:

```bash
npm run build
```

Optionally link it for local command-line use:

```bash
npm link
```

## Usage

Run against the current directory:

```bash
repo-doctor scan .
```

Run without linking:

```bash
node dist/cli.js scan .
```

Print JSON output:

```bash
repo-doctor scan . --json
```

Print Markdown output:

```bash
repo-doctor scan . --format markdown
```

Fail when a repository scores below a threshold:

```bash
repo-doctor scan . --fail-under 90
```

Include npm dependency risk diagnostics:

```bash
repo-doctor scan . --include-dependencies
```

Run directly during development:

```bash
npm run dev -- scan .
```

## Example Output

```text
Repo Doctor
Target: /path/to/project
Score: 100/100
Summary: 11 passed, 0 warned, 0 failed

Checks:
[PASS] README - README.md exists.
[PASS] License - A license file exists.
[PASS] Git ignore - .gitignore exists.
[PASS] CI workflow - A GitHub Actions workflow exists.
```

When a check warns or fails, the terminal and Markdown reports include focused next steps. For example:

```text
[FAIL] README installation - README is missing installation instructions.
  Next: Add a second-level heading like "## Installation" and include the install command.
```

JSON output is useful for automation:

```bash
repo-doctor scan . --json
```

See [examples/sample-report.json](examples/sample-report.json) for a full example.

## CI Quality Gate

Use `--fail-under` to make repository health part of CI:

```bash
repo-doctor scan . --format markdown --fail-under 90
```

In GitHub Actions, write the Markdown report to the job summary:

```yaml
- name: Repository health gate
  run: repo-doctor scan . --format markdown --fail-under 90 >> "$GITHUB_STEP_SUMMARY"
```

This repository runs the local build output the same way in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Configuration

Create `.repo-doctor.json` in the repository being scanned to set defaults:

```json
{
  "format": "markdown",
  "failUnder": 90,
  "rules": {
    "license": {
      "enabled": true,
      "weight": 15
    },
    "readme-examples": {
      "enabled": false
    }
  }
}
```

Command-line options override config file defaults. Rule keys match check IDs in the report, such as `readme`, `license`, `ci-workflow`, `readme-usage`, `node-test-script`, and `node-build-script`.

## Dependency Diagnostics

Dependency checks are opt-in because they run npm commands and may depend on network or registry availability:

```bash
repo-doctor scan . --include-dependencies
```

When enabled for a Node project, `repo-doctor` runs:

- `npm audit --json`
- `npm outdated --json`

The results are reported as zero-weight diagnostic checks, so they do not change the repository score. Vulnerabilities and outdated packages appear as warnings with next-step details.

## Scoring

The score is weighted around practical repository readiness:

- README, license, `.gitignore`, and CI workflow checks
- README installation, usage, testing, and example checks
- Node package metadata, test script, and build script checks when `package.json` exists
- Zero-weight diagnostics for CI test/build command coverage and optional dependency risk

If a repository is not a Node project, Node-specific checks are reported as warnings and do not reduce the score.

## Testing

Run the test suite:

```bash
npm test
```

## Development

Run the TypeScript checker:

```bash
npm run typecheck
```

Build compiled output:

```bash
npm run build
```

## Roadmap

- Add support for Python and Rust project metadata
- Add richer lockfile and package manager detection
- Add first-class npm publishing workflow

## License

MIT
