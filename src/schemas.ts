// SPDX-License-Identifier: MIT
import { z } from "zod";

export const SCENARIOS = [
  "crispr_coverage",
  "go_enrichment",
  "variant_detection",
  "barcode_collision",
  "overdispersed_library",
  "custom",
] as const;
export type Scenario = (typeof SCENARIOS)[number];

export const MODES = ["forward", "reverse"] as const;
export type CalculationMode = (typeof MODES)[number];

export const TAILS = ["eq", "ge", "gt", "le", "lt"] as const;
export type ProbabilityTail = (typeof TAILS)[number];

export const POPULATION_PRESETS = [
  "human_genome",
  "mouse_genome",
  "fly_genome",
  "worm_genome",
  "yeast_genome",
  "arabidopsis_genome",
  "custom",
] as const;
export type PopulationPreset = (typeof POPULATION_PRESETS)[number];

export const LIBRARY_SKEWS = ["uniform", "skewed_10x"] as const;
export type LibrarySkew = (typeof LIBRARY_SKEWS)[number];

export const UMI_BASE_BIASES = ["uniform", "gc_biased"] as const;
export type UmiBaseBias = (typeof UMI_BASE_BIASES)[number];

export const SEQUENCING_ERROR_PRESETS = [
  "none",
  "short_read",
  "long_read",
  "custom",
] as const;
export type SequencingErrorPreset = (typeof SEQUENCING_ERROR_PRESETS)[number];

export const CUSTOM_DISTRIBUTIONS = [
  "poisson",
  "binomial",
  "hypergeometric",
  "negative_binomial",
] as const;
export type CustomDistribution = (typeof CUSTOM_DISTRIBUTIONS)[number];

export const distrogeneInputSchema = z.object({
  scenario: z.enum(SCENARIOS),
  mode: z.enum(MODES),
  tail: z.enum(TAILS),
  population_preset: z.enum(POPULATION_PRESETS).optional(),
  population_N: z.number().int().optional(),
  pathway_size: z.number().int().optional(),
  query_set_size: z.number().int().optional(),
  overlap_count: z.number().int().optional(),
  library_size: z.number().int().optional(),
  reads_per_guide: z.number().optional(),
  total_reads: z.number().int().optional(),
  threshold_k: z.number().int().optional(),
  sequencing_reads: z.number().int().optional(),
  allele_frequency: z.number().optional(),
  variant_reads: z.number().int().optional(),
  num_barcodes: z.number().int().optional(),
  barcode_space: z.number().optional(),
  barcode_length: z.number().int().optional(),
  library_skew: z.enum(LIBRARY_SKEWS).optional(),
  umi_base_bias: z.enum(UMI_BASE_BIASES).optional(),
  sequencing_error_preset: z.enum(SEQUENCING_ERROR_PRESETS).optional(),
  sequencing_error_rate: z.number().optional(),
  mean_count: z.number().optional(),
  dispersion: z.number().optional(),
  custom_distribution: z.enum(CUSTOM_DISTRIBUTIONS).optional(),
  custom_n: z.number().int().optional(),
  custom_p: z.number().optional(),
  custom_K: z.number().int().optional(),
  custom_lambda: z.number().optional(),
  custom_mu: z.number().optional(),
  custom_r: z.number().optional(),
  target_probability: z.number().optional(),
  reverse_solve: z.string().optional(),
});

export type DistrogeneInput = z.infer<typeof distrogeneInputSchema>;

export function parseRunInput(input: unknown): DistrogeneInput {
  return distrogeneInputSchema.parse(input);
}
