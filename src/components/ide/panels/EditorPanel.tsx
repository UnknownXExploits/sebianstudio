import { useState, useCallback, useRef, useMemo, useDeferredValue } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Save, Copy, Undo, Redo } from 'lucide-react';
import { compile } from '@/sebian/compiler';
import { SebianVM } from '@/sebian/vm/vm';
import { cn } from '@/lib/utils';

interface EditorPanelProps {
  filePath: string | null;
  content: string;
  onChange: (content: string) => void;
  onRun: (message: string) => void;
}

// Simple syntax highlighting for Sebian
const SEBIAN_HIGHLIGHT_PATTERNS: Array<{ regex: RegExp; className: string }> = [
  { regex: /^(\/\/.*)/, className: 'syntax-comment' },
  {
    // Sebian keywords / statements (explicitly NOT JavaScript)
    regex: /^(Import|from|import|Create|Repeat|local|function|if|else|while|for|return|do)\b/,
    className: 'syntax-keyword',
  },
  { regex: /^("[^"]*"|'[^']*')/, className: 'syntax-string' },
  { regex: /^(\d+\.?\d*)/, className: 'syntax-number' },
  { regex: /^(true|false|null)\b/, className: 'syntax-keyword' },
  { regex: /^([A-Z][a-zA-Z0-9]*)\b/, className: 'syntax-type' },
  { regex: /^(\.[a-zA-Z_][a-zA-Z0-9_]*)/, className: 'syntax-property' },
  { regex: /^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/, className: 'syntax-function' },
  { regex: /^([=+\-*/<>!&|]+)/, className: 'syntax-operator' },
  { regex: /^([\[\]{}()])/, className: 'syntax-operator' },
];

function highlightSyntax(code: string): React.ReactNode[] {
  const lines = code.split('\n');
  
  return lines.map((line, lineIndex) => {
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let position = 0;
    
    while (remaining.length > 0) {
      let matched = false;
      
      for (const { regex, className } of SEBIAN_HIGHLIGHT_PATTERNS) {
        const match = remaining.match(regex);
        if (match) {
          tokens.push(
            <span key={`${lineIndex}-${position}`} className={className}>
              {match[0]}
            </span>
          );
          remaining = remaining.slice(match[0].length);
          position += match[0].length;
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        // Handle whitespace and other characters
        const match = remaining.match(
          /^(\s+|[^\s]+?(?=\s|Import|from|import|Create|Repeat|local|function|if|else|while|for|return|do|"|'|\d|[A-Z]|\.|[=+\-*/<>!&|]|[\[\]{}()]|$))/
        );
        if (match) {
          tokens.push(
            <span key={`${lineIndex}-${position}`}>{match[0]}</span>
          );
          remaining = remaining.slice(match[0].length);
          position += match[0].length;
        } else {
          tokens.push(<span key={`${lineIndex}-${position}`}>{remaining[0]}</span>);
          remaining = remaining.slice(1);
          position++;
        }
      }
    }
    
    return tokens;
  });
}

export function EditorPanel({ filePath, content, onChange, onRun }: EditorPanelProps) {
  const [isSaved, setIsSaved] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Defer expensive highlighting so paste / fast typing doesn't lock the UI.
  const deferredContent = useDeferredValue(content);

  const highlighted = useMemo(() => {
    // Safeguard: very large pastes can freeze the browser if we tokenize every character.
    // Keep editing responsive by skipping highlighting in that case.
    if (deferredContent.length > 50_000 || deferredContent.split('\n').length > 2_000) {
      return null;
    }
    return highlightSyntax(deferredContent);
  }, [deferredContent]);

  const lines = content.split('\n');
  const lineCount = lines.length;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setIsSaved(false);
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current && highlightRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = content.substring(0, start) + '  ' + content.substring(end);
      onChange(newValue);
      
      // Set cursor position after the tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
    
    // Run with Ctrl+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      runCode();
    }
    
    // Save with Ctrl+S
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setIsSaved(true);
      onRun('📁 File saved');
    }
  };

  const runCode = useCallback(() => {
    onRun('▶️ Running...');
    
    try {
      const result = compile(content);
      
      if (!result.success || !result.chunk) {
        result.errors.forEach(err => {
          onRun(`❌ Error at line ${err.line}: ${err.message}`);
        });
        return;
      }
      
      const vm = new SebianVM();
      
      // Capture output
      const originalConsole = console.log;
      console.log = (...args) => {
        onRun(args.map(a => String(a)).join(' '));
      };
      
      try {
        const output = vm.run(result.chunk);
        if (output.type !== 'null') {
          onRun(`✅ Result: ${JSON.stringify(output.value ?? output.type)}`);
        } else {
          onRun('✅ Execution complete');
        }
      } finally {
        console.log = originalConsole;
      }
    } catch (error: any) {
      onRun(`❌ Runtime Error: ${error.message}`);
    }
  }, [content, onRun]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground font-medium">
            {filePath || 'Untitled'}
          </span>
          {!isSaved && (
            <span className="w-2 h-2 rounded-full bg-primary" title="Unsaved changes" />
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsSaved(true)}>
            <Save className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Undo className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Redo className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="h-7 gap-1.5"
            onClick={runCode}
          >
            <Play className="h-3.5 w-3.5" />
            Run
          </Button>
        </div>
      </div>
      
      {/* Editor Content */}
      <div className="flex-1 relative overflow-hidden font-mono text-sm">
        {/* Line Numbers */}
        <div 
          ref={lineNumbersRef}
          className="absolute left-0 top-0 bottom-0 w-12 bg-secondary/30 border-r border-border overflow-hidden select-none"
        >
          <div className="py-3 pr-3">
            {Array.from({ length: lineCount }, (_, i) => (
              <div 
                key={i} 
                className="text-right text-muted-foreground leading-6 text-xs"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        
        {/* Syntax Highlighted Overlay */}
        <div 
          ref={highlightRef}
          className="absolute left-12 top-0 right-0 bottom-0 overflow-hidden pointer-events-none"
        >
          <div className="p-3 whitespace-pre-wrap break-all">
            {highlighted ? (
              highlighted.map((lineTokens, i) => (
                <div key={i} className="leading-6 min-h-6">
                  {lineTokens}
                </div>
              ))
            ) : (
              <div className="leading-6 text-muted-foreground text-xs">
                Highlighting disabled for large files (edit is still live).
              </div>
            )}
          </div>
        </div>
        
        {/* Actual Textarea (invisible but functional) */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          className={cn(
            "absolute left-12 top-0 right-0 bottom-0 p-3 resize-none",
            "bg-transparent text-transparent caret-foreground",
            "focus:outline-none leading-6 overflow-auto",
            "sebian-scrollbar"
          )}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>
    </div>
  );
}
