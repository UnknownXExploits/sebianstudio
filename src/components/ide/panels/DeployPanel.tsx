import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Upload, FileCode, Package, Loader2, Terminal, Cpu, Library } from 'lucide-react';
import { compile } from '@/sebian/compiler';
import { toast } from 'sonner';
import { SebianVM } from '@/sebian/vm/vm';
import { cn } from '@/lib/utils';
import { generateExe } from '@/sebian/build/exe-builder';
import { generateDll } from '@/sebian/build/dll-builder';

interface DeployPanelProps {
  currentCode: string;
  onOpenConsole?: () => void;
}

export function DeployPanel({ currentCode, onOpenConsole }: DeployPanelProps) {
  const [isCompiling, setIsCompiling] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [runOutput, setRunOutput] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const downloadAsSeb = () => {
    if (!currentCode.trim()) { toast.error('No code to download'); return; }
    downloadBlob(new Blob([currentCode], { type: 'application/x-sebian' }), 'project.seb');
    toast.success('Downloaded as .seb');
  };

  const compileSeb = () => {
    if (!currentCode.trim()) { toast.error('No code to compile'); return; }
    setIsCompiling(true);
    try {
      const result = compile(currentCode);
      if (!result.success) {
        toast.error(`Compilation failed: ${result.errors.length} error(s)`);
        setLastResult(`❌ ${result.errors.map(e => `Line ${e.line}: ${e.message}`).join('\n')}`);
      } else {
        downloadBlob(new Blob([JSON.stringify(result.chunk, null, 2)], { type: 'application/x-sebian-compiled' }), 'project.sebc');
        setLastResult('✅ Compiled and downloaded as .sebc');
        toast.success('Compiled successfully!');
      }
    } catch (err: any) {
      toast.error(err.message);
      setLastResult(`❌ ${err.message}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const buildSebf = () => {
    if (!currentCode.trim()) { toast.error('No code to build'); return; }
    setIsCompiling(true);
    try {
      const result = compile(currentCode);
      if (!result.success) {
        toast.error('Fix errors before building');
        setLastResult(`❌ ${result.errors.length} compilation error(s)`);
        return;
      }
      const sebf = {
        magic: 'SEBF', version: '1.0.0', compiled_at: new Date().toISOString(),
        source_hash: btoa(currentCode).substring(0, 16), bytecode: result.chunk,
        metadata: { sandbox_level: 2, capabilities: ['core', 'math', 'string', 'array', 'json', 'ui', 'fs', 'net', 'time'] }
      };
      downloadBlob(new Blob([JSON.stringify(sebf)], { type: 'application/x-sebian-executable' }), 'project.sebf');
      setLastResult('✅ Built and downloaded as .sebf executable');
      toast.success('Built .sebf executable!');
    } catch (err: any) {
      toast.error(err.message);
      setLastResult(`❌ ${err.message}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const buildExe = () => {
    if (!currentCode.trim()) { toast.error('No code to build'); return; }
    setIsCompiling(true);
    try {
      const result = compile(currentCode);
      if (!result.success) {
        toast.error('Fix errors before building .exe');
        setLastResult(`❌ ${result.errors.length} compilation error(s)`);
        return;
      }
      const exeBlob = generateExe(currentCode, result.chunk!);
      downloadBlob(exeBlob, 'project.exe');
      setLastResult('✅ Built standalone .exe (self-extracting, runs in any browser)');
      toast.success('Built .exe successfully!');
    } catch (err: any) {
      toast.error(err.message);
      setLastResult(`❌ ${err.message}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const buildDll = () => {
    if (!currentCode.trim()) { toast.error('No code to build'); return; }
    setIsCompiling(true);
    try {
      const result = compile(currentCode);
      if (!result.success) {
        toast.error('Fix errors before building .dll');
        setLastResult(`❌ ${result.errors.length} compilation error(s)`);
        return;
      }
      const dllBlob = generateDll(currentCode, result.chunk!);
      downloadBlob(dllBlob, 'project.dll');
      setLastResult('✅ Built .dll dynamic library module');
      toast.success('Built .dll successfully!');
    } catch (err: any) {
      toast.error(err.message);
      setLastResult(`❌ ${err.message}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const uploadSeb = () => { fileInputRef.current?.click(); };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    const ext = file.name.split('.').pop()?.toLowerCase();
    setRunOutput([]);

    if (ext === 'seb') {
      try {
        const result = compile(content);
        if (!result.success || !result.chunk) {
          setRunOutput(result.errors.map(e => `❌ Line ${e.line}: ${e.message}`));
          toast.error('Compilation errors in uploaded file'); return;
        }
        const vm = new SebianVM();
        const outputs: string[] = [];
        vm.setOutputHandler((msg: string) => outputs.push(msg));
        vm.run(result.chunk);
        outputs.push('✅ Execution complete');
        setRunOutput(outputs);
        toast.success(`Ran ${file.name} successfully`);
      } catch (err: any) { setRunOutput([`❌ Runtime error: ${err.message}`]); }
    } else if (ext === 'sebf') {
      try {
        const sebf = JSON.parse(content);
        if (sebf.magic !== 'SEBF') { toast.error('Invalid .sebf file'); return; }
        const vm = new SebianVM();
        const outputs: string[] = [];
        outputs.push(`Running SEBF v${sebf.version} (compiled ${sebf.compiled_at})`);
        vm.setOutputHandler((msg: string) => outputs.push(msg));
        vm.run(sebf.bytecode);
        outputs.push('✅ Execution complete');
        setRunOutput(outputs);
        toast.success(`Ran ${file.name} successfully`);
      } catch (err: any) { setRunOutput([`❌ Error: ${err.message}`]); }
    } else if (ext === 'sebc') {
      try {
        const chunk = JSON.parse(content);
        const vm = new SebianVM();
        const outputs: string[] = [];
        vm.setOutputHandler((msg: string) => outputs.push(msg));
        vm.run(chunk);
        outputs.push('✅ Execution complete');
        setRunOutput(outputs);
        toast.success(`Ran ${file.name} successfully`);
      } catch (err: any) { setRunOutput([`❌ Error: ${err.message}`]); }
    } else if (ext === 'dll') {
      try {
        const dll = JSON.parse(content);
        if (dll.magic !== 'SDLL') { toast.error('Invalid Sebian .dll file'); return; }
        setRunOutput([
          `📦 Sebian DLL: ${dll.name} v${dll.version}`,
          `   Exports: ${dll.exports.join(', ')}`,
          `   Built: ${dll.compiled_at}`,
          `✅ DLL loaded successfully — use 'import "${dll.name}"' in your code`,
        ]);
        toast.success(`Loaded DLL: ${dll.name}`);
      } catch (err: any) { setRunOutput([`❌ Error: ${err.message}`]); }
    } else {
      toast.error('Unsupported file type. Use .seb, .sebc, .sebf, .exe, or .dll');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Deploy & Build</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Compile, download, upload & run</p>
        </div>
        {onOpenConsole && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onOpenConsole}>
            <Terminal className="h-3 w-3 mr-1" />Console
          </Button>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept=".seb,.sebc,.sebf,.dll" onChange={handleFileUpload} className="hidden" />

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Download .seb */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Source File (.seb)</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Download your code as a .seb source file.</p>
            <Button size="sm" className="w-full" onClick={downloadAsSeb}>
              <Download className="h-3.5 w-3.5 mr-1.5" />Download .seb
            </Button>
          </div>

          {/* Compile .sebc */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Compiled Bytecode (.sebc)</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Compile and download VM bytecode.</p>
            <Button size="sm" className="w-full" onClick={compileSeb} disabled={isCompiling}>
              {isCompiling ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
              Compile & Download .sebc
            </Button>
          </div>

          {/* Build .sebf */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Executable (.sebf)</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Build a self-contained Sebian executable with metadata.</p>
            <Button size="sm" className="w-full" onClick={buildSebf} disabled={isCompiling}>
              {isCompiling ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
              Build .sebf Executable
            </Button>
          </div>

          {/* Build .exe */}
          <div className="bg-accent/20 rounded-lg p-3 border border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Standalone Executable (.exe)</span>
              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">NEW</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Build a real self-extracting .exe. Contains the full Sebian runtime + your compiled bytecode. Runs standalone — no install needed.
            </p>
            <Button size="sm" className="w-full" onClick={buildExe} disabled={isCompiling}>
              {isCompiling ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
              Build .exe
            </Button>
          </div>

          {/* Build .dll */}
          <div className="bg-accent/20 rounded-lg p-3 border border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <Library className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Dynamic Library (.dll)</span>
              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">NEW</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Build a .dll module that other Sebian programs can import. Exports all top-level functions and variables.
            </p>
            <Button size="sm" className="w-full" onClick={buildDll} disabled={isCompiling}>
              {isCompiling ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
              Build .dll
            </Button>
          </div>

          {/* Upload & Run */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Upload & Run</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Upload .seb, .sebc, .sebf, or .dll files.</p>
            <Button size="sm" variant="outline" className="w-full" onClick={uploadSeb}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />Upload & Run File
            </Button>
          </div>

          {/* Results */}
          {lastResult && (
            <div className={cn(
              "rounded-lg p-2 border text-xs font-mono whitespace-pre-wrap",
              lastResult.startsWith('✅') ? "bg-primary/10 border-primary/30 text-primary" : "bg-destructive/10 border-destructive/30 text-destructive"
            )}>
              {lastResult}
            </div>
          )}

          {runOutput.length > 0 && (
            <div className="bg-background rounded-lg p-2 border border-border">
              <p className="text-xs font-medium mb-1">Run Output:</p>
              <div className="font-mono text-xs space-y-0.5 max-h-40 overflow-auto sebian-scrollbar">
                {runOutput.map((line, i) => (
                  <div key={i} className={cn(
                    line.startsWith('❌') ? "text-destructive" :
                    line.startsWith('✅') ? "text-primary" : "text-foreground/80"
                  )}>{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
