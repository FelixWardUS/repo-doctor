# CI Quality Gate

`repo-doctor` can block CI when a repository health score drops below a required threshold.

## Command

```bash
repo-doctor scan . --format markdown --fail-under 90
```

The command prints the report before returning a failing exit code, so GitHub Actions can still capture the Markdown output.

## GitHub Actions

For a published package, run it with `npx`:

```yaml
name: Repo Doctor

on:
  pull_request:
  push:

jobs:
  health:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Repository health gate
        run: npx repo-doctor scan . --format markdown --fail-under 90 >> "$GITHUB_STEP_SUMMARY"
```

For this repository, CI builds the local CLI first and then runs:

```bash
node dist/cli.js scan . --format markdown --fail-under 90 >> "$GITHUB_STEP_SUMMARY"
```

## Config File

Use `.repo-doctor.json` when the same settings should apply locally and in CI:

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

Command-line options override `format` and `failUnder` from the config file.
