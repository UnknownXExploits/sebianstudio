import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight } from 'lucide-react';
import { Book, Code, Cpu, Shield, Layers, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const CodeBlock = ({ children }: { children: string }) => (
  <pre className="bg-secondary/50 p-3 rounded text-sm overflow-x-auto font-mono">{children}</pre>
);

const DOCS: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <Book className="h-4 w-4" />,
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Welcome to Sebian</h2>
        <p className="text-muted-foreground">
          Sebian is a custom programming language that runs on SebianVM — a real virtual machine
          that executes bytecode directly. No JavaScript transpilation!
        </p>
        
        <h3 className="text-lg font-semibold mt-6">Your First Program</h3>
        <CodeBlock>{`// Hello World in Sebian
from core import print

Create text hello [
  content="Hello, Sebian!"
  style="font-size: 24px; font-weight: 600;"
]

print("Hello from SebianVM!")`}</CodeBlock>
        
        <h3 className="text-lg font-semibold mt-6">Key Concepts</h3>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li><strong>Imports</strong> — <code>from module import name</code> or <code>Import name from module</code></li>
          <li><strong>Variables</strong> — <code>local x = 0</code> (always use <code>local</code>)</li>
          <li><strong>Functions</strong> — <code>function name() [ body ]</code> (square brackets, NOT braces)</li>
          <li><strong>UI</strong> — <code>Create type name [ property=value ]</code></li>
          <li><strong>Events</strong> — <code>onClick.function=handlerName</code></li>
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
        <h2 className="text-xl font-bold">Sebian Syntax Reference v2.0</h2>
        
        <h3 className="text-lg font-semibold">Imports</h3>
        <CodeBlock>{`// Preferred syntax
from core import print
from math import PI, sqrt, random

// Alternative syntax
Import print from core`}</CodeBlock>
        <p className="text-xs text-destructive mt-1">❌ NEVER: <code>import {'{ print }'} from 'core'</code> — No braces, no quotes on modules</p>
        
        <h3 className="text-lg font-semibold mt-4">Variables</h3>
        <CodeBlock>{`// Always use 'local' to declare
local counter = 0
local message = "Hello"
local active = true

// Assignment after declaration
counter = counter + 1`}</CodeBlock>
        <p className="text-xs text-destructive mt-1">❌ NEVER: <code>let</code>, <code>const</code>, <code>var</code>, <code>:=</code></p>
        
        <h3 className="text-lg font-semibold mt-4">Functions</h3>
        <CodeBlock>{`function greet(name) [
  return "Hello, " + name
]

function factorial(n) [
  if n <= 1 [
    return 1
  ]
  return n * factorial(n - 1)
]

local result = greet("World")`}</CodeBlock>
        <p className="text-xs text-destructive mt-1">❌ NEVER: <code>{'function() { }'}</code> — Use <code>[ ]</code> not <code>{'{ }'}</code>. No arrow functions.</p>
        
        <h3 className="text-lg font-semibold mt-4">UI Components</h3>
        <CodeBlock>{`Create container app [
  style="display: flex; gap: 10px; padding: 20px;"
]

Create text greeting [
  content="Hello World"
  style="font-size: 24px; font-weight: bold;"
]

Create button submit [
  text="Click Me"
  style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px;"
  onClick.function=handleClick
]

Create input nameField [
  placeholder="Enter name"
  style="padding: 10px; border: 1px solid #ccc;"
]`}</CodeBlock>
        <p className="text-xs text-destructive mt-1">❌ NEVER: JSX tags, braces for properties, colons, commas between props</p>
        
        <h3 className="text-lg font-semibold mt-4">Control Flow</h3>
        <CodeBlock>{`if count > 10 [
  print("Big number")
] else [
  print("Small number")
]

while running [
  processNext()
]

for item in items [
  print(item)
]

for i in range(10) [
  print(i)
]`}</CodeBlock>
        <p className="text-xs text-destructive mt-1">❌ NEVER: parentheses around conditions, braces for blocks</p>

        <h3 className="text-lg font-semibold mt-4">Operators</h3>
        <CodeBlock>{`// Arithmetic: + - * / % ^
// Comparison: == != < <= > >=
// Logical: and or not (NOT && || !)

if x > 0 and not finished [
  print("Still going")
]`}</CodeBlock>
      </div>
    ),
  },
  {
    id: 'memory',
    title: 'Memory Functions',
    icon: <Database className="h-4 w-4" />,
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Memory Module (Level 1)</h2>
        <p className="text-muted-foreground">
          C++ style memory management. Allocate buffers, read/write bytes at offsets.
          Requires Sandbox Level 1 (Full Power).
        </p>
        
        <h3 className="text-lg font-semibold mt-4">Basic Usage</h3>
        <CodeBlock>{`from memory import alloc, read, write, free

// Allocate 1024 bytes
local buf = alloc(1024)

// Write bytes at offset 0
write(buf, 0, [72, 101, 108, 108, 111])

// Read 5 bytes from offset 0
local bytes = read(buf, 0, 5)
print(bytes)  // [72, 101, 108, 108, 111]

// Free memory
free(buf)`}</CodeBlock>
        
        <h3 className="text-lg font-semibold mt-4">Typed Access</h3>
        <CodeBlock>{`from memory import alloc, readInt32, writeInt32, readFloat64, writeFloat64

local buf = alloc(256)

// Write/read 32-bit integers
writeInt32(buf, 0, 42)
local val = readInt32(buf, 0)
print(val)  // 42

// Write/read 64-bit floats
writeFloat64(buf, 8, 3.14159)
local pi = readFloat64(buf, 8)
print(pi)  // 3.14159`}</CodeBlock>

        <h3 className="text-lg font-semibold mt-4">String Operations</h3>
        <CodeBlock>{`from memory import alloc, readString, writeString

local buf = alloc(256)
writeString(buf, 0, "Hello World")
local str = readString(buf, 0)
print(str)  // Hello World`}</CodeBlock>

        <h3 className="text-lg font-semibold mt-4">Memory Copy</h3>
        <CodeBlock>{`from memory import alloc, copy, write, read

local src = alloc(64)
local dst = alloc(64)

write(src, 0, [1, 2, 3, 4, 5])
copy(src, 0, dst, 0, 5)

local result = read(dst, 0, 5)
print(result)  // [1, 2, 3, 4, 5]`}</CodeBlock>

        <h3 className="text-lg font-semibold mt-4">Available Functions</h3>
        <div className="grid gap-2 mt-2">
          {[
            { name: 'alloc(size)', desc: 'Allocate memory buffer, returns handle' },
            { name: 'read(handle, offset, size)', desc: 'Read bytes as array' },
            { name: 'write(handle, offset, bytes[])', desc: 'Write byte array' },
            { name: 'free(handle)', desc: 'Free allocated memory' },
            { name: 'size(handle)', desc: 'Get buffer size in bytes' },
            { name: 'readInt32(handle, offset)', desc: 'Read 32-bit signed integer' },
            { name: 'writeInt32(handle, offset, val)', desc: 'Write 32-bit integer' },
            { name: 'readFloat64(handle, offset)', desc: 'Read 64-bit float' },
            { name: 'writeFloat64(handle, offset, val)', desc: 'Write 64-bit float' },
            { name: 'readString(handle, offset, maxLen?)', desc: 'Read null-terminated string' },
            { name: 'writeString(handle, offset, str)', desc: 'Write null-terminated string' },
            { name: 'copy(src, srcOff, dst, dstOff, size)', desc: 'Copy between buffers' },
          ].map(fn => (
            <div key={fn.name} className="bg-secondary/30 p-2 rounded">
              <code className="text-primary font-bold text-xs">{fn.name}</code>
              <p className="text-[10px] text-muted-foreground">{fn.desc}</p>
            </div>
          ))}
        </div>
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
          <li><strong>Stack</strong> — Operand stack for computations</li>
          <li><strong>Call Frames</strong> — Function call stack with locals</li>
          <li><strong>Heap</strong> — Object storage with garbage collection</li>
          <li><strong>Modules</strong> — Loaded module registry</li>
          <li><strong>UI Tree</strong> — Virtual UI node hierarchy</li>
          <li><strong>Memory</strong> — Virtual memory buffers (Level 1)</li>
        </ul>
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
              Level 3 — Restricted
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
              Level 2 — Standard (Default)
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
              Level 1 — Full Power
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Unrestricted. DOM, host, <strong>memory access</strong>, and unsafe net.
              <strong> Requires explicit confirmation!</strong>
            </p>
            <p className="text-xs mt-2">
              Capabilities: <code>+ host, dom, buffer, memory, unsafe_net</code>
            </p>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mt-6">Switching Levels</h3>
        <CodeBlock>{`Import SebianVM from Sebian
SebianVM.tools.functions.sandbox.level = 1
from sandbox.level do function.run`}</CodeBlock>
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
        
        <div className="grid gap-3 mt-4">
          {[
            { name: 'core', desc: 'print, type, len, str, num, bool, keys, values, range' },
            { name: 'math', desc: 'PI, E, abs, floor, ceil, sqrt, pow, sin, cos, random, randint, min, max, clamp' },
            { name: 'string', desc: 'upper, lower, trim, split, join, replace, contains, starts_with, ends_with, substr, repeat' },
            { name: 'array', desc: 'push, pop, shift, unshift, slice, concat, reverse, includes, index_of, fill' },
            { name: 'ui', desc: 'create, set_prop, add_child, render, alert, prompt, confirm' },
            { name: 'fs', desc: 'read, write, exists, delete, list (virtual file system)' },
            { name: 'net', desc: 'fetch, get, post (proxied networking)' },
            { name: 'time', desc: 'now, timestamp, format' },
            { name: 'memory', desc: 'alloc, read, write, free, readInt32, writeFloat64, copy (Level 1 only)' },
          ].map(mod => (
            <div key={mod.name} className="bg-secondary/30 p-3 rounded">
              <span className="font-mono text-primary font-bold">{mod.name}</span>
              <p className="text-xs text-muted-foreground">{mod.desc}</p>
            </div>
          ))}
        </div>
        
        <h3 className="text-lg font-semibold mt-4">Import Syntax</h3>
        <CodeBlock>{`// Import specific functions
from core import print, len
from math import PI, sqrt

// Import module
Import SebianVM from Sebian`}</CodeBlock>
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
