import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Complete Sebian Language Grammar Reference - AUTHORITATIVE VERSION
const SEBIAN_GRAMMAR = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    SEBIAN LANGUAGE SPECIFICATION v2.0                        ║
║                         AUTHORITATIVE REFERENCE                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

⚠️⚠️⚠️ CRITICAL WARNING ⚠️⚠️⚠️
Sebian is a COMPLETELY UNIQUE programming language. It is NOT:
- JavaScript / TypeScript
- Python
- HTML / JSX / React
- Any other language you know

NEVER use syntax from other languages. Follow this specification EXACTLY.

═══════════════════════════════════════════════════════════════════════════════
SECTION 1: KEYWORDS (Case-Insensitive - both forms work)
═══════════════════════════════════════════════════════════════════════════════
Import/import    from/From       Create/create    Repeat/repeat
local/Local      function/Function    if/If       else/Else
while/While      for/For         return/Return    true/True/TRUE
false/False/FALSE    null/Null/NULL    and/And    or/Or
not/Not          do/Do

═══════════════════════════════════════════════════════════════════════════════
SECTION 2: COMMENTS
═══════════════════════════════════════════════════════════════════════════════
// Single line comment (C-style)
# Single line comment (Python-style)  
/* Multi-line
   comment */

═══════════════════════════════════════════════════════════════════════════════
SECTION 3: IMPORTS (Two syntaxes available)
═══════════════════════════════════════════════════════════════════════════════
SYNTAX A (Preferred):
  from <module> import <name1>, <name2>, ...
  
SYNTAX B (Alternative):
  Import <name> from <module>

