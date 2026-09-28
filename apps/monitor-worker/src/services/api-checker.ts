export interface MonitorJob {
  monitorId: string;

  url: string;

  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

  timeoutMs: number;

  expectedStatusCode: number;

  headers?: Record<string, string>;

  body?: string;
}

export interface MonitorCheckResult {
  monitorId: string;

  url: string;

  method: string;

  success: boolean;

  statusCode: number | null;

  responseTime: number;

  errorMessage: string | null;

  checkedAt: string;
}

export async function checkApi(job: MonitorJob): Promise<MonitorCheckResult> {
  const startTime = performance.now();

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, job.timeoutMs);

  try {
    const response = await fetch(job.url, {
      method: job.method,

      headers: job.headers,

      body:
        job.method === "GET" || job.method === "HEAD" ? undefined : job.body,

      signal: controller.signal,
    });

    const responseTime = Math.round(performance.now() - startTime);

    const success = response.status === job.expectedStatusCode;

    return {
      monitorId: job.monitorId,

      url: job.url,

      method: job.method,

      success,

      statusCode: response.status,

      responseTime,

      errorMessage: success
        ? null
        : `Expected status ${job.expectedStatusCode}, received ${response.status}`,

      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);

    let errorMessage = "Unknown error";

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = `Request timed out after ${job.timeoutMs}ms`;
      } else {
        errorMessage = error.message;
      }
    }

    return {
      monitorId: job.monitorId,

      url: job.url,

      method: job.method,

      success: false,

      statusCode: null,

      responseTime,

      errorMessage,

      checkedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}
