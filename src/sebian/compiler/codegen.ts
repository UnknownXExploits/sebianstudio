// Sebian Bytecode Generator - Compiles AST to VM bytecode
// Generates instructions for SebianVM execution

import * as AST from './ast';
import { 
  Chunk, 
  Instruction, 
  OpCode, 
  SebianValue, 
  SebianFunction,
  CompilationResult,
  CompilationError,
  CompilationWarning 
} from '../vm/types';

interface Local {
  name: string;
  depth: number;
  isCaptured: boolean;
}

interface Upvalue {
  index: number;
  isLocal: boolean;
}

interface CompilerScope {
  locals: Local[];
  upvalues: Upvalue[];
  scopeDepth: number;
  function: SebianFunction;
  enclosing: CompilerScope | null;
}

export class CodeGenerator {
  private currentScope: CompilerScope;
  private errors: CompilationError[] = [];
  private warnings: CompilationWarning[] = [];
  private loopStarts: number[] = [];
  private loopExits: number[][] = [];
  
  constructor() {
    this.currentScope = this.createScope('<main>');
  }
  
  compile(ast: AST.Program): CompilationResult {
    try {
      for (const statement of ast.statements) {
        this.compileStatement(statement);
      }
      
      // Add implicit halt
      this.emit(OpCode.OP_HALT, [], 0, 0);
      
      return {
        success: this.errors.length === 0,
        chunk: this.currentScope.function.chunk,
        errors: this.errors,
        warnings: this.warnings,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown compilation error';
      this.errors.push({
        message: msg,
        line: 1,
        column: 1,
        length: 1,
        source: '',
      });
      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
      };
    }
  }
  
  private createScope(name: string): CompilerScope {
    const chunk: Chunk = {
      code: [],
      constants: [],
      name,
      lines: [],
    };
    
    const func: SebianFunction = {
      name,
      arity: 0,
      chunk,
      upvalueCount: 0,
    };
    
    return {
      locals: [],
      upvalues: [],
      scopeDepth: 0,
      function: func,
      enclosing: null,
    };
  }
  
  private chunk(): Chunk {
    return this.currentScope.function.chunk;
  }
  
  private emit(opcode: OpCode, operands: number[], line: number, column: number): number {
    const instruction: Instruction = {
      opcode,
      operands,
      line,
      column,
    };
    this.chunk().code.push(instruction);
    return this.chunk().code.length - 1;
  }
  
  private addConstant(value: SebianValue): number {
    const existing = this.chunk().constants.findIndex(c => 
      c.type === value.type && 
      (c.type === 'string' || c.type === 'number' || c.type === 'boolean' || c.type === 'null') &&
      (c as any).value === (value as any).value
    );
    
    if (existing !== -1) return existing;
    
    this.chunk().constants.push(value);
    return this.chunk().constants.length - 1;
  }
  
  private emitConstant(value: SebianValue, line: number, column: number): void {
    const index = this.addConstant(value);
    this.emit(OpCode.OP_PUSH_CONST, [index], line, column);
  }
  
  private compileStatement(stmt: AST.Statement): void {
    switch (stmt.type) {
      case 'ImportStatement':
        this.compileImportStatement(stmt);
        break;
      case 'FromImportStatement':
        this.compileFromImportStatement(stmt);
        break;
      case 'CreateStatement':
        this.compileCreateStatement(stmt);
        break;
      case 'RepeatStatement':
        this.compileRepeatStatement(stmt);
        break;
      case 'FunctionDeclaration':
        this.compileFunctionDeclaration(stmt);
        break;
      case 'VariableDeclaration':
        this.compileVariableDeclaration(stmt);
        break;
      case 'AssignmentStatement':
        this.compileAssignment(stmt);
        break;
      case 'ExpressionStatement':
        this.compileExpression(stmt.expression);
        this.emit(OpCode.OP_POP, [], 0, 0);
        break;
      case 'IfStatement':
        this.compileIfStatement(stmt);
        break;
      case 'WhileStatement':
        this.compileWhileStatement(stmt);
        break;
      case 'ForStatement':
        this.compileForStatement(stmt);
        break;
      case 'ReturnStatement':
        this.compileReturnStatement(stmt);
        break;
      case 'BlockStatement':
        this.beginScope();
        for (const s of stmt.statements) {
          this.compileStatement(s);
        }
        this.endScope();
        break;
      case 'DoStatement':
        this.compileDoStatement(stmt);
        break;
      case 'PropertyAssignment':
        // Handled within create/repeat
        break;
    }
  }
  
