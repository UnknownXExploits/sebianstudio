import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { commandRegistry, CommandDefinition, CommandModule } from '@/sebian/registry';
import { Search, ChevronRight, ChevronDown, Copy, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CommandExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedCommand, setSelectedCommand] = useState<CommandDefinition | null>(null);

  const modules = commandRegistry.getModules();
  const totalCommands = commandRegistry.getTotalCommandCount();

  const filteredResults = useMemo(() => {
    if (!searchQuery) return null;
    return commandRegistry.search(searchQuery, { maxResults: 100 });
  }, [searchQuery]);

  const toggleModule = (moduleName: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleName)) {
        next.delete(moduleName);
      } else {
        next.add(moduleName);
      }
      return next;
    });
    setSelectedModule(moduleName);
  };

  const copyExample = (example: string) => {
    navigator.clipboard.writeText(example);
  };

  const renderCommand = (cmd: CommandDefinition) => (
    <button
      key={`${cmd.module}.${cmd.name}`}
      onClick={() => setSelectedCommand(cmd)}
      className={cn(
        "w-full text-left px-3 py-1.5 text-sm hover:bg-accent/50 rounded transition-colors",
        selectedCommand?.name === cmd.name && selectedCommand?.module === cmd.module && "bg-accent"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-primary">{cmd.name}</span>
        {cmd.sandboxLevel && (
          <Badge variant="outline" className="text-[10px] h-4">
            L{cmd.sandboxLevel}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground truncate">{cmd.doc}</p>
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${totalCommands.toLocaleString()}+ commands...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Module List / Search Results */}
        <div className="w-1/2 border-r border-border overflow-auto sebian-scrollbar">
          {searchQuery ? (
            <div className="p-2">
              <p className="text-xs text-muted-foreground mb-2 px-2">
                {filteredResults?.length || 0} results
              </p>
              {filteredResults?.map(renderCommand)}
            </div>
          ) : (
            <div className="p-2">
              {modules.map((module) => (
                <div key={module.name}>
                  <button
                    onClick={() => toggleModule(module.name)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/50 transition-colors",
                      selectedModule === module.name && "bg-accent"
                    )}
                  >
                    {expandedModules.has(module.name) ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    <span className="text-sm font-medium">{module.name}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {module.commands.length}
                    </Badge>
                  </button>
                  
                  {expandedModules.has(module.name) && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {module.commands.slice(0, 20).map(renderCommand)}
                      {module.commands.length > 20 && (
                        <p className="text-xs text-muted-foreground px-3 py-1">
                          +{module.commands.length - 20} more...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Command Details */}
        <div className="w-1/2 overflow-auto sebian-scrollbar">
          {selectedCommand ? (
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-lg font-bold font-mono text-primary">
                  {selectedCommand.module}.{selectedCommand.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedCommand.doc}
                </p>
              </div>

              {/* Arguments */}
              {selectedCommand.args.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Arguments
                  </h4>
                  <div className="space-y-1">
                    {selectedCommand.args.map((arg, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-primary">{arg.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {arg.type}
                        </Badge>
                        {arg.optional && (
                          <span className="text-xs text-muted-foreground">(optional)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Returns */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Returns
                </h4>
                <Badge variant="secondary">{selectedCommand.returns}</Badge>
              </div>

              {/* Example */}
              {selectedCommand.example && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Example
                  </h4>
                  <div className="bg-secondary/50 rounded p-3 relative group">
                    <code className="text-sm font-mono text-foreground">
                      {selectedCommand.example}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyExample(selectedCommand.example!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Sandbox Level */}
              {selectedCommand.sandboxLevel && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Required Sandbox Level
                  </h4>
                  <Badge 
                    variant={selectedCommand.sandboxLevel === 1 ? 'destructive' : 'secondary'}
                  >
                    Level {selectedCommand.sandboxLevel}
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Select a command to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
