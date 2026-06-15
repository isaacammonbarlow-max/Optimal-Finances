import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type StoredFile = {
  key: string;
  storage: "local" | "s3";
};

function isS3Configured(): boolean {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY
  );
}

function getS3Client() {
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
  });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
}

export async function storeUploadedFile(options: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  folder: "receipts" | "paystubs";
  userId: string;
}): Promise<StoredFile> {
  const safeName = sanitizeFilename(options.originalName);
  const key = `${options.folder}/${options.userId}/${Date.now()}-${randomUUID()}-${safeName}`;

  if (isS3Configured()) {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: options.buffer,
        ContentType: options.mimeType,
        ServerSideEncryption: "AES256",
        Metadata: {
          userId: options.userId,
          originalName: safeName,
        },
      })
    );
    return { key, storage: "s3" };
  }

  const localPath = path.join("uploads", options.folder, path.basename(key));
  const absolute = path.join(process.cwd(), localPath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, options.buffer);
  return { key: localPath, storage: "local" };
}

export async function getFileAccessUrl(stored: StoredFile): Promise<string | null> {
  if (stored.storage === "local") return null;

  const client = getS3Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: stored.key,
    }),
    { expiresIn: 3600 }
  );
}

export function parseStoredPath(imagePath: string | null): StoredFile | null {
  if (!imagePath) return null;
  if (imagePath.startsWith("uploads/")) {
    return { key: imagePath, storage: "local" };
  }
  return { key: imagePath, storage: "s3" };
}
