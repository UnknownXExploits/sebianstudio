// SebianVM - The Real Virtual Machine
// Executes Sebian bytecode directly - NO JavaScript transpilation

import { 
  SebianValue, 
  OpCode, 
  Chunk, 
  CallFrame, 
  VMState, 
  SebianClosure, 
  SebianFunction,
  SebianUINode,
  SebianModule,
  SandboxConfig,
  SandboxLevel,
  SANDBOX_LEVEL_CAPABILITIES,
  Capability,
  SyscallResult,
  Upvalue,
  DebugState,
  Breakpoint,
  HeapObject
} from './types';
import { executeSyscall, SYSCALL_IDS } from './syscalls';
import { createNativeModule } from './stdlib';

export class SebianVM {
  private state: VMState;
  private sandbox: SandboxConfig;
  private debug: DebugState;
  private eventQueue: Array<{ handler: SebianClosure; args: SebianValue[] }> = [];
  private heapIdCounter = 0;
  private gcThreshold = 1000;
  private onStateChange?: (state: VMState) => void;
  private onOutput?: (message: string) => void;
  private onUIUpdate?: (root: SebianUINode | null) => void;
  private onBreakpoint?: (frame: CallFrame, line: number) => void;

  constructor(sandbox?: Partial<SandboxConfig>) {
    this.sandbox = {
      level: sandbox?.level ?? 2,
      capabilities: new Set(SANDBOX_LEVEL_CAPABILITIES[sandbox?.level ?? 2]),
      maxInstructions: sandbox?.maxInstructions ?? 10000000,
      maxStackSize: sandbox?.maxStackSize ?? 10000,
      maxHeapSize: sandbox?.maxHeapSize ?? 100000,
      allowedHosts: sandbox?.allowedHosts ?? ['*'],
    };
    
    this.state = this.createInitialState();
    this.debug = {
      breakpoints: [],
      stepping: false,
      stepMode: null,
      watchExpressions: [],
    };
    
    this.loadStandardLibrary();
  }

  private createInitialState(): VMState {
    return {
      stack: [],
      globals: new Map(),
      frames: [],
      heap: [],
      modules: new Map(),
      uiRoot: null,
      halted: false,
      paused: false,
      instructionCount: 0,
      maxInstructions: this.sandbox.maxInstructions,
    };
  }

  private loadStandardLibrary(): void {
    let uiModule: SebianModule | null = null;

    // Load core module
    const coreModule = createNativeModule('core', this);
    this.state.modules.set('core', coreModule);
    
    // Load math module if capability exists
    if (this.hasCapability('math')) {
      const mathModule = createNativeModule('math', this);
      this.state.modules.set('math', mathModule);
    }
    
    // Load string module
    if (this.hasCapability('string')) {
      const stringModule = createNativeModule('string', this);
      this.state.modules.set('string', stringModule);
    }
    
    // Load array module
    if (this.hasCapability('array')) {
      const arrayModule = createNativeModule('array', this);
      this.state.modules.set('array', arrayModule);
    }
    
    // Load UI module
    if (this.hasCapability('ui')) {
      uiModule = createNativeModule('ui', this);
      this.state.modules.set('ui', uiModule);
    }
    
    // Load fs module
    if (this.hasCapability('fs')) {
      const fsModule = createNativeModule('fs', this);
      this.state.modules.set('fs', fsModule);
    }
    
    // Load net module
    if (this.hasCapability('net')) {
      const netModule = createNativeModule('net', this);
      this.state.modules.set('net', netModule);
    }
    
    // Load time module
    if (this.hasCapability('time')) {
      const timeModule = createNativeModule('time', this);
      this.state.modules.set('time', timeModule);
    }

    // Load memory module (Level 1 only - buffer capability)
    if (this.hasCapability('buffer')) {
      const memoryModule = createNativeModule('memory', this);
      this.state.modules.set('memory', memoryModule);
    }

    // Load Sebian special module for sandbox control
    const sebianVMModule = this.createSebianVMModule();
    this.state.modules.set('Sebian', sebianVMModule);

    // Convenience module name used by examples: expose both UI + SebianVM tools
    if (uiModule) {
      const merged = new Map<string, SebianValue>();

      // UI exports first
      uiModule.exports.forEach((v, k) => merged.set(k, v));
      // Add SebianVM tools (and any future exports)
      sebianVMModule.exports.forEach((v, k) => merged.set(k, v));

      this.state.modules.set('sebian', {
        name: 'sebian',
        exports: merged,
        loaded: true,
      });
    }
  }

