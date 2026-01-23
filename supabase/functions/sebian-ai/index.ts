import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, mode, existingCode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const systemPrompt = mode === 'modify'
      ? `You are an expert Sebian programmer and must output VALID Sebian every time.

ABSOLUTE RULES (non-negotiable):
- This is NOT JavaScript/TypeScript/React/HTML. NEVER output braces {}, colons :, commas in objects, JSX tags <...>, or arrow functions =>.
- Return STRICT JSON with exactly: {"code":"...","explanation":"..."}. No markdown.
- Put Sebian source ONLY inside the JSON field "code".

Sebian GRAMMAR (use ONLY these forms):
1) Imports:
   from core import print

2) Variables:
   local name = value
   name = expression

3) Functions:
   function name() [
     // statements
   ]
   function name(arg1, arg2) [
     // statements
   ]
   NOTE: parameters are IDENTIFIERS only. No types. No default values.

4) UI nodes:
   Create <type> <optionalName> [
     property=value
     property="string"
     onClick.function=someFunction
   ]
   NOTES:
   - Properties are ONE per line, NO commas.
   - Property assignment MUST use '=' (not ':').
   - Nested dot properties are allowed ONLY like: onClick.function=handler
   - Do NOT invent other event shapes.
   - Strings MUST be double-quoted.

COMMON PARSER ERRORS TO AVOID:
- "Expected property name" / "Expected '=' after property": means you used ':' or commas or JSON-like syntax. Don't.
- "Expected '(' after 'function'": always write: function name(args) [ ... ]

TASK: Modify the existing Sebian code to satisfy the user.

Existing code:
${existingCode || ''}

Before returning, SELF-CHECK:
1) Every Create block has [ ... ] and each property line uses '='.
2) Every function has () then [ ... ].
3) No JS/TS tokens, no braces, no JSX.

Respond with JSON: {"code":"modified sebian code","explanation":"what you changed"}`
      : `You are an expert Sebian programmer and must output VALID Sebian every time.

ABSOLUTE RULES (non-negotiable):
- This is NOT JavaScript/TypeScript/React/HTML. NEVER output braces {}, colons :, commas in objects, JSX tags <...>, or arrow functions =>.
- Return STRICT JSON with exactly: {"code":"...","explanation":"..."}. No markdown.
- Put Sebian source ONLY inside the JSON field "code".

Sebian GRAMMAR (use ONLY these forms):
1) Imports:
   from core import print

2) Variables:
   local name = value
   name = expression

3) Functions:
   function name() [
     // statements
   ]
   function name(arg1, arg2) [
     // statements
   ]
   NOTE: parameters are IDENTIFIERS only. No types. No default values.

4) UI nodes:
   Create <type> <optionalName> [
     property=value
     property="string"
     onClick.function=someFunction
   ]
   NOTES:
   - Properties are ONE per line, NO commas.
   - Property assignment MUST use '=' (not ':').
   - Nested dot properties are allowed ONLY like: onClick.function=handler
   - Strings MUST be double-quoted.

COMMON PARSER ERRORS TO AVOID:
- "Expected property name" / "Expected '=' after property": means you used ':' or commas or JSON-like syntax. Don't.
- "Expected '(' after 'function'": always write: function name(args) [ ... ]

TASK: Generate Sebian code that satisfies the user.

WORKING EXAMPLE (copy patterns exactly):
from core import print

local count = 0

function increment() [
  count = count + 1
  print("count=" + count)
]

Create container app [
  style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 24px;"
]

Create text label [
  content="Counter"
  style="font-size: 18px; font-weight: 600;"
]

Create button upBtn [
  text="+"
  style="padding: 10px 18px; border-radius: 10px;"
  onClick.function=increment
]

Before returning, SELF-CHECK:
1) Every Create block has [ ... ] and each property line uses '='.
2) Every function has () then [ ... ].
3) No JS/TS tokens, no braces, no JSX.

Respond with JSON: {"code":"sebian code here","explanation":"brief explanation"}`;

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
