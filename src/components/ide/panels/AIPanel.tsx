import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Send, Copy, Plus, Loader2, Code, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIPanelProps {
  onInsertCode: (code: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  code?: string;
}

export function AIPanel({ onInsertCode }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I can help you write Sebian code. Try asking me to:\n• Generate a counter app\n• Explain Sebian syntax\n• Create UI components\n• Fix errors in your code',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'generate' | 'explain'>('generate');

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Try Pollinations first
      const response = await generateWithPollinations(input, mode);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.explanation || '',
        code: response.code,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Fallback - provide a template response
      const fallbackMessage: Message = {
        role: 'assistant',
        content: 'Here\'s a template based on your request:',
        code: generateFallbackCode(input),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateWithPollinations = async (prompt: string, mode: 'generate' | 'explain') => {
    const systemPrompt = mode === 'generate' 
      ? `You are an expert Sebian programmer. Generate Sebian code based on user requests.
Sebian syntax:
- Import X from Y
- from module import function
- Create type [ properties... ]
- local variable = value
- function name(args) [ body ]
- Repeat local element creation [ ... ]

Respond with JSON: { "code": "sebian code here", "explanation": "brief explanation" }`
      : `You are an expert at explaining Sebian code. Explain what the code does clearly.
Respond with JSON: { "explanation": "your explanation" }`;

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

    if (!response.ok) {
      throw new Error('Pollinations API failed');
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { explanation: text };
    }
  };

  const generateFallbackCode = (prompt: string): string => {
    const lower = prompt.toLowerCase();
    
    if (lower.includes('counter')) {
      return `// Counter App
Import SebianVM from Sebian
Import UI from sebian

local count = 0

function increment()
[
  count = count + 1
  updateDisplay()
]

function decrement()
[
  count = count - 1
  updateDisplay()
]

Create container
[
  Create text
  [
    id= "display"
    content= "Count: 0"
    style= "font-size: 32px; text-align: center;"
  ]
  
  Create button
  [
    text= "+"
    onClick.function= increment
  ]
  
  Create button
  [
    text= "-"
    onClick.function= decrement
  ]
]

from ui import render
render(container)`;
    }
    
    if (lower.includes('button')) {
      return `// Button Example
Import UI from sebian

function handleClick()
[
  // Button clicked!
]

Create button
[
  text= "Click Me"
  style= "padding: 12px 24px; background: #00ff88;"
  onClick.function= handleClick
]

from ui import render
render(button)`;
    }
    
    return `// Generated Template
Import SebianVM from Sebian
Import UI from sebian

Create container
[
  Create text
  [
    content= "Hello, Sebian!"
    style= "font-size: 24px; color: #00ff88;"
  ]
]

from ui import render
render(container)`;
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
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Button
          variant={mode === 'generate' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMode('generate')}
          className="gap-1.5"
        >
          <Code className="h-3.5 w-3.5" />
          Generate
        </Button>
        <Button
          variant={mode === 'explain' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMode('explain')}
          className="gap-1.5"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Explain
        </Button>
        <Badge variant="secondary" className="ml-auto text-xs">
          <Sparkles className="h-3 w-3 mr-1" />
          Pollinations AI
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col gap-2",
                message.role === 'user' && "items-end"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg p-3",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              
              {message.code && (
                <div className="max-w-[85%] w-full">
                  <div className="bg-secondary/50 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
                      <span className="text-xs text-muted-foreground">Generated Code</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCode(message.code!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onInsertCode(message.code!)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <pre className="p-3 text-xs overflow-x-auto max-h-60">
                      {message.code}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generating...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'generate'
                ? "Describe what you want to build..."
                : "Paste code to explain..."
            }
            className="min-h-[60px] max-h-32 resize-none"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="self-end"
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
