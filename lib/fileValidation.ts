type SupportedImageType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

const imageSignatures: Record<SupportedImageType, (buffer: Buffer) => boolean> = {
  "image/jpeg": (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  "image/png": (buffer) => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": (buffer) =>
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP",
  "image/gif": (buffer) => {
    const header = buffer.toString("ascii", 0, 6);
    return header === "GIF87a" || header === "GIF89a";
  },
};

export function matchesFileSignature(buffer: Buffer, contentType: string): boolean {
  if (contentType === "application/pdf") {
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }

  const signatureCheck = imageSignatures[contentType as SupportedImageType];
  return signatureCheck ? signatureCheck(buffer) : false;
}
