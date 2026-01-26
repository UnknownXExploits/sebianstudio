import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Complete Sebian Language Grammar Reference
const SEBIAN_GRAMMAR = `
═══════════════════════════════════════════════════════════════════
                    SEBIAN LANGUAGE SPECIFICATION
═══════════════════════════════════════════════════════════════════

⚠️ CRITICAL: Sebian is NOT JavaScript/TypeScript/Python/HTML/JSX.
   NEVER use: { } for objects, : for properties, => arrows, <tags>

═══════════════════════════════════════════════════════════════════
1. COMMENTS
═══════════════════════════════════════════════════════════════════
   // single line comment
   # alternative single line comment
   /* multi-line
      comment */

═══════════════════════════════════════════════════════════════════
2. IMPORTS (two forms)
═══════════════════════════════════════════════════════════════════
   Form A: from <module> import <name1>, <name2>
   Form B: Import <name> from <module>
   
   CORRECT:
     from core import print
     from core import print, alert
     Import print from core
   
   WRONG (JavaScript):
     import { print } from 'core'   ❌ NO braces, NO quotes on module

═══════════════════════════════════════════════════════════════════
3. VARIABLES
═══════════════════════════════════════════════════════════════════
   Declaration:  local <name> = <value>
   Assignment:   <name> = <expression>
   
   CORRECT:
     local count = 0
     local message = "hello"
     local isActive = true
     local items = null
     count = count + 1
   
   WRONG (JavaScript):
     let count = 0      ❌ Use 'local' not 'let'
     const x = 5        ❌ Use 'local' not 'const'
     var y = 10         ❌ Use 'local' not 'var'

═══════════════════════════════════════════════════════════════════
4. DATA TYPES
═══════════════════════════════════════════════════════════════════
   Numbers:    42, 3.14, -7, 1e10
   Strings:    "double quotes" or 'single quotes'
   Booleans:   true, false (or True, False)
   Null:       null (or Null)
   
   String escapes: \\n \\t \\r \\" \\' \\\\

═══════════════════════════════════════════════════════════════════
5. OPERATORS
═══════════════════════════════════════════════════════════════════
   Arithmetic:  + - * / % ^
   Comparison:  == != < <= > >=
   Logical:     and or not (NOT && || !)
   Assignment:  =
   
   CORRECT:
     if count > 0 and isActive [...]
   
   WRONG (JavaScript):
     if (count > 0 && isActive) {...}   ❌ NO &&, use 'and'

═══════════════════════════════════════════════════════════════════
6. FUNCTIONS
═══════════════════════════════════════════════════════════════════
   Syntax: function <name>(<params>) [ <body> ]
   
   - Use [ ] for function body, NOT { }
   - Parameters are plain identifiers (NO types, NO defaults)
   - Use 'return' to return values
   
   CORRECT:
     function greet() [
       print("Hello!")
     ]
     
     function add(a, b) [
       return a + b
     ]
     
     function handleClick() [
       count = count + 1
       print("Clicked: " + count)
     ]
   
   WRONG (JavaScript):
     function greet() { ... }           ❌ Use [ ] not { }
     const greet = () => { ... }        ❌ NO arrow functions
     function add(a: number) { ... }    ❌ NO type annotations

═══════════════════════════════════════════════════════════════════
7. UI COMPONENTS (Create blocks)
═══════════════════════════════════════════════════════════════════
   Syntax: Create <type> <optionalName> [ <properties> ]
   
   - Each property on its OWN LINE
   - Properties use = NOT :
   - NO commas between properties
   - String values in double quotes
   - Event handlers: onClick.function=<functionName>
   
   Available types: container, row, column, text, button, input, image
   
   CORRECT:
     Create container app [
       style="display: flex; padding: 20px;"
     ]
     
     Create text greeting [
       content="Hello World"
       style="font-size: 24px; color: blue;"
     ]
     
     Create button submit [
       text="Click Me"
       style="padding: 10px 20px; border-radius: 8px;"
       onClick.function=handleClick
     ]
     
     Create input nameField [
       placeholder="Enter name"
       value=""
       style="padding: 8px; border: 1px solid gray;"
     ]

   WRONG (JavaScript/React):
     <button onClick={handleClick}>     ❌ NO JSX tags
     Create button { text: "Hi" }       ❌ NO braces, NO colons
     Create button [text="Hi",]         ❌ NO commas
     onClick: handleClick               ❌ Use onClick.function=

═══════════════════════════════════════════════════════════════════
8. CONTROL FLOW
═══════════════════════════════════════════════════════════════════
   IF/ELSE (use [ ] for blocks):
     if <condition> [
       // statements
     ] else [
       // statements
     ]
   
   WHILE loop:
     while <condition> [
       // statements
     ]
   
   FOR loop:
     for <variable> in <iterable> [
       // statements
     ]
   
   CORRECT:
     if count > 10 [
       print("Big number")
     ] else [
       print("Small number")
     ]
     
     while running [
       doSomething()
     ]
   
   WRONG (JavaScript):
     if (count > 10) { ... }    ❌ NO parentheses, NO braces

═══════════════════════════════════════════════════════════════════
9. RETURN STATEMENTS
═══════════════════════════════════════════════════════════════════
   return <expression>
   return   // returns null
   
   CORRECT:
     function double(x) [
       return x * 2
     ]

═══════════════════════════════════════════════════════════════════
10. FUNCTION CALLS
═══════════════════════════════════════════════════════════════════
    <name>(<arguments>)
    
    CORRECT:
      print("Hello")
      print("Count: " + count)
      result = add(5, 3)
      doSomething()

═══════════════════════════════════════════════════════════════════
11. COMPLETE WORKING EXAMPLE
═══════════════════════════════════════════════════════════════════

// Counter Application
from core import print

local count = 0

function increment() [
  count = count + 1
  print("Count is now: " + count)
]

function decrement() [
  count = count - 1
  print("Count is now: " + count)
]

function reset() [
  count = 0
  print("Counter reset")
]

Create container app [
  style="display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 32px; font-family: sans-serif;"
]

Create text title [
  content="Counter App"
  style="font-size: 28px; font-weight: bold; color: #333;"
]

Create text display [
  content="0"
  style="font-size: 64px; font-weight: bold;"
]

Create row buttons [
  style="display: flex; gap: 12px;"
]

Create button minusBtn [
  text="-"
  style="padding: 12px 24px; font-size: 20px; border-radius: 8px; background: #ef4444; color: white; border: none; cursor: pointer;"
  onClick.function=decrement
]

Create button plusBtn [
  text="+"
  style="padding: 12px 24px; font-size: 20px; border-radius: 8px; background: #22c55e; color: white; border: none; cursor: pointer;"
  onClick.function=increment
]

Create button resetBtn [
  text="Reset"
  style="padding: 12px 24px; font-size: 16px; border-radius: 8px; background: #6b7280; color: white; border: none; cursor: pointer;"
  onClick.function=reset
]

print("Counter app ready!")

═══════════════════════════════════════════════════════════════════
COMMON ERRORS AND FIXES
═══════════════════════════════════════════════════════════════════
ERROR: "Expected '=' after property"
  → You used ':' instead of '=' in Create block
  FIX: text="Hello" NOT text: "Hello"

ERROR: "Expected property name"  
  → You used commas or JS object syntax
  FIX: Each property on new line, no commas

ERROR: "Expected '(' after 'function'"
  → You wrote arrow function or wrong syntax
  FIX: function name() [ ] NOT const name = () => {}

ERROR: "Expected ']' after block"
  → You used { } instead of [ ]
  FIX: function name() [ body ] NOT function name() { body }

ERROR: "Unexpected character"
  → You used && || or other JS operators
  FIX: Use 'and' 'or' 'not' instead
`;

