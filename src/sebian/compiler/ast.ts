// Sebian Abstract Syntax Tree (AST) Node Types
// Represents parsed Sebian code structures

import { Token } from './lexer';

export type ASTNode = 
  | Program
  | Statement
  | Expression;

// Top-level program
export interface Program {
  type: 'Program';
  statements: Statement[];
}

// Statements
export type Statement =
  | ImportStatement
  | FromImportStatement
  | CreateStatement
  | RepeatStatement
  | FunctionDeclaration
  | VariableDeclaration
  | AssignmentStatement
  | PropertyAssignment
  | ExpressionStatement
  | IfStatement
  | WhileStatement
  | ForStatement
  | ReturnStatement
  | BlockStatement
  | DoStatement;

export interface ImportStatement {
  type: 'ImportStatement';
  name: string;          // What to import (e.g., "SebianVM")
  from: string;          // Module name (e.g., "Sebian")
  token: Token;
}

export interface FromImportStatement {
  type: 'FromImportStatement';
  module: string;        // Module name (e.g., "ui")
  imports: string[];     // What to import (e.g., ["buttons"])
  token: Token;
}

export interface CreateStatement {
  type: 'CreateStatement';
  elementType: string;   // Type of element (e.g., "button")
  name?: string;         // Optional name
  properties: PropertyAssignment[];
  imports: ImportStatement[];
  token: Token;
}

export interface RepeatStatement {
  type: 'RepeatStatement';
  modifier: 'local' | null;  // "Repeat local"
  description: string;       // "button creation"
  properties: PropertyAssignment[];
  token: Token;
}

export interface FunctionDeclaration {
  type: 'FunctionDeclaration';
  name: string;
  parameters: string[];
  body: Statement[];
  token: Token;
}

export interface VariableDeclaration {
  type: 'VariableDeclaration';
  name: string;
  initializer: Expression | null;
  isLocal: boolean;
  token: Token;
}

export interface AssignmentStatement {
  type: 'AssignmentStatement';
  target: Expression;
  value: Expression;
  token: Token;
}

export interface PropertyAssignment {
  type: 'PropertyAssignment';
  name: string;          // Property name (e.g., "Buttonname")
  value: Expression;     // Value
  token: Token;
}

export interface ExpressionStatement {
  type: 'ExpressionStatement';
  expression: Expression;
}

export interface IfStatement {
  type: 'IfStatement';
  condition: Expression;
  thenBranch: Statement[];
  elseBranch: Statement[] | null;
  token: Token;
}

export interface WhileStatement {
  type: 'WhileStatement';
  condition: Expression;
  body: Statement[];
  token: Token;
}

export interface ForStatement {
  type: 'ForStatement';
  variable: string;
  iterable: Expression;
  body: Statement[];
  token: Token;
}

export interface ReturnStatement {
  type: 'ReturnStatement';
  value: Expression | null;
  token: Token;
}

export interface BlockStatement {
  type: 'BlockStatement';
  statements: Statement[];
}

export interface DoStatement {
  type: 'DoStatement';
  module: string;        // e.g., "sandbox.level"
  action: string;        // e.g., "function.run"
  token: Token;
}

// Expressions
export type Expression =
  | LiteralExpression
  | IdentifierExpression
  | BinaryExpression
  | UnaryExpression
  | CallExpression
  | MemberExpression
  | IndexExpression
  | ArrayExpression
  | ObjectExpression
  | FunctionExpression
  | GroupExpression;

export interface LiteralExpression {
  type: 'LiteralExpression';
  value: string | number | boolean | null;
  literalType: 'string' | 'number' | 'boolean' | 'null';
  token: Token;
}

export interface IdentifierExpression {
  type: 'IdentifierExpression';
  name: string;
  token: Token;
}

export interface BinaryExpression {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
  token: Token;
}

export interface UnaryExpression {
  type: 'UnaryExpression';
  operator: string;
  operand: Expression;
  token: Token;
}

export interface CallExpression {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
  token: Token;
}

export interface MemberExpression {
  type: 'MemberExpression';
  object: Expression;
  property: string;
  token: Token;
}

export interface IndexExpression {
  type: 'IndexExpression';
  object: Expression;
  index: Expression;
  token: Token;
}

