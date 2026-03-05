import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimal Sebian VM for server-side execution
class SebianVM {
  stack: any[] = [];
  globals: Map<string, any> = new Map();
  frames: any[] = [];
  halted = false;
  output: string[] = [];
  instructionCount = 0;
  maxInstructions = 5000000;

  constructor() {
    this._initStdlib();
  }

  _initStdlib() {
    this.globals.set('print', { type: 'native', value: (args: any[]) => {
      const msg = args.map((a: any) => this._toString(a)).join(' ');
      this.output.push(msg);
      return { type: 'null' };
    }});
    this.globals.set('len', { type: 'native', value: (args: any[]) => {
      const v = args[0];
      if (v?.type === 'string') return { type: 'number', value: v.value.length };
      if (v?.type === 'array') return { type: 'number', value: v.value.length };
      return { type: 'number', value: 0 };
    }});
    this.globals.set('str', { type: 'native', value: (args: any[]) => ({ type: 'string', value: this._toString(args[0]) }) });
    this.globals.set('num', { type: 'native', value: (args: any[]) => ({ type: 'number', value: Number(this._toString(args[0])) || 0 }) });
    this.globals.set('type', { type: 'native', value: (args: any[]) => ({ type: 'string', value: args[0]?.type || 'null' }) });
    this.globals.set('abs', { type: 'native', value: (args: any[]) => ({ type: 'number', value: Math.abs(args[0]?.value || 0) }) });
    this.globals.set('floor', { type: 'native', value: (args: any[]) => ({ type: 'number', value: Math.floor(args[0]?.value || 0) }) });
    this.globals.set('ceil', { type: 'native', value: (args: any[]) => ({ type: 'number', value: Math.ceil(args[0]?.value || 0) }) });
    this.globals.set('round', { type: 'native', value: (args: any[]) => ({ type: 'number', value: Math.round(args[0]?.value || 0) }) });
    this.globals.set('sqrt', { type: 'native', value: (args: any[]) => ({ type: 'number', value: Math.sqrt(args[0]?.value || 0) }) });
    this.globals.set('random', { type: 'native', value: () => ({ type: 'number', value: Math.random() }) });
    this.globals.set('range', { type: 'native', value: (args: any[]) => {
      if (!args[0] || args[0].type !== 'number') return { type: 'array', value: [] };
      const end = args[0].value;
      const start = args.length > 1 && args[1]?.type === 'number' ? args[1].value : 0;
      const result: any[] = [];
      for (let i = start; i < end; i++) result.push({ type: 'number', value: i });
      return { type: 'array', value: result };
    }});
  }

  _toString(v: any): string {
    if (!v) return 'null';
    switch (v.type) {
      case 'null': return 'null';
      case 'boolean': return v.value ? 'true' : 'false';
      case 'number': return String(v.value);
      case 'string': return v.value;
      case 'array': return '[' + v.value.map((x: any) => this._toString(x)).join(', ') + ']';
      case 'object': return '{object}';
      case 'function': case 'closure': return '<fn>';
      case 'native': return '<native fn>';
      default: return String(v.value || v.type);
    }
  }

  _isTruthy(v: any): boolean {
    if (!v || v.type === 'null') return false;
    if (v.type === 'boolean') return v.value;
    if (v.type === 'number') return v.value !== 0;
    if (v.type === 'string') return v.value.length > 0;
    return true;
  }

  run(chunk: any) {
    if (!chunk?.code) throw new Error('Invalid bytecode chunk');
    const mainFn = { name: chunk.name || 'main', arity: 0, chunk, upvalueCount: 0 };
    const mainClosure = { function: mainFn, upvalues: [] };
    this.frames.push({ closure: mainClosure, ip: 0, stackBase: 0, returnAddress: 0 });
    this._execute();
  }

  _execute() {
    while (this.frames.length > 0 && !this.halted && this.instructionCount < this.maxInstructions) {
      this.instructionCount++;
      const frame = this.frames[this.frames.length - 1];
      const chunk = frame.closure.function.chunk;
      if (frame.ip >= chunk.code.length) { this.frames.pop(); continue; }
      const instr = chunk.code[frame.ip++];
      this._dispatch(instr, frame, chunk);
    }
    if (this.instructionCount >= this.maxInstructions) {
      this.output.push('[SebianVM] Execution limit reached (' + this.maxInstructions + ' instructions)');
    }
  }