const getSystemPrompt = (mode: string, existingCode?: string) => {
  const basePrompt = `You are an expert Sebian programmer. You MUST output valid Sebian code.

${SEBIAN_GRAMMAR}

═══════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════
${mode === 'modify' ? `MODIFY the existing Sebian code below according to user instructions.

EXISTING CODE:
${existingCode || '(empty)'}

Preserve working parts, only change what's needed.` : `Generate NEW Sebian code that implements what the user describes.`}

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT (STRICT JSON)
═══════════════════════════════════════════════════════════════════
Return ONLY valid JSON with exactly two fields:
{"code":"<sebian source code here>","explanation":"<brief description>"}

- Put the Sebian code in the "code" field
- Keep explanation under 50 words
- NO markdown, NO code fences, NO extra text

═══════════════════════════════════════════════════════════════════
SELF-CHECK BEFORE RESPONDING
═══════════════════════════════════════════════════════════════════
Before returning, verify:
✓ All functions use [ ] NOT { }
✓ All Create blocks use [ ] with = for properties
✓ Each property is on its own line, NO commas
✓ Used 'local' for variables, NOT let/const/var
✓ Used 'and'/'or'/'not', NOT &&/||/!
✓ Event handlers use onClick.function=name format
✓ Imports use: from module import name
✓ NO JavaScript/TypeScript/JSX syntax anywhere`;

  return basePrompt;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, mode, existingCode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const systemPrompt = getSystemPrompt(mode, existingCode);

    // Try Lovable AI first
    if (LOVABLE_API_KEY) {
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            try {
              const parsed = JSON.parse(content);
              return new Response(JSON.stringify(parsed), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            } catch {
              return new Response(JSON.stringify({ explanation: content }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }
        }
        
        if (response.status === 429) {
          console.log("Lovable AI rate limited, falling back to Pollinations");
        } else if (response.status === 402) {
          console.log("Lovable AI payment required, falling back to Pollinations");
        }
      } catch (e) {
        console.error("Lovable AI error:", e);
      }
    }

    // Fallback to Pollinations
    console.log("Using Pollinations fallback");
    const pollinationsResponse = await fetch('https://text.pollinations.ai/', {
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

    if (!pollinationsResponse.ok) {
      throw new Error('Both AI providers failed');
    }

    const text = await pollinationsResponse.text();
    try {
      const parsed = JSON.parse(text);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ explanation: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (e) {
    console.error("sebian-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