  private createSebianVMModule(): SebianModule {
    const sandboxObj: SebianValue = {
      type: 'object',
      value: new Map<string, SebianValue>([
        ['level', { type: 'number', value: this.sandbox.level }],
      ]),
    };
    
    const functionsObj: SebianValue = {
      type: 'object',
      value: new Map<string, SebianValue>([
        ['sandbox', sandboxObj],
      ]),
    };
    
    const toolsObj: SebianValue = {
      type: 'object',
      value: new Map<string, SebianValue>([
        ['functions', functionsObj],
      ]),
    };

    return {
      name: 'Sebian',
      exports: new Map<string, SebianValue>([
        ['SebianVM', {
          type: 'object',
          value: new Map<string, SebianValue>([
            ['tools', toolsObj],
            ['version', { type: 'string', value: '1.0.0' }],
          ]),
        }],
      ]),
      loaded: true,
    };
  }

  hasCapability(cap: Capability): boolean {
    return this.sandbox.capabilities.has(cap);
  }

  setSandboxLevel(level: SandboxLevel): { success: boolean; warning?: string } {
    if (level === 1) {
      return {
        success: false,
        warning: 'Level 1 requires explicit confirmation. Use confirmSandboxLevel(1) after showing warning to user.',
      };
    }
    
    this.sandbox.level = level;
    this.sandbox.capabilities = new Set(SANDBOX_LEVEL_CAPABILITIES[level]);
    this.loadStandardLibrary();
    
    return { success: true };
  }

  confirmSandboxLevel(level: SandboxLevel): void {
    this.sandbox.level = level;
    this.sandbox.capabilities = new Set(SANDBOX_LEVEL_CAPABILITIES[level]);
    this.loadStandardLibrary();
  }

  getSandboxLevel(): SandboxLevel {
    return this.sandbox.level;
  }

  getCapabilities(): Capability[] {
    return Array.from(this.sandbox.capabilities);
  }

  // Core execution loop
  run(chunk: Chunk): SebianValue {
    // Create main function
    const mainFunction: SebianFunction = {
      name: '<main>',
      arity: 0,
      chunk,
      upvalueCount: 0,
    };
    
    const mainClosure: SebianClosure = {
      function: mainFunction,
      upvalues: [],
    };
    
    // Push initial frame
    this.state.frames.push({
      closure: mainClosure,
      ip: 0,
      stackBase: 0,
      returnAddress: 0,
    });
    
    return this.execute();
  }

  private execute(): SebianValue {
    while (!this.state.halted && !this.state.paused && this.state.frames.length > 0) {
      const frame = this.state.frames[this.state.frames.length - 1];
      const chunk = frame.closure.function.chunk;
      
      if (frame.ip >= chunk.code.length) {
        // Function ended without explicit return
        this.state.frames.pop();
        if (this.state.frames.length === 0) {
          return { type: 'null' };
        }
        continue;
      }
      
      const instruction = chunk.code[frame.ip];
      
      // Check for breakpoints
      if (this.checkBreakpoint(frame, instruction.line)) {
        this.state.paused = true;
        this.onBreakpoint?.(frame, instruction.line);
        break;
      }
      
      // Instruction limit check
      this.state.instructionCount++;
      if (this.state.instructionCount > this.state.maxInstructions) {
        throw new Error(`Execution limit exceeded: ${this.state.maxInstructions} instructions`);
      }
      
      // Stack size check
      if (this.state.stack.length > this.sandbox.maxStackSize) {
        throw new Error(`Stack overflow: max ${this.sandbox.maxStackSize} values`);
      }
      
      frame.ip++;
      
      this.executeInstruction(instruction, frame, chunk);
      
      // Notify state change
      this.onStateChange?.(this.state);
      
      // Run GC if needed
      if (this.state.heap.length > this.gcThreshold) {
        this.collectGarbage();
      }
    }
    
    // Process event queue
    this.processEventQueue();
    
    return this.state.stack.length > 0 
      ? this.state.stack[this.state.stack.length - 1] 
      : { type: 'null' };
  }

