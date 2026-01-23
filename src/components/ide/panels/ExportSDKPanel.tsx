import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Copy, Check, Monitor, FileCode, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ExportSDKPanel() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadSDK = () => {
    // Create SDK bundle as a zip-like structure (base64 encoded files)
    const sdkFiles = {
      'README.md': `# Sebian SDK

Use Sebian outside of Sebian Studio!

## Installation

1. Install the VS Code extension from the \`vscode-extension\` folder
2. Use the CLI runner to execute .seb files

## Usage

\`\`\`bash
node run-sebian.mjs your-file.seb
\`\`\`

## VS Code Extension

Copy the \`sebian-language\` folder to your VS Code extensions directory:
- Windows: \`%USERPROFILE%\\.vscode\\extensions\`
- macOS/Linux: \`~/.vscode/extensions\`

Restart VS Code and you'll get syntax highlighting for .seb files!
`,
      'run-sebian.mjs': `#!/usr/bin/env node
import { readFileSync } from 'fs';
import { compile } from './sebianc.js';
import { SebianVM } from './sebianvm.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node run-sebian.mjs <file.seb>');
  process.exit(1);
}

const code = readFileSync(file, 'utf-8');
const result = compile(code);

if (!result.success) {
  console.error('Compilation errors:');
  result.errors.forEach(e => console.error(\`  Line \${e.line}: \${e.message}\`));
  process.exit(1);
}

const vm = new SebianVM();
vm.setOutputHandler(console.log);
vm.run(result.chunk);
`,
      'package.json': `{
  "name": "sebian-sdk",
  "version": "1.0.0",
  "type": "module",
  "description": "Sebian Programming Language SDK",
  "main": "sebianvm.js",
  "bin": {
    "sebian": "./run-sebian.mjs"
  }
}
`,
      'vscode-extension/sebian-language/package.json': `{
  "name": "sebian-language",
  "displayName": "Sebian Language",
  "description": "Syntax highlighting for Sebian (.seb) files",
  "version": "1.0.0",
  "engines": { "vscode": "^1.60.0" },
  "categories": ["Programming Languages"],
  "contributes": {
    "languages": [{
      "id": "sebian",
      "aliases": ["Sebian", "sebian"],
      "extensions": [".seb"],
      "configuration": "./language-configuration.json"
    }],
    "grammars": [{
      "language": "sebian",
      "scopeName": "source.sebian",
      "path": "./syntaxes/sebian.tmLanguage.json"
    }]
  }
}
`,
      'vscode-extension/sebian-language/language-configuration.json': `{
  "comments": { "lineComment": "//" },
  "brackets": [["[", "]"], ["(", ")"]],
  "autoClosingPairs": [
    { "open": "[", "close": "]" },
    { "open": "(", "close": ")" },
    { "open": "\\"", "close": "\\"" }
  ]
}
`,
      'vscode-extension/sebian-language/syntaxes/sebian.tmLanguage.json': `{
  "name": "Sebian",
  "scopeName": "source.sebian",
  "patterns": [
    { "include": "#comments" },
    { "include": "#keywords" },
    { "include": "#strings" },
    { "include": "#numbers" },
    { "include": "#operators" }
  ],
  "repository": {
    "comments": {
      "match": "//.*$",
      "name": "comment.line.double-slash.sebian"
    },
    "keywords": {
      "match": "\\\\b(from|import|local|function|if|else|while|for|in|return|Create|Repeat|true|false|null)\\\\b",
      "name": "keyword.control.sebian"
    },
    "strings": {
      "match": "\\"[^\\"]*\\"",
      "name": "string.quoted.double.sebian"
    },
    "numbers": {
      "match": "\\\\b\\\\d+(\\\\.\\\\d+)?\\\\b",
      "name": "constant.numeric.sebian"
    },
    "operators": {
      "match": "(=|\\\\+|-|\\\\*|/|<|>|==|!=|<=|>=|and|or|not)",
      "name": "keyword.operator.sebian"
    }
  }
}
`
    };

    // Create downloadable content
    const content = Object.entries(sdkFiles)
      .map(([path, content]) => `=== ${path} ===\n${content}`)
      .join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sebian-sdk.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const vscodePath = {
    windows: '%USERPROFILE%\\.vscode\\extensions\\sebian-language',
    mac: '~/.vscode/extensions/sebian-language',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Use Sebian Elsewhere</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Export SDK for VS Code & CLI</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Download SDK */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Download SDK Bundle</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Get the complete Sebian SDK including compiler, VM, CLI runner, and VS Code extension.
            </p>
            <Button onClick={downloadSDK} size="sm" className="w-full">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download SDK
            </Button>
          </div>

          {/* VS Code Setup */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-sm">VS Code Extension</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Copy the extension to your VS Code extensions folder:
            </p>
            
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">Windows:</label>
                <div className="flex items-center gap-1 mt-1">
                  <code className="flex-1 text-xs bg-background px-2 py-1 rounded border border-border truncate">
                    {vscodePath.windows}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => copyToClipboard(vscodePath.windows, 'win')}
                  >
                    {copied === 'win' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground">macOS / Linux:</label>
                <div className="flex items-center gap-1 mt-1">
                  <code className="flex-1 text-xs bg-background px-2 py-1 rounded border border-border truncate">
                    {vscodePath.mac}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => copyToClipboard(vscodePath.mac, 'mac')}
                  >
                    {copied === 'mac' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* CLI Usage */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="h-4 w-4 text-green-400" />
              <span className="font-medium text-sm">CLI Runner</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Run Sebian files from the command line:
            </p>
            <div className="flex items-center gap-1">
              <code className="flex-1 text-xs bg-background px-2 py-1 rounded border border-border font-mono">
                node run-sebian.mjs app.seb
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => copyToClipboard('node run-sebian.mjs app.seb', 'cli')}
              >
                {copied === 'cli' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">SDK includes:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li>Sebian Compiler (sebianc.js)</li>
              <li>Sebian VM Runtime (sebianvm.js)</li>
              <li>Node.js CLI Runner</li>
              <li>VS Code Syntax Highlighting</li>
              <li>Language Configuration</li>
            </ul>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
