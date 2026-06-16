interface ApiFetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

// Global interface expansion for reactive diagnostic tracking
declare global {
  interface Window {
    _adminApiDiagnostics?: Array<{
      id: string;
      url: string;
      method: string;
      status: number | string;
      timestamp: string;
      responseBody: any;
      requestBody: any;
      durationMs: number;
      error?: string;
    }>;
  }
}

function addDiagnosticLog(log: {
  url: string;
  method: string;
  status: number | string;
  timestamp: string;
  durationMs: number;
  requestBody?: any;
  responseBody?: any;
  error?: string;
}) {
  if (typeof window !== "undefined") {
    if (!window._adminApiDiagnostics) {
      window._adminApiDiagnostics = [];
    }
    window._adminApiDiagnostics.unshift({
      id: Math.random().toString(36).substring(2, 9),
      url: log.url,
      method: log.method,
      status: log.status,
      timestamp: log.timestamp,
      durationMs: log.durationMs,
      requestBody: log.requestBody,
      responseBody: log.responseBody,
      error: log.error
    });
    if (window._adminApiDiagnostics.length > 50) {
      window._adminApiDiagnostics.pop();
    }
    window.dispatchEvent(new CustomEvent("admin_api_diagnostics_updated"));
  }
}

export async function apiFetch<T = any>(url: string, options: ApiFetchOptions = {}): Promise<T> {
  const { timeout = 15000, retries = 2, ...fetchOptions } = options;
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const method = fetchOptions.method || "GET";
  
  let requestBody: any = undefined;
  if (fetchOptions.body) {
    try {
      requestBody = typeof fetchOptions.body === "string" ? JSON.parse(fetchOptions.body) : fetchOptions.body;
    } catch {
      requestBody = fetchOptions.body;
    }
  }

  let attempt = 0;
  let lastError: any = null;
  while (attempt <= retries) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      // Setup headers dynamically
      const headers = new Headers(fetchOptions.headers || {});
      if (typeof window !== "undefined") {
        const adminEmail = localStorage.getItem("modivah_admin_email");
        if (adminEmail) {
          headers.set("X-Admin-Email", adminEmail.toLowerCase().trim());
        }
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });
      clearTimeout(id);

      const contentType = response.headers.get("content-type") || "";

      // Clone and parse body asynchronously for transparent client-side analytics/diagnostics
      let responseBody: any = null;
      try {
        const responseClone = response.clone();
        if (contentType.includes("application/json")) {
          responseBody = await responseClone.json();
        } else {
          const txt = await responseClone.text();
          responseBody = txt.substring(0, 300); // Gracefully truncate huge raw templates or Vercel HTML messages
        }
      } catch (e) {
        responseBody = "[Erro ao extrair corpo da resposta]";
      }

      const durationMs = Date.now() - startTime;

      if (!response.ok) {
        let errorMessage = `Erro do servidor (Status ${response.status})`;
        if (contentType.includes("application/json")) {
          try {
            const errData = responseBody || {};
            errorMessage = errData.error || errData.message || errorMessage;
          } catch (e) {
            // fallback
          }
        } else {
          errorMessage = `Resposta inválida do servidor: formato não compatível (Status ${response.status})`;
        }

        // Add to diagnostic logs for deep tracing
        addDiagnosticLog({
          url,
          method,
          status: response.status,
          timestamp,
          durationMs,
          requestBody,
          responseBody,
          error: errorMessage
        });

        throw new Error(errorMessage);
      }

      // Add successful log Entry
      addDiagnosticLog({
        url,
        method,
        status: response.status,
        timestamp,
        durationMs,
        requestBody,
        responseBody
      });

      // Safe JSON parsing when ok is true
      if (contentType.includes("application/json")) {
        return responseBody as T;
      } else {
        const text = responseBody || "";
        try {
          return JSON.parse(text) as T;
        } catch (e) {
          return { success: true, message: text } as unknown as T;
        }
      }
    } catch (err: any) {
      clearTimeout(id);
      lastError = err;

      const isAbort = err.name === "AbortError" || (err instanceof DOMException && err.name === "AbortError");
      const isNetworkError = err.message && (
        err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError") ||
        err.message.includes("network")
      );

      if ((isAbort || isNetworkError) && attempt < retries) {
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        continue;
      }

      const durationMs = Date.now() - startTime;
      const statusValue = isAbort ? "TIMEOUT" : (err.message && err.message.includes("Status ") ? err.message.split("Status ")[1].replace(")", "") : "FAILED");

      // Log the terminal catastrophic crash of the request in the store
      addDiagnosticLog({
        url,
        method,
        status: statusValue,
        timestamp,
        durationMs,
        requestBody,
        error: err.message || String(err)
      });

      if (isAbort) {
        throw new Error("Erro de comunicação: Tempo limite de resposta excedido.");
      }
      throw err;
    }
  }

  const durationMs = Date.now() - startTime;
  addDiagnosticLog({
    url,
    method,
    status: "MAX_RETRIES",
    timestamp,
    durationMs,
    requestBody,
    error: lastError ? lastError.message : "Múltiplas tentativas falharam."
  });

  const detail = lastError ? ` Detalhes: ${lastError.message || String(lastError)}` : "";
  throw new Error(`Falha na comunicação com o servidor após múltiplas tentativas.${detail}`);
}
