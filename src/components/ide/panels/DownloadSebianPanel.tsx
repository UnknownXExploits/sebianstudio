import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Check, Cpu, Terminal, FileCode, HardDrive, Shield, Globe } from 'lucide-react';
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

  const handleDownload = (id: string, filename: string, content: string, mime: string) => {
    setDownloading(id);
    downloadBlob(new Blob([content], { type: mime }), filename);
    toast.success(`Downloaded ${filename}`);
    setTimeout(() => setDownloading(null), 1500);
  };

  // Self-contained HTML runtime - NO Node.js required
  const buildHtmlRuntime = (): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SebianVM Runtime v2.0</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #0a0a0f; color: #e0e0e0; min-height: 100vh; display: flex; flex-direction: column; }
  .header { background: #111118; border-bottom: 1px solid #2a2a35; padding: 12px 20px; display: flex; align-items: center; gap: 12px; }
  .header h1 { font-size: 18px; color: #22c55e; }
  .header span { font-size: 12px; color: #888; }
  .main { flex: 1; display: flex; gap: 0; }
  .sidebar { width: 280px; background: #111118; border-right: 1px solid #2a2a35; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .output-area { flex: 1; display: flex; flex-direction: column; }
  .output { flex: 1; padding: 16px; font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 13px; line-height: 1.6; overflow-y: auto; white-space: pre-wrap; }
  .output .line { padding: 2px 0; }
  .output .error { color: #ef4444; }
  .output .success { color: #22c55e; }
  .output .info { color: #3b82f6; }
  .output .warn { color: #f59e0b; }
  button { padding: 10px 16px; border: 1px solid #2a2a35; border-radius: 8px; background: #1a1a24; color: #e0e0e0; cursor: pointer; font-size: 13px; transition: all 0.15s; }
  button:hover { background: #22c55e; color: #0a0a0f; border-color: #22c55e; }
  button.primary { background: #22c55e; color: #0a0a0f; border-color: #22c55e; font-weight: 600; }
  button.primary:hover { background: #16a34a; }
  .drop-zone { border: 2px dashed #2a2a35; border-radius: 12px; padding: 30px; text-align: center; transition: all 0.2s; }
  .drop-zone.over { border-color: #22c55e; background: #22c55e10; }
  .drop-zone p { color: #888; font-size: 13px; margin-top: 8px; }
  input[type="file"] { display: none; }
  .status { padding: 8px 16px; background: #111118; border-top: 1px solid #2a2a35; font-size: 12px; color: #888; display: flex; justify-content: space-between; }
  .cmd-input { display: flex; gap: 8px; padding: 8px 16px; border-top: 1px solid #2a2a35; background: #0d0d14; }
  .cmd-input input { flex: 1; background: transparent; border: 1px solid #2a2a35; border-radius: 6px; padding: 8px 12px; color: #e0e0e0; font-family: monospace; font-size: 13px; outline: none; }
  .cmd-input input:focus { border-color: #22c55e; }
  @media (max-width: 768px) { .main { flex-direction: column; } .sidebar { width: 100%; border-right: none; border-bottom: 1px solid #2a2a35; } }
</style>
</head>
<body>
<div class="header">
  <h1>⚡ SebianVM</h1>
  <span>Runtime v2.0 — No installation needed</span>
</div>

<div class="main">
  <div class="sidebar">
    <div class="drop-zone" id="dropZone" onclick="document.getElementById('fileInput').click()">
      <div style="font-size: 32px;">📁</div>
      <p>Drop a file here or click to browse</p>
      <p style="font-size: 11px; margin-top: 4px;">.seb .sebc .sebf .exe .dll</p>
    </div>
    <input type="file" id="fileInput" accept=".seb,.sebc,.sebf,.exe,.dll" onchange="handleFile(this.files[0])" />
    <button class="primary" onclick="document.getElementById('fileInput').click()">📂 Open File</button>
    <button onclick="clearOutput()">🗑️ Clear Output</button>
    <div style="margin-top: auto; font-size: 11px; color: #666;">
      <p><strong>Supported:</strong></p>
      <p>• .exe — PE with SEBX payload</p>
      <p>• .dll — Dynamic library</p>
      <p>• .sebf — Self-contained executable</p>
      <p>• .sebc — Compiled bytecode</p>
      <p>• .seb — Source (not yet)</p>
    </div>
  </div>

  <div class="output-area">
    <div class="output" id="output">
<div class="line info">╔══════════════════════════════════════╗</div>
<div class="line info">║       SebianVM Runtime v2.0          ║</div>
<div class="line info">║   No Node.js required — runs here!  ║</div>
<div class="line info">╚══════════════════════════════════════╝</div>
<div class="line">Drop a .exe, .sebc, .sebf, or .dll file to run it.</div>
<div class="line">Or type a command below: <span class="info">sebian compile &lt;file&gt;</span></div>
    </div>
    <div class="cmd-input">
      <input id="cmdInput" placeholder="sebian run file.exe | sebian compile file.exe" onkeydown="if(event.key==='Enter')runCommand(this.value)" />
      <button onclick="runCommand(document.getElementById('cmdInput').value)">Run</button>
    </div>
  </div>
</div>

<div class="status">
  <span id="statusText">Ready</span>
  <span id="instrCount"></span>
</div>

<script>
// ═══════════ MINI SEBIAN VM (browser-native) ═══════════
class SebianVM {
  constructor() {
    this.stack = [];
    this.globals = new Map();
    this.frames = [];
    this.halted = false;
    this.output = [];
    this.instructionCount = 0;
    this.maxInstructions = 10000000;
    this._initStdlib();
  }

  _initStdlib() {
    const self = this;
    this.globals.set('print', { type: 'native', value: (args) => {
      const msg = args.map(a => self._toString(a)).join(' ');
      self.output.push(msg);
      return { type: 'null' };
    }});
    this.globals.set('len', { type: 'native', value: (args) => {
      const v = args[0];
      if (v?.type === 'string') return { type: 'number', value: v.value.length };
      if (v?.type === 'array') return { type: 'number', value: v.value.length };
      return { type: 'number', value: 0 };
    }});
    this.globals.set('str', { type: 'native', value: (args) => ({ type: 'string', value: self._toString(args[0]) }) });
    this.globals.set('num', { type: 'native', value: (args) => ({ type: 'number', value: Number(self._toString(args[0])) || 0 }) });
    this.globals.set('type', { type: 'native', value: (args) => ({ type: 'string', value: args[0]?.type || 'null' }) });
    this.globals.set('abs', { type: 'native', value: (args) => ({ type: 'number', value: Math.abs(args[0]?.value || 0) }) });
    this.globals.set('floor', { type: 'native', value: (args) => ({ type: 'number', value: Math.floor(args[0]?.value || 0) }) });
    this.globals.set('ceil', { type: 'native', value: (args) => ({ type: 'number', value: Math.ceil(args[0]?.value || 0) }) });
    this.globals.set('round', { type: 'native', value: (args) => ({ type: 'number', value: Math.round(args[0]?.value || 0) }) });
    this.globals.set('sqrt', { type: 'native', value: (args) => ({ type: 'number', value: Math.sqrt(args[0]?.value || 0) }) });
    this.globals.set('random', { type: 'native', value: () => ({ type: 'number', value: Math.random() }) });
    this.globals.set('range', { type: 'native', value: (args) => {
      if (!args[0] || args[0].type !== 'number') return { type: 'array', value: [] };
      const r = []; for (let i = 0; i < args[0].value; i++) r.push({ type: 'number', value: i });
      return { type: 'array', value: r };
    }});
  }

  _toString(v) {
    if (!v) return 'null';
    switch (v.type) {
      case 'null': return 'null';
      case 'boolean': return v.value ? 'true' : 'false';
      case 'number': return String(v.value);
      case 'string': return v.value;
      case 'array': return '[' + v.value.map(x => this._toString(x)).join(', ') + ']';
      default: return v.type;
    }
  }

  _isTruthy(v) {
    if (!v || v.type === 'null') return false;
    if (v.type === 'boolean') return v.value;
    if (v.type === 'number') return v.value !== 0;
    if (v.type === 'string') return v.value.length > 0;
    return true;
  }

  run(chunk) {
    if (!chunk?.code) throw new Error('Invalid bytecode');
    const mainFn = { name: chunk.name || 'main', arity: 0, chunk, upvalueCount: 0 };
    this.frames.push({ closure: { function: mainFn, upvalues: [] }, ip: 0, stackBase: 0 });
    this._execute();
  }

  _execute() {
    while (this.frames.length > 0 && !this.halted && this.instructionCount < this.maxInstructions) {
      this.instructionCount++;
      const f = this.frames[this.frames.length - 1];
      const c = f.closure.function.chunk;
      if (f.ip >= c.code.length) { this.frames.pop(); continue; }
      const i = c.code[f.ip++];
      this._op(i, f, c);
    }
  }

  _op(i, f, c) {
    const o = i.opcode;
    switch(o) {
      case 0x01: this.stack.push(c.constants[i.operands[0]]); break;
      case 0x02: this.stack.pop(); break;
      case 0x03: this.stack.push(this.stack[this.stack.length-1]); break;
      case 0x10: { const n=c.constants[i.operands[0]]; this.stack.push(this.globals.get(n.type==='string'?n.value:String(n.value))||{type:'null'}); break; }
      case 0x11: { const n=c.constants[i.operands[0]]; this.globals.set(n.type==='string'?n.value:String(n.value),this.stack[this.stack.length-1]); break; }
      case 0x12: this.stack.push(this.stack[f.stackBase+i.operands[0]]||{type:'null'}); break;
      case 0x13: this.stack[f.stackBase+i.operands[0]]=this.stack[this.stack.length-1]; break;
      case 0x30: { const b=this.stack.pop(),a=this.stack.pop();
        if(a?.type==='string'||b?.type==='string') this.stack.push({type:'string',value:this._toString(a)+this._toString(b)});
        else this.stack.push({type:'number',value:(a?.value||0)+(b?.value||0)}); break; }
      case 0x31: { const b=this.stack.pop(),a=this.stack.pop(); this.stack.push({type:'number',value:(a?.value||0)-(b?.value||0)}); break; }
      case 0x32: { const b=this.stack.pop(),a=this.stack.pop(); this.stack.push({type:'number',value:(a?.value||0)*(b?.value||0)}); break; }
      case 0x33: { const b=this.stack.pop(),a=this.stack.pop(); this.stack.push({type:'number',value:(a?.value||0)/(b?.value||0)}); break; }
      case 0x34: { const b=this.stack.pop(),a=this.stack.pop(); this.stack.push({type:'number',value:(a?.value||0)%(b?.value||0)}); break; }
      case 0x35: { const a=this.stack.pop(); this.stack.push({type:'number',value:-(a?.value||0)}); break; }
      case 0x40: { const b=this.stack.pop(),a=this.stack.pop(); this.stack.push({type:'boolean',value:this._toString(a)===this._toString(b)}); break; }
      case 0x41: { const b=this.stack.pop(),a=this.stack.pop(); this.stack.push({type:'boolean',value:this._toString(a)!==this._toString(b)}); break; }
      case 0x42: { const b=this.stack.pop(),a=this.stack.pop(); this.stack.push({type:'boolean',value:(a?.value||0)<(b?.value||0)}); break; }
      case 0x43: { const b=this.stack.pop(),a=this.stack.pop(); this.stack.push({type:'boolean',value:(a?.value||0)<=(b?.value||0)}); break; }
      case 0x44: { const b=this.stack.pop(),a=this.stack.pop(); this.stack.push({type:'boolean',value:(a?.value||0)>(b?.value||0)}); break; }
      case 0x45: { const b=this.stack.pop(),a=this.stack.pop(); this.stack.push({type:'boolean',value:(a?.value||0)>=(b?.value||0)}); break; }
      case 0x50: { const a=this.stack.pop(); this.stack.push({type:'boolean',value:!this._isTruthy(a)}); break; }
      case 0x60: f.ip=i.operands[0]; break;
      case 0x61: { if(!this._isTruthy(this.stack.pop())) f.ip=i.operands[0]; break; }
      case 0x62: { if(this._isTruthy(this.stack.pop())) f.ip=i.operands[0]; break; }
      case 0x63: f.ip=i.operands[0]; break;
      case 0x70: {
        const ac=i.operands[0],args=[];
        for(let j=0;j<ac;j++) args.unshift(this.stack.pop());
        const fn=this.stack.pop();
        if(fn?.type==='native') this.stack.push(fn.value(args,this));
        else if(fn?.type==='closure') { for(const a of args) this.stack.push(a); this.frames.push({closure:fn.value,ip:0,stackBase:this.stack.length-ac}); }
        break;
      }
      case 0x71: { const r=this.stack.length>f.stackBase?this.stack.pop():{type:'null'};
        while(this.stack.length>f.stackBase) this.stack.pop();
        this.stack.push(r); this.frames.pop(); break; }
      case 0x80: { const n=i.operands[0],items=[]; for(let j=0;j<n;j++) items.unshift(this.stack.pop()); this.stack.push({type:'array',value:items}); break; }
      case 0xA3: { const v=this.stack.pop(); this.output.push(this._toString(v)); break; }
      case 0xAF: this.halted=true; break;
    }
  }
}

// ═══════════ FILE HANDLING ═══════════
const output = document.getElementById('output');
const statusText = document.getElementById('statusText');
const instrCount = document.getElementById('instrCount');
let lastFile = null;

function log(msg, cls='') {
  const div = document.createElement('div');
  div.className = 'line ' + cls;
  div.textContent = msg;
  output.appendChild(div);
  output.scrollTop = output.scrollHeight;
}

function clearOutput() {
  output.innerHTML = '';
  log('Output cleared.', 'info');
}

function runBytecode(chunk, label) {
  const vm = new SebianVM();
  const start = performance.now();
  try {
    vm.run(chunk);
    vm.output.forEach(line => log(line));
    const dur = (performance.now() - start).toFixed(1);
    log('✅ Execution complete (' + dur + 'ms, ' + vm.instructionCount + ' instructions)', 'success');
    statusText.textContent = 'Completed in ' + dur + 'ms';
    instrCount.textContent = vm.instructionCount.toLocaleString() + ' instructions';
  } catch (err) {
    log('❌ Runtime error: ' + err.message, 'error');
    statusText.textContent = 'Error';
  }
}

function handleFile(file) {
  if (!file) return;
  lastFile = file;
  const ext = file.name.split('.').pop().toLowerCase();
  statusText.textContent = 'Loading ' + file.name + '...';

  const reader = new FileReader();

  if (ext === 'exe') {
    // Binary read for PE parsing
    reader.onload = function(e) {
      const buf = new Uint8Array(e.target.result);
      log('📦 Loading ' + file.name + ' (' + buf.length + ' bytes)', 'info');
      // Search for SEBX payload
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const str = decoder.decode(buf);
      const idx = str.indexOf('{"magic":"SEBX"');
      if (idx === -1) { log('❌ No SEBX payload found in .exe', 'error'); return; }
      let depth = 0, end = idx;
      for (let i = idx; i < str.length; i++) {
        if (str[i] === '{') depth++;
        if (str[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
      }
      try {
        const sebx = JSON.parse(str.substring(idx, end));
        log('🔧 SEBX v' + (sebx.runtime?.vm_version || '1.0') + ' | Compiled: ' + (sebx.compiled_at || 'unknown'), 'info');
        runBytecode(sebx.bytecode, file.name);
      } catch (err) { log('❌ Failed to parse SEBX payload: ' + err.message, 'error'); }
    };
    reader.readAsArrayBuffer(file);
  } else {
    reader.onload = function(e) {
      const content = e.target.result;
      log('📦 Loading ' + file.name, 'info');

      if (ext === 'sebc') {
        try { runBytecode(JSON.parse(content), file.name); }
        catch (err) { log('❌ Invalid .sebc: ' + err.message, 'error'); }
      } else if (ext === 'sebf') {
        try {
          const sebf = JSON.parse(content);
          if (sebf.magic !== 'SEBF') { log('❌ Invalid .sebf magic', 'error'); return; }
          log('🔧 SEBF v' + sebf.version + ' | Built: ' + sebf.compiled_at, 'info');
          runBytecode(sebf.bytecode, file.name);
        } catch (err) { log('❌ Error: ' + err.message, 'error'); }
      } else if (ext === 'dll') {
        try {
          const dll = JSON.parse(content);
          if (dll.magic !== 'SDLL') { log('❌ Invalid .dll magic', 'error'); return; }
          log('📦 Sebian DLL: ' + dll.name + ' v' + dll.version, 'info');
          log('   Exports: ' + dll.exports.join(', '), 'info');
          log('   Built: ' + dll.compiled_at, 'info');
          log('✅ DLL loaded successfully', 'success');
        } catch (err) { log('❌ Error: ' + err.message, 'error'); }
      } else if (ext === 'seb') {
        log('⚠️ Source compilation in the browser runtime is not supported yet.', 'warn');
        log('   Compile your .seb file in Sebian Studio first (Deploy tab → .sebc)', 'warn');
      } else {
        log('❌ Unsupported file type: .' + ext, 'error');
      }
    };
    reader.readAsText(file);
  }
}

// ═══════════ COMMAND LINE ═══════════
function runCommand(cmd) {
  document.getElementById('cmdInput').value = '';
  if (!cmd.trim()) return;
  log('> ' + cmd, 'info');

  const parts = cmd.trim().split(/\\s+/);
  const command = parts[0].toLowerCase();

  if (command === 'sebian' || command === 'seb') {
    const sub = (parts[1] || '').toLowerCase();
    if (sub === 'compile' && parts[2]) {
      log('⚠️ To compile, drag the file here. The runtime will detect .exe files and re-extract the bytecode.', 'warn');
      log('   For full compilation from .seb source, use Sebian Studio (Deploy tab).', 'warn');
    } else if (sub === 'run' && parts[2]) {
      log('Drag and drop the file to run it.', 'info');
    } else if (sub === 'version' || sub === '--version' || sub === '-v') {
      log('SebianVM Runtime v2.0 (Browser Edition)', 'success');
      log('No Node.js required — runs entirely in the browser.', '');
    } else if (sub === 'help' || !sub) {
      log('SebianVM Runtime Commands:', 'info');
      log('  sebian version    Show version', '');
      log('  sebian help       Show this help', '');
      log('  clear             Clear output', '');
      log('', '');
      log('Drag & drop .exe, .sebc, .sebf, or .dll files to run them.', '');
    } else {
      log('Unknown command: sebian ' + sub, 'error');
    }
  } else if (command === 'clear' || command === 'cls') {
    clearOutput();
  } else if (command === 'help') {
    log('Type "sebian help" for SebianVM commands.', 'info');
  } else {
    log('Unknown command: ' + command + '. Type "sebian help".', 'error');
  }
}

// ═══════════ DRAG & DROP ═══════════
const dropZone = document.getElementById('dropZone');
document.body.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('over'); });
document.body.addEventListener('dragleave', () => dropZone.classList.remove('over'));
document.body.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('over');
  if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});
<\/script>
</body>
</html>`;
  };

  // Windows installer that doesn't need Node.js
  const installerBat = `@echo off
echo ============================================
echo   SebianVM Installer for Windows
echo ============================================
echo.

set INSTALL_DIR=%USERPROFILE%\\.sebian
mkdir "%INSTALL_DIR%" 2>nul

echo Installing SebianVM HTML Runtime to %INSTALL_DIR%...
copy /Y sebianvm-runtime.html "%INSTALL_DIR%\\sebianvm-runtime.html" >nul

echo Creating sebian.bat launcher...
(
echo @echo off
echo if "%%1"=="" (
echo   start "" "%INSTALL_DIR%\\sebianvm-runtime.html"
echo   exit /b
echo )
echo echo Drag and drop your file into the SebianVM runtime window.
echo start "" "%INSTALL_DIR%\\sebianvm-runtime.html"
) > "%INSTALL_DIR%\\sebian.bat"

echo Adding to PATH...
setx PATH "%PATH%;%INSTALL_DIR%" >nul 2>&1

echo.
echo ============================================
echo   Installation complete!
echo   Run: sebian (opens runtime in browser)
echo   Or double-click sebianvm-runtime.html
echo ============================================
echo   NO Node.js required!
echo ============================================
pause
`;

  const installerSh = `#!/bin/bash
echo "============================================"
echo "  SebianVM Installer for macOS / Linux"
echo "  NO Node.js required!"
echo "============================================"
echo ""

INSTALL_DIR="$HOME/.sebian"
mkdir -p "$INSTALL_DIR"

echo "Installing SebianVM HTML Runtime to $INSTALL_DIR..."
cp sebianvm-runtime.html "$INSTALL_DIR/sebianvm-runtime.html"

echo "Creating sebian launcher..."
cat > "$INSTALL_DIR/sebian" << 'LAUNCHER'
#!/bin/bash
if [ -z "$1" ]; then
  open "$HOME/.sebian/sebianvm-runtime.html" 2>/dev/null || xdg-open "$HOME/.sebian/sebianvm-runtime.html" 2>/dev/null
else
  echo "Drag and drop your file into the SebianVM runtime window."
  open "$HOME/.sebian/sebianvm-runtime.html" 2>/dev/null || xdg-open "$HOME/.sebian/sebianvm-runtime.html" 2>/dev/null
fi
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
echo "  Run: sebian (opens in your browser)"
echo "  Or open sebianvm-runtime.html directly"
echo "  NO Node.js needed!"
echo "============================================"
`;

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Download Sebian</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Runtime, installers & tools — no Node.js needed</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* HTML Runtime */}
          <div className="bg-accent/20 rounded-lg p-3 border border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">SebianVM Runtime</span>
              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">v2.0</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Self-contained HTML file. <strong>No Node.js required.</strong> Just double-click to open in any browser. Drag & drop your .exe, .sebc, .sebf, or .dll files.
            </p>
            <Button
              size="sm"
              className="w-full"
              onClick={() => handleDownload('runtime', 'sebianvm-runtime.html', buildHtmlRuntime(), 'text/html')}
            >
              {downloading === 'runtime' ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
              Download sebianvm-runtime.html
            </Button>
          </div>

          {/* Windows Installer */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Windows Installer</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Installs the runtime and adds <code className="bg-secondary px-1 rounded">sebian</code> to PATH. No Node.js.
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
              Run <code className="bg-secondary px-1 rounded">bash install-sebian.sh</code>. No Node.js.
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
              <span className="font-medium text-sm">How it works</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1.5">
              <p>The runtime is a <strong>single HTML file</strong> with the full SebianVM embedded. No dependencies.</p>
              <div className="bg-background rounded p-2 font-mono mt-1 border border-border">
                <p>1. Download sebianvm-runtime.html</p>
                <p>2. Double-click to open in browser</p>
                <p>3. Drag & drop your .exe / .sebc / .sebf</p>
                <p>4. Output appears instantly!</p>
              </div>
              <p className="mt-2">For .exe files, the runtime extracts the SEBX bytecode payload from the PE binary and executes it in the VM.</p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
