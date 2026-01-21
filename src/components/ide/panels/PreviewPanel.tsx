import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Smartphone, Monitor, Tablet } from 'lucide-react';
import { compile } from '@/sebian/compiler';
import { SebianVM } from '@/sebian/vm/vm';
import { cn } from '@/lib/utils';

interface PreviewPanelProps {
  code: string;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export function PreviewPanel({ code }: PreviewPanelProps) {
  const [previewContent, setPreviewContent] = useState<React.ReactNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (autoRefresh) {
      refreshPreview();
    }
  }, [code, autoRefresh]);

  const refreshPreview = () => {
    setError(null);
    
    try {
      const result = compile(code);
      
      if (!result.success || !result.chunk) {
        if (result.errors.length > 0) {
          setError(result.errors.map(e => `Line ${e.line}: ${e.message}`).join('\n'));
        }
        return;
      }
      
      const vm = new SebianVM();
      vm.run(result.chunk);
      
      // For now, show a placeholder since getUIRoot needs to be added to VM
      setPreviewContent(
        <div className="text-center p-8">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-foreground font-medium">Code compiled successfully!</p>
          <p className="text-sm text-muted-foreground mt-2">UI preview coming soon</p>
        </div>
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const renderUINode = (node: any): React.ReactNode => {
    const props: any = {};
    const style: any = {};
    
    // Convert VM props to React props
    if (node.props) {
      node.props.forEach((value: any, key: string) => {
        if (key === 'style' && value.type === 'string') {
          // Parse inline style string
          const styleStr = value.value;
          styleStr.split(';').forEach((rule: string) => {
            const [prop, val] = rule.split(':').map((s: string) => s.trim());
            if (prop && val) {
              const camelProp = prop.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase());
              style[camelProp] = val;
            }
          });
        } else if (key === 'content' || key === 'text') {
          props.children = value.value;
        } else if (key === 'className' || key === 'class') {
          props.className = value.value;
        } else {
          props[key] = value.value;
        }
      });
    }
    
    props.style = style;
    
    // Render children
    const children = node.children?.map((child: any, i: number) => (
      <React.Fragment key={i}>{renderUINode(child)}</React.Fragment>
    ));
    
    if (children && children.length > 0) {
      props.children = children;
    }
    
    // Map node types to HTML elements
    const typeMap: Record<string, string> = {
      text: 'span',
      button: 'button',
      div: 'div',
      container: 'div',
      row: 'div',
      column: 'div',
      input: 'input',
      label: 'label',
      image: 'img',
      link: 'a',
    };
    
    const Tag = typeMap[node.type] || 'div';
    
    return <Tag {...props} />;
  };

  const getDeviceStyles = (): string => {
    switch (deviceMode) {
      case 'mobile':
        return 'max-w-[375px] mx-auto';
      case 'tablet':
        return 'max-w-[768px] mx-auto';
      default:
        return '';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Preview Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1">
          <Button 
            variant={deviceMode === 'desktop' ? 'secondary' : 'ghost'} 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setDeviceMode('desktop')}
          >
            <Monitor className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant={deviceMode === 'tablet' ? 'secondary' : 'ghost'} 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setDeviceMode('tablet')}
          >
            <Tablet className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant={deviceMode === 'mobile' ? 'secondary' : 'ghost'} 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setDeviceMode('mobile')}
          >
            <Smartphone className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-3 h-3"
            />
            Auto
          </label>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refreshPreview}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      {/* Preview Content */}
      <div className="flex-1 overflow-auto bg-background p-4">
        {error ? (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-destructive font-medium text-sm mb-2">Preview Error</p>
            <pre className="text-xs text-destructive/80 whitespace-pre-wrap">{error}</pre>
          </div>
        ) : (
          <div className={cn("min-h-full bg-card rounded-lg border border-border p-4", getDeviceStyles())}>
            {previewContent}
          </div>
        )}
      </div>
    </div>
  );
}
