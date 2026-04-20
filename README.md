# repo-doctor

A local repository health check CLI for README quality, licensing, CI readiness, and Node package basics.

`repo-doctor` scans a project directory and prints a simple health report with a score, passed checks, failed checks, and concrete recommendations. It works offline and does not require a GitHub token.

## Features

- Checks for `README.md`, `LICENSE`, `.gitignore`, and GitHub Actions workflows
- Reviews README sections for installation, usage, testing, and command examples
- Detects `package.json` metadata when scanning Node projects
- Checks Node `test` and `build` scripts only when `package.json` exists
- Outputs either a terminal report or pretty JSON
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

JSON output is useful for automation:

```bash
repo-doctor scan . --json
```

See [examples/sample-report.json](examples/sample-report.json) for a full example.

## Scoring

The score is weighted around practical repository readiness:

- README, license, `.gitignore`, and CI workflow checks
- README installation, usage, testing, and example checks
- Node package metadata, test script, and build script checks when `package.json` exists

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

- Add configurable rule weights
- Add Markdown output for pull request comments
- Add support for Python and Rust project metadata
- Add a `--fail-under` option for CI gates

## License

MIT
# repo-doctor
