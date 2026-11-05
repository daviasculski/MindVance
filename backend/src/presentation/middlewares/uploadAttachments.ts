import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { NextFunction, Request, Response } from "express";
import multer from "multer";

/** Diretório dos anexos (INF-04); relativo à pasta do backend */
export const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

export const uploadMaxMb = Number(process.env.UPLOAD_MAX_MB ?? 10);
const maxFilesPerUpload = 5;

// Imagens, documentos, planilhas, apresentações e protótipos compactados
const allowedExtensions = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp",
  ".pdf", ".txt", ".csv",
  ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".odt", ".ods", ".odp",
  ".zip",
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: uploadMaxMb * 1024 * 1024, files: maxFilesPerUpload },
  fileFilter: (_req, file, cb) => {
    if (allowedExtensions.has(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

const multerErrors: Record<string, string> = {
  LIMIT_FILE_SIZE: "File exceeds the size limit",
  LIMIT_FILE_COUNT: "Too many files",
  LIMIT_UNEXPECTED_FILE: "Too many files",
};

/** Recebe até 5 arquivos no campo "files"; erros de validação viram 400 (UC01 FA02) */
export function uploadAttachments(req: Request, res: Response, next: NextFunction): void {
  upload.array("files", maxFilesPerUpload)(req, res, (error: unknown) => {
    if (!error) return next();
    removeUploadedFiles(req);
    const message =
      error instanceof multer.MulterError
        ? (multerErrors[error.code] ?? "Invalid upload")
        : error instanceof Error && error.message === "File type not allowed"
          ? error.message
          : null;
    if (!message) return next(error);
    res.status(400).json({ error: message, maxSizeMb: uploadMaxMb });
  });
}

/** Apaga os arquivos já gravados quando o envio é recusado */
export function removeUploadedFiles(req: Request): void {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  for (const file of files) {
    fs.rm(file.path, { force: true }, () => undefined);
  }
}

/**
 * O multer entrega o nome original em latin1; converte para UTF-8
 * para preservar acentos ("Proposta técnica.pdf").
 */
export function originalNameOf(file: Express.Multer.File): string {
  return Buffer.from(file.originalname, "latin1").toString("utf8");
}
