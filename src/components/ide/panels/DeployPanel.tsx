import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Upload, FileCode, Package, Loader2, Check } from 'lucide-react';
import { compile } from '@/sebian/compiler';
import { vfs } from '@/sebian/vfs';
import { toast } from 'sonner';
import { SebianVM } from '@/sebian/vm/vm';
import { cn } from '@/lib/utils';

interface DeployPanelProps {
  currentCode: string;
}

export function DeployPanel({ currentCode }: DeployPanelProps) {
  const [isCompiling, setIsCompiling] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [runOutput, setRunOutput] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadAsSeb = () => {
    if (!currentCode.trim()) {
      toast.error('No code to download');
      return;
    }
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.seb';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded as .seb');
  };

  const compileSeb = () => {
    if (!currentCode.trim()) {
      toast.error('No code to compile');
      return;
    }
    setIsCompiling(true);
    try {
      const result = compile(currentCode);
      if (!result.success) {
        toast.error(`Compilation failed: ${result.errors.length} error(s)`);
        setLastResult(`❌ ${result.errors.map(e => `Line ${e.line}: ${e.message}`).join('\n')}`);
      } else {
        // Download compiled bytecode
        const bytecode = JSON.stringify(result.chunk, null, 2);
        const blob = new Blob([bytecode], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project.sebc';
        a.click();
        URL.revokeObjectURL(url);
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
    if (!currentCode.trim()) {
      toast.error('No code to build');
      return;
    }
    setIsCompiling(true);
    try {
      const result = compile(currentCode);
      if (!result.success) {
        toast.error('Fix errors before building');
        setLastResult(`❌ ${result.errors.length} compilation error(s)`);
        return;
      }

      const sebf = {
        magic: 'SEBF',
        version: '1.0.0',
        compiled_at: new Date().toISOString(),
        source_hash: btoa(currentCode).substring(0, 16),
        bytecode: result.chunk,
        metadata: {
          sandbox_level: 2,
          capabilities: ['core', 'math', 'string', 'array', 'json', 'ui', 'fs', 'net', 'time'],
        }
      };

      const blob = new Blob([JSON.stringify(sebf)], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project.sebf';
      a.click();
      URL.revokeObjectURL(url);
      setLastResult('✅ Built and downloaded as .sebf executable');
      toast.success('Built .sebf executable!');
    } catch (err: any) {
      toast.error(err.message);
      setLastResult(`❌ ${err.message}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const uploadSeb = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    const ext = file.name.split('.').pop()?.toLowerCase();

    setRunOutput([]);

    if (ext === 'seb') {
      // Run .seb source file
      try {
        const result = compile(content);
        if (!result.success || !result.chunk) {
          setRunOutput(result.errors.map(e => `❌ Line ${e.line}: ${e.message}`));
          toast.error('Compilation errors in uploaded file');
          return;
        }
        
        const vm = new SebianVM();
        const outputs: string[] = [];
        vm.setOutputHandler((msg: string) => outputs.push(msg));
        vm.run(result.chunk);
        outputs.push('✅ Execution complete');
        setRunOutput(outputs);
        toast.success(`Ran ${file.name} successfully`);
      } catch (err: any) {
        setRunOutput([`❌ Runtime error: ${err.message}`]);
      }
    } else if (ext === 'sebf') {
      // Run .sebf executable
      try {
        const sebf = JSON.parse(content);
        if (sebf.magic !== 'SEBF') {
          toast.error('Invalid .sebf file');
          return;
        }

        const vm = new SebianVM();
        const outputs: string[] = [];
        outputs.push(`Running SEBF v${sebf.version} (compiled ${sebf.compiled_at})`);
        vm.setOutputHandler((msg: string) => outputs.push(msg));
        vm.run(sebf.bytecode);
        outputs.push('✅ Execution complete');
        setRunOutput(outputs);
        toast.success(`Ran ${file.name} successfully`);
      } catch (err: any) {
        setRunOutput([`❌ Error: ${err.message}`]);
      }
    } else if (ext === 'sebc') {
      // Run compiled bytecode
      try {
        const chunk = JSON.parse(content);
        const vm = new SebianVM();
        const outputs: string[] = [];
        vm.setOutputHandler((msg: string) => outputs.push(msg));
        vm.run(chunk);
        outputs.push('✅ Execution complete');
        setRunOutput(outputs);
        toast.success(`Ran ${file.name} successfully`);
      } catch (err: any) {
        setRunOutput([`❌ Error: ${err.message}`]);
      }
    } else {
      toast.error('Unsupported file type. Use .seb, .sebc, or .sebf');
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Deploy & Build</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Compile, download, upload & run</p>
      </div>

      <input 
        ref={fileInputRef}
        type="file" 
        accept=".seb,.sebc,.sebf"
        onChange={handleFileUpload}
        className="hidden"
      />

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
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download .seb
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

          {/* Upload & Run */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Upload & Run</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Upload a .seb, .sebc, or .sebf file and execute it.</p>
            <Button size="sm" variant="outline" className="w-full" onClick={uploadSeb}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload & Run File
            </Button>
          </div>

          {/* Results */}
          {lastResult && (
            <div className={cn(
              "rounded-lg p-2 border text-xs font-mono",
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
                  )}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