  private compileImportStatement(stmt: AST.ImportStatement): void {
    const line = stmt.token.line;
    const col = stmt.token.column;
    
    // Load the module
    const moduleIndex = this.addConstant({ type: 'string', value: stmt.from });
    this.emit(OpCode.OP_IMPORT_MODULE, [moduleIndex], line, col);
    
    // Get the export
    const exportIndex = this.addConstant({ type: 'string', value: stmt.name });
    this.emit(OpCode.OP_GET_PROP, [exportIndex], line, col);
    
    // Store as global
    const nameIndex = this.addConstant({ type: 'string', value: stmt.name });
    this.emit(OpCode.OP_STORE_GLOBAL, [nameIndex], line, col);
    this.emit(OpCode.OP_POP, [], line, col);
  }
  
  private compileFromImportStatement(stmt: AST.FromImportStatement): void {
    const line = stmt.token.line;
    const col = stmt.token.column;
    
    // Load the module
    const moduleIndex = this.addConstant({ type: 'string', value: stmt.module });
    this.emit(OpCode.OP_IMPORT_MODULE, [moduleIndex], line, col);
    
    // Import each symbol
    for (const name of stmt.imports) {
      this.emit(OpCode.OP_DUP, [], line, col);
      const exportIndex = this.addConstant({ type: 'string', value: name });
      this.emit(OpCode.OP_GET_PROP, [exportIndex], line, col);
      const nameIndex = this.addConstant({ type: 'string', value: name });
      this.emit(OpCode.OP_STORE_GLOBAL, [nameIndex], line, col);
      this.emit(OpCode.OP_POP, [], line, col);
    }
    
    this.emit(OpCode.OP_POP, [], line, col);
  }
  
  private compileCreateStatement(stmt: AST.CreateStatement): void {
    const line = stmt.token.line;
    const col = stmt.token.column;
    
    // Create UI node
    const typeIndex = this.addConstant({ type: 'string', value: stmt.elementType });
    this.emit(OpCode.OP_UI_CREATE_NODE, [typeIndex], line, col);
    
    // Process nested imports
    for (const imp of stmt.imports) {
      this.compileImportStatement(imp);
    }
    
    // Set properties
    for (const prop of stmt.properties) {
      // Duplicate the node reference
      this.emit(OpCode.OP_DUP, [], prop.token.line, prop.token.column);
      
      // Compile the value
      this.compileExpression(prop.value);
      
      // Handle dotted property names (e.g., "Up.function")
      if (prop.name.includes('.')) {
        const parts = prop.name.split('.');
        // This becomes an event binding
        const eventIndex = this.addConstant({ type: 'string', value: parts[1] });
        this.emit(OpCode.OP_UI_BIND_EVENT, [eventIndex], prop.token.line, prop.token.column);
      } else {
        const propIndex = this.addConstant({ type: 'string', value: prop.name });
        this.emit(OpCode.OP_UI_SET_PROP, [propIndex], prop.token.line, prop.token.column);
      }
      
      this.emit(OpCode.OP_POP, [], prop.token.line, prop.token.column);
    }
    
    // If named, store as variable
    if (stmt.name) {
      const nameIndex = this.addConstant({ type: 'string', value: stmt.name });
      this.emit(OpCode.OP_STORE_GLOBAL, [nameIndex], line, col);
    }
    
    // Render the node
    this.emit(OpCode.OP_DUP, [], line, col);
    this.emit(OpCode.OP_UI_RENDER, [], line, col);
  }
  
