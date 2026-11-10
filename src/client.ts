// SPDX-License-Identifier: MIT
import {
  TOOL_ID,
  apiPath,
  resolveApiKey,
  resolveBaseUrl,
} from "./config.js";
import {
  parseRunInput,
  type CalculationMode,
  type DistrogeneInput,
  type PopulationPreset,
} from "./schemas.js";
import {
  PepkioAPIError,
  type DistrogeneResult,
  type ExampleMeta,
  type RunOptions,
  type RunResult,
  type ToolManifest,
} from "./types.js";

export interface PepkioClientOptions {
  apiKey?: string;
  baseUrl?: string;
}

export interface CrisprCoverageOptions {
  librarySize: number;
  totalReads?: number;
  readsPerGuide?: number;
  thresholdK?: number;
  mode?: CalculationMode;
  targetProbability?: number;
  runOptions?: RunOptions;
}

export interface GoEnrichmentOptions {
  pathwaySize: number;
  querySetSize: number;
  overlapCount: number;
  populationPreset?: PopulationPreset;
  populationN?: number;
  mode?: CalculationMode;
  targetProbability?: number;
  runOptions?: RunOptions;
}

export interface VariantDetectionOptions {
  sequencingReads: number;
  alleleFrequency: number;
  variantReads: number;
  mode?: CalculationMode;
  targetProbability?: number;
  runOptions?: RunOptions;
}

export interface BarcodeCollisionOptions {
  numBarcodes: number;
  barcodeSpace?: number;
  barcodeLength?: number;
  mode?: CalculationMode;
  targetProbability?: number;
  runOptions?: RunOptions;
}

