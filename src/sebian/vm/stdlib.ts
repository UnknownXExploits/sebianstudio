// Sebian Standard Library - Native Modules
// These are built-in modules available to Sebian programs

import { SebianValue, SebianModule, NativeFunction, SebianUINode } from './types';
import type { SebianVM } from './vm';

export function createNativeModule(name: string, vm: SebianVM): SebianModule {
  const exports = new Map<string, SebianValue>();
  
  switch (name) {
    case 'core':
      createCoreModule(exports, vm);
      break;
    case 'math':
      createMathModule(exports);
      break;
    case 'string':
      createStringModule(exports);
      break;
    case 'array':
      createArrayModule(exports);
      break;
    case 'ui':
    case 'sebian':
      createUIModule(exports, vm);
      break;
    case 'fs':
      createFSModule(exports);
      break;
    case 'net':
      createNetModule(exports);
      break;
    case 'time':
      createTimeModule(exports);
      break;
  }
  
  return { name, exports, loaded: true };
}

function createCoreModule(exports: Map<string, SebianValue>, vm: SebianVM): void {
  exports.set('print', createNative((args) => {
    const msg = args.map(a => formatValue(a)).join(' ');
    console.log('[Sebian]', msg);
    return { type: 'null' };
  }));
  
  exports.set('type', createNative((args) => {
    if (args.length === 0) return { type: 'null' };
    return { type: 'string', value: args[0].type };
  }));
  
  exports.set('len', createNative((args) => {
    if (args.length === 0) return { type: 'null' };
    const val = args[0];
    if (val.type === 'string') return { type: 'number', value: val.value.length };
    if (val.type === 'array') return { type: 'number', value: val.value.length };
    if (val.type === 'object') return { type: 'number', value: val.value.size };
    return { type: 'null' };
  }));
  
  exports.set('str', createNative((args) => {
    if (args.length === 0) return { type: 'string', value: '' };
    return { type: 'string', value: formatValue(args[0]) };
  }));
  
  exports.set('num', createNative((args) => {
    if (args.length === 0) return { type: 'null' };
    const val = args[0];
    if (val.type === 'number') return val;
    if (val.type === 'string') {
      const num = parseFloat(val.value);
      if (isNaN(num)) return { type: 'null' };
      return { type: 'number', value: num };
    }
    if (val.type === 'boolean') return { type: 'number', value: val.value ? 1 : 0 };
    return { type: 'null' };
  }));
  
  exports.set('bool', createNative((args) => {
    if (args.length === 0) return { type: 'boolean', value: false };
    return { type: 'boolean', value: isTruthy(args[0]) };
  }));
  
  exports.set('keys', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'object') return { type: 'array', value: [] };
    const keys = Array.from(args[0].value.keys());
    return { type: 'array', value: keys.map(k => ({ type: 'string' as const, value: k })) };
  }));
  
  exports.set('values', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'object') return { type: 'array', value: [] };
    return { type: 'array', value: Array.from(args[0].value.values()) };
  }));
  
  exports.set('range', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') return { type: 'array', value: [] };
    const start = args.length > 1 && args[1].type === 'number' ? args[1].value : 0;
    const end = args[0].value;
    const step = args.length > 2 && args[2].type === 'number' ? args[2].value : 1;
    
    const result: SebianValue[] = [];
    for (let i = start; step > 0 ? i < end : i > end; i += step) {
      result.push({ type: 'number', value: i });
    }
    return { type: 'array', value: result };
  }));
}