  private compileRepeatStatement(stmt: AST.RepeatStatement): void {
    const line = stmt.token.line;
    const col = stmt.token.column;
    
    // Clone the last UI node
    this.emit(OpCode.OP_UI_CLONE, [], line, col);
    
    // Set properties on clone
    for (const prop of stmt.properties) {
      this.emit(OpCode.OP_DUP, [], prop.token.line, prop.token.column);
      this.compileExpression(prop.value);
      
      if (prop.name.includes('.')) {
        const parts = prop.name.split('.');
        const eventIndex = this.addConstant({ type: 'string', value: parts[1] });
        this.emit(OpCode.OP_UI_BIND_EVENT, [eventIndex], prop.token.line, prop.token.column);
      } else {
        const propIndex = this.addConstant({ type: 'string', value: prop.name });
        this.emit(OpCode.OP_UI_SET_PROP, [propIndex], prop.token.line, prop.token.column);
      }
      
      this.emit(OpCode.OP_POP, [], prop.token.line, prop.token.column);
    }
    
    // Render
    this.emit(OpCode.OP_DUP, [], line, col);
    this.emit(OpCode.OP_UI_RENDER, [], line, col);
  }
  
  private compileFunctionDeclaration(stmt: AST.FunctionDeclaration): void {
    const line = stmt.token.line;
    const col = stmt.token.column;
    
    // Create a new scope for the function
    const enclosing = this.currentScope;
    this.currentScope = this.createScope(stmt.name);
    this.currentScope.enclosing = enclosing;
    this.currentScope.function.arity = stmt.parameters.length;
    
    this.beginScope();
    
    // Add parameters as locals
    for (const param of stmt.parameters) {
      this.declareLocal(param);
      this.markInitialized();
    }
    
    // Compile body
    for (const s of stmt.body) {
      this.compileStatement(s);
    }
    
    // Implicit return null
    this.emitConstant({ type: 'null' }, line, col);
    this.emit(OpCode.OP_RET, [], line, col);
    
    // Get the compiled function
    const func = this.currentScope.function;
    func.upvalueCount = this.currentScope.upvalues.length;
    
    // Restore enclosing scope
    this.currentScope = enclosing;
    
    // Add function as constant
    const funcIndex = this.addConstant({ type: 'function', value: func });
    
    // Emit closure instruction with upvalue info
    const upvalueInfo: number[] = [];
    for (const upvalue of this.currentScope.upvalues) {
      upvalueInfo.push(upvalue.isLocal ? 1 : 0);
      upvalueInfo.push(upvalue.index);
    }
    
    this.emit(OpCode.OP_MAKE_CLOSURE, [funcIndex, func.upvalueCount, ...upvalueInfo], line, col);
    
    // Store as global
    const nameIndex = this.addConstant({ type: 'string', value: stmt.name });
    this.emit(OpCode.OP_STORE_GLOBAL, [nameIndex], line, col);
    this.emit(OpCode.OP_POP, [], line, col);
  }
  
  private compileVariableDeclaration(stmt: AST.VariableDeclaration): void {
    const line = stmt.token.line;
    const col = stmt.token.column;
    
    if (stmt.initializer) {
      this.compileExpression(stmt.initializer);
    } else {
      this.emitConstant({ type: 'null' }, line, col);
    }
    
    if (this.currentScope.scopeDepth > 0) {
      // Local variable
      this.declareLocal(stmt.name);
      this.markInitialized();
    } else {
      // Global variable
      const nameIndex = this.addConstant({ type: 'string', value: stmt.name });
      this.emit(OpCode.OP_STORE_GLOBAL, [nameIndex], line, col);
      this.emit(OpCode.OP_POP, [], line, col);
    }
  }
  
