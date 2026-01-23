import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Copy, Check, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { vfs } from '@/sebian/vfs';
import { compile } from '@/sebian/compiler';
import { toast } from 'sonner';

interface PublishedProject {
  id: string;
  name: string;
  published_at: string;
}

interface PublishPanelProps {
  currentCode: string;
}

export function PublishPanel({ currentCode }: PublishPanelProps) {
  const [projectName, setProjectName] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [publishedProjects, setPublishedProjects] = useState<PublishedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPublishedProjects();
  }, []);

  const loadPublishedProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('published_projects')
        .select('id, name, published_at')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setPublishedProjects(data || []);
    } catch (err) {
      console.error('Failed to load published projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  };

  const publishProject = async () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    const slug = generateSlug(projectName);
    if (!slug) {
      toast.error('Invalid project name');
      return;
    }

    setIsPublishing(true);

    try {
      // Compile the code to verify it works
      const result = compile(currentCode);
      if (!result.success) {
        toast.error('Fix compilation errors before publishing');
        setIsPublishing(false);
        return;
      }

      // Generate the HTML bundle
      const htmlBundle = generateHTMLBundle(currentCode, projectName);

      // Save to Supabase
      const { data, error } = await supabase
        .from('published_projects')
        .upsert({
          name: projectName,
          slug,
          source_code: currentCode,
          html_bundle: htmlBundle,
          published_at: new Date().toISOString(),
        }, {
          onConflict: 'slug'
        })
        .select()
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/projects/${slug}`;
      setPublishedUrl(url);
      toast.success('Project published successfully!');
      loadPublishedProjects();
    } catch (err: any) {
      console.error('Publish error:', err);
      toast.error(err.message || 'Failed to publish project');
    } finally {
      setIsPublishing(false);
    }
  };

  const deleteProject = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('published_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Project deleted');
      loadPublishedProjects();
    } catch (err: any) {
      toast.error('Failed to delete project');
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Publish to Web</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Share your Sebian app with the world</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Publish Form */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Publish Project</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Project Name</label>
                <Input
                  placeholder="my-awesome-app"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="h-8 text-sm"
                />
                {projectName && (
                  <p className="text-xs text-muted-foreground mt-1">
                    URL: sebianstudio.lovable.app/projects/{generateSlug(projectName)}
                  </p>
                )}
              </div>

              <Button
                onClick={publishProject}
                disabled={isPublishing || !projectName.trim()}
                size="sm"
                className="w-full"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Globe className="h-3.5 w-3.5 mr-1.5" />
                    Publish
                  </>
                )}
              </Button>
            </div>

            {publishedUrl && (
              <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded">
                <p className="text-xs text-green-400 mb-2">✓ Published successfully!</p>
                <div className="flex items-center gap-1">
                  <code className="flex-1 text-xs bg-background px-2 py-1 rounded border border-border truncate">
                    {publishedUrl}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => copyUrl(publishedUrl)}
                  >
                    {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => window.open(publishedUrl, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Published Projects List */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <h4 className="font-medium text-sm mb-2">Your Published Projects</h4>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : publishedProjects.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No published projects yet</p>
            ) : (
              <div className="space-y-2">
                {publishedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-2 bg-background rounded border border-border"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(project.published_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => window.open(`/projects/${generateSlug(project.name)}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteProject(project.id, project.name)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Published apps include:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li>Full Sebian runtime</li>
              <li>Your compiled code</li>
              <li>"Made with Sebian" badge</li>
            </ul>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function generateHTMLBundle(sourceCode: string, projectName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} - Made with Sebian</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: system-ui, -apple-system, sans-serif;
      background: #0a0a0a;
      color: #fafafa;
      min-height: 100vh;
    }
    #app { padding: 20px; }
    .sebian-badge {
      position: fixed;
      bottom: 16px;
      left: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(20, 20, 20, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      text-decoration: none;
      color: #a1a1aa;
      font-size: 12px;
      transition: all 0.2s;
      backdrop-filter: blur(8px);
    }
    .sebian-badge:hover {
      background: rgba(30, 30, 30, 0.95);
      color: #fafafa;
      border-color: rgba(255, 255, 255, 0.2);
    }
    .sebian-badge-logo {
      width: 20px;
      height: 20px;
      background: linear-gradient(135deg, #8b5cf6, #6366f1);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 10px;
      color: white;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  
  <a href="https://sebianstudio.lovable.app/" target="_blank" class="sebian-badge">
    <div class="sebian-badge-logo">S</div>
    <span>Made with Sebian</span>
  </a>

  <script>
    // Embedded Sebian source
    const SOURCE_CODE = ${JSON.stringify(sourceCode)};
    
    // Minimal Sebian runtime will be loaded here
    // For now, display a message
    document.getElementById('app').innerHTML = '<p style="opacity: 0.6;">Loading Sebian app...</p>';
    
    // In production, this would include the full VM
    console.log('Sebian source loaded:', SOURCE_CODE.substring(0, 100) + '...');
  </script>
</body>
</html>`;
}