  _dispatch(instr: any, frame: any, chunk: any) {
    const op = instr.opcode;
    switch (op) {
      case 0x01: this.stack.push(chunk.constants[instr.operands[0]]); break;
      case 0x02: this.stack.pop(); break;
      case 0x03: this.stack.push(this.stack[this.stack.length - 1]); break;
      case 0x10: {
        const name = chunk.constants[instr.operands[0]];
        const key = name.type === 'string' ? name.value : String(name.value);
        this.stack.push(this.globals.get(key) || { type: 'null' });
        break;
      }
      case 0x11: {
        const name = chunk.constants[instr.operands[0]];
        const key = name.type === 'string' ? name.value : String(name.value);
        this.globals.set(key, this.stack[this.stack.length - 1]);
        break;
      }
      case 0x12: this.stack.push(this.stack[frame.stackBase + instr.operands[0]] || { type: 'null' }); break;
      case 0x13: this.stack[frame.stackBase + instr.operands[0]] = this.stack[this.stack.length - 1]; break;
      case 0x30: { const b = this.stack.pop(), a = this.stack.pop();
        if (a?.type === 'string' || b?.type === 'string') this.stack.push({ type: 'string', value: this._toString(a) + this._toString(b) });
        else this.stack.push({ type: 'number', value: (a?.value || 0) + (b?.value || 0) }); break; }
      case 0x31: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'number', value: (a?.value || 0) - (b?.value || 0) }); break; }
      case 0x32: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'number', value: (a?.value || 0) * (b?.value || 0) }); break; }
      case 0x33: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'number', value: (a?.value || 0) / (b?.value || 0) }); break; }
      case 0x34: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'number', value: (a?.value || 0) % (b?.value || 0) }); break; }
      case 0x35: { const a = this.stack.pop(); this.stack.push({ type: 'number', value: -(a?.value || 0) }); break; }
      case 0x40: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'boolean', value: this._toString(a) === this._toString(b) }); break; }
      case 0x41: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'boolean', value: this._toString(a) !== this._toString(b) }); break; }
      case 0x42: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'boolean', value: (a?.value || 0) < (b?.value || 0) }); break; }
      case 0x43: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'boolean', value: (a?.value || 0) <= (b?.value || 0) }); break; }
      case 0x44: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'boolean', value: (a?.value || 0) > (b?.value || 0) }); break; }
      case 0x45: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'boolean', value: (a?.value || 0) >= (b?.value || 0) }); break; }
      case 0x50: { const a = this.stack.pop(); this.stack.push({ type: 'boolean', value: !this._isTruthy(a) }); break; }
      case 0x60: frame.ip = instr.operands[0]; break;
      case 0x61: { const cond = this.stack.pop(); if (!this._isTruthy(cond)) frame.ip = instr.operands[0]; break; }
      case 0x62: { const cond = this.stack.pop(); if (this._isTruthy(cond)) frame.ip = instr.operands[0]; break; }
      case 0x63: frame.ip = instr.operands[0]; break;
      case 0x70: {
        const argCount = instr.operands[0];
        const args: any[] = [];
        for (let i = 0; i < argCount; i++) args.unshift(this.stack.pop());
        const fn = this.stack.pop();
        if (fn?.type === 'native') { this.stack.push(fn.value(args, this)); }
        else if (fn?.type === 'closure') {
          const newFrame = { closure: fn.value, ip: 0, stackBase: this.stack.length, returnAddress: 0 };
          for (const arg of args) this.stack.push(arg);
          this.frames.push(newFrame);
        }
        break;
      }
      case 0x71: { const retVal = this.stack.length > frame.stackBase ? this.stack.pop() : { type: 'null' };
        while (this.stack.length > frame.stackBase) this.stack.pop();
        this.stack.push(retVal); this.frames.pop(); break; }
      case 0x80: {
        const count = instr.operands[0]; const items: any[] = [];
        for (let i = 0; i < count; i++) items.unshift(this.stack.pop());
        this.stack.push({ type: 'array', value: items }); break;
      }
      case 0xA3: { const val = this.stack.pop(); this.output.push(this._toString(val)); break; }
      case 0xAF: this.halted = true; break;
      default: break;
    }
  }
}

// Minimal compiler for server-side (same as client)
// We accept either source code or pre-compiled bytecode
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, bytecode, format } = await req.json();

    // If bytecode is provided, execute directly
    if (bytecode) {
      const vm = new SebianVM();
      const startTime = Date.now();
      vm.run(bytecode);
      const duration = Date.now() - startTime;

      return new Response(JSON.stringify({
        success: true,
        output: vm.output,
        instructions: vm.instructionCount,
        duration_ms: duration,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If source code provided, we need to compile first
    // For now, return an error suggesting pre-compilation
    if (code && format === 'source') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Server-side compilation not yet supported. Please compile in the IDE first and send bytecode.',
        hint: 'Use the Deploy tab to compile your code, then send the bytecode JSON to this endpoint.',
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Provide either "bytecode" (compiled chunk) or "code" with format:"source"',
      usage: {
        endpoint: 'POST /sebian-execute',
        body: {
          bytecode: '{ compiled chunk object from .sebc file }',
        },
        response: {
          success: true,
          output: ['lines of output'],
          instructions: 12345,
          duration_ms: 42,
        },
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: message,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
