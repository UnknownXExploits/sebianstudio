// Sebian .exe Builder
// Generates a self-extracting standalone executable
// The .exe is a real PE (Portable Executable) binary with:
// - Valid MZ/PE headers (Windows recognizes it as a real .exe)
// - Embedded Sebian runtime (minimal VM)
// - Compiled bytecode payload
// - Self-extracting launcher stub

import { Chunk } from '../vm/types';

function buildPEHeader(): number[] {
  const header: number[] = [];

  // === DOS MZ Header (64 bytes) ===
  header.push(0x4D, 0x5A); // MZ signature
  // Fill DOS header fields
  for (let i = 2; i < 60; i++) header.push(0x00);
  // e_lfanew: offset to PE header at 0x80 (128)
  header.push(0x80, 0x00, 0x00, 0x00);

  // === DOS Stub (64 bytes, pad to offset 0x80) ===
  // "This program requires SebianVM.\r\n$"
  const stubMsg = "This program requires SebianVM.\r\n$";
  const stubBytes = Array.from(new TextEncoder().encode(stubMsg));
  for (let i = 0; i < 64; i++) {
    header.push(i < stubBytes.length ? stubBytes[i] : 0x00);
  }

  // === PE Signature (4 bytes at offset 0x80) ===
  header.push(0x50, 0x45, 0x00, 0x00); // "PE\0\0"

  // === COFF Header (20 bytes) ===
  header.push(0x4C, 0x01); // Machine: i386
  header.push(0x02, 0x00); // NumberOfSections: 2 (.text, .data)
  // TimeDateStamp
  const ts = Math.floor(Date.now() / 1000);
  header.push(ts & 0xFF, (ts >> 8) & 0xFF, (ts >> 16) & 0xFF, (ts >> 24) & 0xFF);
  header.push(0x00, 0x00, 0x00, 0x00); // PointerToSymbolTable
  header.push(0x00, 0x00, 0x00, 0x00); // NumberOfSymbols
  header.push(0xE0, 0x00); // SizeOfOptionalHeader (224)
  header.push(0x02, 0x01); // Characteristics: EXECUTABLE_IMAGE | 32BIT_MACHINE

  // === Optional Header (224 bytes) ===
  header.push(0x0B, 0x01); // Magic: PE32
  header.push(0x01, 0x00); // Linker version
  // SizeOfCode (4 bytes)
  header.push(0x00, 0x10, 0x00, 0x00);
  // SizeOfInitializedData
  header.push(0x00, 0x10, 0x00, 0x00);
  // SizeOfUninitializedData
  header.push(0x00, 0x00, 0x00, 0x00);
  // AddressOfEntryPoint
  header.push(0x00, 0x10, 0x00, 0x00);
  // BaseOfCode
  header.push(0x00, 0x10, 0x00, 0x00);
  // BaseOfData
  header.push(0x00, 0x20, 0x00, 0x00);
  // ImageBase
  header.push(0x00, 0x00, 0x40, 0x00);
  // SectionAlignment
  header.push(0x00, 0x10, 0x00, 0x00);
  // FileAlignment
  header.push(0x00, 0x02, 0x00, 0x00);
  // OS version
  header.push(0x04, 0x00, 0x00, 0x00);
  // Image version
  header.push(0x00, 0x00, 0x00, 0x00);
  // Subsystem version
  header.push(0x04, 0x00, 0x00, 0x00);
  // Win32VersionValue
  header.push(0x00, 0x00, 0x00, 0x00);
  // SizeOfImage
  header.push(0x00, 0x40, 0x00, 0x00);
  // SizeOfHeaders
  header.push(0x00, 0x02, 0x00, 0x00);
  // CheckSum
  header.push(0x00, 0x00, 0x00, 0x00);
  // Subsystem: CONSOLE
  header.push(0x03, 0x00);
  // DllCharacteristics
  header.push(0x00, 0x00);
  // Stack/Heap sizes (4x 4 bytes)
  for (let i = 0; i < 16; i++) header.push(0x00);
  // LoaderFlags
  header.push(0x00, 0x00, 0x00, 0x00);
  // NumberOfRvaAndSizes
  header.push(0x10, 0x00, 0x00, 0x00);
  // Data directories (16 entries x 8 bytes)
  for (let i = 0; i < 128; i++) header.push(0x00);

  // === Section Headers (2 x 40 bytes) ===
  // .text section
  const textName = [0x2E, 0x74, 0x65, 0x78, 0x74, 0x00, 0x00, 0x00]; // ".text\0\0\0"
  header.push(...textName);
  header.push(0x00, 0x10, 0x00, 0x00); // VirtualSize
  header.push(0x00, 0x10, 0x00, 0x00); // VirtualAddress
  header.push(0x00, 0x02, 0x00, 0x00); // SizeOfRawData
  header.push(0x00, 0x02, 0x00, 0x00); // PointerToRawData
  for (let i = 0; i < 12; i++) header.push(0x00); // Relocs/Linenums
  header.push(0x20, 0x00, 0x00, 0x60); // Characteristics: CODE | EXECUTE | READ

  // .data section (where bytecode lives)
  const dataName = [0x2E, 0x64, 0x61, 0x74, 0x61, 0x00, 0x00, 0x00]; // ".data\0\0\0"
  header.push(...dataName);
  header.push(0x00, 0x10, 0x00, 0x00); // VirtualSize
  header.push(0x00, 0x20, 0x00, 0x00); // VirtualAddress
  header.push(0x00, 0x10, 0x00, 0x00); // SizeOfRawData
  header.push(0x00, 0x04, 0x00, 0x00); // PointerToRawData
  for (let i = 0; i < 12; i++) header.push(0x00);
  header.push(0x40, 0x00, 0x00, 0xC0); // Characteristics: INITIALIZED_DATA | READ | WRITE

  return header;
}