  private compileAssignment(stmt: AST.AssignmentStatement): void {
    const line = stmt.token.line;
    const col = stmt.token.column;
    
    // Compile the value
    this.compileExpression(stmt.value);
    
    // Determine the target
    const target = stmt.target;
    
    if (target.type === 'IdentifierExpression') {
      const name = target.name;
      const local = this.resolveLocal(name);
      
      if (local !== -1) {
        this.emit(OpCode.OP_STORE_LOCAL, [local], line, col);
      } else {
        const upvalue = this.resolveUpvalue(name);
        if (upvalue !== -1) {
          this.emit(OpCode.OP_STORE_UPVALUE, [upvalue], line, col);
        } else {
          const nameIndex = this.addConstant({ type: 'string', value: name });
          this.emit(OpCode.OP_STORE_GLOBAL, [nameIndex], line, col);
        }
      }
      this.emit(OpCode.OP_POP, [], line, col);
    } else if (target.type === 'MemberExpression') {
      // obj.prop = value
      // Compile: [value, obj]
      this.compileExpression(target.object);
      this.emit(OpCode.OP_SWAP, [], line, col);
      const propIndex = this.addConstant({ type: 'string', value: target.property });
      this.emit(OpCode.OP_SET_PROP, [propIndex], line, col);
      this.emit(OpCode.OP_POP, [], line, col);
    } else if (target.type === 'IndexExpression') {
      // obj[index] = value
      this.compileExpression(target.object);
      this.compileExpression(target.index);
      // Stack: [value, obj, index] -> need [obj, index, value]
      // This is complex, we'll handle it differently
      this.emit(OpCode.OP_SET_INDEX, [], line, col);
      this.emit(OpCode.OP_POP, [], line, col);
    }
  }
  
  private compileIfStatement(stmt: AST.IfStatement): void {
    const line = stmt.token.line;
    const col = stmt.token.column;
    
    // Compile condition
    this.compileExpression(stmt.condition);
    
    // Jump if false
    const jumpIfFalse = this.emit(OpCode.OP_JMP_IF_FALSE, [0], line, col);
    
    // Compile then branch
    this.beginScope();
    for (const s of stmt.thenBranch) {
      this.compileStatement(s);
    }
    this.endScope();
    
    if (stmt.elseBranch) {
      // Jump over else
      const jumpOver = this.emit(OpCode.OP_JMP, [0], line, col);
      
      // Patch the false jump
      this.patchJump(jumpIfFalse);
      
      // Compile else branch
      this.beginScope();
      for (const s of stmt.elseBranch) {
        this.compileStatement(s);
      }
      this.endScope();
      
      // Patch the jump over
      this.patchJump(jumpOver);
    } else {
      this.patchJump(jumpIfFalse);
    }
  }
  
  private compileWhileStatement(stmt: AST.WhileStatement): void {
    const line = stmt.token.line;
    const col = stmt.token.column;
    
    const loopStart = this.chunk().code.length;
    this.loopStarts.push(loopStart);
    this.loopExits.push([]);
    
    // Compile condition
    this.compileExpression(stmt.condition);
    
    // Exit if false
    const exitJump = this.emit(OpCode.OP_JMP_IF_FALSE, [0], line, col);
    
    // Compile body
    this.beginScope();
    for (const s of stmt.body) {
      this.compileStatement(s);
    }
    this.endScope();
    
    // Loop back
    const offset = this.chunk().code.length - loopStart + 1;
    this.emit(OpCode.OP_LOOP, [offset], line, col);
    
    // Patch exit
    this.patchJump(exitJump);
    
    // Patch break statements
    const exits = this.loopExits.pop()!;
    for (const exit of exits) {
      this.patchJump(exit);
    }
    this.loopStarts.pop();
  }
  
  private compileForStatement(stmt: AST.ForStatement): void {
    const line = stmt.token.line;
    const col = stmt.token.column;
    
    this.beginScope();
    
    // Compile iterable
    this.compileExpression(stmt.iterable);
    
    // Store iterator index
    this.emitConstant({ type: 'number', value: 0 }, line, col);
    const indexLocal = this.declareLocal('$index');
    this.markInitialized();
    
    // Store the iterable
    const iterLocal = this.declareLocal('$iter');
    this.markInitialized();
    
    const loopStart = this.chunk().code.length;
    
    // Check if index < length
    this.emit(OpCode.OP_LOAD_LOCAL, [indexLocal], line, col);
    this.emit(OpCode.OP_LOAD_LOCAL, [iterLocal], line, col);
    // Call length - this is simplified; real implementation would be more complex
    this.emitConstant({ type: 'number', value: 0 }, line, col);
    this.emit(OpCode.OP_LT, [], line, col);
    
    const exitJump = this.emit(OpCode.OP_JMP_IF_FALSE, [0], line, col);
    
    // Get current element
    this.emit(OpCode.OP_LOAD_LOCAL, [iterLocal], line, col);
    this.emit(OpCode.OP_LOAD_LOCAL, [indexLocal], line, col);
    this.emit(OpCode.OP_GET_INDEX, [], line, col);
    
    // Declare loop variable
    this.declareLocal(stmt.variable);
    this.markInitialized();
    
    // Compile body
    for (const s of stmt.body) {
      this.compileStatement(s);
    }
    
    // Increment index
    this.emit(OpCode.OP_LOAD_LOCAL, [indexLocal], line, col);
    this.emitConstant({ type: 'number', value: 1 }, line, col);
    this.emit(OpCode.OP_ADD, [], line, col);
    this.emit(OpCode.OP_STORE_LOCAL, [indexLocal], line, col);
    this.emit(OpCode.OP_POP, [], line, col);
    
    // Loop back
    const offset = this.chunk().code.length - loopStart + 1;
    this.emit(OpCode.OP_LOOP, [offset], line, col);
    
    this.patchJump(exitJump);
    
    this.endScope();
  }
  
