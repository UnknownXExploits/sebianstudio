import { useState, useRef, useEffect } from 'react';
import { vfs } from '@/sebian/vfs';
import { compile } from '@/sebian/compiler';
import { SebianVM } from '@/sebian/vm/vm';
import { cn } from '@/lib/utils';

interface TerminalPanelProps {
  onLog: (message: string) => void;
}

interface HistoryEntry {
  type: 'input' | 'output' | 'error';
  content: string;
}

export function TerminalPanel({ onLog }: TerminalPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { type: 'output', content: 'SebianOS Terminal v1.0.0' },
    { type: 'output', content: 'Type "help" for available commands.' },
    { type: 'output', content: '' },
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const addOutput = (content: string, type: 'output' | 'error' = 'output') => {
    setHistory(prev => [...prev, { type, content }]);
  };

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Add to history
    setHistory(prev => [...prev, { type: 'input', content: `$ ${trimmed}` }]);
    setCommandHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        addOutput(`Available commands:
  ls [path]       - List directory contents
  cd <path>       - Change directory
  pwd             - Print working directory
  cat <file>      - Display file contents
  mkdir <dir>     - Create directory
  touch <file>    - Create empty file
  rm <path>       - Remove file
  rmdir <path>    - Remove directory
  run <file.seb>  - Execute Sebian file
  clear           - Clear terminal
  perm            - Show sandbox permissions
  version         - Show version info
  exit            - Exit terminal`);
        break;

      case 'ls':
        const lsPath = args[0] || vfs.getCwd();
        const entries = vfs.readdir(lsPath);
        if (entries.length === 0) {
          addOutput('(empty directory)');
        } else {
          entries.forEach(entry => {
            const fullPath = lsPath === '/' ? `/${entry}` : `${lsPath}/${entry}`;
            const isDir = vfs.isDirectory(fullPath);
            addOutput(isDir ? `📁 ${entry}/` : `📄 ${entry}`);
          });
        }
        break;

      case 'cd':
        if (!args[0]) {
          addOutput('Usage: cd <path>', 'error');
        } else if (vfs.chdir(args[0])) {
          addOutput(`Changed to ${vfs.getCwd()}`);
        } else {
          addOutput(`cd: ${args[0]}: No such directory`, 'error');
        }
        break;

      case 'pwd':
        addOutput(vfs.getCwd());
        break;

      case 'cat':
        if (!args[0]) {
          addOutput('Usage: cat <file>', 'error');
        } else {
          const content = vfs.readFile(args[0]);
          if (content !== null) {
            addOutput(content);
          } else {
            addOutput(`cat: ${args[0]}: No such file`, 'error');
          }
        }
        break;

      case 'mkdir':
        if (!args[0]) {
          addOutput('Usage: mkdir <directory>', 'error');
        } else if (vfs.mkdir(args[0])) {
          addOutput(`Created directory: ${args[0]}`);
        } else {
          addOutput(`mkdir: Failed to create ${args[0]}`, 'error');
        }
        break;

      case 'touch':
        if (!args[0]) {
          addOutput('Usage: touch <file>', 'error');
        } else if (vfs.writeFile(args[0], '')) {
          addOutput(`Created file: ${args[0]}`);
        } else {
          addOutput(`touch: Failed to create ${args[0]}`, 'error');
        }
        break;

      case 'rm':
        if (!args[0]) {
          addOutput('Usage: rm <file>', 'error');
        } else if (vfs.deleteFile(args[0])) {
          addOutput(`Removed: ${args[0]}`);
        } else {
          addOutput(`rm: ${args[0]}: No such file`, 'error');
        }
        break;

      case 'rmdir':
        if (!args[0]) {
          addOutput('Usage: rmdir <directory>', 'error');
        } else if (vfs.rmdir(args[0], args.includes('-r'))) {
          addOutput(`Removed directory: ${args[0]}`);
        } else {
          addOutput(`rmdir: ${args[0]}: Directory not empty or not found`, 'error');
        }
        break;

      case 'run':
        if (!args[0]) {
          addOutput('Usage: run <file.seb>', 'error');
        } else {
          const code = vfs.readFile(args[0]);
          if (code === null) {
            addOutput(`run: ${args[0]}: No such file`, 'error');
          } else {
            try {
              const result = compile(code);
              if (!result.success || !result.chunk) {
                result.errors.forEach(err => {
                  addOutput(`Error at line ${err.line}: ${err.message}`, 'error');
                });
              } else {
                const vm = new SebianVM();
                const output = vm.run(result.chunk);
                addOutput(`✅ Execution complete`);
                if (output.type !== 'null') {
                  addOutput(`Result: ${JSON.stringify(output.value ?? output.type)}`);
                }
              }
            } catch (err: any) {
              addOutput(`Runtime error: ${err.message}`, 'error');
            }
          }
        }
        break;

      case 'clear':
        setHistory([]);
        break;

      case 'perm':
        addOutput(`Sandbox Level: 2 (Standard)
Active Capabilities:
  ✓ core    - Core language features
  ✓ math    - Mathematical operations
  ✓ string  - String manipulation
  ✓ array   - Array operations
  ✓ json    - JSON parsing/stringify
  ✓ ui      - UI creation
  ✓ fs      - Virtual filesystem
  ✓ net     - Network (proxied)
  ✓ time    - Date/time operations`);
        break;

      case 'version':
        addOutput(`SebianOS Terminal v1.0.0
Sebian Language v1.0.0
SebianVM v1.0.0
Compiler v1.0.0`);
        break;

      case 'exit':
        addOutput('Use the close button to exit the terminal.');
        break;

      default:
        addOutput(`${command}: command not found. Type "help" for available commands.`, 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion for paths
      const parts = input.split(/\s+/);
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        const entries = vfs.readdir(vfs.getCwd());
        const match = entries.find(e => e.startsWith(lastPart));
        if (match) {
          parts[parts.length - 1] = match;
          setInput(parts.join(' '));
        }
      }
    }
  };

  return (
    <div 
      className="h-full flex flex-col bg-background font-mono text-sm cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="flex-1 overflow-auto p-3 sebian-scrollbar">
        {history.map((entry, i) => (
          <div 
            key={i} 
            className={cn(
              "whitespace-pre-wrap",
              entry.type === 'input' && "text-primary font-medium",
              entry.type === 'error' && "text-destructive",
              entry.type === 'output' && "text-foreground/80"
            )}
          >
            {entry.content}
          </div>
        ))}
        
        {/* Input Line */}
        <div className="flex items-center">
          <span className="text-primary mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-foreground"
            autoFocus
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
