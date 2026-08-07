import { errorEnvelopeSchema, type Paginated } from '@screen-companion/validation';

/**
 * typed fetch client. every endpoint returns the §9.2 error envelope on failure, so this
 * client parses it once and throws a typed ApiError — no per-endpoint error handling.
 */

export class ApiError extends Error {
  readonly code: string;
  readonly requestId?: string;
  readonly status: number;

  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  /** caller-provided, echoed in errors — per §3.4 observability */
  requestId?: string;
  signal?: AbortSignal;
}

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getAccessToken: () => Promise<string | null> = async () => null,
  ) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      ...options.headers,
    };
    if (options.requestId) headers['x-request-id'] = options.requestId;

    const token = await this.getAccessToken();
    if (token) headers.authorization = `Bearer ${token}`;

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: options.method ?? 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal,
      });
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') throw cause;
      throw new ApiError(0, 'network_error', 'could not reach the server');
    }

    if (response.status === 204) return undefined as T;

    const raw = await response.json().catch(() => null);
    if (!response.ok) {
      const parsed = errorEnvelopeSchema.safeParse(raw);
      if (parsed.success) {
        throw new ApiError(
          response.status,
          parsed.data.error.code,
          parsed.data.error.message,
          parsed.data.error.requestId,
        );
      }
      throw new ApiError(response.status, 'unknown_error', 'an unexpected error occurred');
    }
    return raw as T;
  }

  get<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  /** paginated list helper — §9.1 cursor envelope */
  async getPaginated<T>(
    path: string,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<Paginated<T>> {
    return this.get<Paginated<T>>(path, options);
  }
}
