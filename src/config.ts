import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { RepoDoctorConfig, ReportFormat, RuleConfig } from "./types.js";

const configFileName = ".repo-doctor.json";

export async function loadConfig(targetPath: string): Promise<RepoDoctorConfig> {
  try {
    const raw = await readFile(join(targetPath, configFileName), "utf8");
    return parseConfig(raw);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

function parseConfig(raw: string): RepoDoctorConfig {
  const parsed = JSON.parse(raw) as unknown;

  if (!isRecord(parsed)) {
    throw new Error(`${configFileName} must contain a JSON object.`);
  }

  const config: RepoDoctorConfig = {};

  if (parsed.format !== undefined) {
    if (!isReportFormat(parsed.format)) {
      throw new Error(`${configFileName} format must be "text", "json", or "markdown".`);
    }

    config.format = parsed.format;
  }

  if (parsed.failUnder !== undefined) {
    if (!isScoreThreshold(parsed.failUnder)) {
      throw new Error(`${configFileName} failUnder must be an integer from 0 to 100.`);
    }

    config.failUnder = parsed.failUnder;
  }

  if (parsed.rules !== undefined) {
    if (!isRecord(parsed.rules)) {
      throw new Error(`${configFileName} rules must be a JSON object.`);
    }

    config.rules = parseRules(parsed.rules);
  }

  return config;
}

function parseRules(rawRules: Record<string, unknown>): Record<string, RuleConfig> {
  const rules: Record<string, RuleConfig> = {};

  for (const [id, rawRule] of Object.entries(rawRules)) {
    if (!isRecord(rawRule)) {
      throw new Error(`${configFileName} rule "${id}" must be a JSON object.`);
    }

    const rule: RuleConfig = {};

    if (rawRule.enabled !== undefined) {
      if (typeof rawRule.enabled !== "boolean") {
        throw new Error(`${configFileName} rule "${id}" enabled must be a boolean.`);
      }

      rule.enabled = rawRule.enabled;
    }

    if (rawRule.weight !== undefined) {
      if (!isRuleWeight(rawRule.weight)) {
        throw new Error(`${configFileName} rule "${id}" weight must be an integer from 0 to 100.`);
      }

      rule.weight = rawRule.weight;
    }

    rules[id] = rule;
  }

  return rules;
}

function isReportFormat(value: unknown): value is ReportFormat {
  return value === "text" || value === "json" || value === "markdown";
}

function isScoreThreshold(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100;
}

function isRuleWeight(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
