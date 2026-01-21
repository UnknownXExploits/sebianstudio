import { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type SandboxLevel = 1 | 2 | 3;

const LEVEL_INFO: Record<SandboxLevel, { name: string; description: string; capabilities: string[] }> = {
  3: {
    name: 'Restricted',
    description: 'Pure computation only. No DOM, network, or file access.',
    capabilities: ['core', 'math', 'string', 'array'],
  },
  2: {
    name: 'Standard',
    description: 'Balanced sandbox with VFS, UI, and proxied networking.',
    capabilities: ['core', 'math', 'string', 'array', 'json', 'ui', 'fs', 'net', 'time'],
  },
  1: {
    name: 'Full Power',
    description: 'Unrestricted access including DOM and host bindings.',
    capabilities: ['core', 'math', 'string', 'array', 'json', 'ui', 'fs', 'net', 'time', 'host', 'dom', 'buffer', 'unsafe_net'],
  },
};

export function SandboxStatus() {
  const [level, setLevel] = useState<SandboxLevel>(2);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<SandboxLevel | null>(null);

  const handleLevelChange = (newLevel: SandboxLevel) => {
    if (newLevel === 1) {
      setPendingLevel(1);
      setShowWarning(true);
    } else {
      setLevel(newLevel);
    }
  };

  const confirmLevelChange = () => {
    if (pendingLevel) {
      setLevel(pendingLevel);
      setPendingLevel(null);
    }
    setShowWarning(false);
  };

  const getLevelIcon = () => {
    switch (level) {
      case 1:
        return <ShieldAlert className="h-4 w-4 text-destructive" />;
      case 2:
        return <Shield className="h-4 w-4 text-primary" />;
      case 3:
        return <ShieldCheck className="h-4 w-4 text-green-500" />;
    }
  };

  const getLevelColor = () => {
    switch (level) {
      case 1:
        return 'text-destructive';
      case 2:
        return 'text-primary';
      case 3:
        return 'text-green-500';
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            {getLevelIcon()}
            <span className={cn("text-xs font-medium", getLevelColor())}>
              Level {level}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Sandbox Level</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {([3, 2, 1] as SandboxLevel[]).map((lvl) => (
            <DropdownMenuItem 
              key={lvl}
              onClick={() => handleLevelChange(lvl)}
              className={cn(
                "flex flex-col items-start gap-1 cursor-pointer",
                level === lvl && "bg-accent"
              )}
            >
              <div className="flex items-center gap-2 w-full">
                {lvl === 1 && <ShieldAlert className="h-4 w-4 text-destructive" />}
                {lvl === 2 && <Shield className="h-4 w-4 text-primary" />}
                {lvl === 3 && <ShieldCheck className="h-4 w-4 text-green-500" />}
                <span className="font-medium">Level {lvl}: {LEVEL_INFO[lvl].name}</span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {LEVEL_INFO[lvl].description}
              </p>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <div className="p-2">
            <p className="text-xs text-muted-foreground mb-2">Active Capabilities:</p>
            <div className="flex flex-wrap gap-1">
              {LEVEL_INFO[level].capabilities.map((cap) => (
                <Badge key={cap} variant="secondary" className="text-xs">
                  {cap}
                </Badge>
              ))}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Warning: Full Power Mode
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <p>
                You are about to enable <strong>Level 1 (Full Power)</strong> sandbox mode.
                This gives Sebian code unrestricted access to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-destructive">
                <li>Direct DOM manipulation</li>
                <li>Unrestricted network requests</li>
                <li>Host system bindings</li>
                <li>Buffer/memory operations</li>
              </ul>
              <p className="font-medium">
                Only enable this if you trust the code you're running!
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarning(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmLevelChange}>
              I Understand, Enable Level 1
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
