// Sebian Programming Language - Main Export
// Complete ecosystem: Compiler + VM + Runtime

export * from './vm/types';
export * from './vm/vm';
export * from './vm/syscalls';
export * from './vm/stdlib';
export * from './compiler';

import { SebianVM } from './vm/vm';
import { compile, formatError, disassemble } from './compiler';
import { SandboxLevel, SebianValue, Chunk } from './vm/types';

export interface ExecutionResult {
  success: boolean;
  value?: SebianValue;
  output: string[];
  error?: string;
  bytecode?: Chunk;
}

export interface SebianRuntime {
  vm: SebianVM;
  execute: (source: string) => ExecutionResult;
  executeChunk: (chunk: Chunk) => ExecutionResult;
  getSandboxLevel: () => SandboxLevel;
  setSandboxLevel: (level: SandboxLevel, confirmed?: boolean) => { success: boolean; warning?: string };
  getCapabilities: () => string[];
  reset: () => void;
  getState: () => any;
}

export function createRuntime(sandboxLevel: SandboxLevel = 2): SebianRuntime {
  const vm = new SebianVM({ level: sandboxLevel });
  const output: string[] = [];
  
  vm.setOutputHandler((msg) => {
    output.push(msg);
  });
  
  const execute = (source: string): ExecutionResult => {
    output.length = 0;
    
    try {
      const result = compile(source);
      
      if (!result.success || !result.chunk) {
        const errorMessages = result.errors.map(e => formatError(e, source));
        return {
          success: false,
          output,
          error: errorMessages.join('\n'),
        };
      }
      
      const value = vm.run(result.chunk);
      
      return {
        success: true,
        value,
        output: [...output],
        bytecode: result.chunk,
      };
    } catch (error) {
      return {
        success: false,
        output: [...output],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };
  
  const executeChunk = (chunk: Chunk): ExecutionResult => {
    output.length = 0;
    
    try {
      const value = vm.run(chunk);
      return {
        success: true,
        value,
        output: [...output],
        bytecode: chunk,
      };
    } catch (error) {
      return {
        success: false,
        output: [...output],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };
  
  return {
    vm,
    execute,
    executeChunk,
    getSandboxLevel: () => vm.getSandboxLevel(),
    setSandboxLevel: (level: SandboxLevel, confirmed = false) => {
      if (level === 1 && confirmed) {
        vm.confirmSandboxLevel(1);
        return { success: true };
      }
      return vm.setSandboxLevel(level);
    },
    getCapabilities: () => vm.getCapabilities(),
    reset: () => vm.reset(),
    getState: () => vm.getState(),
  };
}

// Export convenience function
export { compile, formatError, disassemble };
