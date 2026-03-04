import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Check, Cpu, Library, Terminal, FileCode, Package, HardDrive, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function DownloadSebianPanel() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const buildRuntime = (): string => {
    return `// ================================================
// SebianVM Runtime v1.0.0
// Standalone Runtime Environment
// Generated: ${new Date().toISOString()}
// ================================================
// 
// This is the official Sebian Virtual Machine runtime.
// Use it to run .seb, .sebc, .sebf, .exe, and .dll files.
//
// USAGE:
//   node sebianvm-runtime.js <file>
//
// SUPPORTED FILES:
//   .seb   - Sebian source code (compiled + executed)
//   .sebc  - Compiled bytecode (executed directly)
//   .sebf  - Sebian executable (self-contained)
//   .exe   - Sebian PE executable (extracts + runs bytecode)
//   .dll   - Sebian dynamic library (loads exports)
//
// ================================================

const fs = require('fs');
const path = require('path');

// ---- Minimal Sebian VM Core ----
class SebianVM {
  constructor() {
    this.stack = [];
    this.globals = new Map();
    this.frames = [];
    this.halted = false;
    this.outputHandler = console.log;
    this.modules = new Map();
    this._initStdlib();
  }

  setOutputHandler(fn) { this.outputHandler = fn; }

  _initStdlib() {
    // Core builtins
    this.globals.set('print', { type: 'native', value: (args) => {
      const msg = args.map(a => this._toString(a)).join(' ');
      this.outputHandler(msg);
      return { type: 'null' };
    }});
    this.globals.set('len', { type: 'native', value: (args) => {
      const v = args[0];
      if (v.type === 'string') return { type: 'number', value: v.value.length };
      if (v.type === 'array') return { type: 'number', value: v.value.length };
      return { type: 'number', value: 0 };
    }});
    this.globals.set('str', { type: 'native', value: (args) => {
      return { type: 'string', value: this._toString(args[0]) };
    }});
    this.globals.set('num', { type: 'native', value: (args) => {
      return { type: 'number', value: Number(this._toString(args[0])) || 0 };
    }});
    this.globals.set('type', { type: 'native', value: (args) => {
      return { type: 'string', value: args[0]?.type || 'null' };
    }});
    // Math
    this.globals.set('abs', { type: 'native', value: (args) => ({ type: 'number', value: Math.abs(args[0]?.value || 0) }) });
    this.globals.set('floor', { type: 'native', value: (args) => ({ type: 'number', value: Math.floor(args[0]?.value || 0) }) });
    this.globals.set('ceil', { type: 'native', value: (args) => ({ type: 'number', value: Math.ceil(args[0]?.value || 0) }) });
    this.globals.set('round', { type: 'native', value: (args) => ({ type: 'number', value: Math.round(args[0]?.value || 0) }) });
    this.globals.set('sqrt', { type: 'native', value: (args) => ({ type: 'number', value: Math.sqrt(args[0]?.value || 0) }) });
    this.globals.set('random', { type: 'native', value: () => ({ type: 'number', value: Math.random() }) });
  }

  _toString(v) {
    if (!v) return 'null';
    switch (v.type) {
      case 'null': return 'null';
      case 'boolean': return v.value ? 'true' : 'false';
      case 'number': return String(v.value);
      case 'string': return v.value;
      case 'array': return '[' + v.value.map(x => this._toString(x)).join(', ') + ']';
      case 'object': return '{object}';
      case 'function': case 'closure': return '<fn>';
      case 'native': return '<native fn>';
      default: return String(v.value || v.type);
    }
  }

  run(chunk) {
    if (!chunk || !chunk.code) throw new Error('Invalid bytecode chunk');
    const mainFn = { name: chunk.name || 'main', arity: 0, chunk, upvalueCount: 0 };
    const mainClosure = { function: mainFn, upvalues: [] };
    this.frames.push({ closure: mainClosure, ip: 0, stackBase: 0, returnAddress: 0 });
    this._execute();
  }

  _execute() {
    const MAX = 1000000;
    let count = 0;
    while (this.frames.length > 0 && !this.halted && count < MAX) {
      count++;
      const frame = this.frames[this.frames.length - 1];
      const chunk = frame.closure.function.chunk;
      if (frame.ip >= chunk.code.length) { this.frames.pop(); continue; }
      const instr = chunk.code[frame.ip++];
      this._dispatch(instr, frame, chunk);
    }
  }

  _dispatch(instr, frame, chunk) {
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
        if (a.type === 'string' || b.type === 'string') this.stack.push({ type: 'string', value: this._toString(a) + this._toString(b) });
        else this.stack.push({ type: 'number', value: (a.value || 0) + (b.value || 0) }); break; }
      case 0x31: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'number', value: (a.value || 0) - (b.value || 0) }); break; }
      case 0x32: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'number', value: (a.value || 0) * (b.value || 0) }); break; }
      case 0x33: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'number', value: (a.value || 0) / (b.value || 0) }); break; }
      case 0x34: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'number', value: (a.value || 0) % (b.value || 0) }); break; }
      case 0x35: { const a = this.stack.pop(); this.stack.push({ type: 'number', value: -(a.value || 0) }); break; }
      case 0x40: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'boolean', value: this._toString(a) === this._toString(b) }); break; }
      case 0x41: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'boolean', value: this._toString(a) !== this._toString(b) }); break; }
      case 0x42: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'boolean', value: (a.value || 0) < (b.value || 0) }); break; }
      case 0x43: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'boolean', value: (a.value || 0) <= (b.value || 0) }); break; }
      case 0x44: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'boolean', value: (a.value || 0) > (b.value || 0) }); break; }
      case 0x45: { const b = this.stack.pop(), a = this.stack.pop(); this.stack.push({ type: 'boolean', value: (a.value || 0) >= (b.value || 0) }); break; }
      case 0x50: { const a = this.stack.pop(); this.stack.push({ type: 'boolean', value: !this._isTruthy(a) }); break; }
      case 0x60: frame.ip = instr.operands[0]; break;
      case 0x61: { const cond = this.stack.pop(); if (!this._isTruthy(cond)) frame.ip = instr.operands[0]; break; }
      case 0x62: { const cond = this.stack.pop(); if (this._isTruthy(cond)) frame.ip = instr.operands[0]; break; }
      case 0x63: frame.ip = instr.operands[0]; break;
      case 0x70: {
        const argCount = instr.operands[0];
        const args = [];
        for (let i = 0; i < argCount; i++) args.unshift(this.stack.pop());
        const fn = this.stack.pop();
        if (fn.type === 'native') { this.stack.push(fn.value(args, this)); }
        else if (fn.type === 'closure') {
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
        const count = instr.operands[0];
        const items = [];
        for (let i = 0; i < count; i++) items.unshift(this.stack.pop());
        this.stack.push({ type: 'array', value: items }); break;
      }
      case 0xA3: {
        const val = this.stack.pop();
        this.outputHandler(this._toString(val)); break;
      }
      case 0xAF: this.halted = true; break;
      default: break;
    }
  }

  _isTruthy(v) {
    if (!v) return false;
    if (v.type === 'null') return false;
    if (v.type === 'boolean') return v.value;
    if (v.type === 'number') return v.value !== 0;
    if (v.type === 'string') return v.value.length > 0;
    return true;
  }

  loadDll(dllData) {
    if (dllData.magic !== 'SDLL') throw new Error('Invalid DLL format');
    const vm = new SebianVM();
    vm.run(dllData.bytecode);
    const exports = {};
    for (const exp of dllData.export_table) {
      const val = vm.globals.get(exp.name);
      if (val) { exports[exp.name] = val; this.globals.set(exp.name, val); }
    }
    this.modules.set(dllData.name, { name: dllData.name, exports: new Map(Object.entries(exports)), loaded: true });
    return exports;
  }
}

// ---- Sebian Compiler (Minimal) ----
// For full compilation, use the SDK compiler
class SebianCompiler {
  compile(source) {
    // This is a minimal bootstrap compiler
    // For full compilation use sebianc.js from the SDK
    throw new Error('Use the full SDK compiler (sebianc.js) for source compilation. This runtime only executes pre-compiled bytecode (.sebc, .sebf, .exe).');
  }
}

// ---- File Runner ----
function run(filePath) {
  const content = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const vm = new SebianVM();

  switch (ext) {
    case '.sebc': {
      const chunk = JSON.parse(content.toString('utf-8'));
      console.log('[SebianVM] Running compiled bytecode...');
      vm.run(chunk);
      console.log('[SebianVM] Done.');
      break;
    }
    case '.sebf': {
      const sebf = JSON.parse(content.toString('utf-8'));
      if (sebf.magic !== 'SEBF') throw new Error('Invalid .sebf file');
      console.log(\`[SebianVM] Running SEBF v\${sebf.version} (compiled \${sebf.compiled_at})\`);
      vm.run(sebf.bytecode);
      console.log('[SebianVM] Done.');
      break;
    }
    case '.exe': {
      // Parse PE and extract .data section containing SEBX payload
      const buf = content;
      // Find SEBX marker in binary
      const str = buf.toString('utf-8', 0, buf.length);
      const sebxStart = str.indexOf('{"magic":"SEBX"');
      if (sebxStart === -1) throw new Error('No SEBX payload found in .exe');
      // Find the end of JSON
      let depth = 0, end = sebxStart;
      for (let i = sebxStart; i < str.length; i++) {
        if (str[i] === '{') depth++;
        if (str[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
      }
      const sebx = JSON.parse(str.substring(sebxStart, end));
      console.log(\`[SebianVM] Running PE executable (runtime v\${sebx.runtime.vm_version})\`);
      vm.run(sebx.bytecode);
      console.log('[SebianVM] Done.');
      break;
    }
    case '.dll': {
      const dll = JSON.parse(content.toString('utf-8'));
      const exports = vm.loadDll(dll);
      console.log(\`[SebianVM] Loaded DLL: \${dll.name} v\${dll.version}\`);
      console.log(\`[SebianVM] Exports: \${Object.keys(exports).join(', ')}\`);
      break;
    }
    case '.seb': {
      console.error('[SebianVM] Cannot compile .seb source in runtime-only mode.');
      console.error('           Use the full SDK: node run-sebian.mjs <file.seb>');
      console.error('           Or compile first in Sebian Studio and use .sebc/.sebf/.exe');
      process.exit(1);
      break;
    }
    default:
      console.error(\`[SebianVM] Unsupported file type: \${ext}\`);
      process.exit(1);
  }
}

// ---- Entry Point ----
const file = process.argv[2];
if (!file) {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║       SebianVM Runtime v1.0.0        ║');
  console.log('  ╠══════════════════════════════════════╣');
  console.log('  ║                                      ║');
  console.log('  ║  Usage:                              ║');
  console.log('  ║    node sebianvm-runtime.js <file>    ║');
  console.log('  ║                                      ║');
  console.log('  ║  Supported:                          ║');
  console.log('  ║    .sebc  Compiled bytecode           ║');
  console.log('  ║    .sebf  Sebian executable           ║');
  console.log('  ║    .exe   PE executable               ║');
  console.log('  ║    .dll   Dynamic library             ║');
  console.log('  ║                                      ║');
  console.log('  ║  For .seb source, use the full SDK    ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  process.exit(0);
}

if (!fs.existsSync(file)) {
  console.error(\`[SebianVM] File not found: \${file}\`);
  process.exit(1);
}

run(file);
`;
  };

  const handleDownload = (id: string, filename: string, content: string, mime: string) => {
    setDownloading(id);
    downloadBlob(new Blob([content], { type: mime }), filename);
    toast.success(`Downloaded ${filename}`);
    setTimeout(() => setDownloading(null), 1500);
  };

  const runtimeContent = buildRuntime();

  const installerBat = `@echo off
echo ============================================
echo   SebianVM Installer for Windows
echo ============================================
echo.

set INSTALL_DIR=%USERPROFILE%\\.sebian
mkdir "%INSTALL_DIR%" 2>nul

echo Installing SebianVM runtime to %INSTALL_DIR%...
copy /Y sebianvm-runtime.js "%INSTALL_DIR%\\sebianvm-runtime.js" >nul

echo Creating sebian.bat launcher...
(
echo @echo off
echo node "%INSTALL_DIR%\\sebianvm-runtime.js" %%*
) > "%INSTALL_DIR%\\sebian.bat"

echo Adding to PATH...
setx PATH "%PATH%;%INSTALL_DIR%" >nul 2>&1

echo.
echo ============================================
echo   Installation complete!
echo   Run: sebian yourfile.exe
echo ============================================
pause
`;

  const installerSh = `#!/bin/bash
echo "============================================"
echo "  SebianVM Installer for macOS / Linux"
echo "============================================"
echo ""

INSTALL_DIR="$HOME/.sebian"
mkdir -p "$INSTALL_DIR"

echo "Installing SebianVM runtime to $INSTALL_DIR..."
cp sebianvm-runtime.js "$INSTALL_DIR/sebianvm-runtime.js"

echo "Creating sebian launcher..."
cat > "$INSTALL_DIR/sebian" << 'LAUNCHER'
#!/bin/bash
node "$HOME/.sebian/sebianvm-runtime.js" "$@"
LAUNCHER
chmod +x "$INSTALL_DIR/sebian"

# Add to PATH
if ! grep -q '.sebian' "$HOME/.bashrc" 2>/dev/null; then
  echo 'export PATH="$HOME/.sebian:$PATH"' >> "$HOME/.bashrc"
fi
if ! grep -q '.sebian' "$HOME/.zshrc" 2>/dev/null; then
  echo 'export PATH="$HOME/.sebian:$PATH"' >> "$HOME/.zshrc"
fi

echo ""
echo "============================================"
echo "  Installation complete!"
echo "  Restart your terminal, then run:"
echo "    sebian yourfile.exe"
echo "============================================"
`;

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Download Sebian</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Runtime, installers & tools</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Runtime */}
          <div className="bg-accent/20 rounded-lg p-3 border border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">SebianVM Runtime</span>
              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">CORE</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              The standalone Sebian VM. Required to run .exe, .dll, .sebc, and .sebf files outside of Sebian Studio. Powered by Node.js.
            </p>
            <Button
              size="sm"
              className="w-full"
              onClick={() => handleDownload('runtime', 'sebianvm-runtime.js', runtimeContent, 'application/javascript')}
            >
              {downloading === 'runtime' ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
              Download sebianvm-runtime.js
            </Button>
          </div>

          {/* Windows Installer */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Windows Installer</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              One-click installer for Windows. Installs the runtime and adds <code className="bg-secondary px-1 rounded">sebian</code> to your PATH.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => handleDownload('win', 'install-sebian.bat', installerBat, 'application/bat')}
            >
              {downloading === 'win' ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
              Download install-sebian.bat
            </Button>
          </div>

          {/* macOS/Linux Installer */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">macOS / Linux Installer</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Shell script installer. Run <code className="bg-secondary px-1 rounded">bash install-sebian.sh</code> to install.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => handleDownload('unix', 'install-sebian.sh', installerSh, 'application/x-sh')}
            >
              {downloading === 'unix' ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
              Download install-sebian.sh
            </Button>
          </div>

          {/* How it works */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">How .exe files work</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1.5">
              <p>When you build a <strong>.exe</strong> in the Deploy tab, Sebian generates a <strong>real PE binary</strong> with:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                <li>Valid MZ/PE Windows headers</li>
                <li>Compiled bytecode in the .data section</li>
                <li>SEBX payload with runtime metadata</li>
              </ul>
              <p className="mt-2">To run your .exe:</p>
              <div className="bg-background rounded p-2 font-mono mt-1 border border-border">
                <p>1. Download the runtime above</p>
                <p>2. Run the installer (or manual setup)</p>
                <p>3. <code>sebian project.exe</code></p>
              </div>
              <p className="mt-2">The runtime parses the PE, extracts the SEBX bytecode payload, and executes it in SebianVM — just like a real executable.</p>
            </div>
          </div>

          {/* Supported files */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Runtime supports:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li><strong>.exe</strong> — PE executables with SEBX payload</li>
              <li><strong>.dll</strong> — Dynamic libraries with export tables</li>
              <li><strong>.sebf</strong> — Self-contained executables</li>
              <li><strong>.sebc</strong> — Raw compiled bytecode</li>
            </ul>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
