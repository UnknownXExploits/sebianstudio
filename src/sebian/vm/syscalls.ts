// SebianVM Syscall System
// All privileged operations go through syscalls with capability checks

import { SebianValue, SyscallResult, Capability } from './types';
import type { SebianVM } from './vm';

export const SYSCALL_IDS = {
  // Core syscalls (always available)
  PRINT: 0x0001,
  TYPE_OF: 0x0002,
  TO_STRING: 0x0003,
  TO_NUMBER: 0x0004,
  
  // Math syscalls
  MATH_SIN: 0x0100,
  MATH_COS: 0x0101,
  MATH_TAN: 0x0102,
  MATH_SQRT: 0x0103,
  MATH_POW: 0x0104,
  MATH_ABS: 0x0105,
  MATH_FLOOR: 0x0106,
  MATH_CEIL: 0x0107,
  MATH_ROUND: 0x0108,
  MATH_RANDOM: 0x0109,
  MATH_MIN: 0x010A,
  MATH_MAX: 0x010B,
  MATH_LOG: 0x010C,
  MATH_EXP: 0x010D,
  
  // String syscalls
  STRING_LENGTH: 0x0200,
  STRING_UPPER: 0x0201,
  STRING_LOWER: 0x0202,
  STRING_SPLIT: 0x0203,
  STRING_JOIN: 0x0204,
  STRING_TRIM: 0x0205,
  STRING_REPLACE: 0x0206,
  STRING_CONTAINS: 0x0207,
  STRING_STARTS_WITH: 0x0208,
  STRING_ENDS_WITH: 0x0209,
  STRING_SUBSTR: 0x020A,
  STRING_CHAR_AT: 0x020B,
  STRING_INDEX_OF: 0x020C,
  
  // Array syscalls
  ARRAY_LENGTH: 0x0300,
  ARRAY_PUSH: 0x0301,
  ARRAY_POP: 0x0302,
  ARRAY_SHIFT: 0x0303,
  ARRAY_UNSHIFT: 0x0304,
  ARRAY_SLICE: 0x0305,
  ARRAY_CONCAT: 0x0306,
  ARRAY_REVERSE: 0x0307,
  ARRAY_SORT: 0x0308,
  ARRAY_FIND: 0x0309,
  ARRAY_FILTER: 0x030A,
  ARRAY_MAP: 0x030B,
  ARRAY_REDUCE: 0x030C,
  ARRAY_INCLUDES: 0x030D,
  
  // JSON syscalls
  JSON_PARSE: 0x0400,
  JSON_STRINGIFY: 0x0401,
  
  // UI syscalls (requires 'ui' capability)
  UI_CREATE: 0x0500,
  UI_UPDATE: 0x0501,
  UI_REMOVE: 0x0502,
  UI_QUERY: 0x0503,
  UI_STYLE: 0x0504,
  UI_ANIMATE: 0x0505,
  
  // File system syscalls (requires 'fs' capability)
  FS_READ: 0x0600,
  FS_WRITE: 0x0601,
  FS_DELETE: 0x0602,
  FS_LIST: 0x0603,
  FS_EXISTS: 0x0604,
  FS_MKDIR: 0x0605,
  FS_STAT: 0x0606,
  
  // Network syscalls (requires 'net' capability)
  NET_FETCH: 0x0700,
  NET_WEBSOCKET: 0x0701,
  
  // Time syscalls (requires 'time' capability)
  TIME_NOW: 0x0800,
  TIME_SET_TIMEOUT: 0x0801,
  TIME_SET_INTERVAL: 0x0802,
  TIME_CLEAR_TIMEOUT: 0x0803,
  TIME_SLEEP: 0x0804,
  
  // Host syscalls (requires 'host' capability - Level 1 only)
  HOST_GET_GLOBAL: 0x0900,
  HOST_SET_GLOBAL: 0x0901,
  HOST_CALL: 0x0902,
  
  // DOM syscalls (requires 'dom' capability - Level 1 only)
  DOM_QUERY: 0x0A00,
  DOM_CREATE: 0x0A01,
  DOM_APPEND: 0x0A02,
  DOM_REMOVE: 0x0A03,
  DOM_SET_ATTR: 0x0A04,
  DOM_GET_ATTR: 0x0A05,
  DOM_SET_STYLE: 0x0A06,
  DOM_ADD_EVENT: 0x0A07,
  
  // Buffer syscalls (requires 'buffer' capability - Level 1 only)
  BUFFER_CREATE: 0x0B00,
  BUFFER_READ: 0x0B01,
  BUFFER_WRITE: 0x0B02,
  BUFFER_LENGTH: 0x0B03,

  // Memory syscalls (requires 'buffer' capability - Level 1 only)
  MEMORY_ALLOC: 0x0C00,
  MEMORY_READ: 0x0C01,
  MEMORY_WRITE: 0x0C02,
  MEMORY_FREE: 0x0C03,
  MEMORY_SIZE: 0x0C04,
  MEMORY_COPY: 0x0C05,
};