  private compileReturnStatement(stmt: AST.ReturnStatement): void {
    const line = stmt.token.line;
    const col = stmt.token.column;
    
    if (stmt.value) {
      this.compileExpression(stmt.value);
    } else {
      this.emitConstant({ type: 'null' }, line, col);
    }
    
    this.emit(OpCode.OP_RET, [], line, col);
  }
  
  private compileDoStatement(stmt: AST.DoStatement): void {
    const line = stmt.token.line;
    const col = stmt.token.column;
    
    // "from sandbox.level do function.run"
    // This is a special syntax for sandbox level changes
    
    if (stmt.module === 'sandbox.level' && stmt.action === 'function.run') {
      // This would trigger a syscall for sandbox level application
      this.emit(OpCode.OP_SYSCALL, [0x0001, 0], line, col); // Custom syscall for sandbox
    }
    
    // Pop the result
    this.emit(OpCode.OP_POP, [], line, col);
  }
  
  private compileExpression(expr: AST.Expression): void {
    switch (expr.type) {
      case 'LiteralExpression':
        this.compileLiteral(expr);
        break;
      case 'IdentifierExpression':
        this.compileIdentifier(expr);
        break;
      case 'BinaryExpression':
        this.compileBinary(expr);
        break;
      case 'UnaryExpression':
        this.compileUnary(expr);
        break;
      case 'CallExpression':
        this.compileCall(expr);
        break;
      case 'MemberExpression':
        this.compileMember(expr);
        break;
      case 'IndexExpression':
        this.compileIndex(expr);
        break;
      case 'ArrayExpression':
        this.compileArray(expr);
        break;
      case 'ObjectExpression':
        this.compileObject(expr);
        break;
      case 'FunctionExpression':
        this.compileFunction(expr);
        break;
      case 'GroupExpression':
        this.compileExpression(expr.expression);
        break;
    }
  }
  
  private compileLiteral(expr: AST.LiteralExpression): void {
    const line = expr.token.line;
    const col = expr.token.column;
    
    switch (expr.literalType) {
      case 'number':
        this.emitConstant({ type: 'number', value: expr.value as number }, line, col);
        break;
      case 'string':
        this.emitConstant({ type: 'string', value: expr.value as string }, line, col);
        break;
      case 'boolean':
        this.emitConstant({ type: 'boolean', value: expr.value as boolean }, line, col);
        break;
      case 'null':
        this.emitConstant({ type: 'null' }, line, col);
        break;
    }
  }
  
  private compileIdentifier(expr: AST.IdentifierExpression): void {
    const line = expr.token.line;
    const col = expr.token.column;
    const name = expr.name;
    
    const local = this.resolveLocal(name);
    if (local !== -1) {
      this.emit(OpCode.OP_LOAD_LOCAL, [local], line, col);
      return;
    }
    
    const upvalue = this.resolveUpvalue(name);
    if (upvalue !== -1) {
      this.emit(OpCode.OP_LOAD_UPVALUE, [upvalue], line, col);
      return;
    }
    
    const nameIndex = this.addConstant({ type: 'string', value: name });
    this.emit(OpCode.OP_LOAD_GLOBAL, [nameIndex], line, col);
  }
  
