import { describe, expect, it } from "vitest";
import { formatHumanReport, formatJsonReport, formatMarkdownReport } from "../src/reporter.js";
import type { HealthReport } from "../src/types.js";

const report: HealthReport = {
  targetPath: "/tmp/example",
  score: 72,
  summary: {
    passed: 1,
    warned: 1,
    failed: 1
  },
  checks: [
    {
      id: "readme",
      label: "README",
      status: "pass",
      message: "README.md exists.",
      weight: 20,
      points: 20
    },
    {
      id: "ci",
      label: "CI workflow",
      status: "warn",
      message: "No GitHub Actions workflow found.",
      suggestion: "Add a CI workflow that runs tests and builds the project.",
      weight: 10,
      points: 0
    },
    {
      id: "license",
      label: "License",
      status: "fail",
      message: "No LICENSE file found.",
      suggestion: "Add a LICENSE file so visitors know how the project can be used.",
      weight: 15,
      points: 0
    }
  ],
  recommendations: [
    "Add a CI workflow that runs tests and builds the project.",
    "Add a LICENSE file so visitors know how the project can be used."
  ]
};

describe("reporters", () => {
  it("formats a scannable terminal report", () => {
    const output = formatHumanReport(report);

    expect(output).toContain("Repo Doctor");
    expect(output).toContain("Score: 72/100");
    expect(output).toContain("[PASS] README");
    expect(output).toContain("[WARN] CI workflow");
    expect(output).toContain("[FAIL] License");
    expect(output).toContain("Recommendations");
  });

  it("formats stable pretty JSON", () => {
    const output = formatJsonReport(report);

    expect(JSON.parse(output)).toEqual(report);
    expect(output).toContain('\n  "score": 72,\n');
  });

  it("formats a Markdown report for GitHub summaries and PR comments", () => {
    const output = formatMarkdownReport(report);

    expect(output).toContain("# Repo Doctor");
    expect(output).toContain("**Score:** 72/100");
    expect(output).toContain("| Status | Check | Message |");
    expect(output).toContain("| PASS | README | README.md exists. |");
    expect(output).toContain("| WARN | CI workflow | No GitHub Actions workflow found. |");
    expect(output).toContain("| FAIL | License | No LICENSE file found. |");
    expect(output).toContain("## Recommendations");
    expect(output).toContain("- Add a LICENSE file so visitors know how the project can be used.");
  });
});