// Map syscall IDs to required capabilities
const SYSCALL_CAPABILITIES: Record<number, Capability | null> = {
  [SYSCALL_IDS.PRINT]: null,
  [SYSCALL_IDS.TYPE_OF]: null,
  [SYSCALL_IDS.TO_STRING]: null,
  [SYSCALL_IDS.TO_NUMBER]: null,
  
  [SYSCALL_IDS.MATH_SIN]: 'math',
  [SYSCALL_IDS.MATH_COS]: 'math',
  [SYSCALL_IDS.MATH_TAN]: 'math',
  [SYSCALL_IDS.MATH_SQRT]: 'math',
  [SYSCALL_IDS.MATH_POW]: 'math',
  [SYSCALL_IDS.MATH_ABS]: 'math',
  [SYSCALL_IDS.MATH_FLOOR]: 'math',
  [SYSCALL_IDS.MATH_CEIL]: 'math',
  [SYSCALL_IDS.MATH_ROUND]: 'math',
  [SYSCALL_IDS.MATH_RANDOM]: 'math',
  [SYSCALL_IDS.MATH_MIN]: 'math',
  [SYSCALL_IDS.MATH_MAX]: 'math',
  [SYSCALL_IDS.MATH_LOG]: 'math',
  [SYSCALL_IDS.MATH_EXP]: 'math',
  
  [SYSCALL_IDS.STRING_LENGTH]: 'string',
  [SYSCALL_IDS.STRING_UPPER]: 'string',
  [SYSCALL_IDS.STRING_LOWER]: 'string',
  [SYSCALL_IDS.STRING_SPLIT]: 'string',
  [SYSCALL_IDS.STRING_JOIN]: 'string',
  [SYSCALL_IDS.STRING_TRIM]: 'string',
  [SYSCALL_IDS.STRING_REPLACE]: 'string',
  [SYSCALL_IDS.STRING_CONTAINS]: 'string',
  [SYSCALL_IDS.STRING_STARTS_WITH]: 'string',
  [SYSCALL_IDS.STRING_ENDS_WITH]: 'string',
  [SYSCALL_IDS.STRING_SUBSTR]: 'string',
  [SYSCALL_IDS.STRING_CHAR_AT]: 'string',
  [SYSCALL_IDS.STRING_INDEX_OF]: 'string',
  
  [SYSCALL_IDS.ARRAY_LENGTH]: 'array',
  [SYSCALL_IDS.ARRAY_PUSH]: 'array',
  [SYSCALL_IDS.ARRAY_POP]: 'array',
  [SYSCALL_IDS.ARRAY_SHIFT]: 'array',
  [SYSCALL_IDS.ARRAY_UNSHIFT]: 'array',
  [SYSCALL_IDS.ARRAY_SLICE]: 'array',
  [SYSCALL_IDS.ARRAY_CONCAT]: 'array',
  [SYSCALL_IDS.ARRAY_REVERSE]: 'array',
  [SYSCALL_IDS.ARRAY_SORT]: 'array',
  [SYSCALL_IDS.ARRAY_FIND]: 'array',
  [SYSCALL_IDS.ARRAY_FILTER]: 'array',
  [SYSCALL_IDS.ARRAY_MAP]: 'array',
  [SYSCALL_IDS.ARRAY_REDUCE]: 'array',
  [SYSCALL_IDS.ARRAY_INCLUDES]: 'array',
  
  [SYSCALL_IDS.JSON_PARSE]: 'json',
  [SYSCALL_IDS.JSON_STRINGIFY]: 'json',
  
  [SYSCALL_IDS.UI_CREATE]: 'ui',
  [SYSCALL_IDS.UI_UPDATE]: 'ui',
  [SYSCALL_IDS.UI_REMOVE]: 'ui',
  [SYSCALL_IDS.UI_QUERY]: 'ui',
  [SYSCALL_IDS.UI_STYLE]: 'ui',
  [SYSCALL_IDS.UI_ANIMATE]: 'ui',
  
  [SYSCALL_IDS.FS_READ]: 'fs',
  [SYSCALL_IDS.FS_WRITE]: 'fs',
  [SYSCALL_IDS.FS_DELETE]: 'fs',
  [SYSCALL_IDS.FS_LIST]: 'fs',
  [SYSCALL_IDS.FS_EXISTS]: 'fs',
  [SYSCALL_IDS.FS_MKDIR]: 'fs',
  [SYSCALL_IDS.FS_STAT]: 'fs',
  
  [SYSCALL_IDS.NET_FETCH]: 'net',
  [SYSCALL_IDS.NET_WEBSOCKET]: 'net',
  
  [SYSCALL_IDS.TIME_NOW]: 'time',
  [SYSCALL_IDS.TIME_SET_TIMEOUT]: 'time',
  [SYSCALL_IDS.TIME_SET_INTERVAL]: 'time',
  [SYSCALL_IDS.TIME_CLEAR_TIMEOUT]: 'time',
  [SYSCALL_IDS.TIME_SLEEP]: 'time',
  
  [SYSCALL_IDS.HOST_GET_GLOBAL]: 'host',
  [SYSCALL_IDS.HOST_SET_GLOBAL]: 'host',
  [SYSCALL_IDS.HOST_CALL]: 'host',
  
  [SYSCALL_IDS.DOM_QUERY]: 'dom',
  [SYSCALL_IDS.DOM_CREATE]: 'dom',
  [SYSCALL_IDS.DOM_APPEND]: 'dom',
  [SYSCALL_IDS.DOM_REMOVE]: 'dom',
  [SYSCALL_IDS.DOM_SET_ATTR]: 'dom',
  [SYSCALL_IDS.DOM_GET_ATTR]: 'dom',
  [SYSCALL_IDS.DOM_SET_STYLE]: 'dom',
  [SYSCALL_IDS.DOM_ADD_EVENT]: 'dom',
  
  [SYSCALL_IDS.BUFFER_CREATE]: 'buffer',
  [SYSCALL_IDS.BUFFER_READ]: 'buffer',
  [SYSCALL_IDS.BUFFER_WRITE]: 'buffer',
  [SYSCALL_IDS.BUFFER_LENGTH]: 'buffer',

  [SYSCALL_IDS.MEMORY_ALLOC]: 'buffer',
  [SYSCALL_IDS.MEMORY_READ]: 'buffer',
  [SYSCALL_IDS.MEMORY_WRITE]: 'buffer',
  [SYSCALL_IDS.MEMORY_FREE]: 'buffer',
  [SYSCALL_IDS.MEMORY_SIZE]: 'buffer',
  [SYSCALL_IDS.MEMORY_COPY]: 'buffer',
};

