import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Plus, Trash2, Package, Upload, Loader2, ChevronDown, ChevronRight, Settings, Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Installer {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface InstallerPackage {
  id: string;
  installer_id: string;
  name: string;
  version: string;
  description: string;
  source_code: string;
  architecture: string;
}

export function SettingsPanel() {
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [expandedInstaller, setExpandedInstaller] = useState<string | null>(null);
  const [packages, setPackages] = useState<InstallerPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newInstallerName, setNewInstallerName] = useState('');
  const [newInstallerDesc, setNewInstallerDesc] = useState('');
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgDesc, setNewPkgDesc] = useState('');
  const [newPkgVersion, setNewPkgVersion] = useState('1.0.0');
  const [newPkgArch, setNewPkgArch] = useState('x64');
  const [addingPkgTo, setAddingPkgTo] = useState<string | null>(null);
  const [section, setSection] = useState<'general' | 'console' | 'installers'>('installers');

  useEffect(() => {
    loadInstallers();
  }, []);

  const loadInstallers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('installers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setInstallers(data || []);
    setIsLoading(false);
  };

  const loadPackages = async (installerId: string) => {
    const { data } = await supabase
      .from('packages')
      .select('*')
      .eq('installer_id', installerId)
      .order('name');
    
    setPackages(data || []);
  };

  const toggleInstaller = (id: string) => {
    if (expandedInstaller === id) {
      setExpandedInstaller(null);
    } else {
      setExpandedInstaller(id);
      loadPackages(id);
    }
  };

  const createInstaller = async () => {
    if (!newInstallerName.trim()) {
      toast.error('Enter an installer name');
      return;
    }

    const { error } = await supabase.from('installers').insert({
      name: newInstallerName.trim(),
      description: newInstallerDesc.trim(),
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Installer "${newInstallerName}" created!`);
    setNewInstallerName('');
    setNewInstallerDesc('');
    loadInstallers();
  };

  const deleteInstaller = async (id: string, name: string) => {
    if (!confirm(`Delete installer "${name}" and all its packages?`)) return;

    const { error } = await supabase.from('installers').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Installer deleted');
    if (expandedInstaller === id) setExpandedInstaller(null);
    loadInstallers();
  };

  const addPackage = async (installerId: string) => {
    if (!newPkgName.trim()) {
      toast.error('Enter a package name');
      return;
    }

    const { error } = await supabase.from('packages').insert({
      installer_id: installerId,
      name: newPkgName.trim(),
      version: newPkgVersion || '1.0.0',
      description: newPkgDesc.trim(),
      source_code: '// Package module\n// Add your Sebian code here\n',
      architecture: newPkgArch || 'x64',
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Package "${newPkgName}" added!`);
    setNewPkgName('');
    setNewPkgDesc('');
    setNewPkgVersion('1.0.0');
    setNewPkgArch('x64');
    setAddingPkgTo(null);
    loadPackages(installerId);
  };

  const uploadSebAsPackage = (installerId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.seb';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const content = await file.text();
      const name = file.name.replace(/\.seb$/, '');

      const { error } = await supabase.from('packages').insert({
        installer_id: installerId,
        name,
        version: '1.0.0',
        description: `Uploaded from ${file.name}`,
        source_code: content,
        architecture: 'x64',
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Package "${name}" uploaded!`);
      loadPackages(installerId);
    };
    input.click();
  };

  const deletePackage = async (id: string, installerId: string) => {
    const { error } = await supabase.from('packages').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Package deleted');
    loadPackages(installerId);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Settings className="h-4 w-4" />
          Settings
        </h3>
      </div>

      {/* Section Nav */}
      <div className="flex border-b border-border bg-secondary/30">
        {(['general', 'console', 'installers'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={cn(
              "flex-1 px-2 py-1.5 text-xs font-medium capitalize transition-colors",
              section === s ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {section === 'general' && (
            <div className="space-y-3">
              <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                <p className="text-sm font-medium mb-2">Sandbox Level</p>
                <p className="text-xs text-muted-foreground">
                  Current: Level 2 (Standard). Level 1 enables DLLs, host access, and DOM manipulation.
                </p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                <p className="text-sm font-medium mb-2">VM Configuration</p>
                <p className="text-xs text-muted-foreground">Max instructions: 10,000,000</p>
                <p className="text-xs text-muted-foreground">Max stack size: 10,000</p>
                <p className="text-xs text-muted-foreground">Max heap size: 100,000</p>
              </div>
            </div>
          )}

          {section === 'console' && (
            <div className="space-y-3">
              <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">SebConsole</p>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  SebConsole is the SebianVM terminal. Use SebShell commands to manage installers and packages.
                </p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>• <code className="bg-secondary px-1 rounded">seb vm install &lt;name&gt;</code> — Install a custom installer</p>
                  <p>• <code className="bg-secondary px-1 rounded">&lt;installer&gt; install &lt;pkg&gt;</code> — Install a package</p>
                  <p>• <code className="bg-secondary px-1 rounded">seb build &lt;file&gt; --sebf</code> — Build executable</p>
                </div>
              </div>
            </div>
          )}

          {section === 'installers' && (
            <div className="space-y-3">
              {/* Create Installer */}
              <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-primary" />
                  Be Your Own Installer
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Create a custom installer, add .seb modules as packages, then install them via SebShell.
                </p>
                <div className="space-y-2">
                  <Input
                    placeholder="Installer name (e.g. chicken-wing-data)"
                    value={newInstallerName}
                    onChange={e => setNewInstallerName(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newInstallerDesc}
                    onChange={e => setNewInstallerDesc(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" className="w-full" onClick={createInstaller}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Create Installer
                  </Button>
                </div>
              </div>

              {/* Installers List */}
              <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                <p className="text-sm font-medium mb-2">Your Installers</p>
                
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : installers.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No installers yet. Create one above!</p>
                ) : (
                  <div className="space-y-2">
                    {installers.map(inst => (
                      <div key={inst.id} className="border border-border rounded bg-background">
                        <div 
                          className="flex items-center justify-between p-2 cursor-pointer hover:bg-secondary/30"
                          onClick={() => toggleInstaller(inst.id)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {expandedInstaller === inst.id 
                              ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> 
                              : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                            <span className="text-sm font-medium truncate">{inst.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); deleteInstaller(inst.id, inst.name); }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {expandedInstaller === inst.id && (
                          <div className="border-t border-border p-2 space-y-2">
                            {inst.description && (
                              <p className="text-xs text-muted-foreground">{inst.description}</p>
                            )}

                            {/* Packages */}
                            {packages.filter(p => p.installer_id === inst.id).map(pkg => (
                              <div key={pkg.id} className="flex items-center justify-between p-1.5 bg-secondary/30 rounded text-xs">
                                <span>📄 {pkg.name} v{pkg.version} ({pkg.architecture})</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => deletePackage(pkg.id, inst.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}

                            {/* Add Package */}
                            {addingPkgTo === inst.id ? (
                              <div className="space-y-1.5 p-2 bg-secondary/20 rounded border border-border">
                                <Input placeholder="Package name" value={newPkgName} onChange={e => setNewPkgName(e.target.value)} className="h-7 text-xs" />
                                <Input placeholder="Description" value={newPkgDesc} onChange={e => setNewPkgDesc(e.target.value)} className="h-7 text-xs" />
                                <div className="flex gap-1.5">
                                  <Input placeholder="Version" value={newPkgVersion} onChange={e => setNewPkgVersion(e.target.value)} className="h-7 text-xs flex-1" />
                                  <Input placeholder="Arch" value={newPkgArch} onChange={e => setNewPkgArch(e.target.value)} className="h-7 text-xs w-16" />
                                </div>
                                <div className="flex gap-1.5">
                                  <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => addPackage(inst.id)}>
                                    <Plus className="h-3 w-3 mr-1" />Add
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddingPkgTo(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-1.5">
                                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => setAddingPkgTo(inst.id)}>
                                  <Plus className="h-3 w-3 mr-1" />Add Package
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => uploadSebAsPackage(inst.id)}>
                                  <Upload className="h-3 w-3 mr-1" />.seb
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
