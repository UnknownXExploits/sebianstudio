// Virtual File System for Sebian Studio
// Persists to IndexedDB locally and syncs with Lovable Cloud

export interface VFSNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  content?: string;
  children?: Map<string, VFSNode>;
  createdAt: number;
  modifiedAt: number;
  size: number;
}

export interface VFSProject {
  id: string;
  name: string;
  root: VFSNode;
  createdAt: number;
  modifiedAt: number;
}

export interface VFSWatcher {
  id: string;
  path: string;
  callback: (event: VFSEvent) => void;
}

export interface VFSEvent {
  type: 'create' | 'update' | 'delete' | 'rename';
  path: string;
  oldPath?: string;
}

const DB_NAME = 'sebian-vfs';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';

class VirtualFileSystem {
  private db: IDBDatabase | null = null;
  private currentProject: VFSProject | null = null;
  private cwd: string = '/';
  private watchers: VFSWatcher[] = [];
  private watcherIdCounter = 0;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  async createProject(name: string): Promise<VFSProject> {
    const project: VFSProject = {
      id: crypto.randomUUID(),
      name,
      root: this.createDirectory('/'),
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };
    
    // Create default structure
    this.mkdir('/src', project.root);
    this.mkdir('/assets', project.root);
    
    // Create main.seb with official working example
    const mainContent = `// ${name} - Main Entry Point
// Official Sebian Hello World

print("Hello, Sebian!")
print("Welcome to Sebian Studio")
`;
    this.writeFile('/src/main.seb', mainContent, project.root);
    
    // Save to IndexedDB
    await this.saveProject(project);
    
    this.currentProject = project;
    this.cwd = '/';
    
    return project;
  }

  private createDirectory(path: string): VFSNode {
    const name = path === '/' ? '/' : path.split('/').pop() || '';
    return {
      name,
      type: 'directory',
      path,
      children: new Map(),
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      size: 0,
    };
  }

  private createFile(path: string, content: string = ''): VFSNode {
    const name = path.split('/').pop() || '';
    return {
      name,
      type: 'file',
      path,
      content,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      size: content.length,
    };
  }

  private getNode(path: string, root?: VFSNode): VFSNode | null {
    const targetRoot = root || this.currentProject?.root;
    if (!targetRoot) return null;
    
    const normalizedPath = this.normalizePath(path);
    if (normalizedPath === '/') return targetRoot;
    
    const parts = normalizedPath.split('/').filter(Boolean);
    let current = targetRoot;
    
    for (const part of parts) {
      if (current.type !== 'directory' || !current.children) return null;
      const child = current.children.get(part);
      if (!child) return null;
      current = child;
    }
    
    return current;
  }

  private getParentNode(path: string, root?: VFSNode): VFSNode | null {
    const normalizedPath = this.normalizePath(path);
    const parentPath = normalizedPath.split('/').slice(0, -1).join('/') || '/';
    return this.getNode(parentPath, root);
  }

  private normalizePath(path: string): string {
    if (path.startsWith('/')) {
      return this.resolvePath(path);
    }
    return this.resolvePath(`${this.cwd}/${path}`);
  }

  private resolvePath(path: string): string {
    const parts = path.split('/').filter(Boolean);
    const resolved: string[] = [];
    
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }
    
