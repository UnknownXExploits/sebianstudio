import { useState, useEffect } from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { vfs } from '@/sebian/vfs';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  RefreshCw,
  FileCode,
  Image,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileTreeNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileTreeNode[];
}

interface IDESidebarProps {
  onFileSelect: (path: string) => void;
  currentFile: string | null;
}

export function IDESidebar({ onFileSelect, currentFile }: IDESidebarProps) {
  const [fileTree, setFileTree] = useState<FileTreeNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));

  useEffect(() => {
    refreshFileTree();
  }, []);

  const refreshFileTree = () => {
    const tree = vfs.getFileTree('/');
    setFileTree(tree);
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'seb':
        return <FileCode className="h-4 w-4 text-primary" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="h-4 w-4 text-green-400" />;
      case 'json':
        return <FileText className="h-4 w-4 text-yellow-400" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const renderNode = (node: FileTreeNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = currentFile === node.path;
    
    if (node.type === 'directory') {
      return (
        <div key={node.path}>
          <button
            onClick={() => toggleFolder(node.path)}
            className={cn(
              "w-full flex items-center gap-1 px-2 py-1 hover:bg-accent/50 rounded text-sm transition-colors",
              "text-foreground/80"
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-primary shrink-0" />
            )}
            <span className="truncate">{node.name === '/' ? 'Project' : node.name}</span>
          </button>
          
          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <button
        key={node.path}
        onClick={() => onFileSelect(node.path)}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1 hover:bg-accent/50 rounded text-sm transition-colors",
          isSelected && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 24}px` }}
      >
        {getFileIcon(node.name)}
        <span className="truncate">{node.name}</span>
      </button>
    );
  };

  return (
    <Sidebar className="w-60" collapsible="icon">
      <SidebarHeader className="border-b border-border p-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide group-data-[collapsible=icon]:hidden">
            Explorer
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refreshFileTree}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <SidebarTrigger className="h-6 w-6" />
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <ScrollArea className="h-full">
          <div className="p-2">
            {fileTree && renderNode(fileTree)}
          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
