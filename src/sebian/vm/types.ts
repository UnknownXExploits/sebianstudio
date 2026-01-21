// SebianVM Core Types
// This is the actual virtual machine - NO JavaScript transpilation

export type SebianValue = 
  | { type: 'null' }
  | { type: 'boolean'; value: boolean }
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'array'; value: SebianValue[] }
  | { type: 'object'; value: Map<string, SebianValue> }
  | { type: 'function'; value: SebianFunction }
  | { type: 'closure'; value: SebianClosure }
  | { type: 'native'; value: NativeFunction }
  | { type: 'ui_node'; value: SebianUINode }
  | { type: 'module'; value: SebianModule };

export interface SebianFunction {
  name: string;
  arity: number;
  chunk: Chunk;
  upvalueCount: number;
}

export interface SebianClosure {
  function: SebianFunction;
  upvalues: Upvalue[];
}

export interface Upvalue {
  location: number;
  closed: SebianValue | null;
  isLocal: boolean;
}

export type NativeFunction = (args: SebianValue[], vm: any) => SebianValue;

export interface SebianUINode {
  id: string;
  type: string;
  props: Map<string, SebianValue>;
  children: SebianUINode[];
  eventHandlers: Map<string, SebianClosure>;
  parent: SebianUINode | null;
}

export interface SebianModule {
  name: string;
  exports: Map<string, SebianValue>;
  loaded: boolean;
}

// Bytecode types
export enum OpCode {
  // Stack operations
  OP_PUSH_CONST = 0x01,
  OP_POP = 0x02,
  OP_DUP = 0x03,
  OP_SWAP = 0x04,
  
  // Variable operations
  OP_LOAD_GLOBAL = 0x10,
  OP_STORE_GLOBAL = 0x11,
  OP_LOAD_LOCAL = 0x12,
  OP_STORE_LOCAL = 0x13,
  OP_LOAD_UPVALUE = 0x14,
  OP_STORE_UPVALUE = 0x15,
  OP_CLOSE_UPVALUE = 0x16,
  
  // Property operations
  OP_GET_PROP = 0x20,
  OP_SET_PROP = 0x21,
  OP_GET_INDEX = 0x22,
  OP_SET_INDEX = 0x23,
  
  // Arithmetic operations
  OP_ADD = 0x30,
  OP_SUB = 0x31,
  OP_MUL = 0x32,
  OP_DIV = 0x33,
  OP_MOD = 0x34,
  OP_NEG = 0x35,
  OP_POW = 0x36,
  
  // Comparison operations
  OP_EQ = 0x40,
  OP_NEQ = 0x41,
  OP_LT = 0x42,
  OP_LTE = 0x43,
  OP_GT = 0x44,
  OP_GTE = 0x45,
  
  // Logical operations
  OP_NOT = 0x50,
  OP_AND = 0x51,
  OP_OR = 0x52,
  
  // Control flow
  OP_JMP = 0x60,
  OP_JMP_IF_FALSE = 0x61,
  OP_JMP_IF_TRUE = 0x62,
  OP_LOOP = 0x63,
  
  // Function operations
  OP_CALL = 0x70,
  OP_RET = 0x71,
  OP_MAKE_CLOSURE = 0x72,
  OP_BIND_METHOD = 0x73,
  
  // Object operations
  OP_MAKE_ARRAY = 0x80,
  OP_MAKE_OBJECT = 0x81,
  OP_MAKE_CLASS = 0x82,
  
  // UI operations
  OP_UI_CREATE_NODE = 0x90,
  OP_UI_SET_PROP = 0x91,
  OP_UI_BIND_EVENT = 0x92,
  OP_UI_APPEND = 0x93,
  OP_UI_RENDER = 0x94,
  OP_UI_REMOVE = 0x95,
  OP_UI_CLONE = 0x96,
  
  // System operations
  OP_SYSCALL = 0xA0,
  OP_IMPORT_MODULE = 0xA1,
  OP_EXPORT = 0xA2,
  OP_PRINT = 0xA3,
  OP_HALT = 0xAF,
  
  // Debug operations
  OP_BREAKPOINT = 0xF0,
  OP_NOP = 0xFF,
}

export interface Instruction {
  opcode: OpCode;
  operands: number[];
  line: number;
  column: number;
}

export interface Chunk {
  code: Instruction[];
  constants: SebianValue[];
  name: string;
  lines: number[];
}

export interface CallFrame {
  closure: SebianClosure;
  ip: number;
  stackBase: number;
  returnAddress: number;
}

export interface VMState {
  stack: SebianValue[];
  globals: Map<string, SebianValue>;
  frames: CallFrame[];
  heap: HeapObject[];
  modules: Map<string, SebianModule>;
  uiRoot: SebianUINode | null;
  halted: boolean;
  paused: boolean;
  instructionCount: number;
  maxInstructions: number;
}

export interface HeapObject {
  id: number;
  value: SebianValue;
  marked: boolean;
  refCount: number;
}

// Sandbox types
export type SandboxLevel = 1 | 2 | 3;

export type Capability = 
  | 'core'
  | 'math'
  | 'string'
  | 'array'
  | 'json'
  | 'ui'
  | 'fs'
  | 'net'
  | 'time'
  | 'host'
  | 'dom'
  | 'buffer'
  | 'unsafe_net';

export interface SandboxConfig {
  level: SandboxLevel;
  capabilities: Set<Capability>;
  maxInstructions: number;
  maxStackSize: number;
  maxHeapSize: number;
  allowedHosts: string[];
}

export const SANDBOX_LEVEL_CAPABILITIES: Record<SandboxLevel, Capability[]> = {
  3: ['core', 'math', 'string', 'array'],
  2: ['core', 'math', 'string', 'array', 'json', 'ui', 'fs', 'net', 'time'],
  1: ['core', 'math', 'string', 'array', 'json', 'ui', 'fs', 'net', 'time', 'host', 'dom', 'buffer', 'unsafe_net'],
};

export interface SyscallResult {
  success: boolean;
  value?: SebianValue;
  error?: string;
}

// Debug types
export interface Breakpoint {
  file: string;
  line: number;
  enabled: boolean;
  condition?: string;
}

export interface DebugState {
  breakpoints: Breakpoint[];
  stepping: boolean;
  stepMode: 'into' | 'over' | 'out' | null;
  watchExpressions: string[];
}

// Compiler types
export interface CompilationResult {
  success: boolean;
  chunk?: Chunk;
  errors: CompilationError[];
  warnings: CompilationWarning[];
}

export interface CompilationError {
  message: string;
  line: number;
  column: number;
  length: number;
  source: string;
  suggestion?: string;
}

export interface CompilationWarning {
  message: string;
  line: number;
  column: number;
}