export interface ArrayExpression {
  type: 'ArrayExpression';
  elements: Expression[];
  token: Token;
}

export interface ObjectExpression {
  type: 'ObjectExpression';
  properties: { key: string; value: Expression }[];
  token: Token;
}

export interface FunctionExpression {
  type: 'FunctionExpression';
  parameters: string[];
  body: Statement[];
  token: Token;
}

export interface GroupExpression {
  type: 'GroupExpression';
  expression: Expression;
}

// Visitor pattern for AST traversal
export interface ASTVisitor<T> {
  visitProgram(node: Program): T;
  visitImportStatement(node: ImportStatement): T;
  visitFromImportStatement(node: FromImportStatement): T;
  visitCreateStatement(node: CreateStatement): T;
  visitRepeatStatement(node: RepeatStatement): T;
  visitFunctionDeclaration(node: FunctionDeclaration): T;
  visitVariableDeclaration(node: VariableDeclaration): T;
  visitAssignmentStatement(node: AssignmentStatement): T;
  visitPropertyAssignment(node: PropertyAssignment): T;
  visitExpressionStatement(node: ExpressionStatement): T;
  visitIfStatement(node: IfStatement): T;
  visitWhileStatement(node: WhileStatement): T;
  visitForStatement(node: ForStatement): T;
  visitReturnStatement(node: ReturnStatement): T;
  visitBlockStatement(node: BlockStatement): T;
  visitDoStatement(node: DoStatement): T;
  visitLiteralExpression(node: LiteralExpression): T;
  visitIdentifierExpression(node: IdentifierExpression): T;
  visitBinaryExpression(node: BinaryExpression): T;
  visitUnaryExpression(node: UnaryExpression): T;
  visitCallExpression(node: CallExpression): T;
  visitMemberExpression(node: MemberExpression): T;
  visitIndexExpression(node: IndexExpression): T;
  visitArrayExpression(node: ArrayExpression): T;
  visitObjectExpression(node: ObjectExpression): T;
  visitFunctionExpression(node: FunctionExpression): T;
  visitGroupExpression(node: GroupExpression): T;
}

// Helper to visit any node
export function visitNode<T>(node: ASTNode, visitor: ASTVisitor<T>): T {
  switch (node.type) {
    case 'Program': return visitor.visitProgram(node);
    case 'ImportStatement': return visitor.visitImportStatement(node);
    case 'FromImportStatement': return visitor.visitFromImportStatement(node);
    case 'CreateStatement': return visitor.visitCreateStatement(node);
    case 'RepeatStatement': return visitor.visitRepeatStatement(node);
    case 'FunctionDeclaration': return visitor.visitFunctionDeclaration(node);
    case 'VariableDeclaration': return visitor.visitVariableDeclaration(node);
    case 'AssignmentStatement': return visitor.visitAssignmentStatement(node);
    case 'PropertyAssignment': return visitor.visitPropertyAssignment(node);
    case 'ExpressionStatement': return visitor.visitExpressionStatement(node);
    case 'IfStatement': return visitor.visitIfStatement(node);
    case 'WhileStatement': return visitor.visitWhileStatement(node);
    case 'ForStatement': return visitor.visitForStatement(node);
    case 'ReturnStatement': return visitor.visitReturnStatement(node);
    case 'BlockStatement': return visitor.visitBlockStatement(node);
    case 'DoStatement': return visitor.visitDoStatement(node);
    case 'LiteralExpression': return visitor.visitLiteralExpression(node);
    case 'IdentifierExpression': return visitor.visitIdentifierExpression(node);
    case 'BinaryExpression': return visitor.visitBinaryExpression(node);
    case 'UnaryExpression': return visitor.visitUnaryExpression(node);
    case 'CallExpression': return visitor.visitCallExpression(node);
    case 'MemberExpression': return visitor.visitMemberExpression(node);
    case 'IndexExpression': return visitor.visitIndexExpression(node);
    case 'ArrayExpression': return visitor.visitArrayExpression(node);
    case 'ObjectExpression': return visitor.visitObjectExpression(node);
    case 'FunctionExpression': return visitor.visitFunctionExpression(node);
    case 'GroupExpression': return visitor.visitGroupExpression(node);
    default:
      throw new Error(`Unknown node type: ${(node as any).type}`);
  }
}
