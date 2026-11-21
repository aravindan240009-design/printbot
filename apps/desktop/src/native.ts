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
  driver_name?: string;
  port_name?: string;
  protocol?: string;
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
      device_name: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Windows') ? 'Workstation-PC' : 'Station') : 'Station',
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

export async function readSpoolFile(jobId: string): Promise<number[] | null> {
  try {
    const result = await invoke<number[] | null>('read_spool_file', { jobId });
    return result;
  } catch (error) {
    throw new NativeWorkstationError(String(error));
  }
}

export interface PrintToHardwarePayload {
  job_id: string;
  attempt_id: string;
  printer_name: string;
  file_name: string;
  file_bytes: number[];
  rendered_pages: number[][];
  copies?: number;
  duplex_mode: 'simplex' | 'duplex_long' | 'duplex_short';
  paper_size?: string;
}

export interface PrintToHardwareResult {
  success: boolean;
  spooler_job_id: number;
  printer_name: string;
  message: string;
}

export async function printToHardware(payload: PrintToHardwarePayload): Promise<PrintToHardwareResult> {
  try {
    return await invoke<PrintToHardwareResult>('print_to_native_hardware', { payload });
  } catch (error) {
    throw new NativeWorkstationError(String(error));
  }
}

export async function downloadAndLaunchUpdate(downloadUrl: string): Promise<string> {
  try {
    return await invoke<string>('download_and_launch_update', { downloadUrl });
  } catch (error) {
    // If not in Tauri or native invoke failed, fallback to opening in browser
    if (typeof window !== 'undefined' && downloadUrl) {
      window.open(downloadUrl, '_blank');
      return 'Web fallback: Opened download URL in browser.';
    }
    throw new NativeWorkstationError(String(error));
  }
}