function createMathModule(exports: Map<string, SebianValue>): void {
  // Constants
  exports.set('PI', { type: 'number', value: Math.PI });
  exports.set('E', { type: 'number', value: Math.E });
  exports.set('TAU', { type: 'number', value: Math.PI * 2 });
  exports.set('INFINITY', { type: 'number', value: Infinity });
  
  // Basic functions
  exports.set('abs', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.abs(args[0].value) };
  }));
  
  exports.set('floor', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.floor(args[0].value) };
  }));
  
  exports.set('ceil', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.ceil(args[0].value) };
  }));
  
  exports.set('round', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.round(args[0].value) };
  }));
  
  exports.set('sqrt', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.sqrt(args[0].value) };
  }));
  
  exports.set('pow', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'number' || args[1].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.pow(args[0].value, args[1].value) };
  }));
  
  // Trigonometry
  exports.set('sin', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.sin(args[0].value) };
  }));
  
  exports.set('cos', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.cos(args[0].value) };
  }));
  
  exports.set('tan', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.tan(args[0].value) };
  }));
  
  exports.set('asin', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.asin(args[0].value) };
  }));
  
  exports.set('acos', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.acos(args[0].value) };
  }));
  
  exports.set('atan', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.atan(args[0].value) };
  }));
  
  exports.set('atan2', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'number' || args[1].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.atan2(args[0].value, args[1].value) };
  }));
  
  // Logarithms
  exports.set('log', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.log(args[0].value) };
  }));
  
  exports.set('log10', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.log10(args[0].value) };
  }));
  
  exports.set('log2', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.log2(args[0].value) };
  }));
  
  exports.set('exp', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.exp(args[0].value) };
  }));
  
  // Random
  exports.set('random', createNative(() => {
    return { type: 'number', value: Math.random() };
  }));
  
  exports.set('randint', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'number' || args[1].type !== 'number') {
      return { type: 'null' };
    }
    const min = Math.floor(args[0].value);
    const max = Math.floor(args[1].value);
    return { type: 'number', value: Math.floor(Math.random() * (max - min + 1)) + min };
  }));
  
  // Min/max
  exports.set('min', createNative((args) => {
    const nums = args.filter(a => a.type === 'number').map(a => (a as any).value);
    if (nums.length === 0) return { type: 'null' };
    return { type: 'number', value: Math.min(...nums) };
  }));
  
  exports.set('max', createNative((args) => {
    const nums = args.filter(a => a.type === 'number').map(a => (a as any).value);
    if (nums.length === 0) return { type: 'null' };
    return { type: 'number', value: Math.max(...nums) };
  }));
  
  exports.set('clamp', createNative((args) => {
    if (args.length < 3 || args[0].type !== 'number' || args[1].type !== 'number' || args[2].type !== 'number') {
      return { type: 'null' };
    }
    return { type: 'number', value: Math.min(Math.max(args[0].value, args[1].value), args[2].value) };
  }));
  
  // Sign
  exports.set('sign', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') return { type: 'null' };
    return { type: 'number', value: Math.sign(args[0].value) };
  }));
}

function createStringModule(exports: Map<string, SebianValue>): void {
  exports.set('upper', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'string') return { type: 'null' };
    return { type: 'string', value: args[0].value.toUpperCase() };
  }));
  
  exports.set('lower', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'string') return { type: 'null' };
    return { type: 'string', value: args[0].value.toLowerCase() };
  }));
  
  exports.set('trim', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'string') return { type: 'null' };
    return { type: 'string', value: args[0].value.trim() };
  }));
  
  exports.set('split', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'string') {
      return { type: 'array', value: [] };
    }
    const parts = args[0].value.split(args[1].value);
    return { type: 'array', value: parts.map(p => ({ type: 'string' as const, value: p })) };
  }));
  
  exports.set('join', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'array' || args[1].type !== 'string') {
      return { type: 'string', value: '' };
    }
    const parts = args[0].value.map(v => formatValue(v));
    return { type: 'string', value: parts.join(args[1].value) };
  }));
  
  exports.set('replace', createNative((args) => {
    if (args.length < 3 || args[0].type !== 'string' || args[1].type !== 'string' || args[2].type !== 'string') {
      return { type: 'null' };
    }
    return { type: 'string', value: args[0].value.split(args[1].value).join(args[2].value) };
  }));
  
  exports.set('contains', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'string') {
      return { type: 'boolean', value: false };
    }
    return { type: 'boolean', value: args[0].value.includes(args[1].value) };
  }));
  
  exports.set('starts_with', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'string') {
      return { type: 'boolean', value: false };
    }
    return { type: 'boolean', value: args[0].value.startsWith(args[1].value) };
  }));
  
  exports.set('ends_with', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'string') {
      return { type: 'boolean', value: false };
    }
    return { type: 'boolean', value: args[0].value.endsWith(args[1].value) };
  }));
  
  exports.set('substr', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'number') {
      return { type: 'null' };
    }
    const start = args[1].value;
    const len = args.length > 2 && args[2].type === 'number' ? args[2].value : undefined;
    return { type: 'string', value: args[0].value.substr(start, len) };
  }));
  
  exports.set('char_at', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'number') {
      return { type: 'null' };
    }
    const char = args[0].value.charAt(args[1].value);
    return char ? { type: 'string', value: char } : { type: 'null' };
  }));
  
  exports.set('index_of', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'string') {
      return { type: 'number', value: -1 };
    }
    return { type: 'number', value: args[0].value.indexOf(args[1].value) };
  }));
  
  exports.set('repeat', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'number') {
      return { type: 'null' };
    }
    return { type: 'string', value: args[0].value.repeat(Math.floor(args[1].value)) };
  }));
  
  exports.set('pad_start', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'number') {
      return { type: 'null' };
    }
    const padChar = args.length > 2 && args[2].type === 'string' ? args[2].value : ' ';
    return { type: 'string', value: args[0].value.padStart(args[1].value, padChar) };
  }));
  
  exports.set('pad_end', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'number') {
      return { type: 'null' };
    }
    const padChar = args.length > 2 && args[2].type === 'string' ? args[2].value : ' ';
    return { type: 'string', value: args[0].value.padEnd(args[1].value, padChar) };
  }));
}