  private executeInstruction(instruction: { opcode: OpCode; operands: number[]; line: number; column: number }, frame: CallFrame, chunk: Chunk): void {
    const { opcode, operands } = instruction;
    
    switch (opcode) {
      case OpCode.OP_PUSH_CONST: {
        const value = chunk.constants[operands[0]];
        this.push(value);
        break;
      }
      
      case OpCode.OP_POP: {
        this.pop();
        break;
      }
      
      case OpCode.OP_DUP: {
        const value = this.peek(0);
        this.push(value);
        break;
      }
      
      case OpCode.OP_SWAP: {
        const a = this.pop();
        const b = this.pop();
        this.push(a);
        this.push(b);
        break;
      }
      
      case OpCode.OP_LOAD_GLOBAL: {
        const name = this.getConstantString(chunk, operands[0]);
        const value = this.state.globals.get(name);
        if (value === undefined) {
          throw new Error(`Undefined global variable: ${name}`);
        }
        this.push(value);
        break;
      }
      
      case OpCode.OP_STORE_GLOBAL: {
        const name = this.getConstantString(chunk, operands[0]);
        const value = this.peek(0);
        this.state.globals.set(name, value);
        break;
      }
      
      case OpCode.OP_LOAD_LOCAL: {
        const slot = operands[0];
        const value = this.state.stack[frame.stackBase + slot];
        this.push(value);
        break;
      }
      
      case OpCode.OP_STORE_LOCAL: {
        const slot = operands[0];
        const value = this.peek(0);
        this.state.stack[frame.stackBase + slot] = value;
        break;
      }
      
      case OpCode.OP_LOAD_UPVALUE: {
        const slot = operands[0];
        const upvalue = frame.closure.upvalues[slot];
        if (upvalue.closed !== null) {
          this.push(upvalue.closed);
        } else {
          this.push(this.state.stack[upvalue.location]);
        }
        break;
      }
      
      case OpCode.OP_STORE_UPVALUE: {
        const slot = operands[0];
        const value = this.peek(0);
        const upvalue = frame.closure.upvalues[slot];
        if (upvalue.closed !== null) {
          upvalue.closed = value;
        } else {
          this.state.stack[upvalue.location] = value;
        }
        break;
      }
      
      case OpCode.OP_CLOSE_UPVALUE: {
        this.closeUpvalues(this.state.stack.length - 1);
        this.pop();
        break;
      }
      
      case OpCode.OP_GET_PROP: {
        const propName = this.getConstantString(chunk, operands[0]);
        const obj = this.pop();
        if (obj.type !== 'object' && obj.type !== 'ui_node' && obj.type !== 'module') {
          throw new Error(`Cannot get property '${propName}' of ${obj.type}`);
        }
        const props =
          obj.type === 'object'
            ? obj.value
            : obj.type === 'ui_node'
              ? obj.value.props
              : obj.value.exports;
        const value = props.get(propName) ?? { type: 'null' as const };
        this.push(value);
        break;
      }
      
      case OpCode.OP_SET_PROP: {
        const propName = this.getConstantString(chunk, operands[0]);
        const value = this.pop();
        const obj = this.pop();
        if (obj.type !== 'object' && obj.type !== 'ui_node' && obj.type !== 'module') {
          throw new Error(`Cannot set property '${propName}' of ${obj.type}`);
        }
        const props =
          obj.type === 'object'
            ? obj.value
            : obj.type === 'ui_node'
              ? obj.value.props
              : obj.value.exports;
        props.set(propName, value);
        this.push(obj);
        break;
      }
      
      case OpCode.OP_GET_INDEX: {
        const index = this.pop();
        const arr = this.pop();
        if (arr.type === 'array' && index.type === 'number') {
          const value = arr.value[Math.floor(index.value)] ?? { type: 'null' };
          this.push(value);
        } else if (arr.type === 'object' && index.type === 'string') {
          const value = arr.value.get(index.value) ?? { type: 'null' };
          this.push(value);
        } else {
          throw new Error(`Cannot index ${arr.type} with ${index.type}`);
        }
        break;
      }
      
      case OpCode.OP_SET_INDEX: {
        const value = this.pop();
        const index = this.pop();
        const arr = this.pop();
        if (arr.type === 'array' && index.type === 'number') {
          arr.value[Math.floor(index.value)] = value;
        } else if (arr.type === 'object' && index.type === 'string') {
          arr.value.set(index.value, value);
        } else {
          throw new Error(`Cannot set index of ${arr.type} with ${index.type}`);
        }
        this.push(arr);
        break;
      }
      
      case OpCode.OP_ADD: {
        const b = this.pop();
        const a = this.pop();
        if (a.type === 'number' && b.type === 'number') {
          this.push({ type: 'number', value: a.value + b.value });
        } else if (a.type === 'string' || b.type === 'string') {
          this.push({ type: 'string', value: this.toString(a) + this.toString(b) });
        } else {
          throw new Error(`Cannot add ${a.type} and ${b.type}`);
        }
        break;
      }
      
      case OpCode.OP_SUB: {
        const b = this.pop();
        const a = this.pop();
        this.assertNumbers(a, b, '-');
        this.push({ type: 'number', value: (a as any).value - (b as any).value });
        break;
      }
      
      case OpCode.OP_MUL: {
        const b = this.pop();
        const a = this.pop();
        this.assertNumbers(a, b, '*');
        this.push({ type: 'number', value: (a as any).value * (b as any).value });
        break;
      }
      
      case OpCode.OP_DIV: {
        const b = this.pop();
        const a = this.pop();
        this.assertNumbers(a, b, '/');
        if ((b as any).value === 0) {
          throw new Error('Division by zero');
        }
        this.push({ type: 'number', value: (a as any).value / (b as any).value });
        break;
      }
      
      case OpCode.OP_MOD: {
        const b = this.pop();
        const a = this.pop();
        this.assertNumbers(a, b, '%');
        this.push({ type: 'number', value: (a as any).value % (b as any).value });
        break;
      }
      
      case OpCode.OP_NEG: {
        const a = this.pop();
        if (a.type !== 'number') {
          throw new Error(`Cannot negate ${a.type}`);
        }
        this.push({ type: 'number', value: -a.value });
        break;
      }
      
      case OpCode.OP_POW: {
        const b = this.pop();
        const a = this.pop();
        this.assertNumbers(a, b, '**');
        this.push({ type: 'number', value: Math.pow((a as any).value, (b as any).value) });
        break;
      }
      
      case OpCode.OP_EQ: {
        const b = this.pop();
        const a = this.pop();
        this.push({ type: 'boolean', value: this.isEqual(a, b) });
        break;
      }
      
      case OpCode.OP_NEQ: {
        const b = this.pop();
        const a = this.pop();
        this.push({ type: 'boolean', value: !this.isEqual(a, b) });
        break;
      }
      
      case OpCode.OP_LT: {
        const b = this.pop();
        const a = this.pop();
        this.assertNumbers(a, b, '<');
        this.push({ type: 'boolean', value: (a as any).value < (b as any).value });
        break;
      }
      
      case OpCode.OP_LTE: {
        const b = this.pop();
        const a = this.pop();
        this.assertNumbers(a, b, '<=');
        this.push({ type: 'boolean', value: (a as any).value <= (b as any).value });
        break;
      }
      
      case OpCode.OP_GT: {
        const b = this.pop();
        const a = this.pop();
        this.assertNumbers(a, b, '>');
        this.push({ type: 'boolean', value: (a as any).value > (b as any).value });
        break;
      }
      
      case OpCode.OP_GTE: {
        const b = this.pop();
        const a = this.pop();
        this.assertNumbers(a, b, '>=');
        this.push({ type: 'boolean', value: (a as any).value >= (b as any).value });
        break;
      }
      
      case OpCode.OP_NOT: {
        const a = this.pop();
        this.push({ type: 'boolean', value: !this.isTruthy(a) });
        break;
      }
      
      case OpCode.OP_AND: {
        const b = this.pop();
        const a = this.pop();
        this.push(this.isTruthy(a) ? b : a);
        break;
      }
      
      case OpCode.OP_OR: {
        const b = this.pop();
        const a = this.pop();
        this.push(this.isTruthy(a) ? a : b);
        break;
      }
      
      case OpCode.OP_JMP: {
        frame.ip = operands[0];
        break;
      }
      
      case OpCode.OP_JMP_IF_FALSE: {
        const condition = this.pop();
        if (!this.isTruthy(condition)) {
          frame.ip = operands[0];
        }
        break;
      }
      
      case OpCode.OP_JMP_IF_TRUE: {
        const condition = this.pop();
        if (this.isTruthy(condition)) {
          frame.ip = operands[0];
        }
        break;
      }
      
      case OpCode.OP_LOOP: {
        frame.ip -= operands[0];
        break;
      }
      
      case OpCode.OP_CALL: {
        const argCount = operands[0];
        const callee = this.peek(argCount);
        this.callValue(callee, argCount);
        break;
      }
      
      case OpCode.OP_RET: {
        const result = this.pop();
        
        // Close upvalues
        this.closeUpvalues(frame.stackBase);
        
        // Pop the frame
        this.state.frames.pop();
        
        // Pop function and arguments from stack
        while (this.state.stack.length > frame.stackBase) {
          this.pop();
        }
        
        // Push return value
        this.push(result);
        
        if (this.state.frames.length === 0) {
          this.state.halted = true;
        }
        break;
      }
      
      case OpCode.OP_MAKE_CLOSURE: {
        const funcIndex = operands[0];
        const func = chunk.constants[funcIndex] as { type: 'function'; value: SebianFunction };
        const upvalueCount = operands[1];
        
        const upvalues: Upvalue[] = [];
        for (let i = 0; i < upvalueCount; i++) {
          const isLocal = operands[2 + i * 2] === 1;
          const index = operands[3 + i * 2];
          
          if (isLocal) {
            upvalues.push(this.captureUpvalue(frame.stackBase + index));
          } else {
            upvalues.push(frame.closure.upvalues[index]);
          }
        }
        
        const closure: SebianClosure = {
          function: func.value,
          upvalues,
        };
        
        this.push({ type: 'closure', value: closure });
        break;
      }
      
      case OpCode.OP_MAKE_ARRAY: {
        const count = operands[0];
        const elements: SebianValue[] = [];
        for (let i = 0; i < count; i++) {
          elements.unshift(this.pop());
        }
        this.push({ type: 'array', value: elements });
        break;
      }
      
      case OpCode.OP_MAKE_OBJECT: {
        const count = operands[0];
        const obj = new Map<string, SebianValue>();
        for (let i = 0; i < count; i++) {
          const value = this.pop();
          const key = this.pop();
          if (key.type !== 'string') {
            throw new Error('Object key must be a string');
          }
          obj.set(key.value, value);
        }
        this.push({ type: 'object', value: obj });
        break;
      }
      
      case OpCode.OP_UI_CREATE_NODE: {
        if (!this.hasCapability('ui')) {
          throw new Error('UI capability not enabled');
        }
        const nodeType = this.getConstantString(chunk, operands[0]);
        const node: SebianUINode = {
          id: this.generateUID(),
          type: nodeType,
          props: new Map(),
          children: [],
          eventHandlers: new Map(),
          parent: null,
        };
        this.push({ type: 'ui_node', value: node });
        break;
      }
      
      case OpCode.OP_UI_SET_PROP: {
        if (!this.hasCapability('ui')) {
          throw new Error('UI capability not enabled');
        }
        const propName = this.getConstantString(chunk, operands[0]);
        const value = this.pop();
        const node = this.pop();
        if (node.type !== 'ui_node') {
          throw new Error('Expected UI node');
        }
        node.value.props.set(propName, value);
        this.push(node);
        break;
      }
      
      case OpCode.OP_UI_BIND_EVENT: {
        if (!this.hasCapability('ui')) {
          throw new Error('UI capability not enabled');
        }
        const eventName = this.getConstantString(chunk, operands[0]);
        const handler = this.pop();
        const node = this.pop();
        if (node.type !== 'ui_node') {
          throw new Error('Expected UI node');
        }
        if (handler.type !== 'closure') {
          throw new Error('Event handler must be a function');
        }
        node.value.eventHandlers.set(eventName, handler.value);
        this.push(node);
        break;
      }
      
      case OpCode.OP_UI_APPEND: {
        if (!this.hasCapability('ui')) {
          throw new Error('UI capability not enabled');
        }
        const child = this.pop();
        const parent = this.pop();
        if (parent.type !== 'ui_node' || child.type !== 'ui_node') {
          throw new Error('Expected UI nodes');
        }
        child.value.parent = parent.value;
        parent.value.children.push(child.value);
        this.push(parent);
        break;
      }
      
      case OpCode.OP_UI_RENDER: {
        if (!this.hasCapability('ui')) {
          throw new Error('UI capability not enabled');
        }
        const node = this.pop();
        if (node.type !== 'ui_node') {
          throw new Error('Expected UI node');
        }
        this.state.uiRoot = node.value;
        this.onUIUpdate?.(this.state.uiRoot);
        break;
      }
      
      case OpCode.OP_UI_CLONE: {
        if (!this.hasCapability('ui')) {
          throw new Error('UI capability not enabled');
        }
        const node = this.pop();
        if (node.type !== 'ui_node') {
          throw new Error('Expected UI node');
        }
        const cloned = this.cloneUINode(node.value);
        this.push({ type: 'ui_node', value: cloned });
        break;
      }
      
      case OpCode.OP_SYSCALL: {
        const syscallId = operands[0];
        const argCount = operands[1];
        const args: SebianValue[] = [];
        for (let i = 0; i < argCount; i++) {
          args.unshift(this.pop());
        }
        const result = executeSyscall(syscallId, args, this);
        if (!result.success) {
          throw new Error(result.error ?? 'Syscall failed');
        }
        this.push(result.value ?? { type: 'null' });
        break;
      }
      
      case OpCode.OP_IMPORT_MODULE: {
        const moduleName = this.getConstantString(chunk, operands[0]);
        const mod = this.state.modules.get(moduleName);
        if (!mod) {
          throw new Error(`Module not found: ${moduleName}`);
        }
        this.push({ type: 'module', value: mod });
        break;
      }
      
      case OpCode.OP_PRINT: {
        const value = this.pop();
        const output = this.toString(value);
        this.onOutput?.(output);
        console.log('[Sebian]', output);
        break;
      }
      
      case OpCode.OP_HALT: {
        this.state.halted = true;
        break;
      }
      
      case OpCode.OP_BREAKPOINT: {
        this.state.paused = true;
        break;
      }
      
      case OpCode.OP_NOP: {
        // Do nothing
        break;
      }
      
      default:
        throw new Error(`Unknown opcode: 0x${opcode.toString(16)}`);
    }
  }