  private compileBinary(expr: AST.BinaryExpression): void {
    const line = expr.token.line;
    const col = expr.token.column;
    
    // Short-circuit evaluation for and/or
    if (expr.operator === 'and') {
      this.compileExpression(expr.left);
      const jump = this.emit(OpCode.OP_JMP_IF_FALSE, [0], line, col);
      this.emit(OpCode.OP_POP, [], line, col);
      this.compileExpression(expr.right);
      this.patchJump(jump);
      return;
    }
    
    if (expr.operator === 'or') {
      this.compileExpression(expr.left);
      const jump = this.emit(OpCode.OP_JMP_IF_TRUE, [0], line, col);
      this.emit(OpCode.OP_POP, [], line, col);
      this.compileExpression(expr.right);
      this.patchJump(jump);
      return;
    }
    
    this.compileExpression(expr.left);
    this.compileExpression(expr.right);
    
    const opMap: Record<string, OpCode> = {
      '+': OpCode.OP_ADD,
      '-': OpCode.OP_SUB,
      '*': OpCode.OP_MUL,
      '/': OpCode.OP_DIV,
      '%': OpCode.OP_MOD,
      '^': OpCode.OP_POW,
      '==': OpCode.OP_EQ,
      '!=': OpCode.OP_NEQ,
      '<': OpCode.OP_LT,
      '<=': OpCode.OP_LTE,
      '>': OpCode.OP_GT,
      '>=': OpCode.OP_GTE,
    };
    
    const opcode = opMap[expr.operator];
    if (opcode !== undefined) {
      this.emit(opcode, [], line, col);
    }
  }
  
  private compileUnary(expr: AST.UnaryExpression): void {
    const line = expr.token.line;
    const col = expr.token.column;
    
    this.compileExpression(expr.operand);
    
    if (expr.operator === '-') {
      this.emit(OpCode.OP_NEG, [], line, col);
    } else if (expr.operator === 'not' || expr.operator === '!') {
      this.emit(OpCode.OP_NOT, [], line, col);
    }
  }
  
  private compileCall(expr: AST.CallExpression): void {
    const line = expr.token.line;
    const col = expr.token.column;
    
    // Compile callee
    this.compileExpression(expr.callee);
    
    // Compile arguments
    for (const arg of expr.arguments) {
      this.compileExpression(arg);
    }
    
    this.emit(OpCode.OP_CALL, [expr.arguments.length], line, col);
  }
  
  private compileMember(expr: AST.MemberExpression): void {
    const line = expr.token.line;
    const col = expr.token.column;
    
    this.compileExpression(expr.object);
    const propIndex = this.addConstant({ type: 'string', value: expr.property });
    this.emit(OpCode.OP_GET_PROP, [propIndex], line, col);
  }
  
  private compileIndex(expr: AST.IndexExpression): void {
    const line = expr.token.line;
    const col = expr.token.column;
    
    this.compileExpression(expr.object);
    this.compileExpression(expr.index);
    this.emit(OpCode.OP_GET_INDEX, [], line, col);
  }
  
  private compileArray(expr: AST.ArrayExpression): void {
    const line = expr.token.line;
    const col = expr.token.column;
    
    for (const elem of expr.elements) {
      this.compileExpression(elem);
    }
    
    this.emit(OpCode.OP_MAKE_ARRAY, [expr.elements.length], line, col);
  }
  
  private compileObject(expr: AST.ObjectExpression): void {
    const line = expr.token.line;
    const col = expr.token.column;
    
    for (const prop of expr.properties) {
      this.emitConstant({ type: 'string', value: prop.key }, line, col);
      this.compileExpression(prop.value);
    }
    
    this.emit(OpCode.OP_MAKE_OBJECT, [expr.properties.length], line, col);
  }
  
