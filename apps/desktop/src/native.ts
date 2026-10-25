import { invoke } from '@tauri-apps/api/core';

export interface NativePrinterInfo {
  name: string;
  shop_id: string;
  is_default: boolean;
  is_online: boolean;
  supports_color: boolean;
  supports_duplex: boolean;
  supported_paper_sizes: string[];
  queue_count: number;
  status: string;
}

export interface NativePrintRequest {
  job_id: string;
  shop_id: string;
  printer_name: string;
  document_path: string;
  copies: number;
}

export interface NativeSpoolReceipt {
  job_id: string;
  state: 'INTENT_RECORDED';
  message: string;
}

export class NativeWorkstationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NativeWorkstationError';
  }
}

export async function discoverPrinters(): Promise<NativePrinterInfo[]> {
  try {
    return await invoke<NativePrinterInfo[]>('get_system_printers');
  } catch (error) {
    throw new NativeWorkstationError(String(error));
  }
}

export async function preparePrintJob(request: NativePrintRequest): Promise<NativeSpoolReceipt> {
  try {
    return await invoke<NativeSpoolReceipt>('prepare_print_job', { request });
  } catch (error) {
    throw new NativeWorkstationError(String(error));
  }
}

export async function readSpoolJob(jobId: string) {
  try {
    return await invoke('get_spool_job', { jobId });
  } catch (error) {
    throw new NativeWorkstationError(String(error));
  }
}
