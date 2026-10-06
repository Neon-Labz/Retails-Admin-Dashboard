import "server-only";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "node:crypto";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "bulkmart-assets";
const publicBaseUrl = process.env.R2_PUBLIC_URL; // e.g. https://pub-xxxx.r2.dev

export const isR2Configured = Boolean(accountId && accessKeyId && secretAccessKey);

let client: S3Client | null = null;

function getClient() {
  if (!isR2Configured) return null;
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });
  }
  return client;
}

/**
 * Uploads a file buffer to Cloudflare R2 and returns its public URL.
 * Falls back gracefully (throws) if R2 credentials are not configured so
 * callers can decide on a fallback strategy.
 */
export async function uploadToR2(params: {
  buffer: Buffer;
  contentType: string;
  keyPrefix?: string;
  fileExtension?: string;
}) {
  const s3 = getClient();
  if (!s3) {
    throw new Error("Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME.");
  }

  const ext = params.fileExtension || "jpg";
  const key = `${params.keyPrefix ? `${params.keyPrefix}/` : ""}${crypto.randomUUID()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: params.buffer,
      ContentType: params.contentType,
    }),
  );

  const base = publicBaseUrl ? publicBaseUrl.replace(/\/$/, "") : `https://${bucketName}.r2.cloudflarestorage.com`;
  return `${base}/${key}`;
}

export async function deleteFromR2(key: string) {
  const s3 = getClient();
  if (!s3) return;
  await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}