// Virtual file system storage
const virtualFS = new Map<string, string>();

// Virtual memory storage (C++ style ReadProcessMemory/WriteProcessMemory simulation)
const memoryBlocks = new Map<number, ArrayBuffer>();
let memoryHandleCounter = 1;

// Timer storage
const timers = new Map<number, number>();
let timerIdCounter = 1;

export function executeSyscall(
  syscallId: number, 
  args: SebianValue[], 
  vm: SebianVM
): SyscallResult {
  // Check capability
  const requiredCap = SYSCALL_CAPABILITIES[syscallId];
  if (requiredCap && !vm.hasCapability(requiredCap)) {
    return { 
      success: false, 
      error: `Syscall requires '${requiredCap}' capability (Sandbox Level ${vm.getSandboxLevel()})` 
    };
  }
  
  switch (syscallId) {
    // Core syscalls
    case SYSCALL_IDS.PRINT: {
      const message = args.map(a => valueToString(a)).join(' ');
      console.log('[Sebian]', message);
      return { success: true, value: { type: 'null' } };
    }
    
    case SYSCALL_IDS.TYPE_OF: {
      if (args.length === 0) return { success: false, error: 'type_of requires 1 argument' };
      return { success: true, value: { type: 'string', value: args[0].type } };
    }
    
    case SYSCALL_IDS.TO_STRING: {
      if (args.length === 0) return { success: false, error: 'to_string requires 1 argument' };
      return { success: true, value: { type: 'string', value: valueToString(args[0]) } };
    }
    
    case SYSCALL_IDS.TO_NUMBER: {
      if (args.length === 0) return { success: false, error: 'to_number requires 1 argument' };
      const val = args[0];
      if (val.type === 'number') return { success: true, value: val };
      if (val.type === 'string') {
        const num = parseFloat(val.value);
        if (isNaN(num)) return { success: true, value: { type: 'null' } };
        return { success: true, value: { type: 'number', value: num } };
      }
      if (val.type === 'boolean') return { success: true, value: { type: 'number', value: val.value ? 1 : 0 } };
      return { success: true, value: { type: 'null' } };
    }
    
    // Math syscalls
    case SYSCALL_IDS.MATH_SIN: {
      if (args.length === 0 || args[0].type !== 'number') return { success: false, error: 'sin requires a number' };
      return { success: true, value: { type: 'number', value: Math.sin(args[0].value) } };
    }
    
    case SYSCALL_IDS.MATH_COS: {
      if (args.length === 0 || args[0].type !== 'number') return { success: false, error: 'cos requires a number' };
      return { success: true, value: { type: 'number', value: Math.cos(args[0].value) } };
    }
    
    case SYSCALL_IDS.MATH_TAN: {
      if (args.length === 0 || args[0].type !== 'number') return { success: false, error: 'tan requires a number' };
      return { success: true, value: { type: 'number', value: Math.tan(args[0].value) } };
    }
    
    case SYSCALL_IDS.MATH_SQRT: {
      if (args.length === 0 || args[0].type !== 'number') return { success: false, error: 'sqrt requires a number' };
      return { success: true, value: { type: 'number', value: Math.sqrt(args[0].value) } };
    }
    
    case SYSCALL_IDS.MATH_POW: {
      if (args.length < 2 || args[0].type !== 'number' || args[1].type !== 'number') {
        return { success: false, error: 'pow requires 2 numbers' };
      }
      return { success: true, value: { type: 'number', value: Math.pow(args[0].value, args[1].value) } };
    }
    
    case SYSCALL_IDS.MATH_ABS: {
      if (args.length === 0 || args[0].type !== 'number') return { success: false, error: 'abs requires a number' };
      return { success: true, value: { type: 'number', value: Math.abs(args[0].value) } };
    }
    
    case SYSCALL_IDS.MATH_FLOOR: {
      if (args.length === 0 || args[0].type !== 'number') return { success: false, error: 'floor requires a number' };
      return { success: true, value: { type: 'number', value: Math.floor(args[0].value) } };
    }
    
    case SYSCALL_IDS.MATH_CEIL: {
      if (args.length === 0 || args[0].type !== 'number') return { success: false, error: 'ceil requires a number' };
      return { success: true, value: { type: 'number', value: Math.ceil(args[0].value) } };
    }
    
    case SYSCALL_IDS.MATH_ROUND: {
      if (args.length === 0 || args[0].type !== 'number') return { success: false, error: 'round requires a number' };
      return { success: true, value: { type: 'number', value: Math.round(args[0].value) } };
    }
    
    case SYSCALL_IDS.MATH_RANDOM: {
      return { success: true, value: { type: 'number', value: Math.random() } };
    }
    
    case SYSCALL_IDS.MATH_MIN: {
      const nums = args.filter(a => a.type === 'number').map(a => (a as any).value);
      if (nums.length === 0) return { success: false, error: 'min requires at least 1 number' };
      return { success: true, value: { type: 'number', value: Math.min(...nums) } };
    }
    
    case SYSCALL_IDS.MATH_MAX: {
      const nums = args.filter(a => a.type === 'number').map(a => (a as any).value);
      if (nums.length === 0) return { success: false, error: 'max requires at least 1 number' };
      return { success: true, value: { type: 'number', value: Math.max(...nums) } };
    }
    
    case SYSCALL_IDS.MATH_LOG: {
      if (args.length === 0 || args[0].type !== 'number') return { success: false, error: 'log requires a number' };
      return { success: true, value: { type: 'number', value: Math.log(args[0].value) } };
    }
    
    case SYSCALL_IDS.MATH_EXP: {
      if (args.length === 0 || args[0].type !== 'number') return { success: false, error: 'exp requires a number' };
      return { success: true, value: { type: 'number', value: Math.exp(args[0].value) } };
    }
    
    // String syscalls
    case SYSCALL_IDS.STRING_LENGTH: {
      if (args.length === 0 || args[0].type !== 'string') return { success: false, error: 'length requires a string' };
      return { success: true, value: { type: 'number', value: args[0].value.length } };
    }
    
    case SYSCALL_IDS.STRING_UPPER: {
      if (args.length === 0 || args[0].type !== 'string') return { success: false, error: 'upper requires a string' };
      return { success: true, value: { type: 'string', value: args[0].value.toUpperCase() } };
    }
    
    case SYSCALL_IDS.STRING_LOWER: {
      if (args.length === 0 || args[0].type !== 'string') return { success: false, error: 'lower requires a string' };
      return { success: true, value: { type: 'string', value: args[0].value.toLowerCase() } };
    }
    
    case SYSCALL_IDS.STRING_SPLIT: {
      if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'string') {
        return { success: false, error: 'split requires 2 strings' };
      }
      const parts = args[0].value.split(args[1].value);
      return { 
        success: true, 
        value: { type: 'array', value: parts.map(p => ({ type: 'string' as const, value: p })) } 
      };
    }
    
    case SYSCALL_IDS.STRING_JOIN: {
      if (args.length < 2 || args[0].type !== 'array' || args[1].type !== 'string') {
        return { success: false, error: 'join requires an array and separator string' };
      }
      const parts = args[0].value.map(v => valueToString(v));
      return { success: true, value: { type: 'string', value: parts.join(args[1].value) } };
    }
    
    case SYSCALL_IDS.STRING_TRIM: {
      if (args.length === 0 || args[0].type !== 'string') return { success: false, error: 'trim requires a string' };
      return { success: true, value: { type: 'string', value: args[0].value.trim() } };
    }
    
    case SYSCALL_IDS.STRING_REPLACE: {
      if (args.length < 3 || args[0].type !== 'string' || args[1].type !== 'string' || args[2].type !== 'string') {
        return { success: false, error: 'replace requires 3 strings' };
      }
      return { success: true, value: { type: 'string', value: args[0].value.replace(args[1].value, args[2].value) } };
    }
    
    case SYSCALL_IDS.STRING_CONTAINS: {
      if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'string') {
        return { success: false, error: 'contains requires 2 strings' };
      }
      return { success: true, value: { type: 'boolean', value: args[0].value.includes(args[1].value) } };
    }
    
    case SYSCALL_IDS.STRING_STARTS_WITH: {
      if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'string') {
        return { success: false, error: 'starts_with requires 2 strings' };
      }
      return { success: true, value: { type: 'boolean', value: args[0].value.startsWith(args[1].value) } };
    }
    
    case SYSCALL_IDS.STRING_ENDS_WITH: {
      if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'string') {
        return { success: false, error: 'ends_with requires 2 strings' };
      }
      return { success: true, value: { type: 'boolean', value: args[0].value.endsWith(args[1].value) } };
    }
    
    case SYSCALL_IDS.STRING_SUBSTR: {
      if (args.length < 3 || args[0].type !== 'string' || args[1].type !== 'number' || args[2].type !== 'number') {
        return { success: false, error: 'substr requires string, start, length' };
      }
      return { success: true, value: { type: 'string', value: args[0].value.substr(args[1].value, args[2].value) } };
    }
    
    case SYSCALL_IDS.STRING_CHAR_AT: {
      if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'number') {
        return { success: false, error: 'char_at requires string, index' };
      }
      const char = args[0].value.charAt(args[1].value);
      return { success: true, value: char ? { type: 'string', value: char } : { type: 'null' } };
    }
    
    case SYSCALL_IDS.STRING_INDEX_OF: {
      if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'string') {
        return { success: false, error: 'index_of requires 2 strings' };
      }
      return { success: true, value: { type: 'number', value: args[0].value.indexOf(args[1].value) } };
    }
    
    // Array syscalls
    case SYSCALL_IDS.ARRAY_LENGTH: {
      if (args.length === 0 || args[0].type !== 'array') return { success: false, error: 'length requires an array' };
      return { success: true, value: { type: 'number', value: args[0].value.length } };
    }
    
    case SYSCALL_IDS.ARRAY_PUSH: {
      if (args.length < 2 || args[0].type !== 'array') return { success: false, error: 'push requires array and value' };
      args[0].value.push(args[1]);
      return { success: true, value: { type: 'number', value: args[0].value.length } };
    }
    
    case SYSCALL_IDS.ARRAY_POP: {
      if (args.length === 0 || args[0].type !== 'array') return { success: false, error: 'pop requires an array' };
      const val = args[0].value.pop();
      return { success: true, value: val ?? { type: 'null' } };
    }
    
    case SYSCALL_IDS.ARRAY_INCLUDES: {
      if (args.length < 2 || args[0].type !== 'array') return { success: false, error: 'includes requires array and value' };
      const found = args[0].value.some(v => valuesEqual(v, args[1]));
      return { success: true, value: { type: 'boolean', value: found } };
    }
    
    case SYSCALL_IDS.ARRAY_REVERSE: {
      if (args.length === 0 || args[0].type !== 'array') return { success: false, error: 'reverse requires an array' };
      return { success: true, value: { type: 'array', value: [...args[0].value].reverse() } };
    }
    
    // JSON syscalls
    case SYSCALL_IDS.JSON_PARSE: {
      if (args.length === 0 || args[0].type !== 'string') return { success: false, error: 'parse requires a string' };
      try {
        const parsed = JSON.parse(args[0].value);
        return { success: true, value: jsToSebian(parsed) };
      } catch {
        return { success: false, error: 'Invalid JSON' };
      }
    }
    
    case SYSCALL_IDS.JSON_STRINGIFY: {
      if (args.length === 0) return { success: false, error: 'stringify requires a value' };
      try {
        const js = sebianToJs(args[0]);
        return { success: true, value: { type: 'string', value: JSON.stringify(js) } };
      } catch {
        return { success: false, error: 'Cannot stringify value' };
      }
    }
    
    // FS syscalls
    case SYSCALL_IDS.FS_READ: {
      if (args.length === 0 || args[0].type !== 'string') return { success: false, error: 'read requires a path' };
      const content = virtualFS.get(args[0].value);
      if (content === undefined) return { success: true, value: { type: 'null' } };
      return { success: true, value: { type: 'string', value: content } };
    }
    
    case SYSCALL_IDS.FS_WRITE: {
      if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'string') {
        return { success: false, error: 'write requires path and content' };
      }
      virtualFS.set(args[0].value, args[1].value);
      return { success: true, value: { type: 'boolean', value: true } };
    }
    
    case SYSCALL_IDS.FS_DELETE: {
      if (args.length === 0 || args[0].type !== 'string') return { success: false, error: 'delete requires a path' };
      const existed = virtualFS.delete(args[0].value);
      return { success: true, value: { type: 'boolean', value: existed } };
    }
    
    case SYSCALL_IDS.FS_EXISTS: {
      if (args.length === 0 || args[0].type !== 'string') return { success: false, error: 'exists requires a path' };
      return { success: true, value: { type: 'boolean', value: virtualFS.has(args[0].value) } };
    }
    
    case SYSCALL_IDS.FS_LIST: {
      if (args.length === 0 || args[0].type !== 'string') return { success: false, error: 'list requires a path' };
      const prefix = args[0].value.endsWith('/') ? args[0].value : args[0].value + '/';
      const files: SebianValue[] = [];
      for (const path of virtualFS.keys()) {
        if (path.startsWith(prefix)) {
          const relative = path.slice(prefix.length);
          const firstPart = relative.split('/')[0];
          if (firstPart && !files.some(f => f.type === 'string' && f.value === firstPart)) {
            files.push({ type: 'string', value: firstPart });
          }
        }
      }
      return { success: true, value: { type: 'array', value: files } };
    }
    
    // Time syscalls
    case SYSCALL_IDS.TIME_NOW: {
      return { success: true, value: { type: 'number', value: Date.now() } };
    }
    
    case SYSCALL_IDS.TIME_SET_TIMEOUT: {
      // Note: In VM context, this would need async handling
      // For now, return a timer ID
      const id = timerIdCounter++;
      return { success: true, value: { type: 'number', value: id } };
    }
    
    // Memory syscalls - C++ style readMemory/writeMemory
    case SYSCALL_IDS.MEMORY_ALLOC: {
      if (args.length === 0 || args[0].type !== 'number') return { success: false, error: 'allocMemory requires size (number)' };
      const size = Math.floor(args[0].value);
      if (size <= 0 || size > 1024 * 1024 * 64) return { success: false, error: 'Invalid memory size (1 - 64MB)' };
      const handle = memoryHandleCounter++;
      memoryBlocks.set(handle, new ArrayBuffer(size));
      return { success: true, value: { type: 'number', value: handle } };
    }

    case SYSCALL_IDS.MEMORY_READ: {
      if (args.length < 3 || args[0].type !== 'number' || args[1].type !== 'number' || args[2].type !== 'number') {
        return { success: false, error: 'readMemory(handle, offset, size)' };
      }
      const block = memoryBlocks.get(args[0].value);
      if (!block) return { success: false, error: 'Invalid memory handle' };
      const offset = Math.floor(args[1].value);
      const readSize = Math.floor(args[2].value);
      if (offset < 0 || offset + readSize > block.byteLength) return { success: false, error: 'Memory access out of bounds' };
      const view = new Uint8Array(block, offset, readSize);
      const result: SebianValue[] = [];
      for (let i = 0; i < readSize; i++) {
        result.push({ type: 'number', value: view[i] });
      }
      return { success: true, value: { type: 'array', value: result } };
    }

    case SYSCALL_IDS.MEMORY_WRITE: {
      if (args.length < 3 || args[0].type !== 'number' || args[1].type !== 'number' || args[2].type !== 'array') {
        return { success: false, error: 'writeMemory(handle, offset, bytes[])' };
      }
      const block = memoryBlocks.get(args[0].value);
      if (!block) return { success: false, error: 'Invalid memory handle' };
      const offset = Math.floor(args[1].value);
      const bytes = args[2].value;
      if (offset < 0 || offset + bytes.length > block.byteLength) return { success: false, error: 'Memory access out of bounds' };
      const view = new Uint8Array(block, offset, bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i];
        view[i] = b.type === 'number' ? (b.value & 0xFF) : 0;
      }
      return { success: true, value: { type: 'number', value: bytes.length } };
    }

    case SYSCALL_IDS.MEMORY_FREE: {
      if (args.length === 0 || args[0].type !== 'number') return { success: false, error: 'freeMemory requires handle' };
      const freed = memoryBlocks.delete(args[0].value);
      return { success: true, value: { type: 'boolean', value: freed } };
    }

    case SYSCALL_IDS.MEMORY_SIZE: {
      if (args.length === 0 || args[0].type !== 'number') return { success: false, error: 'memorySize requires handle' };
      const block = memoryBlocks.get(args[0].value);
      if (!block) return { success: false, error: 'Invalid memory handle' };
      return { success: true, value: { type: 'number', value: block.byteLength } };
    }

    case SYSCALL_IDS.MEMORY_COPY: {
      if (args.length < 5) return { success: false, error: 'memoryCopy(srcHandle, srcOffset, dstHandle, dstOffset, size)' };
      const srcBlock = memoryBlocks.get((args[0] as any).value);
      const dstBlock = memoryBlocks.get((args[2] as any).value);
      if (!srcBlock || !dstBlock) return { success: false, error: 'Invalid memory handle' };
      const srcOff = Math.floor((args[1] as any).value);
      const dstOff = Math.floor((args[3] as any).value);
      const copySize = Math.floor((args[4] as any).value);
      if (srcOff + copySize > srcBlock.byteLength || dstOff + copySize > dstBlock.byteLength) {
        return { success: false, error: 'Memory copy out of bounds' };
      }
      const src = new Uint8Array(srcBlock, srcOff, copySize);
      const dst = new Uint8Array(dstBlock, dstOff, copySize);
      dst.set(src);
      return { success: true, value: { type: 'number', value: copySize } };
    }

    default:
      return { success: false, error: `Unknown syscall: 0x${syscallId.toString(16)}` };
  }
}

