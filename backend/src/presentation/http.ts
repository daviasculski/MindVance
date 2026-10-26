import { Response } from "express";

/**
 * Responde um erro de UserStory com o status mapeado pela mensagem.
 * Mensagens fora do mapa são erros inesperados (500) e vão para o log.
 */
export function sendError(
  res: Response,
  error: unknown,
  statusByMessage: Record<string, number>,
  fallback: string,
): Response {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status = statusByMessage[message];
  if (status) {
    return res.status(status).json({ error: message });
  }
  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
}
