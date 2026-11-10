// SPDX-License-Identifier: MIT
import type {
  CalculationMode,
  CustomDistribution,
  DistrogeneInput,
  LibrarySkew,
  PopulationPreset,
  ProbabilityTail,
  Scenario,
  SequencingErrorPreset,
  UmiBaseBias,
} from "./schemas.js";

export type RunStatus = "queued" | "running" | "completed" | "failed" | (string & {});

export interface RunOptions {
  idempotency_key?: string;
  label?: string;
  [key: string]: unknown;
}

export interface RunResult<T = DistrogeneResult> {
  run_id: string;
  status: RunStatus;
  result?: T;
  error?: string | { message?: string; code?: string; details?: unknown } | null;
  result_url?: string;
  permalink?: string;
  duration_ms?: number;
}

export interface ManifestExample {
  name: string;
  description?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface ToolManifest {
  schema_version: string;
  tool_id: string;
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  execution_mode?: string;
  estimated_runtime_sec?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  agent_notes?: string;
  example_prompts?: string[];
  examples?: ManifestExample[];
  limits?: Record<string, unknown>;
  input_schema?: Record<string, unknown>;
}

export interface ExampleMeta {
  name: string;
  description?: string;
}

export interface ProbabilityCurvePoint {
  x: number;
  probability: number;
}

export interface DistrogeneResult {
  ready: boolean;
  errors?: string[];
  warnings?: string[];
  scenario?: Scenario | string;
  mode?: CalculationMode | string;
  tail?: ProbabilityTail | string;
  distribution?: string;
  probability?: number | null;
  probability_label?: string;
  expected_mean?: number | null;
  std_dev?: number | null;
  fold_enrichment?: number | null;
  interpretation?: string;
  reverse_solution?: number | null;
  reverse_label?: string | null;
  probability_curve?: ProbabilityCurvePoint[];
  curve_x_label?: string;
  methods_text?: string;
  result_csv?: string;
  log_space_used?: boolean;
  [key: string]: unknown;
}

export class PepkioAPIError extends Error {
  readonly status: number;
  readonly body?: unknown;
  readonly runId?: string;
  readonly code?: string;

  constructor(
    message: string,
    opts: { status: number; body?: unknown; runId?: string; code?: string },
  ) {
    super(message);
    this.name = "PepkioAPIError";
    this.status = opts.status;
    this.body = opts.body;
    this.runId = opts.runId;
    this.code = opts.code;
  }
}

export type {
  CalculationMode,
  CustomDistribution,
  DistrogeneInput,
  LibrarySkew,
  PopulationPreset,
  ProbabilityTail,
  Scenario,
  SequencingErrorPreset,
  UmiBaseBias,
};