  private compileFunction(expr: AST.FunctionExpression): void {
    const line = expr.token.line;
    const col = expr.token.column;
    
    const enclosing = this.currentScope;
    this.currentScope = this.createScope('<anonymous>');
    this.currentScope.enclosing = enclosing;
    this.currentScope.function.arity = expr.parameters.length;
    
    this.beginScope();
    
    for (const param of expr.parameters) {
      this.declareLocal(param);
      this.markInitialized();
    }
    
    for (const s of expr.body) {
      this.compileStatement(s);
    }
    
    this.emitConstant({ type: 'null' }, line, col);
    this.emit(OpCode.OP_RET, [], line, col);
    
    const func = this.currentScope.function;
    func.upvalueCount = this.currentScope.upvalues.length;
    
    this.currentScope = enclosing;
    
    const funcIndex = this.addConstant({ type: 'function', value: func });
    
    const upvalueInfo: number[] = [];
    for (const upvalue of this.currentScope.upvalues) {
      upvalueInfo.push(upvalue.isLocal ? 1 : 0);
      upvalueInfo.push(upvalue.index);
    }
    
    this.emit(OpCode.OP_MAKE_CLOSURE, [funcIndex, func.upvalueCount, ...upvalueInfo], line, col);
  }
  
  // Scope management
  private beginScope(): void {
    this.currentScope.scopeDepth++;
  }
  
  private endScope(): void {
    this.currentScope.scopeDepth--;
    
    // Pop locals that are going out of scope
    while (
      this.currentScope.locals.length > 0 &&
      this.currentScope.locals[this.currentScope.locals.length - 1].depth > this.currentScope.scopeDepth
    ) {
      const local = this.currentScope.locals.pop()!;
      if (local.isCaptured) {
        this.emit(OpCode.OP_CLOSE_UPVALUE, [], 0, 0);
      } else {
        this.emit(OpCode.OP_POP, [], 0, 0);
      }
    }
  }
  
  private declareLocal(name: string): number {
    // Check for redeclaration in same scope
    for (let i = this.currentScope.locals.length - 1; i >= 0; i--) {
      const local = this.currentScope.locals[i];
      if (local.depth < this.currentScope.scopeDepth) break;
      if (local.name === name) {
        this.warnings.push({
          message: `Variable '${name}' already declared in this scope`,
          line: 0,
          column: 0,
        });
      }
    }
    
    this.currentScope.locals.push({
      name,
      depth: -1, // Uninitialized
      isCaptured: false,
    });
    
    return this.currentScope.locals.length - 1;
  }
  
  private markInitialized(): void {
    if (this.currentScope.locals.length > 0) {
      this.currentScope.locals[this.currentScope.locals.length - 1].depth = this.currentScope.scopeDepth;
    }
  }
  
  private resolveLocal(name: string): number {
    for (let i = this.currentScope.locals.length - 1; i >= 0; i--) {
      const local = this.currentScope.locals[i];
      if (local.name === name) {
        if (local.depth === -1) {
          this.errors.push({
            message: `Cannot use variable '${name}' in its own initializer`,
            line: 0,
            column: 0,
            length: name.length,
            source: '',
          });
        }
        return i;
      }
    }
    return -1;
  }
  
  private resolveUpvalue(name: string): number {
    if (this.currentScope.enclosing === null) return -1;
    
    // Look in enclosing scope's locals
    const enclosing = this.currentScope.enclosing;
    for (let i = enclosing.locals.length - 1; i >= 0; i--) {
      if (enclosing.locals[i].name === name) {
        enclosing.locals[i].isCaptured = true;
        return this.addUpvalue(i, true);
      }
    }
    
    // Look in enclosing scope's upvalues
    for (let i = 0; i < enclosing.upvalues.length; i++) {
      if (enclosing.upvalues[i].index === this.resolveLocal(name)) {
        return this.addUpvalue(i, false);
      }
    }
    
    return -1;
  }
  
  private addUpvalue(index: number, isLocal: boolean): number {
    for (let i = 0; i < this.currentScope.upvalues.length; i++) {
      const upvalue = this.currentScope.upvalues[i];
      if (upvalue.index === index && upvalue.isLocal === isLocal) {
        return i;
      }
    }
    
    this.currentScope.upvalues.push({ index, isLocal });
    return this.currentScope.upvalues.length - 1;
  }
  
  private patchJump(offset: number): void {
    const target = this.chunk().code.length;
    this.chunk().code[offset].operands[0] = target;
  }
}
