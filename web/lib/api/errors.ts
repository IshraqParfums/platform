export class NestApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(
      message ??
        (typeof body === 'object' &&
        body !== null &&
        'message' in body &&
        typeof (body as { message: unknown }).message === 'string'
          ? (body as { message: string }).message
          : `Nest request failed with status ${status}`),
    );
    this.name = 'NestApiError';
    this.status = status;
    this.body = body;
  }
}

export async function readNestErrorBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return { message: response.statusText || 'Request failed' };
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}
