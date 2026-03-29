import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-upload-key, x-upload-content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const key = (req.headers.get("x-upload-key") ?? "").trim();
    const contentType =
      (req.headers.get("x-upload-content-type") ?? "").trim() || "application/octet-stream";
    const file = await req.blob();
    const fileBytes = new Uint8Array(await file.arrayBuffer());

    if (!key) {
      return json({ error: "Missing key" }, { status: 400 });
    }

    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const accountId = Deno.env.get("R2_ACCOUNT_ID");
    const bucket = Deno.env.get("R2_BUCKET");
    const publicBase = Deno.env.get("R2_PUBLIC_BASE");

    if (!accessKeyId || !secretAccessKey || !accountId || !bucket || !publicBase) {
      return json(
        {
          error: "Missing R2 configuration",
          missing: {
            accessKeyId: !accessKeyId,
            secretAccessKey: !secretAccessKey,
            accountId: !accountId,
            bucket: !bucket,
            publicBase: !publicBase,
          },
        },
        { status: 500 },
      );
    }

    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    const client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const trimmedBase = publicBase.replace(/\/+$/, "");

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      Body: fileBytes,
    });

    const result = await client.send(command);

    return json({
      etag: result.ETag ?? null,
      publicUrl: `${trimmedBase}/${key}`,
    });
  } catch (error) {
    console.error("r2-presign-web error", error);
    return json(
      {
        error: error instanceof Error ? error.message : "Unable to upload file",
      },
      { status: 500 },
    );
  }
});
