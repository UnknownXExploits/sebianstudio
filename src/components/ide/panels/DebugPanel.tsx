import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipForward, 
  ArrowRight,
  ArrowDown,
  ArrowUp,
  RotateCcw,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StackFrame {
  name: string;
  file: string;
  line: number;
  locals: Record<string, any>;
}

interface DebugState {
  running: boolean;
  paused: boolean;
  currentLine: number;
  callStack: StackFrame[];
  variables: Record<string, any>;
  heap: any[];
}

export function DebugPanel() {
  const [debugState, setDebugState] = useState<DebugState>({
    running: false,
    paused: false,
    currentLine: 0,
    callStack: [],
    variables: {},
    heap: [],
  });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['callstack', 'locals', 'globals'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Mock data for demonstration
  const mockState: DebugState = {
    running: true,
    paused: true,
    currentLine: 5,
    callStack: [
      { name: '<main>', file: '/src/main.seb', line: 5, locals: { counter: 0 } },
      { name: 'createUI', file: '/src/main.seb', line: 12, locals: { button: '[UINode]' } },
    ],
    variables: {
      counter: { type: 'number', value: 0 },
      message: { type: 'string', value: 'Hello' },
      isActive: { type: 'boolean', value: true },
    },
    heap: [
      { id: 1, type: 'object', refCount: 2 },
      { id: 2, type: 'ui_node', refCount: 1 },
      { id: 3, type: 'closure', refCount: 1 },
    ],
  };

  return (
    <div className="h-full flex flex-col">
      {/* Debugger Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border">
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Continue">
          <Play className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Pause">
          <Pause className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Step Over">
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Step Into">
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Step Out">
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Restart">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      {/* Debug Info */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge variant={mockState.paused ? 'secondary' : 'default'}>
              {mockState.paused ? 'Paused' : mockState.running ? 'Running' : 'Stopped'}
            </Badge>
            {mockState.paused && (
              <span className="text-xs text-muted-foreground">
                at line {mockState.currentLine}
              </span>
            )}
          </div>
          
          {/* Call Stack */}
          <div>
            <button
              onClick={() => toggleSection('callstack')}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2"
            >
              {expandedSections.has('callstack') ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Call Stack
            </button>
            
            {expandedSections.has('callstack') && (
              <div className="space-y-1 pl-4">
                {mockState.callStack.map((frame, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "text-xs p-1.5 rounded cursor-pointer hover:bg-accent/50",
                      i === 0 && "bg-accent"
                    )}
                  >
                    <span className="text-primary font-medium">{frame.name}</span>
                    <span className="text-muted-foreground ml-2">
                      {frame.file}:{frame.line}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Variables */}
          <div>
            <button
              onClick={() => toggleSection('locals')}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2"
            >
              {expandedSections.has('locals') ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Variables
            </button>
            
            {expandedSections.has('locals') && (
              <div className="space-y-1 pl-4">
                {Object.entries(mockState.variables).map(([name, val]) => (
                  <div key={name} className="text-xs flex items-start gap-2">
                    <span className="text-primary font-medium">{name}</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-foreground/80">
                      {formatValue(val.value)}
                    </span>
                    <Badge variant="outline" className="text-[10px] h-4">
                      {val.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Heap */}
          <div>
            <button
              onClick={() => toggleSection('heap')}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2"
            >
              {expandedSections.has('heap') ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Heap ({mockState.heap.length} objects)
            </button>
            
            {expandedSections.has('heap') && (
              <div className="space-y-1 pl-4">
                {mockState.heap.map((obj) => (
                  <div key={obj.id} className="text-xs flex items-center gap-2">
                    <span className="text-muted-foreground">#{obj.id}</span>
                    <Badge variant="outline" className="text-[10px] h-4">
                      {obj.type}
                    </Badge>
                    <span className="text-muted-foreground">
                      refs: {obj.refCount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
