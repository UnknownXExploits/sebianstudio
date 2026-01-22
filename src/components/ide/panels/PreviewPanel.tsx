import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Smartphone, Monitor, Tablet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewPanelProps {
  code: string;
  onLog?: (message: string) => void;
  runTrigger?: number;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

// Type for SebianUINode (matches src/sebian/vm/types.ts)
interface SebianUINode {
  id: string;
  type: string;
  props: Map<string, any>;
  children: SebianUINode[];
  eventHandlers: Map<string, any>;
  parent: SebianUINode | null;
}

export function PreviewPanel({ code, onLog, runTrigger = 0 }: PreviewPanelProps) {
  const [uiRoot, setUiRoot] = useState<SebianUINode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [output, setOutput] = useState<string[]>([]);
  const lastRunTriggerRef = useRef<number>(runTrigger);
  const vmRef = useRef<any>(null);

  const refreshPreview = useCallback(async () => {
    setError(null);
    setUiRoot(null);
    setOutput([]);
    vmRef.current = null;

    try {
      // Dynamic imports to avoid circular dependencies
      const { compile } = await import('@/sebian/compiler');
      const { SebianVM } = await import('@/sebian/vm/vm');

      const result = compile(code);

      if (!result.success || !result.chunk) {
        if (result.errors.length > 0) {
          setError(result.errors.map(e => `Line ${e.line}: ${e.message}`).join('\n'));
        }
        return;
      }

      const vm = new SebianVM();
      vmRef.current = vm;

      // Capture output
      vm.setOutputHandler((msg: string) => {
        setOutput(prev => [...prev, msg]);
        onLog?.(msg);
      });

      // Capture UI updates
      vm.setUIUpdateHandler((root: SebianUINode | null) => {
        setUiRoot(root);
      });

      vm.run(result.chunk);

      // If no UI was rendered, show success message
      if (!uiRoot) {
        // Will be handled by render logic
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    }
  }, [code, onLog]);

  // Avoid double-runs when AI both changes `code` and bumps `runTrigger`.
  // If `runTrigger` changes, it is an explicit run request; otherwise auto-refresh can run on code edits.
  useEffect(() => {
    if (runTrigger !== lastRunTriggerRef.current) {
      lastRunTriggerRef.current = runTrigger;
      refreshPreview();
      return;
    }

    if (autoRefresh) {
      refreshPreview();
    }
  }, [code, autoRefresh, refreshPreview, runTrigger]);

  // Dispatch UI event to VM
  const handleUIEvent = useCallback((nodeId: string, eventName: string, eventData: any = null) => {
    if (vmRef.current && typeof vmRef.current.dispatchUIEvent === 'function') {
      try {
        vmRef.current.dispatchUIEvent(nodeId, eventName, eventData);
      } catch (err: any) {
        console.error('UI event error:', err);
        onLog?.(`❌ Event error: ${err.message}`);
      }
    }
  }, [onLog]);

  // Render a SebianUINode to React
  const renderNode = (node: SebianUINode): React.ReactNode => {
    const props: Record<string, any> = { key: node.id };
    const style: React.CSSProperties = {};

    // Extract props
    node.props.forEach((value, key) => {
      const val = value?.type === 'string' ? value.value : 
                  value?.type === 'number' ? value.value :
                  value?.type === 'boolean' ? value.value :
                  value?.value ?? value;

      if (key === 'style' && typeof val === 'string') {
        // Parse inline style string
        val.split(';').forEach((rule: string) => {
          const [prop, v] = rule.split(':').map(s => s.trim());
          if (prop && v) {
            const camelProp = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
            (style as any)[camelProp] = v;
          }
        });
      } else if (key === 'content' || key === 'text') {
        props.children = val;
      } else if (key === 'className' || key === 'class') {
        props.className = val;
      } else if (key === 'id') {
        props.id = val;
      } else {
        props[key] = val;
      }
    });

    props.style = style;

    // Attach event handlers from node.eventHandlers
    if (node.eventHandlers && node.eventHandlers.size > 0) {
      node.eventHandlers.forEach((handler, eventName) => {
        // Map Sebian event names to React event props
        const reactEventMap: Record<string, string> = {
          'click': 'onClick',
          'onClick': 'onClick',
          'change': 'onChange',
          'input': 'onInput',
          'submit': 'onSubmit',
          'focus': 'onFocus',
          'blur': 'onBlur',
          'mouseenter': 'onMouseEnter',
          'mouseleave': 'onMouseLeave',
        };
        
        const reactEventName = reactEventMap[eventName] || `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;
        
        props[reactEventName] = (e: React.SyntheticEvent) => {
          e.preventDefault?.();
          handleUIEvent(node.id, eventName, { type: 'null' });
        };
      });
    }

    // Render children
    const children = node.children.map(child => renderNode(child));
    if (children.length > 0) {
      props.children = children;
    }

    // Map node types to HTML elements
    const tagMap: Record<string, keyof JSX.IntrinsicElements> = {
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
      heading: 'h1',
      paragraph: 'p',
    };

    const Tag = tagMap[node.type] || 'div';

    // Add default styling for row/column
    if (node.type === 'row' && !style.display) {
      style.display = 'flex';
      style.flexDirection = 'row';
    }
    if (node.type === 'column' && !style.display) {
      style.display = 'flex';
      style.flexDirection = 'column';
    }

    return React.createElement(Tag, props);
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
            {uiRoot ? (
              <div className="sebian-ui-root">
                {renderNode(uiRoot)}
              </div>
            ) : (
              <div className="text-center p-8">
                {output.length > 0 ? (
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground mb-2">Output:</p>
                    <pre className="text-sm text-foreground bg-secondary/50 p-3 rounded-lg whitespace-pre-wrap">
                      {output.join('\n')}
                    </pre>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl mb-4">✅</div>
                    <p className="text-foreground font-medium">Code compiled successfully!</p>
                    <p className="text-sm text-muted-foreground mt-2">No UI rendered</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
