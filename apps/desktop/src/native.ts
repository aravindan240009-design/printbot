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

export interface WorkstationDeviceIdentity {
  device_id: string;
  hardware_hash: string;
  device_name: string;
}

export async function getWorkstationDeviceIdentity(): Promise<WorkstationDeviceIdentity> {
  try {
    return await invoke<WorkstationDeviceIdentity>('get_workstation_device_identity');
  } catch {
    // Web / preview fallback: maintain persistent unique workstation identifier
    let stored = typeof window !== 'undefined' ? localStorage.getItem('printbot_workstation_device_id') : null;
    if (!stored) {
      stored = 'dev_' + Math.random().toString(36).substring(2, 14);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('printbot_workstation_device_id', stored); } catch {}
      }
    }
    return {
      device_id: stored,
      hardware_hash: 'hw_' + stored,
      device_name: 'COUNTER-PC',
    };
  }
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

export async function bindWorkstation(deviceToken: string): Promise<string> {
  try {
    return await invoke<string>('bind_workstation', { deviceToken });
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