function createArrayModule(exports: Map<string, SebianValue>): void {
  exports.set('push', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'array') return { type: 'null' };
    args[0].value.push(args[1]);
    return { type: 'number', value: args[0].value.length };
  }));
  
  exports.set('pop', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'array') return { type: 'null' };
    const val = args[0].value.pop();
    return val ?? { type: 'null' };
  }));
  
  exports.set('shift', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'array') return { type: 'null' };
    const val = args[0].value.shift();
    return val ?? { type: 'null' };
  }));
  
  exports.set('unshift', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'array') return { type: 'null' };
    args[0].value.unshift(args[1]);
    return { type: 'number', value: args[0].value.length };
  }));
  
  exports.set('slice', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'array' || args[1].type !== 'number') {
      return { type: 'array', value: [] };
    }
    const start = args[1].value;
    const end = args.length > 2 && args[2].type === 'number' ? args[2].value : undefined;
    return { type: 'array', value: args[0].value.slice(start, end) };
  }));
  
  exports.set('concat', createNative((args) => {
    const result: SebianValue[] = [];
    for (const arg of args) {
      if (arg.type === 'array') {
        result.push(...arg.value);
      } else {
        result.push(arg);
      }
    }
    return { type: 'array', value: result };
  }));
  
  exports.set('reverse', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'array') return { type: 'array', value: [] };
    return { type: 'array', value: [...args[0].value].reverse() };
  }));
  
  exports.set('includes', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'array') return { type: 'boolean', value: false };
    const found = args[0].value.some(v => valuesEqual(v, args[1]));
    return { type: 'boolean', value: found };
  }));
  
  exports.set('index_of', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'array') return { type: 'number', value: -1 };
    const idx = args[0].value.findIndex(v => valuesEqual(v, args[1]));
    return { type: 'number', value: idx };
  }));
  
  exports.set('fill', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'number') return { type: 'array', value: [] };
    const len = args[0].value;
    const val = args[1];
    return { type: 'array', value: Array(Math.floor(len)).fill(val) };
  }));
}

function createUIModule(exports: Map<string, SebianValue>, vm: SebianVM): void {
  // UI element types
  exports.set('buttons', { type: 'object', value: new Map() });
  exports.set('inputs', { type: 'object', value: new Map() });
  exports.set('containers', { type: 'object', value: new Map() });
  exports.set('text', { type: 'object', value: new Map() });
  
  // Tracker for state management
  exports.set('tracker', {
    type: 'object',
    value: new Map([
      ['count', { type: 'number', value: 0 }],
      ['up', createNative(() => {
        // This would be implemented with proper state management
        return { type: 'null' };
      })],
      ['down', createNative(() => {
        return { type: 'null' };
      })],
    ]),
  });
  
  // Create UI node
  exports.set('create', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'string') return { type: 'null' };
    const node: SebianUINode = {
      id: 'seb_' + Math.random().toString(36).substr(2, 9),
      type: args[0].value,
      props: new Map(),
      children: [],
      eventHandlers: new Map(),
      parent: null,
    };
    return { type: 'ui_node', value: node };
  }));
  
  // Set prop on UI node
  exports.set('set_prop', createNative((args) => {
    if (args.length < 3 || args[0].type !== 'ui_node' || args[1].type !== 'string') {
      return { type: 'null' };
    }
    args[0].value.props.set(args[1].value, args[2]);
    return args[0];
  }));
  
  // Add child to UI node
  exports.set('append', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'ui_node' || args[1].type !== 'ui_node') {
      return { type: 'null' };
    }
    args[1].value.parent = args[0].value;
    args[0].value.children.push(args[1].value);
    return args[0];
  }));
  
  // Render to screen
  exports.set('render', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'ui_node') return { type: 'null' };
    // This would trigger the UI update handler
    return { type: 'boolean', value: true };
  }));
  
  // SebianVM special object for sandbox control
  exports.set('SebianVM', {
    type: 'object',
    value: new Map([
      ['tools', {
        type: 'object',
        value: new Map([
          ['functions', {
            type: 'object',
            value: new Map([
              ['sandbox', {
                type: 'object',
                value: new Map([
                  ['level', { type: 'number', value: vm.getSandboxLevel() }],
                ]),
              }],
            ]),
          }],
        ]),
      }],
      ['version', { type: 'string', value: '1.0.0' }],
    ]),
  });
}

