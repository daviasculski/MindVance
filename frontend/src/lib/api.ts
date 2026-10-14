const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3333/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data && typeof data.error === "string" ? data.error : "Erro inesperado";
    throw new ApiError(response.status, message);
  }

  return data as T;
}
