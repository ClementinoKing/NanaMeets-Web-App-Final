function sanitizeFilename(name: string | undefined): string {
  return String(name || "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 120);
}

export async function uploadFileToR2(
  file: File | Blob,
  {
    prefix = "events",
    idx = 0,
  }: {
    prefix?: string;
    idx?: number;
  } = {},
) {
  if (!file) {
    throw new Error("No file provided");
  }

  const filename = sanitizeFilename("name" in file ? file.name : `upload_${idx}.jpg`);
  const key = `${prefix}/${Date.now()}_${idx}_${filename}`;
  const contentType = "type" in file ? file.type : "application/octet-stream";
  const response = await fetch("/api/r2-presign", {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      "x-upload-key": key,
      "x-upload-content-type": contentType,
    },
    body: file,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error || "Unable to upload file");
  }

  const data = (await response.json()) as { publicUrl?: string };

  if (!data.publicUrl) {
    throw new Error("Upload response missing public URL");
  }

  return { key, url: data.publicUrl };
}

export async function uploadManyToR2(
  files: (File | Blob)[],
  {
    prefix = "events",
  }: {
    prefix?: string;
  } = {},
) {
  const uploads = files.map((file, idx) => {
    if (!file) {
      return Promise.resolve(null);
    }

    return uploadFileToR2(file, { prefix, idx });
  });

  const results = await Promise.all(uploads);

  return results.flatMap((result) => (result ? [result.url] : []));
}