function createFSModule(exports: Map<string, SebianValue>): void {
  const virtualFS = new Map<string, string>();
  
  exports.set('read', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'string') return { type: 'null' };
    const content = virtualFS.get(args[0].value);
    if (content === undefined) return { type: 'null' };
    return { type: 'string', value: content };
  }));
  
  exports.set('write', createNative((args) => {
    if (args.length < 2 || args[0].type !== 'string' || args[1].type !== 'string') {
      return { type: 'boolean', value: false };
    }
    virtualFS.set(args[0].value, args[1].value);
    return { type: 'boolean', value: true };
  }));
  
  exports.set('delete', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'string') return { type: 'boolean', value: false };
    return { type: 'boolean', value: virtualFS.delete(args[0].value) };
  }));
  
  exports.set('exists', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'string') return { type: 'boolean', value: false };
    return { type: 'boolean', value: virtualFS.has(args[0].value) };
  }));
  
  exports.set('list', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'string') return { type: 'array', value: [] };
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
    return { type: 'array', value: files };
  }));
}

function createNetModule(exports: Map<string, SebianValue>): void {
  exports.set('fetch', createNative((args) => {
    // Async operations would need special handling in the VM
    // For now, return a placeholder
    return { type: 'null' };
  }));
}

function createTimeModule(exports: Map<string, SebianValue>): void {
  exports.set('now', createNative(() => {
    return { type: 'number', value: Date.now() };
  }));
  
  exports.set('timestamp', createNative(() => {
    return { type: 'number', value: Math.floor(Date.now() / 1000) };
  }));
  
  exports.set('format', createNative((args) => {
    if (args.length === 0 || args[0].type !== 'number') {
      return { type: 'string', value: new Date().toISOString() };
    }
    return { type: 'string', value: new Date(args[0].value).toISOString() };
  }));
}

// Helper functions
function createNative(fn: NativeFunction): SebianValue {
  return { type: 'native', value: fn };
}

function formatValue(value: SebianValue): string {
  switch (value.type) {
    case 'null': return 'null';
    case 'boolean': return value.value ? 'true' : 'false';
    case 'number': return String(value.value);
    case 'string': return value.value;
    case 'array': return '[' + value.value.map(formatValue).join(', ') + ']';
    case 'object': {
      const entries = Array.from(value.value.entries());
      return '{' + entries.map(([k, v]) => `${k}: ${formatValue(v)}`).join(', ') + '}';
    }
    case 'function': return `<fn ${value.value.name}>`;
    case 'closure': return `<closure ${value.value.function.name}>`;
    case 'native': return '<native fn>';
    case 'ui_node': return `<ui:${value.value.type}>`;
    case 'module': return `<module ${value.value.name}>`;
  }
}

function isTruthy(value: SebianValue): boolean {
  if (value.type === 'null') return false;
  if (value.type === 'boolean') return value.value;
  if (value.type === 'number') return value.value !== 0;
  if (value.type === 'string') return value.value.length > 0;
  return true;
}

function valuesEqual(a: SebianValue, b: SebianValue): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'null') return true;
  if (a.type === 'boolean') return a.value === (b as any).value;
  if (a.type === 'number') return a.value === (b as any).value;
  if (a.type === 'string') return a.value === (b as any).value;
  return a === b;
}