function valueToString(value: SebianValue): string {
  switch (value.type) {
    case 'null': return 'null';
    case 'boolean': return value.value ? 'true' : 'false';
    case 'number': return String(value.value);
    case 'string': return value.value;
    case 'array': return '[' + value.value.map(valueToString).join(', ') + ']';
    case 'object': {
      const entries = Array.from(value.value.entries());
      return '{' + entries.map(([k, v]) => `${k}: ${valueToString(v)}`).join(', ') + '}';
    }
    case 'function': return `<fn ${value.value.name}>`;
    case 'closure': return `<closure ${value.value.function.name}>`;
    case 'native': return '<native fn>';
    case 'ui_node': return `<ui:${value.value.type}>`;
    case 'module': return `<module ${value.value.name}>`;
  }
}

function valuesEqual(a: SebianValue, b: SebianValue): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'null') return true;
  if (a.type === 'boolean') return a.value === (b as any).value;
  if (a.type === 'number') return a.value === (b as any).value;
  if (a.type === 'string') return a.value === (b as any).value;
  return a === b;
}

function jsToSebian(value: any): SebianValue {
  if (value === null || value === undefined) return { type: 'null' };
  if (typeof value === 'boolean') return { type: 'boolean', value };
  if (typeof value === 'number') return { type: 'number', value };
  if (typeof value === 'string') return { type: 'string', value };
  if (Array.isArray(value)) return { type: 'array', value: value.map(jsToSebian) };
  if (typeof value === 'object') {
    const map = new Map<string, SebianValue>();
    for (const [k, v] of Object.entries(value)) {
      map.set(k, jsToSebian(v));
    }
    return { type: 'object', value: map };
  }
  return { type: 'null' };
}

function sebianToJs(value: SebianValue): any {
  switch (value.type) {
    case 'null': return null;
    case 'boolean': return value.value;
    case 'number': return value.value;
    case 'string': return value.value;
    case 'array': return value.value.map(sebianToJs);
    case 'object': {
      const obj: any = {};
      for (const [k, v] of value.value.entries()) {
        obj[k] = sebianToJs(v);
      }
      return obj;
    }
    default: return null;
  }
}
