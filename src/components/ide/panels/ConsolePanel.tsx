import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Copy, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConsolePanelProps {
  output: string[];
  onClear: () => void;
}

export function ConsolePanel({ output, onClear }: ConsolePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  const getLineStyle = (line: string) => {
    if (line.startsWith('❌') || line.toLowerCase().includes('error')) {
      return 'text-destructive';
    }
    if (line.startsWith('✅')) {
      return 'text-green-500';
    }
    if (line.startsWith('⚠️') || line.toLowerCase().includes('warning')) {
      return 'text-yellow-500';
    }
    if (line.startsWith('▶️')) {
      return 'text-primary';
    }
    if (line.startsWith('📁')) {
      return 'text-blue-400';
    }
    return 'text-foreground/80';
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output.join('\n'));
  };

  const downloadOutput = () => {
    const blob = new Blob([output.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'console-output.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Console Toolbar */}
      <div className="flex items-center justify-end gap-1 px-2 py-1 border-b border-border bg-secondary/20">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyOutput} title="Copy">
          <Copy className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={downloadOutput} title="Download">
          <Download className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClear} title="Clear">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      
      {/* Console Output */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-3 font-mono text-xs sebian-scrollbar">
        {output.length === 0 ? (
          <div className="text-muted-foreground italic">
            Console output will appear here...
          </div>
        ) : (
          output.map((line, index) => (
            <div 
              key={index} 
              className={cn("py-0.5 whitespace-pre-wrap break-all", getLineStyle(line))}
            >
              <span className="text-muted-foreground mr-2 select-none">[{index + 1}]</span>
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
