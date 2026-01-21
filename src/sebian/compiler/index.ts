// Sebian Compiler - Main Entry Point
// Compiles Sebian source code to VM bytecode

import { Parser } from './parser';
import { CodeGenerator } from './codegen';
import { CompilationResult, CompilationError, Chunk } from '../vm/types';

export { Lexer, TokenType } from './lexer';
export type { Token } from './lexer';
export { Parser } from './parser';
export { CodeGenerator } from './codegen';
export * from './ast';

export interface CompileOptions {
  filename?: string;
  debug?: boolean;
}

export function compile(source: string, options: CompileOptions = {}): CompilationResult {
  const parser = new Parser(source);
  const parseResult = parser.parse();
  
  if (parseResult.errors.length > 0) {
    return {
      success: false,
      errors: parseResult.errors,
      warnings: [],
    };
  }
  
  if (!parseResult.ast) {
    return {
      success: false,
      errors: [{
        message: 'Failed to parse source code',
        line: 1,
        column: 1,
        length: 1,
        source: source.split('\n')[0] || '',
      }],
      warnings: [],
    };
  }
  
  const generator = new CodeGenerator();
  return generator.compile(parseResult.ast);
}

export function formatError(error: CompilationError, source: string): string {
  const lines = source.split('\n');
  const line = lines[error.line - 1] || '';
  
  let output = `Error at line ${error.line}, column ${error.column}:\n`;
  output += `  ${line}\n`;
  output += `  ${' '.repeat(error.column - 1)}${'~'.repeat(error.length)}\n`;
  output += `  ${error.message}\n`;
  
  if (error.suggestion) {
    output += `  Suggestion: ${error.suggestion}\n`;
  }
  
  return output;
}

export function disassemble(chunk: Chunk): string {
  const lines: string[] = [];
  
  lines.push(`== ${chunk.name} ==`);
  lines.push(`Constants: ${chunk.constants.length}`);
  
  for (let i = 0; i < chunk.constants.length; i++) {
    const c = chunk.constants[i];
    let valueStr: string;
    switch (c.type) {
      case 'string': valueStr = `"${c.value}"`; break;
      case 'number': valueStr = String(c.value); break;
      case 'boolean': valueStr = c.value ? 'true' : 'false'; break;
      case 'null': valueStr = 'null'; break;
      case 'function': valueStr = `<fn ${c.value.name}>`; break;
      default: valueStr = `<${c.type}>`;
    }
    lines.push(`  [${i}] ${valueStr}`);
  }
  
  lines.push('');
  lines.push('Instructions:');
  
  for (let i = 0; i < chunk.code.length; i++) {
    const instr = chunk.code[i];
    const opName = getOpcodeName(instr.opcode);
    const operands = instr.operands.join(', ');
    lines.push(`  ${i.toString().padStart(4, '0')}  ${opName.padEnd(20)} ${operands}`);
  }
  
  return lines.join('\n');
}

function getOpcodeName(opcode: number): string {
  const names: Record<number, string> = {
    0x01: 'PUSH_CONST',
    0x02: 'POP',
    0x03: 'DUP',
    0x04: 'SWAP',
    0x10: 'LOAD_GLOBAL',
    0x11: 'STORE_GLOBAL',
    0x12: 'LOAD_LOCAL',
    0x13: 'STORE_LOCAL',
    0x14: 'LOAD_UPVALUE',
    0x15: 'STORE_UPVALUE',
    0x16: 'CLOSE_UPVALUE',
    0x20: 'GET_PROP',
    0x21: 'SET_PROP',
    0x22: 'GET_INDEX',
    0x23: 'SET_INDEX',
    0x30: 'ADD',
    0x31: 'SUB',
    0x32: 'MUL',
    0x33: 'DIV',
    0x34: 'MOD',
    0x35: 'NEG',
    0x36: 'POW',
    0x40: 'EQ',
    0x41: 'NEQ',
    0x42: 'LT',
    0x43: 'LTE',
    0x44: 'GT',
    0x45: 'GTE',
    0x50: 'NOT',
    0x51: 'AND',
    0x52: 'OR',
    0x60: 'JMP',
    0x61: 'JMP_IF_FALSE',
    0x62: 'JMP_IF_TRUE',
    0x63: 'LOOP',
    0x70: 'CALL',
    0x71: 'RET',
    0x72: 'MAKE_CLOSURE',
    0x73: 'BIND_METHOD',
    0x80: 'MAKE_ARRAY',
    0x81: 'MAKE_OBJECT',
    0x82: 'MAKE_CLASS',
    0x90: 'UI_CREATE_NODE',
    0x91: 'UI_SET_PROP',
    0x92: 'UI_BIND_EVENT',
    0x93: 'UI_APPEND',
    0x94: 'UI_RENDER',
    0x95: 'UI_REMOVE',
    0x96: 'UI_CLONE',
    0xA0: 'SYSCALL',
    0xA1: 'IMPORT_MODULE',
    0xA2: 'EXPORT',
    0xA3: 'PRINT',
    0xAF: 'HALT',
    0xF0: 'BREAKPOINT',
    0xFF: 'NOP',
  };
  
  return names[opcode] ?? `UNKNOWN(0x${opcode.toString(16)})`;
}
