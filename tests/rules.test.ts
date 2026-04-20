import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateRepository } from "../src/rules.js";
import { scanRepository } from "../src/scanner.js";

const fixturesPath = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("evaluateRepository", () => {
  it("awards a complete score to a documented Node project", async () => {
    const report = evaluateRepository(
      await scanRepository(join(fixturesPath, "healthy-node-repo"))
    );

    expect(report.score).toBe(100);
    expect(report.summary.passed).toBe(report.checks.length);
    expect(report.recommendations).toEqual([]);
  });

  it("recommends concrete fixes for an incomplete repository", async () => {
    const report = evaluateRepository(
      await scanRepository(join(fixturesPath, "minimal-repo"))
    );

    expect(report.score).toBeLessThan(50);
    expect(report.summary.failed).toBeGreaterThan(0);
    expect(report.recommendations).toContain("Add a LICENSE file so visitors know how the project can be used.");
    expect(report.recommendations).toContain("Add an Installation section to README.md.");
    expect(report.checks.find((check) => check.id === "node-test-script")?.status).toBe("warn");
  });
});
