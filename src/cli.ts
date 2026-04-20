#!/usr/bin/env node
import { realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { Command, CommanderError, InvalidArgumentError } from "commander";
import { scanRepository } from "./scanner.js";
import { evaluateRepository } from "./rules.js";
import { formatHumanReport, formatJsonReport, formatMarkdownReport } from "./reporter.js";
import { loadConfig } from "./config.js";
import { collectDependencyDiagnostics } from "./dependencies.js";
import type { DependencyCommandRunner, HealthReport, ReportFormat } from "./types.js";

export interface CliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
  cwd?: string;
  dependencyRunner?: DependencyCommandRunner;
}

export async function runCli(
  argv: string[] = process.argv,
  io: CliIo = {
    stdout: (value) => process.stdout.write(value),
    stderr: (value) => process.stderr.write(value)
  }
): Promise<number> {
  const program = new Command();
  const cwd = io.cwd ?? process.cwd();
  let exitCode = 0;

  program
    .name("repo-doctor")
    .description("Scan a local repository and print a project health report.")
    .version("0.1.0")
    .exitOverride()
    .configureOutput({
      writeOut: io.stdout,
      writeErr: io.stderr
    });

  program
    .command("scan")
    .description("Scan a repository directory.")
    .argument("[path]", "repository path", ".")
    .option("--json", "print JSON output")
    .option("--format <format>", "print text, json, or markdown output", parseReportFormat)
    .option("--fail-under <score>", "return exit code 1 when the score is below this threshold", parseScoreThreshold)
    .option("--include-dependencies", "include npm audit and outdated diagnostics")
    .action(async (target: string, options: {
      json?: boolean;
      format?: ReportFormat;
      failUnder?: number;
      includeDependencies?: boolean;
    }) => {
      const targetPath = resolve(cwd, target);
      const config = await loadConfig(targetPath);
      const scan = await scanRepository(targetPath);
      const dependencyDiagnostics = options.includeDependencies && scan.packageJson
        ? await collectDependencyDiagnostics(targetPath, io.dependencyRunner)
        : undefined;
      const report = evaluateRepository(scan, {
        rules: config.rules,
        dependencyDiagnostics
      });
      const format = options.json ? "json" : options.format ?? config.format ?? "text";
      const failUnder = options.failUnder ?? config.failUnder;
      const output = formatReport(report, format);
      io.stdout(output);

      if (typeof failUnder === "number" && report.score < failUnder) {
        io.stderr(`Score is below threshold: expected at least ${failUnder}, got ${report.score}.\n`);
        exitCode = 1;
      }
    });

  try {
    await program.parseAsync(argv, { from: "node" });
    return exitCode;
  } catch (error) {
    if (error instanceof CommanderError) {
      return error.exitCode;
    }

    const message = error instanceof Error ? error.message : String(error);
    io.stderr(`Error: ${message}\n`);
    return 1;
  }
}

function formatReport(report: HealthReport, format: ReportFormat): string {
  if (format === "json") {
    return `${formatJsonReport(report)}\n`;
  }

  if (format === "markdown") {
    return formatMarkdownReport(report);
  }

  return formatHumanReport(report);
}

function parseReportFormat(value: string): ReportFormat {
  if (value === "text" || value === "json" || value === "markdown") {
    return value;
  }

  throw new InvalidArgumentError("Expected text, json, or markdown.");
}

function parseScoreThreshold(value: string): number {
  const score = Number(value);

  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new InvalidArgumentError("Expected an integer from 0 to 100.");
  }

  return score;
}

async function isCliEntrypoint(argvPath: string | undefined): Promise<boolean> {
  if (!argvPath) {
    return false;
  }

  const currentFile = await realpath(fileURLToPath(import.meta.url));
  const invokedFile = await realpath(argvPath);
  return currentFile === invokedFile;
}

if (await isCliEntrypoint(process.argv[1])) {
  runCli().then((code) => {
    process.exitCode = code;
  });
}
