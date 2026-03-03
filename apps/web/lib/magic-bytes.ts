/**
 * Validate file uploads by magic bytes (file signatures).
 * Only allow known video formats; reject dangerous executables.
 */

interface MagicSignature {
  mime: string;
  offset: number;
  bytes: number[];
}

// Allowed video signatures
const ALLOWED_SIGNATURES: MagicSignature[] = [
  // MP4 / MOV — ftyp box at offset 4
  { mime: "video/mp4", offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] },
  // WebM — EBML header
  { mime: "video/webm", offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3] },
];

// Blocked executable signatures
const BLOCKED_SIGNATURES: MagicSignature[] = [
  // PE / EXE (MZ)
  { mime: "application/x-msdownload", offset: 0, bytes: [0x4d, 0x5a] },
  // ELF
  { mime: "application/x-elf", offset: 0, bytes: [0x7f, 0x45, 0x4c, 0x46] },
  // Mach-O 32-bit
  { mime: "application/x-mach-binary", offset: 0, bytes: [0xfe, 0xed, 0xfa, 0xce] },
  // Mach-O 64-bit
  { mime: "application/x-mach-binary", offset: 0, bytes: [0xfe, 0xed, 0xfa, 0xcf] },
];

function matchesSignature(header: Uint8Array, sig: MagicSignature): boolean {
  if (header.length < sig.offset + sig.bytes.length) return false;
  return sig.bytes.every((byte, i) => header[sig.offset + i] === byte);
}

export interface ValidationResult {
  valid: boolean;
  mime?: string;
  error?: string;
}

export function validateMagicBytes(header: Uint8Array): ValidationResult {
  // Check blocked signatures first
  for (const sig of BLOCKED_SIGNATURES) {
    if (matchesSignature(header, sig)) {
      return {
        valid: false,
        error: `Blocked file type detected: ${sig.mime}`,
      };
    }
  }

  // Check allowed signatures
  for (const sig of ALLOWED_SIGNATURES) {
    if (matchesSignature(header, sig)) {
      return { valid: true, mime: sig.mime };
    }
  }

  return {
    valid: false,
    error: "Unsupported file type. Only MP4, MOV, and WebM files are allowed.",
  };
}
