/**
 * Canonical PrintPlan v1 contract definitions for Print Bot SaaS.
 * Pure immutable contract, decoupled from rendering logic and backend storage.
 */

export interface PrintPlanCapabilities {
  color_modes: ("bw" | "color")[];
  duplex_modes: ("simplex" | "duplex_long" | "duplex_short")[];
  paper_sizes: ("A3" | "A4" | "A5" | "Letter" | "Legal")[];
  media: string[];
  max_copies: number;
}

export interface PrintPlanMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PrintPlanSettings {
  copies: number;
  collate: boolean;
  color: "bw" | "color";
  duplex: "simplex" | "duplex_long" | "duplex_short";
  paper_size: "A3" | "A4" | "A5" | "Letter" | "Legal";
  width_um: number;
  height_um: number;
  orientation: "portrait" | "landscape";
  scaling: "fit_printable" | "fit_page" | "actual_size";
  margins_um: PrintPlanMargins;
  pages_per_sheet: 1 | 2 | 4 | 6 | 9 | 16;
  booklet: boolean;
  photo: unknown | null;
  media: string;
  bin_id: string | null;
  staple: "none" | "top_left" | "top_right" | "two_left";
  punch: "none" | "two_hole" | "four_hole";
}

export interface PrintPlanFile {
  file_id: string;
  page_count: number;
  range: string;
  parity: "all" | "odd" | "even";
  sha256: string;
  bytes: number;
}

export interface PrintPlan {
  schema_version: "1.0.0";
  plan_id: string;
  shop_id: string;
  created_at: string;
  capabilities: PrintPlanCapabilities;
  settings: PrintPlanSettings;
  files: PrintPlanFile[];
  render_hash: string;
}

export const PAPER_DIMENSIONS_UM: Record<string, [number, number]> = {
  A3: [297000, 420000],
  A4: [210000, 297000],
  A5: [148000, 210000],
  Letter: [215900, 279400],
  Legal: [215900, 355600],
};
