import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Send, Copy, Wand2, Loader2, Code, MessageSquare, Replace } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIPanelProps {
  onInsertCode: (code: string) => void;
  onReplaceCode: (code: string) => void;
  currentCode?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  code?: string;
}

export function AIPanel({ onInsertCode, onReplaceCode, currentCode = '' }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 I can help you write Sebian code!\n\n• "Create a counter app"\n• "Add a button that increments"\n• "Fix my code"\n\nClick "Apply" to replace your code directly!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'generate' | 'modify'>('generate');

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateWithPollinations(input, mode, currentCode);
      const code = response.code || generateFallbackCode(input);
      
      // Auto-apply the code
      if (code) {
        onReplaceCode(code);
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.explanation || '✅ Code applied!',
        code,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const code = generateFallbackCode(input);
      
      // Auto-apply fallback code
      onReplaceCode(code);
      
      const fallbackMessage: Message = {
        role: 'assistant',
        content: '✅ Code applied!',
        code,
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateWithPollinations = async (prompt: string, mode: 'generate' | 'modify', existingCode: string) => {
    const systemPrompt = mode === 'modify' 
      ? `You are an expert Sebian programmer. Modify the existing code based on user requests.
Sebian syntax:
- Import X from Y
- from module import function
- Create type [ properties... ]
- local variable = value
- function name(args) [ body ]
- Repeat local element creation [ ... ]

Existing code:
${existingCode}

Modify this code according to the user's request. Respond with JSON: { "code": "modified sebian code", "explanation": "what you changed" }`
      : `You are an expert Sebian programmer. Generate Sebian code based on user requests.
Sebian syntax:
- Import X from Y
- from module import function
- Create type [ properties... ]
- local variable = value
- function name(args) [ body ]
- Repeat local element creation [ ... ]

Respond with JSON: { "code": "sebian code here", "explanation": "brief explanation" }`;

    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        model: 'openai',
        jsonMode: true,
      }),
    });

    if (!response.ok) throw new Error('API failed');

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { explanation: text };
    }
  };

  const generateFallbackCode = (prompt: string): string => {
    const lower = prompt.toLowerCase();
    
    // Counter App (Sebian syntax, no JS)
    if (lower.includes('counter')) {
      return `// Counter App - Sebian

from core import print

local count = 0

function increment() [
  count = count + 1
  print("count=" + count)
]

function decrement() [
  count = count - 1
  print("count=" + count)
]

// UI (Create auto-renders)
Create container app [
  style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 24px;"
]

Create text label [
  content="Counter"
  style="font-size: 18px; font-weight: 600;"
]

Create text display [
  content="0"
  style="font-size: 40px; font-weight: 700;"
]

Create row controls [
  style="display: flex; gap: 10px;"
]

Create button downBtn [
  text="-"
  style="padding: 10px 18px; border-radius: 10px;"
  onClick.function=decrement
]

Create button upBtn [
  text="+"
  style="padding: 10px 18px; border-radius: 10px;"
  onClick.function=increment
]

print("Counter ready")`;
    }
    
    // Button/click example
    if (lower.includes('button') || lower.includes('click')) {
      return `// Button Example - Sebian

from core import print

function handleClick() [
  print("Button clicked")
]

Create button myButton [
  text="Click me"
  style="padding: 12px 18px; border-radius: 10px;"
  onClick.function=handleClick
]
`;
    }
    
    // Hello world default
    return `// Hello Sebian

from core import print

Create text hello [
  content="Hello, Sebian!"
  style="font-size: 24px; font-weight: 600;"
]

print("Hello from SebianVM")`;
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Mode Toggle */}
      <div className="flex items-center gap-1 p-2 border-b border-border flex-wrap">
        <Button
          variant={mode === 'generate' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMode('generate')}
          className="gap-1 h-7 text-xs"
        >
          <Code className="h-3 w-3" />
          New
        </Button>
        <Button
          variant={mode === 'modify' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMode('modify')}
          className="gap-1 h-7 text-xs"
        >
          <Wand2 className="h-3 w-3" />
          Modify
        </Button>
        <Badge variant="secondary" className="ml-auto text-[10px] h-5">
          <Sparkles className="h-2.5 w-2.5 mr-0.5" />
          AI
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {messages.map((message, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col gap-1.5",
                message.role === 'user' && "items-end"
              )}
            >
              <div
                className={cn(
                  "max-w-[90%] rounded-lg p-2",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                )}
              >
                <p className="text-xs whitespace-pre-wrap">{message.content}</p>
              </div>
              
              {message.code && (
                <div className="max-w-[90%] w-full">
                  <div className="bg-secondary/50 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-border">
                      <span className="text-[10px] text-muted-foreground">Code</span>
                      <div className="flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => copyCode(message.code!)}
                          title="Copy"
                        >
                          <Copy className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="h-5 px-2 text-[10px] gap-1"
                          onClick={() => onReplaceCode(message.code!)}
                          title="Apply to editor"
                        >
                          <Replace className="h-2.5 w-2.5" />
                          Apply
                        </Button>
                      </div>
                    </div>
                    <pre className="p-2 text-[10px] overflow-x-auto max-h-32 leading-tight">
                      {message.code}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">Generating...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-2 border-t border-border">
        <div className="flex gap-1.5">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'modify' ? "Describe changes..." : "What to build..."}
            className="min-h-[40px] max-h-20 resize-none text-xs"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
