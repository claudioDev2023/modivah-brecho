interface ApiFetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export async function apiFetch<T = any>(url: string, options: ApiFetchOptions = {}): Promise<T> {
  const { timeout = 15000, retries = 2, ...fetchOptions } = options;

  let attempt = 0;
  while (attempt <= retries) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(id);

      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        let errorMessage = `Erro do servidor (Status ${response.status})`;
        if (contentType.includes("application/json")) {
          try {
            const errData = await response.json();
            errorMessage = errData.error || errData.message || errorMessage;
          } catch (e) {
            // Ignorado, mantém erro padrão
          }
        } else {
          errorMessage = `Resposta inválida do servidor: formato não compatível (Status ${response.status})`;
        }
        throw new Error(errorMessage);
      }

      // Safe JSON parsing when ok is true
      if (contentType.includes("application/json")) {
        try {
          return await response.json() as T;
        } catch (jsonErr) {
          throw new Error("Erro de processamento: Resposta do servidor corrompida.");
        }
      } else {
        const text = await response.text();
        try {
          return JSON.parse(text) as T;
        } catch (e) {
          return { success: true, message: text } as unknown as T;
        }
      }
    } catch (err: any) {
      clearTimeout(id);

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

      if (isAbort) {
        throw new Error("Erro de comunicação: Tempo limite de resposta excedido.");
      }
      throw err;
    }
  }

  throw new Error("Falha na comunicação com o servidor após múltiplas tentativas.");
}
