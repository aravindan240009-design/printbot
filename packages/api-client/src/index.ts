import {
  PrintJobCreateRequest,
  PrintJobResponse,
  PrinterDevice,
  ReconciliationRequest,
  ReconciliationResponse,
  PrintOptions
} from '@xerox/contracts';

export interface ClientConfig {
  baseUrl: string;
  tenantId: string;
  authToken?: string;
}

export class XeroxApiClient {
  private baseUrl: string;
  private tenantId: string;
  private authToken?: string;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.tenantId = config.tenantId;
    this.authToken = config.authToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    idempotencyKey?: string
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': this.tenantId,
      ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      ...(options.headers as Record<string, string>),
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API Error [${res.status}]: ${errorText}`);
    }

    return res.json() as Promise<T>;
  }

  // Health
  async checkHealth(): Promise<{ status: string }> {
    return this.request('/api/v1/health');
  }

  // Quotes & Orders
  async getQuote(pageCount: number, options: PrintOptions): Promise<any> {
    return this.request('/api/v1/orders/quote', {
      method: 'POST',
      body: JSON.stringify({ page_count: pageCount, options }),
    });
  }

  async createOrder(
    orderReq: PrintJobCreateRequest,
    idempotencyKey?: string
  ): Promise<PrintJobResponse> {
    return this.request<PrintJobResponse>(
      '/api/v1/orders',
      {
        method: 'POST',
        body: JSON.stringify({
          file_name: orderReq.fileName,
          file_size_bytes: orderReq.fileSizeBytes,
          page_count: orderReq.pageCount,
          options: orderReq.options,
          customer_email: orderReq.customerEmail,
          customer_phone: orderReq.customerPhone,
          idempotency_key: idempotencyKey,
        }),
      },
      idempotencyKey
    );
  }

  async getOrder(jobId: string): Promise<PrintJobResponse> {
    return this.request<PrintJobResponse>(`/api/v1/orders/${jobId}`);
  }

  async listOrders(): Promise<PrintJobResponse[]> {
    return this.request<PrintJobResponse[]>('/api/v1/orders');
  }

  // Hardware & Workstation Printers
  async listPrinters(): Promise<PrinterDevice[]> {
    return this.request<PrinterDevice[]>('/api/v1/printers');
  }

  async claimJob(workstationId: string, jobId: string): Promise<PrintJobResponse> {
    return this.request<PrintJobResponse>('/api/v1/printers/claim', {
      method: 'POST',
      body: JSON.stringify({
        workstation_id: workstationId,
        job_id: jobId,
      }),
    });
  }

  // Reconciliation for offline resilience
  async syncReconciliation(req: ReconciliationRequest): Promise<ReconciliationResponse> {
    return this.request<ReconciliationResponse>('/api/v1/reconciliation/sync', {
      method: 'POST',
      body: JSON.stringify({
        workstation_id: req.workstationId,
        tenant_id: req.tenantId,
        spooled_job_ids: req.spooledJobIds,
      }),
    });
  }
}