  private push(value: SebianValue): void {
    this.state.stack.push(value);
  }

  private pop(): SebianValue {
    if (this.state.stack.length === 0) {
      throw new Error('Stack underflow');
    }
    return this.state.stack.pop()!;
  }

  private peek(distance: number): SebianValue {
    return this.state.stack[this.state.stack.length - 1 - distance];
  }

  private getConstantString(chunk: Chunk, index: number): string {
    const constant = chunk.constants[index];
    if (constant.type !== 'string') {
      throw new Error('Expected string constant');
    }
    return constant.value;
  }

  private assertNumbers(a: SebianValue, b: SebianValue, op: string): void {
    if (a.type !== 'number' || b.type !== 'number') {
      throw new Error(`Cannot perform '${op}' on ${a.type} and ${b.type}`);
    }
  }

  private isEqual(a: SebianValue, b: SebianValue): boolean {
    if (a.type !== b.type) return false;
    if (a.type === 'null') return true;
    if (a.type === 'boolean') return a.value === (b as any).value;
    if (a.type === 'number') return a.value === (b as any).value;
    if (a.type === 'string') return a.value === (b as any).value;
    return a === b; // Reference equality for objects
  }

  private isTruthy(value: SebianValue): boolean {
    if (value.type === 'null') return false;
    if (value.type === 'boolean') return value.value;
    if (value.type === 'number') return value.value !== 0;
    if (value.type === 'string') return value.value.length > 0;
    return true;
  }

