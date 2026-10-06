import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "ecommerce-uploads";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
const R2_ENDPOINT = process.env.R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

export const isR2Configured = Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_ENDPOINT);

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID as string,
        secretAccessKey: R2_SECRET_ACCESS_KEY as string,
      },
    });
  }
  return client;
}

export interface UploadResult {
  url: string;
  key: string;
}

/**
 * Uploads a file buffer to Cloudflare R2 when credentials are configured.
 * Falls back to local filesystem storage under /public/uploads for local
 * development/sandbox environments where R2 secrets aren't provisioned yet.
 */
export async function uploadFile(buffer: Buffer, filename: string, contentType: string, folder = "products"): Promise<UploadResult> {
  const ext = path.extname(filename) || "";
  const key = `${folder}/${Date.now()}-${randomUUID()}${ext}`;

  if (isR2Configured) {
    await getClient().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    const publicBase = R2_PUBLIC_URL || `${R2_ENDPOINT}/${R2_BUCKET_NAME}`;
    return { url: `${publicBase.replace(/\/$/, "")}/${key}`, key };
  }

  // Local fallback
  const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadsDir, { recursive: true });
  const localName = `${Date.now()}-${randomUUID()}${ext}`;
  await writeFile(path.join(uploadsDir, localName), buffer);
  return { url: `/uploads/${folder}/${localName}`, key: `local:${folder}/${localName}` };
}

export async function deleteFile(key: string): Promise<void> {
  if (!key) return;
  if (key.startsWith("local:")) {
    const relative = key.replace("local:", "");
    const filePath = path.join(process.cwd(), "public", "uploads", relative);
    try {
      await unlink(filePath);
    } catch {
      // ignore missing file
    }
    return;
  }
  if (isR2Configured) {
    try {
      await getClient().send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    } catch {
      // ignore delete failures
    }
  }
}
