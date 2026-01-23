import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { compile } from '@/sebian/compiler';
import { SebianVM } from '@/sebian/vm/vm';
import React from 'react';

interface SebianUINode {
  id: string;
  type: string;
  props: Map<string, any>;
  children: SebianUINode[];
  eventHandlers: Map<string, any>;
  parent: SebianUINode | null;
}

export default function ProjectViewer() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uiRoot, setUiRoot] = useState<SebianUINode | null>(null);
  const [output, setOutput] = useState<string[]>([]);
  const vmRef = React.useRef<SebianVM | null>(null);

  useEffect(() => {
    loadProject();
  }, [slug]);

  const loadProject = async () => {
    if (!slug) {
      setError('No project specified');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('published_projects')
        .select('*')
        .eq('slug', slug)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Project not found');

      setProject(data);
      runProject(data.source_code);
    } catch (err: any) {
      setError(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const runProject = (sourceCode: string) => {
    try {
      const result = compile(sourceCode);
      
      if (!result.success || !result.chunk) {
        setError('Failed to compile project');
        return;
      }

      const vm = new SebianVM();
      vmRef.current = vm;

      vm.setOutputHandler((msg: string) => {
        setOutput(prev => [...prev, msg]);
      });

      vm.setUIUpdateHandler((root: SebianUINode | null) => {
        setUiRoot(root);
      });

      vm.run(result.chunk);
    } catch (err: any) {
      setError(err.message || 'Runtime error');
    }
  };

  const handleUIEvent = useCallback((nodeId: string, eventName: string, eventData: any = null) => {
    if (vmRef.current && typeof vmRef.current.dispatchUIEvent === 'function') {
      try {
        vmRef.current.dispatchUIEvent(nodeId, eventName, eventData);
      } catch (err: any) {
        console.error('UI event error:', err);
      }
    }
  }, []);

  const renderNode = (node: SebianUINode): React.ReactNode => {
    const props: Record<string, any> = { key: node.id };
    const style: React.CSSProperties = {};

    node.props.forEach((value, key) => {
      const val = value?.type === 'string' ? value.value : 
                  value?.type === 'number' ? value.value :
                  value?.type === 'boolean' ? value.value :
                  value?.value ?? value;

      if (key === 'style' && typeof val === 'string') {
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

    if (node.eventHandlers && node.eventHandlers.size > 0) {
      node.eventHandlers.forEach((handler, eventName) => {
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

    const children = node.children.map(child => renderNode(child));
    if (children.length > 0) {
      props.children = children;
    }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-4xl mb-4">😕</div>
          <h1 className="text-xl font-semibold text-white mb-2">Project Not Found</h1>
          <p className="text-zinc-400 mb-4">{error}</p>
          <Link 
            to="/"
            className="text-purple-400 hover:text-purple-300 text-sm"
          >
            ← Back to Sebian Studio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* App Content */}
      <div className="p-5">
        {uiRoot ? (
          <div className="sebian-app-root">
            {renderNode(uiRoot)}
          </div>
        ) : output.length > 0 ? (
          <div className="max-w-2xl mx-auto">
            <pre className="bg-zinc-900 p-4 rounded-lg text-sm whitespace-pre-wrap border border-zinc-800">
              {output.join('\n')}
            </pre>
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500">
            <p>App loaded successfully</p>
          </div>
        )}
      </div>

      {/* Made with Sebian Badge */}
      <a
        href="https://sebianstudio.lovable.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-zinc-900/90 border border-zinc-800 rounded-lg text-zinc-400 text-xs hover:text-white hover:border-zinc-700 transition-all backdrop-blur-sm"
      >
        <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">S</span>
        </div>
        <span>Made with Sebian</span>
      </a>
    </div>
  );
}