  private toString(value: SebianValue): string {
    switch (value.type) {
      case 'null': return 'null';
      case 'boolean': return value.value ? 'true' : 'false';
      case 'number': return String(value.value);
      case 'string': return value.value;
      case 'array': return '[' + value.value.map(v => this.toString(v)).join(', ') + ']';
      case 'object': {
        const entries = Array.from(value.value.entries());
        return '{' + entries.map(([k, v]) => `${k}: ${this.toString(v)}`).join(', ') + '}';
      }
      case 'function': return `<fn ${value.value.name}>`;
      case 'closure': return `<closure ${value.value.function.name}>`;
      case 'native': return '<native fn>';
      case 'ui_node': return `<ui:${value.value.type} id="${value.value.id}">`;
      case 'module': return `<module ${value.value.name}>`;
    }
  }

  private callValue(callee: SebianValue, argCount: number): void {
    if (callee.type === 'closure') {
      this.callClosure(callee.value, argCount);
    } else if (callee.type === 'native') {
      const args: SebianValue[] = [];
      for (let i = 0; i < argCount; i++) {
        args.unshift(this.pop());
      }
      this.pop(); // Pop the function itself
      const result = callee.value(args, this);
      this.push(result);
    } else {
      throw new Error(`Cannot call ${callee.type}`);
    }
  }

