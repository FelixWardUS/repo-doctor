export type CheckStatus = "pass" | "warn" | "fail";
export type ReportFormat = "text" | "json" | "markdown";

export interface RepoDoctorConfig {
  format?: ReportFormat;
  failUnder?: number;
  rules?: Record<string, RuleConfig>;
}

export interface RuleConfig {
  enabled?: boolean;
  weight?: number;
}

export interface PackageMetadata {
  name?: string;
  version?: string;
  scripts: Record<string, string>;
}

export interface ReadmeSections {
  installation: boolean;
  usage: boolean;
  testing: boolean;
  contributing: boolean;
}

export interface ReadmeScan {
  path?: string;
  wordCount: number;
  hasCodeExamples: boolean;
  sections: ReadmeSections;
}

export interface RepositoryFiles {
  readme: boolean;
  license: boolean;
  gitignore: boolean;
  packageJson: boolean;
  ciWorkflow: boolean;
}

export interface RepositoryScan {
  targetPath: string;
  files: RepositoryFiles;
  readme: ReadmeScan;
  packageJson?: PackageMetadata;
}

export interface HealthCheck {
  id: string;
  label: string;
  status: CheckStatus;
  message: string;
  suggestion?: string;
  weight: number;
  points: number;
}

export interface HealthSummary {
  passed: number;
  warned: number;
  failed: number;
}

export interface HealthReport {
  targetPath: string;
  score: number;
  summary: HealthSummary;
  checks: HealthCheck[];
  recommendations: string[];
}
