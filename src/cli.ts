#!/usr/bin/env node
import { realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { Command, CommanderError, InvalidArgumentError } from "commander";
import { scanRepository } from "./scanner.js";
import { evaluateRepository } from "./rules.js";
import { formatHumanReport, formatJsonReport } from "./reporter.js";

export interface CliIo {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
  cwd?: string;
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
    .option("--fail-under <score>", "return exit code 1 when the score is below this threshold", parseScoreThreshold)
    .action(async (target: string, options: { json?: boolean; failUnder?: number }) => {
      const scan = await scanRepository(resolve(cwd, target));
      const report = evaluateRepository(scan);
      const output = options.json ? `${formatJsonReport(report)}\n` : formatHumanReport(report);
      io.stdout(output);

      if (typeof options.failUnder === "number" && report.score < options.failUnder) {
        io.stderr(`Score is below threshold: expected at least ${options.failUnder}, got ${report.score}.\n`);
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
