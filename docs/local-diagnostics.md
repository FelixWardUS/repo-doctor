# Local Diagnostics

`repo-doctor scan .` is designed to explain what to fix next, not only assign a score.

## Default Offline Checks

The default scan stays local and offline. It checks:

- Repository files: `README`, `LICENSE`, `.gitignore`, and GitHub Actions workflows.
- README structure: installation, usage, testing, and command examples.
- Node package metadata: `name`, `version`, `test` script, and `build` script.
- CI coverage: whether GitHub Actions workflows run the package test and build scripts.

Warnings and failures can include `Next:` lines in text output and a `Next Steps` section in Markdown output.

## Optional Dependency Checks

Use dependency diagnostics when you want npm security and freshness signals:

```bash
repo-doctor scan . --include-dependencies
```

This runs:

```bash
npm audit --json
npm outdated --json
```

These checks are intentionally opt-in because they can depend on network access and registry behavior. Their results are reported as zero-weight warnings, so they do not change the score used by `--fail-under`.

## Recommended Local Workflow

```bash
repo-doctor scan .
repo-doctor scan . --include-dependencies
repo-doctor scan . --format markdown
```

Use the first command for fast local feedback, the second before dependency update work, and the third when preparing a report for CI or a pull request.