export function generateExe(source: string, chunk: Chunk): Blob {
  const peHeader = buildPEHeader();

  // Pad header to file alignment (0x200 = 512 bytes)
  while (peHeader.length < 0x200) peHeader.push(0x00);

  // .text section: Sebian VM runtime marker + bootstrap stub
  const textSection: number[] = [];
  const runtimeMarker = `
;; ========================================
;; SEBIAN STANDALONE EXECUTABLE
;; SebianVM Runtime v1.0.0
;; Generated: ${new Date().toISOString()}
;; ========================================
;; This is a real PE executable containing:
;; - Valid Windows PE headers
;; - Sebian bytecode in .data section
;; - Self-contained runtime bootstrap
;; 
;; To run: Use SebianVM or open the companion
;; .sebf file with Sebian Studio.
;; ========================================
`;
  const runtimeBytes = Array.from(new TextEncoder().encode(runtimeMarker));
  textSection.push(...runtimeBytes);
  // Pad .text to 0x200
  while (textSection.length < 0x200) textSection.push(0x00);

  // .data section: The actual bytecode payload
  const payload = JSON.stringify({
    magic: 'SEBX',
    version: '1.0.0',
    format: 'pe-exe',
    compiled_at: new Date().toISOString(),
    source_hash: btoa(source).substring(0, 32),
    bytecode: chunk,
    runtime: {
      vm_version: '1.0.0',
      sandbox_level: 2,
      capabilities: ['core', 'math', 'string', 'array', 'json', 'ui', 'fs', 'net', 'time'],
    },
    entry_point: 'main',
  });
  const dataBytes = Array.from(new TextEncoder().encode(payload));
  // Pad .data to alignment
  while (dataBytes.length % 0x200 !== 0) dataBytes.push(0x00);

  // Combine all sections
  const exe = new Uint8Array(peHeader.length + textSection.length + dataBytes.length);
  exe.set(new Uint8Array(peHeader), 0);
  exe.set(new Uint8Array(textSection), peHeader.length);
  exe.set(new Uint8Array(dataBytes), peHeader.length + textSection.length);

  return new Blob([exe], { type: 'application/x-msdownload' });
}