  private callClosure(closure: SebianClosure, argCount: number): void {
    if (argCount !== closure.function.arity) {
      throw new Error(`Expected ${closure.function.arity} arguments but got ${argCount}`);
    }
    
    const frame: CallFrame = {
      closure,
      ip: 0,
      stackBase: this.state.stack.length - argCount - 1,
      returnAddress: this.state.frames[this.state.frames.length - 1]?.ip ?? 0,
    };
    
    this.state.frames.push(frame);
  }

  private captureUpvalue(location: number): Upvalue {
    return {
      location,
      closed: null,
      isLocal: true,
    };
  }

  private closeUpvalues(last: number): void {
    // Close all upvalues that reference stack slots at or above 'last'
    for (const frame of this.state.frames) {
      for (const upvalue of frame.closure.upvalues) {
        if (upvalue.isLocal && upvalue.location >= last && upvalue.closed === null) {
          upvalue.closed = this.state.stack[upvalue.location];
          upvalue.isLocal = false;
        }
      }
    }
  }

  private cloneUINode(node: SebianUINode): SebianUINode {
    const cloned: SebianUINode = {
      id: this.generateUID(),
      type: node.type,
      props: new Map(node.props),
      children: [],
      eventHandlers: new Map(node.eventHandlers),
      parent: null,
    };
    
    for (const child of node.children) {
      const clonedChild = this.cloneUINode(child);
      clonedChild.parent = cloned;
      cloned.children.push(clonedChild);
    }
    
    return cloned;
  }

