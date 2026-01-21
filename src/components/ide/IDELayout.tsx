import { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { SidebarProvider } from '@/components/ui/sidebar';
import { IDESidebar } from './IDESidebar';
import { EditorPanel } from './panels/EditorPanel';
import { ConsolePanel } from './panels/ConsolePanel';
import { PreviewPanel } from './panels/PreviewPanel';
import { DebugPanel } from './panels/DebugPanel';
import { TerminalPanel } from './panels/TerminalPanel';
import { CommandExplorer } from './panels/CommandExplorer';
import { DocsPanel } from './panels/DocsPanel';
import { AIPanel } from './panels/AIPanel';
import { SandboxStatus } from './SandboxStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { vfs } from '@/sebian/vfs';
import { 
  Code, 
  Terminal, 
  Play, 
  Bug, 
  BookOpen, 
  Sparkles, 
  Search,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function IDELayout() {
  const [currentFile, setCurrentFile] = useState<string | null>('/src/main.seb');
  const [fileContent, setFileContent] = useState<string>('');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [rightPanel, setRightPanel] = useState<'preview' | 'debug' | 'docs' | 'commands' | 'ai'>('preview');
  const [bottomPanel, setBottomPanel] = useState<'console' | 'terminal'>('console');
  const [isBottomExpanded, setIsBottomExpanded] = useState(true);

  useEffect(() => {
    async function init() {
      await vfs.init();
      const projects = await vfs.listProjects();
      
      if (projects.length === 0) {
        await vfs.createProject('My First Project');
      } else {
        await vfs.loadProject(projects[0].id);
      }
      
      const content = vfs.readFile('/src/main.seb');
      if (content) {
        setFileContent(content);
      }
      
      setIsInitialized(true);
    }
    
    init();
  }, []);

  const handleFileSelect = (path: string) => {
    setCurrentFile(path);
    const content = vfs.readFile(path);
    setFileContent(content || '');
  };

  const handleFileChange = (content: string) => {
    setFileContent(content);
    if (currentFile) {
      vfs.writeFile(currentFile, content);
    }
  };

  const handleConsoleLog = (message: string) => {
    setConsoleOutput(prev => [...prev, message]);
  };

  const clearConsole = () => {
    setConsoleOutput([]);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Initializing Sebian Studio...</p>
        </div>
      </div>
    );
  }

  const handleReplaceCode = (code: string) => {
    setFileContent(code);
    if (currentFile) {
      vfs.writeFile(currentFile, code);
    }
    handleConsoleLog('✨ Code replaced by AI');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <IDESidebar onFileSelect={handleFileSelect} currentFile={currentFile} />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-10 md:h-12 border-b border-border flex items-center justify-between px-2 md:px-4 bg-card">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-primary font-bold">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-primary rounded flex items-center justify-center">
                  <span className="text-primary-foreground text-[10px] md:text-xs font-bold">S</span>
                </div>
                <span className="text-sm md:text-base">Sebian</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <SandboxStatus />
              <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8">
                <Settings className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </div>
          </header>

          {/* Main Content - Stack on mobile, side-by-side on desktop */}
          <div className="flex-1 flex flex-col min-h-0">
            <Tabs defaultValue="editor" className="flex-1 flex flex-col md:hidden">
              {/* Mobile Tab Navigation */}
              <TabsList className="w-full justify-start rounded-none border-b border-border bg-secondary/30 px-1 h-9">
                <TabsTrigger value="editor" className="data-[state=active]:bg-background text-xs h-7">
                  <Code className="h-3 w-3 mr-1" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="preview" className="data-[state=active]:bg-background text-xs h-7">
                  <Play className="h-3 w-3 mr-1" />
                  Run
                </TabsTrigger>
                <TabsTrigger value="ai" className="data-[state=active]:bg-background text-xs h-7">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI
                </TabsTrigger>
                <TabsTrigger value="console" className="data-[state=active]:bg-background text-xs h-7">
                  <Terminal className="h-3 w-3 mr-1" />
                  Log
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="editor" className="flex-1 m-0 mt-0 min-h-0">
                <EditorPanel
                  filePath={currentFile}
                  content={fileContent}
                  onChange={handleFileChange}
                  onRun={handleConsoleLog}
                />
              </TabsContent>
              <TabsContent value="preview" className="flex-1 m-0 mt-0 min-h-0">
                <PreviewPanel code={fileContent} />
              </TabsContent>
              <TabsContent value="ai" className="flex-1 m-0 mt-0 min-h-0">
                <AIPanel 
                  onInsertCode={(code) => handleFileChange(fileContent + '\n' + code)} 
                  onReplaceCode={handleReplaceCode}
                  currentCode={fileContent}
                />
              </TabsContent>
              <TabsContent value="console" className="flex-1 m-0 mt-0 min-h-0">
                <ConsolePanel output={consoleOutput} onClear={clearConsole} />
              </TabsContent>
            </Tabs>

            {/* Desktop Layout */}
            <div className="hidden md:flex md:flex-1 md:flex-col md:min-h-0">
              <ResizablePanelGroup direction="vertical" className="flex-1">
                <ResizablePanel defaultSize={70} minSize={30}>
                  <ResizablePanelGroup direction="horizontal">
                    <ResizablePanel defaultSize={55} minSize={30}>
                      <EditorPanel
                        filePath={currentFile}
                        content={fileContent}
                        onChange={handleFileChange}
                        onRun={handleConsoleLog}
                      />
                    </ResizablePanel>
                    
                    <ResizableHandle withHandle />
                    
                    <ResizablePanel defaultSize={45} minSize={20}>
                      <div className="h-full flex flex-col bg-card">
                        <Tabs value={rightPanel} onValueChange={(v) => setRightPanel(v as any)} className="flex-1 flex flex-col">
                          <TabsList className="w-full justify-start rounded-none border-b border-border bg-secondary/30 px-2">
                            <TabsTrigger value="preview" className="data-[state=active]:bg-background">
                              <Play className="h-3.5 w-3.5 mr-1.5" />
                              Preview
                            </TabsTrigger>
                            <TabsTrigger value="ai" className="data-[state=active]:bg-background">
                              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                              AI
                            </TabsTrigger>
                            <TabsTrigger value="debug" className="data-[state=active]:bg-background">
                              <Bug className="h-3.5 w-3.5 mr-1.5" />
                              Debug
                            </TabsTrigger>
                            <TabsTrigger value="commands" className="data-[state=active]:bg-background">
                              <Search className="h-3.5 w-3.5 mr-1.5" />
                              Cmds
                            </TabsTrigger>
                            <TabsTrigger value="docs" className="data-[state=active]:bg-background">
                              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                              Docs
                            </TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="preview" className="flex-1 m-0 mt-0">
                            <PreviewPanel code={fileContent} />
                          </TabsContent>
                          <TabsContent value="ai" className="flex-1 m-0 mt-0">
                            <AIPanel 
                              onInsertCode={(code) => handleFileChange(fileContent + '\n' + code)} 
                              onReplaceCode={handleReplaceCode}
                              currentCode={fileContent}
                            />
                          </TabsContent>
                          <TabsContent value="debug" className="flex-1 m-0 mt-0">
                            <DebugPanel />
                          </TabsContent>
                          <TabsContent value="commands" className="flex-1 m-0 mt-0">
                            <CommandExplorer />
                          </TabsContent>
                          <TabsContent value="docs" className="flex-1 m-0 mt-0">
                            <DocsPanel />
                          </TabsContent>
                        </Tabs>
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </ResizablePanel>
                
                <ResizableHandle withHandle />
                
                <ResizablePanel 
                  defaultSize={30} 
                  minSize={isBottomExpanded ? 15 : 5}
                  maxSize={isBottomExpanded ? 50 : 5}
                >
                  <div className="h-full flex flex-col bg-card">
                    <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-2">
                      <Tabs value={bottomPanel} onValueChange={(v) => setBottomPanel(v as any)} className="flex-1">
                        <TabsList className="bg-transparent h-9">
                          <TabsTrigger value="console" className="data-[state=active]:bg-background text-xs">
                            <Code className="h-3.5 w-3.5 mr-1.5" />
                            Console
                          </TabsTrigger>
                          <TabsTrigger value="terminal" className="data-[state=active]:bg-background text-xs">
                            <Terminal className="h-3.5 w-3.5 mr-1.5" />
                            Terminal
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => setIsBottomExpanded(!isBottomExpanded)}
                      >
                        {isBottomExpanded ? (
                          <Minimize2 className="h-3.5 w-3.5" />
                        ) : (
                          <Maximize2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    
                    {isBottomExpanded && (
                      <div className="flex-1 min-h-0">
                        {bottomPanel === 'console' ? (
                          <ConsolePanel output={consoleOutput} onClear={clearConsole} />
                        ) : (
                          <TerminalPanel onLog={handleConsoleLog} />
                        )}
                      </div>
                    )}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
