import type { HealthCheck, HealthReport } from "./types.js";

export function formatHumanReport(report: HealthReport): string {
  const lines = [
    "Repo Doctor",
    `Target: ${report.targetPath}`,
    `Score: ${report.score}/100`,
    `Summary: ${report.summary.passed} passed, ${report.summary.warned} warned, ${report.summary.failed} failed`,
    "",
    "Checks:"
  ];

  for (const check of report.checks) {
    lines.push(formatCheck(check));
  }

  lines.push("", "Recommendations:");
  if (report.recommendations.length === 0) {
    lines.push("- No recommendations.");
  } else {
    lines.push(...report.recommendations.map((recommendation) => `- ${recommendation}`));
  }

  return `${lines.join("\n")}\n`;
}

export function formatJsonReport(report: HealthReport): string {
  return JSON.stringify(report, null, 2);
}

function formatCheck(check: HealthCheck): string {
  return `[${check.status.toUpperCase()}] ${check.label} - ${check.message}`;
}
