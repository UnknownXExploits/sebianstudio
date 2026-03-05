import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Globe, Copy, Play, Loader2, Check, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { compile } from '@/sebian/compiler';

interface APIPanelProps {
  currentCode: string;
}

export function APIPanel({ currentCode }: APIPanelProps) {
  const [testCode, setTestCode] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const apiUrl = `https://${projectId}.supabase.co/functions/v1/sebian-execute`;

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copied!');
    setTimeout(() => setCopied(null), 1500);
  };

  const testAPI = async () => {
    const code = testCode.trim() || currentCode.trim();
    if (!code) { toast.error('No code to test'); return; }

    setIsRunning(true);
    setResponse(null);

    try {
      // Compile locally first
      const result = compile(code);
      if (!result.success || !result.chunk) {
        setResponse(JSON.stringify({
          success: false,
          error: 'Compilation failed',
          errors: result.errors.map(e => `Line ${e.line}: ${e.message}`),
        }, null, 2));
        return;
      }

      const { data, error } = await supabase.functions.invoke('sebian-execute', {
        body: { bytecode: result.chunk },
      });

      if (error) throw error;
      setResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponse(JSON.stringify({ success: false, error: err.message }, null, 2));
    } finally {
      setIsRunning(false);
    }
  };

  const curlExample = `curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: YOUR_ANON_KEY" \\
  -d '{"bytecode": <compiled_chunk_json>}'`;

  const jsExample = `// Run Sebian code via API
const response = await fetch("${apiUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": "YOUR_ANON_KEY",
  },
  body: JSON.stringify({
    bytecode: compiledChunk, // from .sebc file
  }),
});

const result = await response.json();
console.log(result.output); // ["Hello from Sebian!"]
console.log(result.duration_ms); // 42`;

  const pythonExample = `import requests

response = requests.post(
    "${apiUrl}",
    headers={
        "Content-Type": "application/json",
        "apikey": "YOUR_ANON_KEY",
    },
    json={"bytecode": compiled_chunk},
)

result = response.json()
print(result["output"])`;

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Sebian API</h3>
          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">REST</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Execute Sebian bytecode remotely via API</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Endpoint */}
          <div className="bg-accent/20 rounded-lg p-3 border border-primary/30">
            <p className="text-[10px] font-semibold text-primary mb-1">ENDPOINT</p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-background px-2 py-1 rounded border border-border flex-1 overflow-x-auto">
                POST /sebian-execute
              </code>
              <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => copyText(apiUrl, 'url')}>
                {copied === 'url' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {/* Test it */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <p className="text-xs font-semibold mb-2">🧪 Test API</p>
            <Textarea
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              placeholder={`Paste Sebian code to test (or leave empty to use current editor code)...`}
              className="text-xs min-h-[60px] max-h-24 resize-none font-mono mb-2"
            />
            <Button size="sm" className="w-full" onClick={testAPI} disabled={isRunning}>
              {isRunning ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1.5" />}
              Run via API
            </Button>
          </div>

          {/* Response */}
          {response && (
            <div className="bg-background rounded-lg p-2 border border-border">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium">Response</p>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => copyText(response, 'resp')}>
                  {copied === 'resp' ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                </Button>
              </div>
              <pre className={cn(
                "text-[10px] font-mono overflow-auto max-h-40 p-2 rounded",
                response.includes('"success": true') ? "bg-primary/5 text-primary" : "bg-destructive/5 text-destructive"
              )}>
                {response}
              </pre>
            </div>
          )}

          {/* How to use */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <p className="text-xs font-semibold mb-2">📖 How to Use</p>
            <div className="text-xs text-muted-foreground space-y-2">
              <p>1. <strong>Compile</strong> your Sebian code in the Deploy tab → download <code className="bg-background px-1 rounded">.sebc</code></p>
              <p>2. <strong>Send</strong> the compiled bytecode JSON as the <code className="bg-background px-1 rounded">bytecode</code> field</p>
              <p>3. <strong>Receive</strong> output array, instruction count, and execution time</p>
            </div>
          </div>

          {/* cURL example */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold">cURL</p>
              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => copyText(curlExample, 'curl')}>
                {copied === 'curl' ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
              </Button>
            </div>
            <pre className="text-[10px] font-mono bg-background p-2 rounded overflow-x-auto">{curlExample}</pre>
          </div>

          {/* JavaScript example */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold">JavaScript</p>
              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => copyText(jsExample, 'js')}>
                {copied === 'js' ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
              </Button>
            </div>
            <pre className="text-[10px] font-mono bg-background p-2 rounded overflow-x-auto max-h-40">{jsExample}</pre>
          </div>

          {/* Python example */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold">Python</p>
              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => copyText(pythonExample, 'py')}>
                {copied === 'py' ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
              </Button>
            </div>
            <pre className="text-[10px] font-mono bg-background p-2 rounded overflow-x-auto max-h-40">{pythonExample}</pre>
          </div>

          {/* Rate limits */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Limits</p>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li>Max <strong>5,000,000</strong> instructions per execution</li>
              <li>Sandbox Level 2 (no DOM/host access)</li>
              <li>Output capped at 1000 lines</li>
            </ul>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
