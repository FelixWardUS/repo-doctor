import { describe, expect, it } from "vitest";
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
});
