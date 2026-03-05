// SebianVM Web Worker
// Runs the VM off the main thread to prevent browser freezes

import { SebianVM } from './vm';
import type { Chunk, SandboxLevel } from './types';

interface WorkerMessage {
  type: 'run';
  chunk: Chunk;
  sandboxLevel?: SandboxLevel;
}

interface WorkerResponse {
  type: 'output' | 'complete' | 'error' | 'ui_update';
  message?: string;
  output?: string[];
  error?: string;
  instructionCount?: number;
  uiRoot?: any;
}

// This worker is used via a blob URL created in the PreviewPanel/ConsolePanel
// The actual worker setup is in useWorkerVM hook

const ctx = self as unknown as Worker;

let vm: SebianVM | null = null;
const outputBuffer: string[] = [];

ctx.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, chunk, sandboxLevel } = event.data;

  if (type === 'run') {
    outputBuffer.length = 0;

    try {
      vm = new SebianVM({ level: sandboxLevel ?? 2 });

      vm.setOutputHandler((msg: string) => {
        outputBuffer.push(msg);
        ctx.postMessage({ type: 'output', message: msg } as WorkerResponse);
      });

      vm.setUIUpdateHandler((root) => {
        // Serialize UI tree (strip circular refs)
        const serialize = (node: any): any => {
          if (!node) return null;
          return {
            id: node.id,
            type: node.type,
            props: Object.fromEntries(node.props || new Map()),
            children: (node.children || []).map(serialize),
            eventHandlers: Array.from((node.eventHandlers || new Map()).keys()),
          };
        };
        ctx.postMessage({ type: 'ui_update', uiRoot: serialize(root) } as WorkerResponse);
      });

      vm.run(chunk);

      const state = vm.getState();
      ctx.postMessage({
        type: 'complete',
        output: outputBuffer,
        instructionCount: state.instructionCount,
      } as WorkerResponse);
    } catch (error) {
      ctx.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown VM error',
        output: outputBuffer,
      } as WorkerResponse);
    }
  }
};
