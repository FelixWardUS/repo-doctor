import { describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCli } from "../src/cli.js";

const fixturesPath = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("runCli", () => {
  it("prints a human report for a scan", async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];

    const code = await runCli([
      "node",
      "repo-doctor",
      "scan",
      join(fixturesPath, "healthy-node-repo")
    ], {
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value)
    });

    expect(code).toBe(0);
    expect(stderr).toEqual([]);
    expect(stdout.join("")).toContain("Score: 100/100");
  });

  it("prints JSON when requested", async () => {
    const stdout: string[] = [];

    const code = await runCli([
      "node",
      "repo-doctor",
      "scan",
      join(fixturesPath, "healthy-node-repo"),
      "--json"
    ], {
      stdout: (value) => stdout.push(value),
      stderr: () => undefined
    });

    const parsed = JSON.parse(stdout.join(""));
    expect(code).toBe(0);
    expect(parsed.score).toBe(100);
    expect(parsed.checks.map((check: { id: string }) => check.id)).toContain("readme");
  });

  it("prints Markdown when requested", async () => {
    const stdout: string[] = [];

    const code = await runCli([
      "node",
      "repo-doctor",
      "scan",
      join(fixturesPath, "healthy-node-repo"),
      "--format",
      "markdown"
    ], {
      stdout: (value) => stdout.push(value),
      stderr: () => undefined
    });

    expect(code).toBe(0);
    expect(stdout.join("")).toContain("# Repo Doctor");
    expect(stdout.join("")).toContain("| PASS | README | README.md exists. |");
  });

  it("returns a failing exit code when the score is below the requested threshold", async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];

    const code = await runCli([
      "node",
      "repo-doctor",
      "scan",
      join(fixturesPath, "minimal-repo"),
      "--fail-under",
      "80"
    ], {
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value)
    });

    expect(code).toBe(1);
    expect(stdout.join("")).toContain("Score:");
    expect(stderr.join("")).toContain("Score is below threshold: expected at least 80, got");
  });

  it("keeps a successful exit code when the score meets the requested threshold", async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];

    const code = await runCli([
      "node",
      "repo-doctor",
      "scan",
      join(fixturesPath, "healthy-node-repo"),
      "--fail-under",
      "100"
    ], {
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value)
    });

    expect(code).toBe(0);
    expect(stdout.join("")).toContain("Score: 100/100");
    expect(stderr).toEqual([]);
  });

  it("uses config defaults for output format and fail-under threshold", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "repo-doctor-cli-"));
    const stdout: string[] = [];
    const stderr: string[] = [];

    try {
      await writeFile(join(tempDir, "README.md"), "# Minimal Repo\n");
      await writeFile(join(tempDir, ".repo-doctor.json"), JSON.stringify({
        format: "markdown",
        failUnder: 80
      }));

      const code = await runCli([
        "node",
        "repo-doctor",
        "scan",
        tempDir
      ], {
        stdout: (value) => stdout.push(value),
        stderr: (value) => stderr.push(value)
      });

      expect(code).toBe(1);
      expect(stdout.join("")).toContain("# Repo Doctor");
      expect(stderr.join("")).toContain("Score is below threshold: expected at least 80, got");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("uses configured rule overrides during a scan", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "repo-doctor-cli-"));
    const stdout: string[] = [];

    try {
      await writeFile(join(tempDir, "README.md"), "# Minimal Repo\n");
      await writeFile(join(tempDir, ".repo-doctor.json"), JSON.stringify({
        rules: {
          license: {
            enabled: false
          }
        }
      }));

      const code = await runCli([
        "node",
        "repo-doctor",
        "scan",
        tempDir
      ], {
        stdout: (value) => stdout.push(value),
        stderr: () => undefined
      });

      expect(code).toBe(0);
      expect(stdout.join("")).not.toContain("[FAIL] License");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("includes dependency diagnostics only when requested", async () => {
    const stdout: string[] = [];

    const code = await runCli([
      "node",
      "repo-doctor",
      "scan",
      join(fixturesPath, "healthy-node-repo"),
      "--include-dependencies"
    ], {
      stdout: (value) => stdout.push(value),
      stderr: () => undefined,
      dependencyRunner: async (args) => {
        if (args[0] === "audit") {
          return {
            exitCode: 0,
            stdout: JSON.stringify({
              metadata: {
                vulnerabilities: {
                  info: 0,
                  low: 0,
                  moderate: 0,
                  high: 0,
                  critical: 0,
                  total: 0
                }
              }
            }),
            stderr: ""
          };
        }

        return {
          exitCode: 1,
          stdout: JSON.stringify({
            vitest: {
              current: "2.1.9",
              wanted: "2.1.9",
              latest: "4.1.4"
            }
          }),
          stderr: ""
        };
      }
    });

    expect(code).toBe(0);
    expect(stdout.join("")).toContain("[PASS] Dependency audit - npm audit found no vulnerabilities.");
    expect(stdout.join("")).toContain("[WARN] Dependency freshness - npm outdated found 1 package behind latest.");
  });
});