AVAILABLE MODULES (these are the ONLY modules and ONLY exports the SebianVM interpreter
actually provides — do not invent functions that aren't in this list):

  core    → print, type, len, str, num, bool, keys, values, range
  math    → PI, E, TAU, INFINITY,
            abs, floor, ceil, round, sqrt, pow,
            sin, cos, tan, asin, acos, atan, atan2,
            log, log10, log2, exp,
            random, randint, min, max, clamp, sign
  string  → upper, lower, trim, split, join, replace, contains,
            starts_with, ends_with, substr, char_at, index_of, repeat,
            pad_start, pad_end
  array   → push, pop, shift, unshift, slice, concat, reverse,
            includes, index_of, fill
  ui      → create, set_prop, append, render,
            tracker, buttons, inputs, containers, text, SebianVM
            (Note: there is NO ui.add_child / alert / prompt / confirm —
             use 'append' to nest nodes, and prefer the top-level
             'Create <type> name [ ... ]' syntax for building UI.)
  time    → now, timestamp, format
            (Note: there is NO time.sleep / parse_date.)
  fs      → read, write, exists, delete, list   (Sandbox Level 2+)
  net     → fetch                               (Sandbox Level 2+;
            there is NO net.get / net.post — only net.fetch)
  memory  → alloc, read, write, free, size,
            readInt32, writeInt32, readFloat64, writeFloat64,
            readString, writeString, copy        (Sandbox Level 1 only)
  sebian  → merged convenience module that re-exports both UI helpers
            and the SebianVM symbol, e.g.:
              Import SebianVM from sebian
              from sebian import SebianVM

CORRECT EXAMPLES:
  from core import print
  from core import print, len, str
  from math import PI, sqrt, random
  Import print from core

WRONG (JavaScript-style - DO NOT USE):
  import { print } from 'core'     ❌ No braces, no quotes on module
  import print from "core"         ❌ No quotes on module names
  require('core')                  ❌ No require

═══════════════════════════════════════════════════════════════════════════════
SECTION 4: VARIABLES
═══════════════════════════════════════════════════════════════════════════════
DECLARATION (always use 'local'):
  local <name> = <value>

ASSIGNMENT (after declaration):
  <name> = <new_value>

CORRECT EXAMPLES:
  local count = 0
  local message = "Hello World"
  local isActive = true
  local items = null
  local price = 19.99
  count = count + 1
  message = "Updated"

WRONG (JavaScript-style - DO NOT USE):
  let count = 0          ❌ Use 'local' not 'let'
  const x = 5            ❌ Use 'local' not 'const'  
  var y = 10             ❌ Use 'local' not 'var'
  count := 0             ❌ No := operator
  int count = 0          ❌ No type annotations

═══════════════════════════════════════════════════════════════════════════════
SECTION 5: DATA TYPES
═══════════════════════════════════════════════════════════════════════════════
NUMBERS:     42, 3.14, -7, 1e10, 0.5
STRINGS:     "double quotes" or 'single quotes'
BOOLEANS:    true, false (or True, False)
NULL:        null (or Null)

STRING ESCAPES: \\n (newline), \\t (tab), \\r (return), \\" \\' \\\\

═══════════════════════════════════════════════════════════════════════════════
SECTION 6: OPERATORS
═══════════════════════════════════════════════════════════════════════════════
ARITHMETIC:   +  -  *  /  %  ^
COMPARISON:   ==  !=  <  <=  >  >=
LOGICAL:      and  or  not
ASSIGNMENT:   =

CORRECT EXAMPLES:
  local sum = a + b
  local power = 2 ^ 10
  if count > 0 and isActive [...]
  if not finished [...]

WRONG (JavaScript-style - DO NOT USE):
  count && isActive      ❌ Use 'and' not '&&'
  count || backup        ❌ Use 'or' not '||'  
  !finished              ❌ Use 'not' not '!'
  count === 0            ❌ Use '==' not '==='
  count !== 0            ❌ Use '!=' not '!=='
  count++                ❌ No ++ operator (use count = count + 1)
  count += 1             ❌ No += operator (use count = count + 1)

═══════════════════════════════════════════════════════════════════════════════
SECTION 7: FUNCTIONS
═══════════════════════════════════════════════════════════════════════════════
SYNTAX:
  function <name>(<param1>, <param2>, ...) [
    <statements>
    return <value>
  ]

KEY RULES:
• Use [ ] (square brackets) for the function body, NOT { }
• Parameters are plain identifiers (no types, no defaults)
• Use 'return' to return a value (optional)
• Functions without return implicitly return null

CORRECT EXAMPLES:
  function greet() [
    print("Hello!")
  ]

  function add(a, b) [
    return a + b
  ]

  function handleClick() [
    count = count + 1
    print("Clicked!")
  ]

  function factorial(n) [
    if n <= 1 [
      return 1
    ]
    return n * factorial(n - 1)
  ]

WRONG (JavaScript-style - DO NOT USE):
  function greet() { ... }           ❌ Use [ ] not { }
  const greet = () => { ... }        ❌ No arrow functions
  function add(a: number) { ... }    ❌ No type annotations
  (x) => x + 1                       ❌ No arrow functions
  function greet() { return; }       ❌ Use [ ] not { }

═══════════════════════════════════════════════════════════════════════════════
SECTION 8: UI COMPONENTS (Create blocks)
═══════════════════════════════════════════════════════════════════════════════
SYNTAX:
  Create <type> <optionalName> [
    <property>=<value>
    <property>=<value>
    <eventType>.function=<functionName>
  ]

ELEMENT TYPES:
  container  → div-like wrapper element
  row        → horizontal flex container  
  column     → vertical flex container
  text       → text display element (uses 'content' property)
  button     → clickable button (uses 'text' property)
  input      → text input field (uses 'placeholder', 'value' properties)
  image      → image element (uses 'src', 'alt' properties)

PROPERTY RULES:
• Each property on its OWN LINE
• Use = (equals) for assignment, NOT :
• NO commas between properties
• String values in double quotes
• Event handlers: onClick.function=<functionName>

CORRECT EXAMPLES:
  Create container app [
    style="display: flex; flex-direction: column; padding: 20px;"
  ]

  Create text greeting [
    content="Hello World"
    style="font-size: 24px; font-weight: bold; color: #333;"
  ]

  Create button submit [
    text="Click Me"
    style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;"
    onClick.function=handleClick
  ]

  Create input nameField [
    placeholder="Enter your name"
    value=""
    style="padding: 10px; border: 1px solid #ccc; border-radius: 4px;"
  ]

  Create row buttonRow [
    style="display: flex; gap: 10px;"
  ]

  Create image logo [
    src="logo.png"
    alt="Company Logo"
    style="width: 100px; height: auto;"
  ]

WRONG (JSX/React-style - DO NOT USE):
  <button onClick={handleClick}>     ❌ NO JSX/HTML tags
  <div className="app">              ❌ NO JSX/HTML tags
  Create button { text: "Hi" }       ❌ NO braces, NO colons
  Create button [text="Hi",]         ❌ NO commas between properties
  Create button [text: "Hi"]         ❌ Use = not :
  onClick: handleClick               ❌ Use onClick.function=
  onClick={handleClick}              ❌ Use onClick.function=
  onClick={() => doSomething()}      ❌ Use onClick.function=

═══════════════════════════════════════════════════════════════════════════════
SECTION 9: CONTROL FLOW
═══════════════════════════════════════════════════════════════════════════════
IF/ELSE:
  if <condition> [
    <statements>
  ] else [
    <statements>
  ]

  if <condition> [
    <statements>
  ] else if <condition> [
    <statements>
  ] else [
    <statements>
  ]

WHILE LOOP:
  while <condition> [
    <statements>
  ]

FOR LOOP (iteration):
  for <variable> in <iterable> [
    <statements>
  ]

CORRECT EXAMPLES:
  if count > 10 [
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
  ]

WRONG (JavaScript-style - DO NOT USE):
  if (count > 10) { ... }     ❌ NO parentheses around condition, use [ ] not { }
  while (running) { ... }     ❌ NO parentheses, use [ ] not { }
  for (let i = 0; ...) { }    ❌ Use for...in syntax
  items.forEach(item => {})   ❌ No forEach, use for...in

═══════════════════════════════════════════════════════════════════════════════
SECTION 10: FUNCTION CALLS
═══════════════════════════════════════════════════════════════════════════════
SYNTAX:
  <name>(<arg1>, <arg2>, ...)

EXAMPLES:
  print("Hello")
  print("Count: " + count)
  local result = add(5, 3)
  local length = len(myArray)
  local rounded = floor(3.7)

═══════════════════════════════════════════════════════════════════════════════
SECTION 11: STRING CONCATENATION
═══════════════════════════════════════════════════════════════════════════════
Use the + operator:
  local greeting = "Hello, " + name + "!"
  print("Value: " + str(number))

WRONG:
  \`Hello, \${name}!\`     ❌ No template literals
  f"Hello, {name}!"       ❌ No f-strings

═══════════════════════════════════════════════════════════════════════════════
SECTION 11b: MEMORY MODULE (C++ style low-level memory — Sandbox Level 1 only)
═══════════════════════════════════════════════════════════════════════════════
The 'memory' module gives Sebian programs raw byte-buffer access, similar to
malloc/free + pointer reads/writes in C/C++. It is only available when the
sandbox level is 1 (Unsafe / Host). Do NOT use it in level 2 or 3 code.

IMPORT:
  from memory import alloc, read, write, free, size
  from memory import readInt32, writeInt32, readFloat64, writeFloat64
  from memory import readString, writeString, copy

CORE FUNCTIONS:
  alloc(numBytes)              → returns a buffer handle (number id)
  free(buffer)                 → releases the buffer
  size(buffer)                 → byte length of the buffer
  read(buffer, offset)         → single byte (0-255) at offset
  write(buffer, offset, byte)  → store a single byte
  copy(dst, dstOffset, src, srcOffset, numBytes)

TYPED HELPERS (offset is in bytes):
  readInt32(buffer, offset)               → 32-bit signed int
  writeInt32(buffer, offset, value)
  readFloat64(buffer, offset)             → 64-bit float
  writeFloat64(buffer, offset, value)
  readString(buffer, offset, byteLength)  → utf-8 string
  writeString(buffer, offset, str)        → returns bytes written

CORRECT EXAMPLE:
  from core import print, str
  from memory import alloc, writeInt32, readInt32, writeString, readString, free, size

  local buf = alloc(64)
  writeInt32(buf, 0, 12345)
  writeString(buf, 8, "hello")
  print("int = " + str(readInt32(buf, 0)))
  print("str = " + readString(buf, 8, 5))
  print("size = " + str(size(buf)))
  free(buf)

RULES:
• A buffer handle is just a number — pass it around like any value
• Offsets are in bytes and must stay within size(buffer)
• Always free(buf) when done to release memory
• Do NOT use memory.* in Level 2/3 (sandboxed/UI) programs
• There is NO pointer arithmetic operator — use offsets explicitly

WRONG (C / JS style — DO NOT USE):
  malloc(64)            ❌ Use alloc(64)
  *ptr = 5              ❌ Use write(buf, offset, 5)
  buf[0] = 5            ❌ Use write(buf, 0, 5)
  new ArrayBuffer(64)   ❌ Use alloc(64)
  delete buf            ❌ Use free(buf)

═══════════════════════════════════════════════════════════════════════════════
SECTION 12: COMPLETE WORKING EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

EXAMPLE 1: Counter Application
─────────────────────────────────────────────────────────────────────────────
// Counter App
from core import print

local count = 0

function increment() [
  count = count + 1
  print("Count: " + str(count))
]

function decrement() [
  count = count - 1
  print("Count: " + str(count))
]

function reset() [
  count = 0
  print("Counter reset to 0")
]

Create container app [
  style="display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 40px; font-family: system-ui, sans-serif;"
]

Create text title [
  content="Counter"
  style="font-size: 32px; font-weight: bold; color: #1f2937;"
]

Create text display [
  content="0"
  style="font-size: 72px; font-weight: bold; color: #3b82f6;"
]

Create row buttons [
  style="display: flex; gap: 12px;"
]

Create button minusBtn [
  text="-"
  style="width: 60px; height: 60px; font-size: 24px; background: #ef4444; color: white; border: none; border-radius: 12px; cursor: pointer;"
  onClick.function=decrement
]

Create button plusBtn [
  text="+"
  style="width: 60px; height: 60px; font-size: 24px; background: #22c55e; color: white; border: none; border-radius: 12px; cursor: pointer;"
  onClick.function=increment
]

Create button resetBtn [
  text="Reset"
  style="padding: 12px 24px; font-size: 16px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer; margin-top: 10px;"
  onClick.function=reset
]

print("Counter app loaded!")

EXAMPLE 2: Todo List
─────────────────────────────────────────────────────────────────────────────
// Simple Todo List
from core import print, len

local taskCount = 0

function addTask() [
  taskCount = taskCount + 1
  print("Added task #" + str(taskCount))
]

function clearTasks() [
  taskCount = 0
  print("All tasks cleared")
]

Create container todoApp [
  style="max-width: 400px; margin: 0 auto; padding: 24px; font-family: system-ui;"
]

Create text header [
  content="My Todo List"
  style="font-size: 24px; font-weight: bold; margin-bottom: 20px;"
]

Create row inputRow [
  style="display: flex; gap: 8px; margin-bottom: 16px;"
]

Create input taskInput [
  placeholder="Enter a new task..."
  style="flex: 1; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;"
]

Create button addBtn [
  text="Add Task"
  style="padding: 10px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;"
  onClick.function=addTask
]

Create button clearBtn [
  text="Clear All"
  style="width: 100%; padding: 10px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 12px;"
  onClick.function=clearTasks
]

EXAMPLE 3: Calculator Functions
─────────────────────────────────────────────────────────────────────────────
// Math utilities
from core import print, str
from math import sqrt, pow, PI

function square(n) [
  return n * n
]

function circleArea(radius) [
  return PI * radius * radius
]

function hypotenuse(a, b) [
  return sqrt(square(a) + square(b))
]

local side = 5
print("Square of " + str(side) + " is " + str(square(side)))
print("Area of circle with radius " + str(side) + " is " + str(circleArea(side)))
print("Hypotenuse of 3,4 triangle is " + str(hypotenuse(3, 4)))

═══════════════════════════════════════════════════════════════════════════════
SECTION 13: COMMON PARSER ERRORS AND HOW TO FIX THEM
═══════════════════════════════════════════════════════════════════════════════

ERROR: "Expected '=' after property"
  CAUSE: You used ':' instead of '=' in a Create block
  FIX: Change text: "Hello" → text="Hello"

ERROR: "Expected ']' after block"  
  CAUSE: You used { } instead of [ ]
  FIX: Change function name() { } → function name() [ ]

ERROR: "Expected '(' after 'function'"
  CAUSE: Arrow function or wrong syntax
  FIX: Change () => {} → function name() [ ]

ERROR: "Unexpected character: &" or "Unexpected character: |"
  CAUSE: You used && or ||
  FIX: Use 'and' and 'or' instead

ERROR: "Unexpected character: !"
  CAUSE: You used ! for negation
  FIX: Use 'not' instead

ERROR: "Undefined variable"
  CAUSE: Variable not declared with 'local'
  FIX: Add local before first assignment

ERROR: "Expected import name" / "Expected module name"
  CAUSE: Wrong import syntax (probably used braces or quotes)
  FIX: Use: from core import print

═══════════════════════════════════════════════════════════════════════════════
FORBIDDEN SYNTAX QUICK REFERENCE
═══════════════════════════════════════════════════════════════════════════════
❌ { }        → Use [ ] for all blocks
❌ :          → Use = in Create blocks
❌ ,          → No commas between properties in Create blocks
❌ let/const/var → Use local
❌ && || !    → Use and or not
❌ === !==    → Use == !=
❌ () => {}   → Use function name() [ ]
❌ <tag>      → Use Create type name [ ]
❌ className  → Use style="..."
❌ ++/--      → Use x = x + 1
❌ +=/-=      → Use x = x + value
❌ \`template\`  → Use "string" + value
❌ import {} from '' → Use from module import name
`;

const getSystemPrompt = (mode: string, existingCode?: string): string => {
  const taskSection = mode === 'modify' 
    ? `MODIFY the existing Sebian code below. Keep working parts, only change what's needed.

EXISTING CODE:
${existingCode || '(empty)'}`
    : `Generate NEW Sebian code that implements what the user describes.`;

  return `You are an expert Sebian programmer. You generate ONLY valid Sebian code.

${SEBIAN_GRAMMAR}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════
${taskSection}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (STRICT JSON)
═══════════════════════════════════════════════════════════════════════════════
Return ONLY valid JSON with exactly two fields:
{"code":"<sebian source code>","explanation":"<brief description under 50 words>"}

• Escape newlines as \\n in the code string
• NO markdown, NO code fences, NO extra text
• Only the JSON object

═══════════════════════════════════════════════════════════════════════════════
MANDATORY SELF-CHECK BEFORE RESPONDING
═══════════════════════════════════════════════════════════════════════════════
Before returning, verify ALL of these:
✓ All blocks use [ ] NOT { }
✓ All Create properties use = NOT :
✓ Each Create property is on its own line
✓ NO commas between Create properties  
✓ Used 'local' for variables, NOT let/const/var
✓ Used 'and'/'or'/'not', NOT &&/||/!
✓ Event handlers use onClick.function=name format
✓ Imports use: from module import name
✓ NO JavaScript/TypeScript/JSX syntax anywhere
✓ NO arrow functions, NO template literals
✓ NO HTML tags like <div> or <button>`;
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