export class PepkioClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private manifestCache: ToolManifest | undefined;

  constructor(opts: PepkioClientOptions = {}) {
    this.baseUrl = resolveBaseUrl(opts.baseUrl);
    this.apiKey = resolveApiKey(this.baseUrl, opts.apiKey);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async getManifest(): Promise<ToolManifest> {
    if (this.manifestCache) {
      return this.manifestCache;
    }
    const manifest = await this.request<ToolManifest>(
      "GET",
      `/tools/${TOOL_ID}/manifest`,
      undefined,
      { requireAuth: false },
    );
    this.manifestCache = manifest;
    return manifest;
  }

  listExamples(manifest?: ToolManifest): ExampleMeta[] {
    const m = manifest ?? this.manifestCache;
    if (!m?.examples) {
      return [];
    }
    return m.examples.map((e) => ({
      name: e.name,
      description: e.description,
    }));
  }

  async getExamples(manifest?: ToolManifest): Promise<ExampleMeta[]> {
    const m = manifest ?? (await this.getManifest());
    return this.listExamples(m);
  }

  async getExampleInput(
    name: string,
    manifest?: ToolManifest,
  ): Promise<DistrogeneInput> {
    const m = manifest ?? (await this.getManifest());
    const example = m.examples?.find((e) => e.name === name);
    if (!example) {
      const available = m.examples?.map((e) => e.name).join(", ") ?? "(none)";
      throw new Error(`Example "${name}" not found. Available: ${available}`);
    }
    return parseRunInput(example.input);
  }

  async run(
    input: DistrogeneInput,
    options?: RunOptions,
  ): Promise<RunResult<DistrogeneResult>> {
    const validated = parseRunInput(input);
    return this.request<RunResult<DistrogeneResult>>(
      "POST",
      `/tools/${TOOL_ID}/run`,
      { input: validated, options: options ?? {} },
      { requireAuth: true },
    );
  }

  /**
   * Convenience helper for CRISPR library coverage analysis.
   */
  async calculateCrisprCoverage(
    opts: CrisprCoverageOptions,
  ): Promise<RunResult<DistrogeneResult>> {
    const mode = opts.mode ?? "forward";
    const input: DistrogeneInput = {
      scenario: "crispr_coverage",
      mode,
      tail: "ge",
      library_size: opts.librarySize,
      threshold_k: opts.thresholdK ?? 1,
      total_reads: opts.totalReads,
      reads_per_guide: opts.readsPerGuide,
      target_probability: opts.targetProbability,
    };
    return this.run(input, opts.runOptions);
  }

  /**
   * Convenience helper for GO / pathway enrichment analysis.
   */
  async calculateGoEnrichment(
    opts: GoEnrichmentOptions,
  ): Promise<RunResult<DistrogeneResult>> {
    const mode = opts.mode ?? "forward";
    const input: DistrogeneInput = {
      scenario: "go_enrichment",
      mode,
      tail: "ge",
      pathway_size: opts.pathwaySize,
      query_set_size: opts.querySetSize,
      overlap_count: opts.overlapCount,
      population_preset: opts.populationPreset ?? "human_genome",
      population_N: opts.populationN,
      target_probability: opts.targetProbability,
    };
    return this.run(input, opts.runOptions);
  }

  /**
   * Convenience helper for NGS low-frequency variant detection probability.
   */
  async calculateVariantDetection(
    opts: VariantDetectionOptions,
  ): Promise<RunResult<DistrogeneResult>> {
    const mode = opts.mode ?? "forward";
    const input: DistrogeneInput = {
      scenario: "variant_detection",
      mode,
      tail: "ge",
      sequencing_reads: opts.sequencingReads,
      allele_frequency: opts.alleleFrequency,
      variant_reads: opts.variantReads,
      target_probability: opts.targetProbability,
    };
    return this.run(input, opts.runOptions);
  }

  /**
   * Convenience helper for single-cell barcode / UMI collision probability.
   */
  async calculateBarcodeCollision(
    opts: BarcodeCollisionOptions,
  ): Promise<RunResult<DistrogeneResult>> {
    const mode = opts.mode ?? "forward";
    const input: DistrogeneInput = {
      scenario: "barcode_collision",
      mode,
      tail: "ge",
      num_barcodes: opts.numBarcodes,
      barcode_space: opts.barcodeSpace,
      barcode_length: opts.barcodeLength,
      target_probability: opts.targetProbability,
    };
    return this.run(input, opts.runOptions);
  }

  async getRun(runId: string): Promise<RunResult<DistrogeneResult>> {
    return this.request<RunResult<DistrogeneResult>>(
      "GET",
      `/runs/${runId}`,
      undefined,
      { requireAuth: true },
    );
  }

  async waitForRun(
    runId: string,
    opts: { intervalMs?: number; timeoutMs?: number } = {},
  ): Promise<RunResult<DistrogeneResult>> {
    const intervalMs = opts.intervalMs ?? 1000;
    const timeoutMs = opts.timeoutMs ?? 30_000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const result = await this.getRun(runId);
      if (result.status === "completed" || result.status === "failed") {
        if (result.error) {
          const errMsg =
            typeof result.error === "string"
              ? result.error
              : typeof result.error === "object" && result.error !== null && "message" in result.error
                ? (result.error as { message: string }).message
                : JSON.stringify(result.error);
          throw new PepkioAPIError(errMsg, {
            status: 200,
            body: result,
            runId,
          });
        }
        return result;
      }
      await sleep(intervalMs);
    }

    throw new PepkioAPIError(`Timed out waiting for run ${runId}`, {
      status: 408,
      runId,
    });
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    opts: { requireAuth?: boolean } = {},
  ): Promise<T> {
    const requireAuth = opts.requireAuth ?? false;
    if (requireAuth && !this.apiKey) {
      throw new PepkioAPIError(
        "API key required. Set PEPKIO_API_KEY (or LOCAL_PEPKIO_API_KEY for local dev).",
        { status: 401 },
      );
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    const url = apiPath(this.baseUrl, path);
    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let parsed: unknown;
    const text = await response.text();
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      parsed = text;
    }

    if (!response.ok) {
      let message = `HTTP ${response.status}: ${response.statusText}`;
      let code: string | undefined;
      if (typeof parsed === "object" && parsed !== null && "error" in parsed) {
        const errVal = (parsed as { error: unknown }).error;
        if (typeof errVal === "string") {
          message = errVal;
        } else if (typeof errVal === "object" && errVal !== null) {
          if ("message" in errVal && typeof (errVal as { message: unknown }).message === "string") {
            message = (errVal as { message: string }).message;
          }
          if ("code" in errVal && typeof (errVal as { code: unknown }).code === "string") {
            code = (errVal as { code: string }).code;
          }
        }
      }
      throw new PepkioAPIError(message, {
        status: response.status,
        body: parsed,
        code,
      });
    }

    const runResult = parsed as RunResult<DistrogeneResult>;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "error" in parsed &&
      runResult.error
    ) {
      const errMsg =
        typeof runResult.error === "string"
          ? runResult.error
          : typeof runResult.error === "object" && runResult.error !== null && "message" in runResult.error
            ? (runResult.error as { message: string }).message
            : JSON.stringify(runResult.error);
      throw new PepkioAPIError(errMsg, {
        status: response.status,
        body: parsed,
        runId: runResult.run_id,
      });
    }

    return parsed as T;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
