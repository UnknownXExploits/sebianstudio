import { useState, useRef, useEffect } from 'react';
import { vfs } from '@/sebian/vfs';
import { compile } from '@/sebian/compiler';
import { SebianVM } from '@/sebian/vm/vm';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SebConsolePanelProps {
  onLog: (message: string) => void;
}

interface HistoryEntry {
  type: 'input' | 'output' | 'error' | 'success' | 'info';
  content: string;
}

interface InstalledInstaller {
  name: string;
  packages: string[];
}

export function SebConsolePanel({ onLog }: SebConsolePanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { type: 'info', content: '╔══════════════════════════════════════╗' },
    { type: 'info', content: '║     SebConsole v2.0 — SebShell      ║' },
    { type: 'info', content: '║   SebianVM PowerShell Environment   ║' },
    { type: 'info', content: '╚══════════════════════════════════════╝' },
    { type: 'output', content: '' },
    { type: 'output', content: 'Type "help" for commands or "shelp" for SebShell commands.' },
    { type: 'output', content: '' },
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [installedInstallers, setInstalledInstallers] = useState<InstalledInstaller[]>([]);
  const [installedPackages, setInstalledPackages] = useState<Map<string, string>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const addOutput = (content: string, type: HistoryEntry['type'] = 'output') => {
    setHistory(prev => [...prev, { type, content }]);
  };

  const addMulti = (lines: string[], type: HistoryEntry['type'] = 'output') => {
    setHistory(prev => [...prev, ...lines.map(content => ({ type, content }))]);
  };

  const executeCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setHistory(prev => [...prev, { type: 'input', content: `SebShell> ${trimmed}` }]);
    setCommandHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // SebShell commands
    if (command === 'sebian' || command === 'seb') {
      await handleSebianCommand(args);
      return;
    }

    switch (command) {
      case 'help':
        addMulti([
          '┌─ SebConsole Commands ──────────────────────┐',
          '│                                            │',
          '│  ls [path]        List directory            │',
          '│  cd <path>        Change directory           │',
          '│  pwd              Print working directory    │',
          '│  cat <file>       Display file contents      │',
          '│  mkdir <dir>      Create directory            │',
          '│  touch <file>     Create empty file           │',
          '│  rm <path>        Remove file                 │',
          '│  rmdir <path>     Remove directory             │',
          '│  run <file.seb>   Execute Sebian file         │',
          '│  compile <file>   Compile to .seb bytecode    │',
          '│  clear            Clear console               │',
          '│  perm             Show sandbox permissions     │',
          '│  version          Show version info            │',
          '│                                            │',
          '└────────────────────────────────────────────┘',
        ]);
        break;

      case 'shelp':
        addMulti([
          '┌─ SebShell Commands ─────────────────────────────────┐',
          '│                                                     │',
          '│  seb vm install <installer>      Install an installer│',
          '│  seb vm uninstall <installer>    Remove installer    │',
          '│  seb vm list                     List installers     │',
          '│  seb vm info <installer>         Installer details   │',
          '│                                                     │',
          '│  <installer> install <pkg> [arch]  Install package   │',
          '│  <installer> remove <pkg>          Remove package    │',
          '│  <installer> list                  List packages     │',
          '│  <installer> info <pkg>            Package info      │',
          '│                                                     │',
          '│  seb compile <file> --out <name>   Compile .seb     │',
          '│  seb build <file> --sebf           Build .sebf exe  │',
          '│  seb run <file.seb>                Run .seb file    │',
          '│                                                     │',
          '└─────────────────────────────────────────────────────┘',
        ]);
        break;

      case 'ls': {
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
      }

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
          addOutput(`Created directory: ${args[0]}`, 'success');
        } else {
          addOutput(`mkdir: Failed to create ${args[0]}`, 'error');
        }
        break;

      case 'touch':
        if (!args[0]) {
          addOutput('Usage: touch <file>', 'error');
        } else if (vfs.writeFile(args[0], '')) {
          addOutput(`Created file: ${args[0]}`, 'success');
        } else {
          addOutput(`touch: Failed to create ${args[0]}`, 'error');
        }
        break;

      case 'rm':
        if (!args[0]) {
          addOutput('Usage: rm <file>', 'error');
        } else if (vfs.deleteFile(args[0])) {
          addOutput(`Removed: ${args[0]}`, 'success');
        } else {
          addOutput(`rm: ${args[0]}: No such file`, 'error');
        }
        break;

      case 'rmdir':
        if (!args[0]) {
          addOutput('Usage: rmdir <directory>', 'error');
        } else if (vfs.rmdir(args[0], args.includes('-r'))) {
          addOutput(`Removed directory: ${args[0]}`, 'success');
        } else {
          addOutput(`rmdir: ${args[0]}: Directory not empty or not found`, 'error');
        }
        break;

      case 'run':
        if (!args[0]) {
          addOutput('Usage: run <file.seb>', 'error');
        } else {
          runSebFile(args[0]);
        }
        break;

      case 'compile':
        if (!args[0]) {
          addOutput('Usage: compile <file.seb>', 'error');
        } else {
          compileSebFile(args[0]);
        }
        break;

      case 'clear':
        setHistory([]);
        break;

      case 'perm':
        addMulti([
          'Sandbox Level: 2 (Standard)',
          'Active Capabilities:',
          '  ✓ core    - Core language features',
          '  ✓ math    - Mathematical operations',
          '  ✓ string  - String manipulation',
          '  ✓ array   - Array operations',
          '  ✓ json    - JSON parsing/stringify',
          '  ✓ ui      - UI creation',
          '  ✓ fs      - Virtual filesystem',
          '  ✓ net     - Network (proxied)',
          '  ✓ time    - Date/time operations',
        ]);
        break;

      case 'version':
        addMulti([
          'SebConsole v2.0.0',
          'SebShell v1.0.0',
          'Sebian Language v2.0.0',
          'SebianVM v1.0.0',
          'Compiler v1.0.0',
        ]);
        break;

      case 'exit':
        addOutput('Use the close button to exit the console.');
        break;

      default:
        // Check if it's an installed installer command
        const installer = installedInstallers.find(i => i.name.toLowerCase() === command);
        if (installer) {
          await handleInstallerCommand(installer.name, args);
        } else {
          addOutput(`${command}: command not found. Type "help" or "shelp".`, 'error');
        }
    }
  };

  const handleSebianCommand = async (args: string[]) => {
    if (args.length === 0) {
      addOutput('Usage: seb <subcommand> [args]', 'error');
      addOutput('Try: seb vm install <installer>', 'info');
      return;
    }

    const sub = args[0].toLowerCase();

    if (sub === 'vm') {
      await handleVMCommand(args.slice(1));
    } else if (sub === 'compile') {
      const file = args[1];
      if (!file) { addOutput('Usage: seb compile <file.seb>', 'error'); return; }
      compileSebFile(file);
    } else if (sub === 'build') {
      const file = args[1];
      if (!file) { addOutput('Usage: seb build <file.seb> --sebf', 'error'); return; }
      buildSebf(file);
    } else if (sub === 'run') {
      const file = args[1];
      if (!file) { addOutput('Usage: seb run <file.seb>', 'error'); return; }
      runSebFile(file);
    } else {
      addOutput(`seb: unknown subcommand '${sub}'`, 'error');
    }
  };

  const handleVMCommand = async (args: string[]) => {
    if (args.length === 0) {
      addOutput('Usage: seb vm <install|uninstall|list|info> [name]', 'error');
      return;
    }

    const action = args[0].toLowerCase();

    switch (action) {
      case 'install': {
        const name = args[1];
        if (!name) { addOutput('Usage: seb vm install <installer-name>', 'error'); return; }
        
        addOutput(`🔍 Searching for installer "${name}"...`, 'info');
        
        const { data, error } = await supabase
          .from('installers')
          .select('*')
          .ilike('name', name)
          .maybeSingle();

        if (error || !data) {
          addOutput(`❌ Installer "${name}" not found in registry.`, 'error');
          return;
        }

        if (installedInstallers.find(i => i.name === data.name)) {
          addOutput(`⚠ Installer "${data.name}" is already installed.`, 'error');
          return;
        }

        addOutput(`📦 Installing ${data.name}...`, 'info');
        setInstalledInstallers(prev => [...prev, { name: data.name, packages: [] }]);
        addOutput(`✅ Installer "${data.name}" installed successfully!`, 'success');
        addOutput(`   Use: ${data.name} install <package>`, 'info');
        break;
      }

      case 'uninstall': {
        const name = args[1];
        if (!name) { addOutput('Usage: seb vm uninstall <installer-name>', 'error'); return; }
        
        const idx = installedInstallers.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
        if (idx === -1) {
          addOutput(`❌ Installer "${name}" is not installed.`, 'error');
          return;
        }

        setInstalledInstallers(prev => prev.filter((_, i) => i !== idx));
        addOutput(`✅ Installer "${name}" uninstalled.`, 'success');
        break;
      }

      case 'list': {
        if (installedInstallers.length === 0) {
          addOutput('No installers installed. Use "seb vm install <name>" to install one.', 'info');
        } else {
          addOutput('Installed Installers:', 'info');
          installedInstallers.forEach(i => {
            addOutput(`  📦 ${i.name} (${i.packages.length} packages installed)`);
          });
        }
        break;
      }

      case 'info': {
        const name = args[1];
        if (!name) { addOutput('Usage: seb vm info <installer-name>', 'error'); return; }
        
        const { data } = await supabase
          .from('installers')
          .select('*, packages(*)')
          .ilike('name', name)
          .maybeSingle();

        if (!data) {
          addOutput(`❌ Installer "${name}" not found.`, 'error');
          return;
        }

        addMulti([
          `📦 ${data.name}`,
          `   ${data.description || 'No description'}`,
          `   Available packages: ${(data as any).packages?.length || 0}`,
        ], 'info');
        break;
      }

      default:
        addOutput(`seb vm: unknown action '${action}'`, 'error');
    }
  };

  const handleInstallerCommand = async (installerName: string, args: string[]) => {
    if (args.length === 0) {
      addOutput(`Usage: ${installerName} <install|remove|list|info> [package] [arch]`, 'error');
      return;
    }

    const action = args[0].toLowerCase();

    switch (action) {
      case 'install': {
        const pkgName = args[1];
        const arch = args[2] || 'x64';
        if (!pkgName) { addOutput(`Usage: ${installerName} install <package> [architecture]`, 'error'); return; }

        addOutput(`🔍 Searching ${installerName} for "${pkgName}" (${arch})...`, 'info');

        // Find the installer ID
        const { data: installer } = await supabase
          .from('installers')
          .select('id')
          .ilike('name', installerName)
          .maybeSingle();

        if (!installer) { addOutput(`❌ Installer not found in registry.`, 'error'); return; }

        const { data: pkg } = await supabase
          .from('packages')
          .select('*')
          .eq('installer_id', installer.id)
          .ilike('name', pkgName)
          .maybeSingle();

        if (!pkg) {
          addOutput(`❌ Package "${pkgName}" not found in ${installerName}.`, 'error');
          return;
        }

        addOutput(`📥 Downloading ${pkg.name} v${pkg.version} (${arch})...`, 'info');
        
        // Save to VFS
        const pkgPath = `/packages/${installerName}/${pkg.name}.seb`;
        vfs.mkdir(`/packages/${installerName}`);
        vfs.writeFile(pkgPath, pkg.source_code);
        
        // Track installed
        setInstalledInstallers(prev => prev.map(i => 
          i.name === installerName 
            ? { ...i, packages: [...i.packages, pkg.name] }
            : i
        ));
        installedPackages.set(`${installerName}/${pkg.name}`, pkg.source_code);
        
        addOutput(`✅ ${pkg.name} v${pkg.version} installed successfully!`, 'success');
        addOutput(`   Saved to: ${pkgPath}`, 'info');
        break;
      }

      case 'remove': {
        const pkgName = args[1];
        if (!pkgName) { addOutput(`Usage: ${installerName} remove <package>`, 'error'); return; }
        
        const pkgPath = `/packages/${installerName}/${pkgName}.seb`;
        if (vfs.deleteFile(pkgPath)) {
          setInstalledInstallers(prev => prev.map(i => 
            i.name === installerName 
              ? { ...i, packages: i.packages.filter(p => p !== pkgName) }
              : i
          ));
          installedPackages.delete(`${installerName}/${pkgName}`);
          addOutput(`✅ Removed ${pkgName}`, 'success');
        } else {
          addOutput(`❌ Package "${pkgName}" is not installed.`, 'error');
        }
        break;
      }

      case 'list': {
        const inst = installedInstallers.find(i => i.name === installerName);
        if (!inst || inst.packages.length === 0) {
          addOutput(`No packages installed from ${installerName}.`, 'info');
        } else {
          addOutput(`Packages from ${installerName}:`, 'info');
          inst.packages.forEach(p => addOutput(`  📄 ${p}`));
        }
        break;
      }

      case 'info': {
        const pkgName = args[1];
        if (!pkgName) { addOutput(`Usage: ${installerName} info <package>`, 'error'); return; }
        
        const { data: installer } = await supabase
          .from('installers')
          .select('id')
          .ilike('name', installerName)
          .maybeSingle();

        if (!installer) return;

        const { data: pkg } = await supabase
          .from('packages')
          .select('*')
          .eq('installer_id', installer.id)
          .ilike('name', pkgName)
          .maybeSingle();

        if (!pkg) {
          addOutput(`❌ Package "${pkgName}" not found.`, 'error');
          return;
        }

        addMulti([
          `📦 ${pkg.name} v${pkg.version}`,
          `   Architecture: ${pkg.architecture}`,
          `   Description: ${pkg.description || 'No description'}`,
          `   Code size: ${pkg.source_code.length} bytes`,
        ], 'info');
        break;
      }

      default:
        addOutput(`${installerName}: unknown command '${action}'`, 'error');
    }
  };

  const runSebFile = (path: string) => {
    const code = vfs.readFile(path);
    if (code === null) {
      addOutput(`run: ${path}: No such file`, 'error');
      return;
    }
    try {
      const result = compile(code);
      if (!result.success || !result.chunk) {
        result.errors.forEach(err => {
          addOutput(`Error at line ${err.line}: ${err.message}`, 'error');
        });
      } else {
        const vm = new SebianVM();
        vm.setOutputHandler((msg: string) => addOutput(msg));
        const output = vm.run(result.chunk);
        addOutput(`✅ Execution complete`, 'success');
        if (output.type !== 'null') {
          addOutput(`Result: ${JSON.stringify(output.value ?? output.type)}`);
        }
      }
    } catch (err: any) {
      addOutput(`Runtime error: ${err.message}`, 'error');
    }
  };

  const compileSebFile = (path: string) => {
    const code = vfs.readFile(path);
    if (code === null) {
      addOutput(`compile: ${path}: No such file`, 'error');
      return;
    }
    try {
      const result = compile(code);
      if (!result.success) {
        result.errors.forEach(err => {
          addOutput(`Error at line ${err.line}: ${err.message}`, 'error');
        });
      } else {
        const outName = path.replace(/\.seb$/, '') + '.sebc';
        // Store compiled bytecode as JSON in VFS
        vfs.writeFile(outName, JSON.stringify(result.chunk));
        addOutput(`✅ Compiled successfully: ${outName}`, 'success');
      }
    } catch (err: any) {
      addOutput(`Compilation error: ${err.message}`, 'error');
    }
  };

  const buildSebf = (path: string) => {
    const code = vfs.readFile(path);
    if (code === null) {
      addOutput(`build: ${path}: No such file`, 'error');
      return;
    }
    try {
      const result = compile(code);
      if (!result.success) {
        result.errors.forEach(err => {
          addOutput(`Error at line ${err.line}: ${err.message}`, 'error');
        });
        return;
      }

      // Build .sebf - a self-contained executable format
      const sebf = {
        magic: 'SEBF',
        version: '1.0.0',
        compiled_at: new Date().toISOString(),
        source_hash: btoa(code).substring(0, 16),
        bytecode: result.chunk,
        metadata: {
          source_file: path,
          sandbox_level: 2,
        }
      };

      const outName = path.replace(/\.seb$/, '') + '.sebf';
      vfs.writeFile(outName, JSON.stringify(sebf));
      addOutput(`✅ Built executable: ${outName}`, 'success');
      addOutput(`   Format: SEBF v1.0.0 (Sebian Executable Format)`, 'info');
      addOutput(`   Contains: bytecode + metadata`, 'info');
    } catch (err: any) {
      addOutput(`Build error: ${err.message}`, 'error');
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
              entry.type === 'output' && "text-foreground/80",
              entry.type === 'success' && "text-primary",
              entry.type === 'info' && "text-muted-foreground"
            )}
          >
            {entry.content}
          </div>
        ))}
        
        <div className="flex items-center">
          <span className="text-primary mr-2 font-bold">SebShell&gt;</span>
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
