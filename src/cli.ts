#!/usr/bin/env node
import { realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { Command, CommanderError } from "commander";
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
    .action(async (target: string, options: { json?: boolean }) => {
      const scan = await scanRepository(resolve(cwd, target));
      const report = evaluateRepository(scan);
      const output = options.json ? `${formatJsonReport(report)}\n` : formatHumanReport(report);
      io.stdout(output);
    });

  try {
    await program.parseAsync(argv, { from: "node" });
    return 0;
  } catch (error) {
    if (error instanceof CommanderError) {
      return error.exitCode;
    }

    const message = error instanceof Error ? error.message : String(error);
    io.stderr(`Error: ${message}\n`);
    return 1;
  }
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
