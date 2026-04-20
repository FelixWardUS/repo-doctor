import { execFile } from "node:child_process";
import type {
  CommandResult,
  DependencyAuditSummary,
  DependencyCommandRunner,
  DependencyDiagnostics,
  OutdatedDependency
} from "./types.js";

export async function collectDependencyDiagnostics(
  targetPath: string,
  runner: DependencyCommandRunner = runNpmCommand
): Promise<DependencyDiagnostics> {
  const [auditResult, outdatedResult] = await Promise.all([
    runner(["audit", "--json"], targetPath),
    runner(["outdated", "--json"], targetPath)
  ]);

  const diagnostics: DependencyDiagnostics = {
    errors: []
  };

  const audit = parseAudit(auditResult.stdout);
  if (audit) {
    diagnostics.audit = audit;
  } else if (auditResult.stderr.trim()) {
    diagnostics.errors?.push(`npm audit: ${auditResult.stderr.trim()}`);
  }

  const outdated = parseOutdated(outdatedResult.stdout);
  if (outdated) {
    diagnostics.outdated = outdated;
  } else if (outdatedResult.stderr.trim()) {
    diagnostics.errors?.push(`npm outdated: ${outdatedResult.stderr.trim()}`);
  }

  if (diagnostics.errors?.length === 0) {
    delete diagnostics.errors;
  }

  return diagnostics;
}

function runNpmCommand(args: string[], cwd: string): Promise<CommandResult> {
  return new Promise((resolve) => {
    execFile("npm", args, { cwd }, (error, stdout, stderr) => {
      resolve({
        exitCode: typeof error === "object" && error && "code" in error && typeof error.code === "number"
          ? error.code
          : 0,
        stdout,
        stderr
      });
    });
  });
}

function parseAudit(stdout: string): DependencyAuditSummary | undefined {
  if (!stdout.trim()) {
    return undefined;
  }

  const parsed = JSON.parse(stdout) as {
    metadata?: {
      vulnerabilities?: Partial<Record<"info" | "low" | "moderate" | "high" | "critical" | "total", unknown>>;
    };
  };
  const vulnerabilities = parsed.metadata?.vulnerabilities;

  if (!vulnerabilities) {
    return undefined;
  }

  return {
    total: numberOrZero(vulnerabilities.total),
    bySeverity: {
      info: numberOrZero(vulnerabilities.info),
      low: numberOrZero(vulnerabilities.low),
      moderate: numberOrZero(vulnerabilities.moderate),
      high: numberOrZero(vulnerabilities.high),
      critical: numberOrZero(vulnerabilities.critical)
    }
  };
}

function parseOutdated(stdout: string): OutdatedDependency[] | undefined {
  if (!stdout.trim()) {
    return [];
  }

  const parsed = JSON.parse(stdout) as Record<string, {
    current?: unknown;
    wanted?: unknown;
    latest?: unknown;
  }>;

  return Object.entries(parsed)
    .map(([name, value]) => ({
      name,
      current: typeof value.current === "string" ? value.current : "unknown",
      wanted: typeof value.wanted === "string" ? value.wanted : "unknown",
      latest: typeof value.latest === "string" ? value.latest : "unknown"
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" ? value : 0;
}
