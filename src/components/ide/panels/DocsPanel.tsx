import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, Book, Code, Cpu, Shield, Terminal, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const DOCS: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <Book className="h-4 w-4" />,
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Welcome to Sebian</h2>
        <p className="text-muted-foreground">
          Sebian is a custom programming language that runs on SebianVM - a real virtual machine
          that executes bytecode directly. No JavaScript transpilation!
        </p>
        
        <h3 className="text-lg font-semibold mt-6">Your First Program</h3>
        <pre className="bg-secondary/50 p-4 rounded-lg text-sm overflow-x-auto">
{`// Hello World in Sebian
Import SebianVM from Sebian
Import UI from sebian

Create text
[
  content= "Hello, Sebian!"
  style= "font-size: 24px; color: #00ff88;"
]

from ui import render
render(text)`}
        </pre>
        
        <h3 className="text-lg font-semibold mt-6">Key Concepts</h3>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li><strong>Imports</strong> - Use <code>Import X from Y</code> to import modules</li>
          <li><strong>Create</strong> - Use <code>Create type [ ... ]</code> to create UI elements</li>
          <li><strong>Properties</strong> - Set properties with <code>name= "value"</code></li>
          <li><strong>Bindings</strong> - Bind events with <code>element.function=handler</code></li>
        </ul>
      </div>
    ),
  },
  {
    id: 'syntax',
    title: 'Language Syntax',
    icon: <Code className="h-4 w-4" />,
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Sebian Syntax Reference</h2>
        
        <h3 className="text-lg font-semibold">Imports</h3>
        <pre className="bg-secondary/50 p-3 rounded text-sm">
{`// Standard import
Import ModuleName from source

// Destructured import  
from module import function

// Multiple imports
from ui import buttons, labels`}
        </pre>
        
        <h3 className="text-lg font-semibold mt-4">Variables</h3>
        <pre className="bg-secondary/50 p-3 rounded text-sm">
{`// Local variable
local counter = 0

// Assignment
counter = counter + 1`}
        </pre>
        
        <h3 className="text-lg font-semibold mt-4">Functions</h3>
        <pre className="bg-secondary/50 p-3 rounded text-sm">
{`function greet(name)
[
  return "Hello, " + name
]

// Call function
local message = greet("World")`}
        </pre>
        
        <h3 className="text-lg font-semibold mt-4">UI Creation</h3>
        <pre className="bg-secondary/50 p-3 rounded text-sm">
{`Create button
[
  Buttonname= "myButton"
  text= "Click Me"
  onClick.function= handleClick
]

Repeat local button creation
[
  Buttonname= "clonedButton"
]`}
        </pre>
        
        <h3 className="text-lg font-semibold mt-4">Control Flow</h3>
        <pre className="bg-secondary/50 p-3 rounded text-sm">
{`if condition
[
  // do something
]
else
[
  // do something else
]

while condition
[
  // loop body
]`}
        </pre>
      </div>
    ),
  },
  {
    id: 'vm',
    title: 'How SebianVM Works',
    icon: <Cpu className="h-4 w-4" />,
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">SebianVM Architecture</h2>
        <p className="text-muted-foreground">
          SebianVM is a stack-based virtual machine that executes Sebian bytecode directly.
          <strong> No JavaScript transpilation or eval() is ever used.</strong>
        </p>
        
        <h3 className="text-lg font-semibold mt-6">Execution Pipeline</h3>
        <div className="bg-secondary/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-primary/20 px-3 py-1 rounded">Source Code</span>
            <ChevronRight className="h-4 w-4" />
            <span className="bg-primary/20 px-3 py-1 rounded">Lexer</span>
            <ChevronRight className="h-4 w-4" />
            <span className="bg-primary/20 px-3 py-1 rounded">Parser</span>
            <ChevronRight className="h-4 w-4" />
            <span className="bg-primary/20 px-3 py-1 rounded">AST</span>
            <ChevronRight className="h-4 w-4" />
            <span className="bg-primary/20 px-3 py-1 rounded">Bytecode</span>
            <ChevronRight className="h-4 w-4" />
            <span className="bg-primary px-3 py-1 rounded text-primary-foreground font-bold">SebianVM</span>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mt-6">VM Components</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li><strong>Stack</strong> - Operand stack for computations</li>
          <li><strong>Call Frames</strong> - Function call stack with locals</li>
          <li><strong>Heap</strong> - Object storage with garbage collection</li>
          <li><strong>Modules</strong> - Loaded module registry</li>
          <li><strong>UI Tree</strong> - Virtual UI node hierarchy</li>
        </ul>
        
        <h3 className="text-lg font-semibold mt-6">Instruction Set</h3>
        <p className="text-sm text-muted-foreground">
          50+ opcodes including stack ops, variable access, arithmetic, 
          control flow, function calls, UI operations, and syscalls.
        </p>
      </div>
    ),
  },
  {
    id: 'sandbox',
    title: 'Sandbox Levels',
    icon: <Shield className="h-4 w-4" />,
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Three-Level Sandbox System</h2>
        
        <div className="space-y-4">
          <div className="border border-green-500/30 bg-green-500/5 p-4 rounded-lg">
            <h3 className="font-bold text-green-500 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Level 3 - Restricted
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Pure computation only. No DOM, network, or file access.
            </p>
            <p className="text-xs mt-2">
              Capabilities: <code>core, math, string, array</code>
            </p>
          </div>
          
          <div className="border border-primary/30 bg-primary/5 p-4 rounded-lg">
            <h3 className="font-bold text-primary flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Level 2 - Standard (Default)
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Balanced sandbox with VFS, UI, and proxied networking.
            </p>
            <p className="text-xs mt-2">
              Capabilities: <code>core, math, string, array, json, ui, fs, net, time</code>
            </p>
          </div>
          
          <div className="border border-destructive/30 bg-destructive/5 p-4 rounded-lg">
            <h3 className="font-bold text-destructive flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Level 1 - Full Power
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Unrestricted access including DOM and host bindings.
              <strong> Requires explicit confirmation!</strong>
            </p>
            <p className="text-xs mt-2">
              Capabilities: <code>+ host, dom, buffer, unsafe_net</code>
            </p>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mt-6">Switching Levels in Code</h3>
        <pre className="bg-secondary/50 p-3 rounded text-sm">
{`from sebian import SebianVM
SebianVM.tools.functions.sandbox.level = 1
from sandbox.level do function.run`}
        </pre>
      </div>
    ),
  },
  {
    id: 'modules',
    title: 'Standard Library',
    icon: <Layers className="h-4 w-4" />,
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Built-in Modules</h2>
        <p className="text-muted-foreground">
          Sebian includes a comprehensive standard library with 500+ commands.
        </p>
        
        <div className="grid gap-3 mt-4">
          {[
            { name: 'math', desc: 'Mathematical operations, trigonometry, random' },
            { name: 'string', desc: 'String manipulation, formatting, parsing' },
            { name: 'array', desc: 'Array operations, map, filter, reduce' },
            { name: 'ui', desc: 'UI component creation and manipulation' },
            { name: 'fs', desc: 'Virtual filesystem operations' },
            { name: 'net', desc: 'HTTP requests, WebSocket, JSON' },
            { name: 'time', desc: 'Date/time, timers, scheduling' },
            { name: 'os', desc: 'System info, environment, process' },
            { name: 'crypto', desc: 'Hashing, encryption, random' },
            { name: 'graphics', desc: 'Canvas drawing, shapes, images' },
            { name: 'audio', desc: 'Audio context, oscillators, effects' },
          ].map(mod => (
            <div key={mod.name} className="bg-secondary/30 p-3 rounded">
              <span className="font-mono text-primary font-bold">{mod.name}</span>
              <p className="text-xs text-muted-foreground">{mod.desc}</p>
            </div>
          ))}
        </div>
        
        <p className="text-sm text-muted-foreground mt-4">
          Use the Command Explorer tab to browse all available commands.
        </p>
      </div>
    ),
  },
];

export function DocsPanel() {
  const [selectedDoc, setSelectedDoc] = useState<string>('getting-started');

  const currentDoc = DOCS.find(d => d.id === selectedDoc);

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-48 border-r border-border p-2">
        {DOCS.map(doc => (
          <button
            key={doc.id}
            onClick={() => setSelectedDoc(doc.id)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors",
              selectedDoc === doc.id 
                ? "bg-accent text-accent-foreground" 
                : "hover:bg-accent/50 text-muted-foreground"
            )}
          >
            {doc.icon}
            {doc.title}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-2xl">
          {currentDoc?.content}
        </div>
      </ScrollArea>
    </div>
  );
}