  private generateUID(): string {
    return 'seb_' + Math.random().toString(36).substr(2, 9);
  }

  private checkBreakpoint(frame: CallFrame, line: number): boolean {
    if (!this.debug.stepping && this.debug.breakpoints.length === 0) {
      return false;
    }
    
    if (this.debug.stepping) {
      return true;
    }
    
    const file = frame.closure.function.name;
    return this.debug.breakpoints.some(bp => 
      bp.enabled && bp.line === line && (bp.file === file || bp.file === '*')
    );
  }

  private processEventQueue(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      this.callClosure(event.handler, event.args.length);
      for (const arg of event.args) {
        this.push(arg);
      }
      this.execute();
    }
  }

  // Garbage collector
  private collectGarbage(): void {
    // Mark phase
    for (const obj of this.state.heap) {
      obj.marked = false;
    }
    
    // Mark from roots (stack, globals)
    for (const value of this.state.stack) {
      this.markValue(value);
    }
    
    for (const value of this.state.globals.values()) {
      this.markValue(value);
    }
    
    // Sweep phase
    this.state.heap = this.state.heap.filter(obj => obj.marked);
  }

  private markValue(value: SebianValue): void {
    // Mark objects reachable from this value
    if (value.type === 'array') {
      for (const elem of value.value) {
        this.markValue(elem);
      }
    } else if (value.type === 'object') {
      for (const elem of value.value.values()) {
        this.markValue(elem);
      }
    }
  }

  // Public API
  setOutputHandler(handler: (message: string) => void): void {
    this.onOutput = handler;
  }

  setUIUpdateHandler(handler: (root: SebianUINode | null) => void): void {
    this.onUIUpdate = handler;
  }

  setStateChangeHandler(handler: (state: VMState) => void): void {
    this.onStateChange = handler;
  }

  setBreakpointHandler(handler: (frame: CallFrame, line: number) => void): void {
    this.onBreakpoint = handler;
  }

  getState(): VMState {
    return { ...this.state };
  }

  pause(): void {
    this.state.paused = true;
  }

  resume(): void {
    if (this.state.paused) {
      this.state.paused = false;
      this.execute();
    }
  }

  step(): void {
    if (this.state.paused) {
      this.debug.stepping = true;
      this.state.paused = false;
      this.execute();
      this.debug.stepping = false;
    }
  }

  reset(): void {
    this.state = this.createInitialState();
    this.loadStandardLibrary();
  }

  addBreakpoint(file: string, line: number): void {
    this.debug.breakpoints.push({ file, line, enabled: true });
  }

  removeBreakpoint(file: string, line: number): void {
    this.debug.breakpoints = this.debug.breakpoints.filter(
      bp => !(bp.file === file && bp.line === line)
    );
  }

  getBreakpoints(): Breakpoint[] {
    return [...this.debug.breakpoints];
  }

  dispatchUIEvent(nodeId: string, eventName: string, eventData: SebianValue): void {
    const node = this.findUINode(this.state.uiRoot, nodeId);
    if (node && node.eventHandlers.has(eventName)) {
      const handler = node.eventHandlers.get(eventName)!;
      this.eventQueue.push({ handler, args: [eventData] });
      if (!this.state.paused) {
        this.processEventQueue();
      }
    }
  }

  private findUINode(node: SebianUINode | null, id: string): SebianUINode | null {
    if (!node) return null;
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = this.findUINode(child, id);
      if (found) return found;
    }
    return null;
  }

  // Allocate on heap
  allocate(value: SebianValue): number {
    const id = this.heapIdCounter++;
    this.state.heap.push({ id, value, marked: false, refCount: 1 });
    
    if (this.state.heap.length > this.sandbox.maxHeapSize) {
      this.collectGarbage();
      if (this.state.heap.length > this.sandbox.maxHeapSize) {
        throw new Error('Heap overflow');
      }
    }
    
    return id;
  }
}
