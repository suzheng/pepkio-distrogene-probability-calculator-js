// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PepkioClient } from "../src/client.js";
import { DEFAULT_API_BASE_URL, TOOL_ID, apiPath, resolveApiKey, resolveBaseUrl } from "../src/config.js";
import { parseRunInput } from "../src/schemas.js";
import { PepkioAPIError, type ToolManifest } from "../src/types.js";

const mockManifest: ToolManifest = {
  schema_version: "1.0",
  tool_id: TOOL_ID,
  title: "DistroGene Probability Calculator",
  description: "Calculate CRISPR coverage, GO enrichment, variant detection, and barcode collision probabilities",
  examples: [
    {
      name: "crispr_coverage",
      description: "CRISPR library coverage calculation",
      input: {
        scenario: "crispr_coverage",
        mode: "forward",
        tail: "ge",
        library_size: 80000,
        total_reads: 400000,
        threshold_k: 1,
      },
    },
    {
      name: "go_enrichment",
      description: "Hypergeometric GO enrichment",
      input: {
        scenario: "go_enrichment",
        mode: "forward",
        tail: "ge",
        population_preset: "human_genome",
        pathway_size: 120,
        query_set_size: 250,
        overlap_count: 18,
      },
    },
  ],
};

describe("PepkioClient unit tests", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("getManifest() fetches and returns tool_id", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    } as unknown as Response);

    const client = new PepkioClient({ baseUrl: "https://tools.pepkio.com" });
    const manifest = await client.getManifest();

    expect(manifest.tool_id).toBe(TOOL_ID);
    expect(manifest.title).toBe("DistroGene Probability Calculator");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://tools.pepkio.com/api/tools/v1/tools/distrogene-probability-calculator/manifest",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("caches getManifest() calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    } as unknown as Response);
    globalThis.fetch = fetchMock;

    const client = new PepkioClient();
    await client.getManifest();
    await client.getManifest();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("listExamples() extracts examples from manifest", async () => {
    const client = new PepkioClient();
    const examples = client.listExamples(mockManifest);

    expect(examples).toHaveLength(2);
    expect(examples[0].name).toBe("crispr_coverage");
    expect(examples[1].name).toBe("go_enrichment");
  });

  it("getExampleInput() retrieves and parses example", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    } as unknown as Response);

    const client = new PepkioClient();
    const input = await client.getExampleInput("crispr_coverage");

    expect(input.scenario).toBe("crispr_coverage");
    expect(input.library_size).toBe(80000);
    expect(input.total_reads).toBe(400000);
  });

  it("getExampleInput() throws on unknown example name", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    } as unknown as Response);

    const client = new PepkioClient();
    await expect(client.getExampleInput("non_existent")).rejects.toThrow(
      /Example "non_existent" not found/,
    );
  });

  it("run() sends validated input and options", async () => {
    const mockRunResponse = {
      run_id: "test-run-123",
      status: "completed",
      result: {
        ready: true,
        scenario: "crispr_coverage",
        probability: 0.993,
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockRunResponse),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const result = await client.run(
      {
        scenario: "crispr_coverage",
        mode: "forward",
        tail: "ge",
        library_size: 80000,
        total_reads: 400000,
        threshold_k: 1,
      },
      { label: "my-run" },
    );

    expect(result.status).toBe("completed");
    expect(result.run_id).toBe("test-run-123");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://tools.pepkio.com/api/tools/v1/tools/distrogene-probability-calculator/run",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("convenience helpers calculateCrisprCoverage and calculateGoEnrichment format and call run()", async () => {
    const mockRunResponse = {
      run_id: "test-run-456",
      status: "completed",
      result: { ready: true, probability: 0.99 },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockRunResponse),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const res1 = await client.calculateCrisprCoverage({
      librarySize: 50000,
      totalReads: 250000,
    });
    expect(res1.run_id).toBe("test-run-456");

    const res2 = await client.calculateGoEnrichment({
      pathwaySize: 100,
      querySetSize: 200,
      overlapCount: 15,
    });
    expect(res2.run_id).toBe("test-run-456");

    const res3 = await client.calculateVariantDetection({
      sequencingReads: 10000,
      alleleFrequency: 0.05,
      variantReads: 3,
    });
    expect(res3.run_id).toBe("test-run-456");

    const res4 = await client.calculateBarcodeCollision({
      numBarcodes: 5000,
      barcodeLength: 12,
    });
    expect(res4.run_id).toBe("test-run-456");
  });

  it("getRun() fetches previous run by ID", async () => {
    const mockRunResponse = {
      run_id: "run-xyz",
      status: "completed",
      result: { ready: true },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockRunResponse),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const result = await client.getRun("run-xyz");

    expect(result.run_id).toBe("run-xyz");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://tools.pepkio.com/api/tools/v1/runs/run-xyz",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("waitForRun() polls until run is completed", async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 2) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ run_id: "poll-run", status: "running" }),
        } as unknown as Response;
      }
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ run_id: "poll-run", status: "completed", result: { ready: true } }),
      } as unknown as Response;
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const result = await client.waitForRun("poll-run", { intervalMs: 10, timeoutMs: 1000 });

    expect(result.status).toBe("completed");
    expect(callCount).toBe(2);
  });

  it("waitForRun() throws on timeout", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ run_id: "poll-run", status: "running" }),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.waitForRun("poll-run", { intervalMs: 20, timeoutMs: 50 }),
    ).rejects.toThrow(PepkioAPIError);
  });

  it("throws PepkioAPIError on HTTP 500 error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => JSON.stringify({ error: { message: "Internal server crash", code: "SERVER_ERROR" } }),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.run({
        scenario: "crispr_coverage",
        mode: "forward",
        tail: "ge",
      }),
    ).rejects.toThrow("Internal server crash");
  });

  it("throws PepkioAPIError when error field is present in response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        run_id: "failed-run",
        status: "failed",
        error: { message: "Calculation domain error" },
      }),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.run({
        scenario: "crispr_coverage",
        mode: "forward",
        tail: "ge",
      }),
    ).rejects.toThrow("Calculation domain error");
  });

  it("throws when calling run() without API key", async () => {
    const client = new PepkioClient({ apiKey: "" });
    await expect(
      client.run({
        scenario: "crispr_coverage",
        mode: "forward",
        tail: "ge",
      }),
    ).rejects.toThrow(/API key required/);
  });

  it("resolves config and URLs correctly", () => {
    expect(DEFAULT_API_BASE_URL).toBe("https://tools.pepkio.com");
    expect(resolveBaseUrl()).toBe("https://tools.pepkio.com");
    expect(resolveBaseUrl("https://custom.pepkio.com/")).toBe("https://custom.pepkio.com");
    expect(apiPath("https://tools.pepkio.com", "/tools/foo")).toBe(
      "https://tools.pepkio.com/api/tools/v1/tools/foo",
    );

    const localKey = resolveApiKey("https://tools.localtest.me", "override-key");
    expect(localKey).toBe("override-key");
  });

  it("validates input schema with parseRunInput", () => {
    const valid = parseRunInput({
      scenario: "crispr_coverage",
      mode: "forward",
      tail: "ge",
      library_size: 1000,
    });
    expect(valid.scenario).toBe("crispr_coverage");

    expect(() =>
      parseRunInput({
        scenario: "invalid_scenario",
        mode: "forward",
        tail: "ge",
      }),
    ).toThrow();
  });
});