    return '/' + resolved.join('/');
  }

  mkdir(path: string, root?: VFSNode): boolean {
    const targetRoot = root || this.currentProject?.root;
    if (!targetRoot) return false;
    
    const normalizedPath = this.normalizePath(path);
    const parts = normalizedPath.split('/').filter(Boolean);
    let current = targetRoot;
    let currentPath = '';
    
    for (const part of parts) {
      currentPath += '/' + part;
      
      if (current.type !== 'directory' || !current.children) return false;
      
      if (!current.children.has(part)) {
        const newDir = this.createDirectory(currentPath);
        current.children.set(part, newDir);
        this.notifyWatchers({ type: 'create', path: currentPath });
      }
      
      current = current.children.get(part)!;
    }
    
    return true;
  }

  writeFile(path: string, content: string, root?: VFSNode): boolean {
    const targetRoot = root || this.currentProject?.root;
    if (!targetRoot) return false;
    
    const normalizedPath = this.normalizePath(path);
    const fileName = normalizedPath.split('/').pop() || '';
    const parentPath = normalizedPath.split('/').slice(0, -1).join('/') || '/';
    
    // Ensure parent directory exists
    this.mkdir(parentPath, targetRoot);
    
    const parent = this.getNode(parentPath, targetRoot);
    if (!parent || parent.type !== 'directory' || !parent.children) return false;
    
    const existingFile = parent.children.get(fileName);
    const isUpdate = !!existingFile;
    
    const file = this.createFile(normalizedPath, content);
    parent.children.set(fileName, file);
    
    this.notifyWatchers({ type: isUpdate ? 'update' : 'create', path: normalizedPath });
    
    return true;
  }

  readFile(path: string): string | null {
    const node = this.getNode(path);
    if (!node || node.type !== 'file') return null;
    return node.content ?? '';
  }

  deleteFile(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    const parent = this.getParentNode(normalizedPath);
    if (!parent || parent.type !== 'directory' || !parent.children) return false;
    
    const fileName = normalizedPath.split('/').pop() || '';
    if (!parent.children.has(fileName)) return false;
    
    parent.children.delete(fileName);
    this.notifyWatchers({ type: 'delete', path: normalizedPath });
    
    return true;
  }

  rmdir(path: string, recursive: boolean = false): boolean {
    const normalizedPath = this.normalizePath(path);
    const node = this.getNode(normalizedPath);
    if (!node || node.type !== 'directory') return false;
    
    if (!recursive && node.children && node.children.size > 0) return false;
    
    const parent = this.getParentNode(normalizedPath);
    if (!parent || parent.type !== 'directory' || !parent.children) return false;
    
    const dirName = normalizedPath.split('/').pop() || '';
    parent.children.delete(dirName);
    this.notifyWatchers({ type: 'delete', path: normalizedPath });
    
    return true;
  }

  readdir(path: string): string[] {
    const node = this.getNode(path);
    if (!node || node.type !== 'directory' || !node.children) return [];
    
    return Array.from(node.children.keys());
  }

  exists(path: string): boolean {
    return this.getNode(path) !== null;
  }

  isFile(path: string): boolean {
    const node = this.getNode(path);
    return node?.type === 'file';
  }

  isDirectory(path: string): boolean {
    const node = this.getNode(path);
    return node?.type === 'directory';
  }

  stat(path: string): { size: number; createdAt: number; modifiedAt: number; type: 'file' | 'directory' } | null {
    const node = this.getNode(path);
    if (!node) return null;
    
    return {
      size: node.size,
      createdAt: node.createdAt,
      modifiedAt: node.modifiedAt,
      type: node.type,
    };
  }

  rename(oldPath: string, newPath: string): boolean {
    const oldNormalized = this.normalizePath(oldPath);
    const newNormalized = this.normalizePath(newPath);
    
    const node = this.getNode(oldNormalized);
    if (!node) return false;
    
    const oldParent = this.getParentNode(oldNormalized);
    const newParent = this.getParentNode(newNormalized);
    
    if (!oldParent || !newParent) return false;
    if (oldParent.type !== 'directory' || newParent.type !== 'directory') return false;
    if (!oldParent.children || !newParent.children) return false;
    
    const oldName = oldNormalized.split('/').pop() || '';
    const newName = newNormalized.split('/').pop() || '';
    
    oldParent.children.delete(oldName);
    node.name = newName;
    node.path = newNormalized;
    newParent.children.set(newName, node);
    
    this.notifyWatchers({ type: 'rename', path: newNormalized, oldPath: oldNormalized });
    
    return true;
  }

  copy(srcPath: string, destPath: string): boolean {
    const srcNode = this.getNode(srcPath);
    if (!srcNode) return false;
    
    if (srcNode.type === 'file') {
      return this.writeFile(destPath, srcNode.content || '');
    }
    
    // Copy directory recursively
    this.mkdir(destPath);
    if (srcNode.children) {
      for (const [name, child] of srcNode.children) {
        this.copy(`${srcPath}/${name}`, `${destPath}/${name}`);
      }
    }
    
    return true;
  }

  getCwd(): string {
    return this.cwd;
  }

  chdir(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    const node = this.getNode(normalizedPath);
    if (!node || node.type !== 'directory') return false;
    
    this.cwd = normalizedPath;
    return true;
  }

  watch(path: string, callback: (event: VFSEvent) => void): VFSWatcher {
    const watcher: VFSWatcher = {
      id: `watcher_${++this.watcherIdCounter}`,
      path: this.normalizePath(path),
      callback,
    };
    
    this.watchers.push(watcher);
    return watcher;
  }

  unwatch(watcher: VFSWatcher): void {
    const index = this.watchers.findIndex(w => w.id === watcher.id);
    if (index !== -1) {
      this.watchers.splice(index, 1);
    }
  }

  private notifyWatchers(event: VFSEvent): void {
    for (const watcher of this.watchers) {
      if (event.path.startsWith(watcher.path)) {
        watcher.callback(event);
      }
    }
  }

  async saveProject(project?: VFSProject): Promise<void> {
    const targetProject = project || this.currentProject;
    if (!targetProject || !this.db) return;
    
    targetProject.modifiedAt = Date.now();
    
    // Serialize the project for storage
    const serialized = this.serializeProject(targetProject);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROJECTS_STORE], 'readwrite');
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.put(serialized);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadProject(id: string): Promise<VFSProject | null> {
    if (!this.db) return null;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROJECTS_STORE], 'readonly');
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.get(id);
      
      request.onsuccess = () => {
        if (request.result) {
          const project = this.deserializeProject(request.result);
          this.currentProject = project;
          this.cwd = '/';
          resolve(project);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async listProjects(): Promise<Array<{ id: string; name: string; modifiedAt: number }>> {
    if (!this.db) return [];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROJECTS_STORE], 'readonly');
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const projects = request.result.map((p: any) => ({
          id: p.id,
          name: p.name,
          modifiedAt: p.modifiedAt,
        }));
        resolve(projects);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProject(id: string): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROJECTS_STORE], 'readwrite');
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        if (this.currentProject?.id === id) {
          this.currentProject = null;
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  getCurrentProject(): VFSProject | null {
    return this.currentProject;
  }

  // Serialize project for IndexedDB storage
  private serializeProject(project: VFSProject): any {
    return {
      ...project,
      root: this.serializeNode(project.root),
    };
  }

  private serializeNode(node: VFSNode): any {
    const serialized: any = {
      name: node.name,
      type: node.type,
      path: node.path,
      createdAt: node.createdAt,
      modifiedAt: node.modifiedAt,
      size: node.size,
    };
    
    if (node.type === 'file') {
      serialized.content = node.content;
    } else if (node.children) {
      serialized.children = Array.from(node.children.entries()).map(([name, child]) => [
        name,
        this.serializeNode(child),
      ]);
    }
    
    return serialized;
  }

  private deserializeProject(data: any): VFSProject {
    return {
      ...data,
      root: this.deserializeNode(data.root),
    };
  }

  private deserializeNode(data: any): VFSNode {
    const node: VFSNode = {
      name: data.name,
      type: data.type,
      path: data.path,
      createdAt: data.createdAt,
      modifiedAt: data.modifiedAt,
      size: data.size,
    };
    
    if (data.type === 'file') {
      node.content = data.content;
    } else if (data.children) {
      node.children = new Map(
        data.children.map(([name, child]: [string, any]) => [name, this.deserializeNode(child)])
      );
    }
    
    return node;
  }

  // Get file tree for display
  getFileTree(path: string = '/'): any {
    const node = this.getNode(path);
    if (!node) return null;
    
    return this.buildFileTree(node);
  }

  private buildFileTree(node: VFSNode): any {
    const tree: any = {
      name: node.name,
      type: node.type,
      path: node.path,
    };
    
    if (node.type === 'directory' && node.children) {
      tree.children = Array.from(node.children.values())
        .sort((a, b) => {
          // Directories first, then alphabetical
          if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
        .map(child => this.buildFileTree(child));
    }
    
    return tree;
  }
}

export const vfs = new VirtualFileSystem();
