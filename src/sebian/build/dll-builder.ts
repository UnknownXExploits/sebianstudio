// Sebian .dll Builder
// Generates a Sebian Dynamic Library module
// Contains compiled bytecode with export table for use by other Sebian programs

import { Chunk, SebianValue } from '../vm/types';

interface DllExport {
  name: string;
  type: 'function' | 'variable';
  offset: number;
}

function extractExports(chunk: Chunk): DllExport[] {
  const exports: DllExport[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < chunk.code.length; i++) {
    const instr = chunk.code[i];
    // OP_STORE_GLOBAL = 0x11 — these are top-level declarations
    if (instr.opcode === 0x11 && instr.operands.length > 0) {
      const constIdx = instr.operands[0];
      if (constIdx < chunk.constants.length) {
        const c = chunk.constants[constIdx];
        if (c.type === 'string' && !seen.has(c.value)) {
          seen.add(c.value);
          // Check if previous instruction pushed a function
          const prevInstr = i > 0 ? chunk.code[i - 1] : null;
          const isFunc = prevInstr && prevInstr.opcode === 0x72; // OP_MAKE_CLOSURE
          exports.push({
            name: c.value,
            type: isFunc ? 'function' : 'variable',
            offset: i,
          });
        }
      }
    }
  }

  return exports;
}

export function generateDll(source: string, chunk: Chunk): Blob {
  const exports = extractExports(chunk);

  const dll = {
    magic: 'SDLL',
    version: '1.0.0',
    format: 'sebian-dll',
    compiled_at: new Date().toISOString(),
    source_hash: btoa(source).substring(0, 32),
    name: 'module',
    exports: exports.map(e => e.name),
    export_table: exports,
    bytecode: chunk,
    metadata: {
      vm_version: '1.0.0',
      sandbox_level: 2,
      capabilities: ['core', 'math', 'string', 'array', 'json'],
      linkage: 'dynamic',
      architecture: 'sebian-vm',
    },
  };

  return new Blob([JSON.stringify(dll)], { type: 'application/x-sebian-dll' });
}
