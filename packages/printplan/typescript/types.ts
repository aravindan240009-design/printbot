/** Wire declarations correspond to schema.v1.json. Runtime validation is mandatory. */
export type ColorMode = 'bw' | 'grayscale' | 'color';
export type DuplexMode = 'simplex' | 'long_edge' | 'short_edge';
export type PaperSize = 'A3' | 'A4' | 'A5' | 'Letter' | 'Legal';
export interface PrintPlanV1 {
  schema_version: 1;
  job_id: string;
  shop_id: string;
  device_id: string;
  pricing_version: string;
  files: {
    file_id: string;
    sha256: string;
    page_count: number;
    range: string;
    parity: 'all' | 'odd' | 'even';
  }[];
  settings: {
    copies: number;
    collate: boolean;
    color: ColorMode;
    duplex: DuplexMode;
    orientation: 'portrait' | 'landscape' | 'auto';
    paper_size: PaperSize;
    width_um: number;
    height_um: number;
    media: string;
    bin_id: number | null;
    scaling: 'fit' | 'actual';
    margins_um: { top: number; right: number; bottom: number; left: number };
    pages_per_sheet: 1 | 2 | 4 | 6 | 9 | 16;
    booklet: boolean;
    photo: {
      layout: 'single' | 'passport' | 'id_front_back';
      crop: { x: number; y: number; width: number; height: number };
      rotation: 0 | 90 | 180 | 270;
      width_um: number;
      height_um: number;
    } | null;
  };
  capabilities: {
    snapshot_version: string;
    color_modes: ColorMode[];
    duplex_modes: DuplexMode[];
    paper_sizes: PaperSize[];
    media: string[];
    max_copies: number;
  };
  policy: { mode: 'FULL_AUTOMATIC' | 'MANUAL_APPROVAL'; version: string };
  render_hash: string;
}

export interface NormalizedPlan {
  selected_pages: number[][];
  sides: { file_index: number; page_numbers: number[]; copy_index: number; blank: boolean }[];
  logical_pages: number;
  marked_sides: number;
  padding_sides: number;
  physical_sheets: number;
}
