// Sebian Parser - Converts tokens into AST
// Handles the exact Sebian syntax style

import { Token, TokenType, Lexer } from './lexer';
import * as AST from './ast';
import { CompilationError } from '../vm/types';

export class Parser {
  private tokens: Token[] = [];
  private current = 0;
  private errors: CompilationError[] = [];
  private source: string;
  
  constructor(source: string) {
    this.source = source;
    const lexer = new Lexer(source);
    this.tokens = lexer.tokenize();
  }
  
  parse(): { ast: AST.Program | null; errors: CompilationError[] } {
    const statements: AST.Statement[] = [];
    
    this.skipNewlines();
    
    while (!this.isAtEnd()) {
      try {
        const stmt = this.parseStatement();
        if (stmt) {
          statements.push(stmt);
        }
      } catch (error) {
        this.synchronize();
      }
      this.skipNewlines();
    }
    
    if (this.errors.length > 0) {
      return { ast: null, errors: this.errors };
    }
    
    return {
      ast: { type: 'Program', statements },
      errors: this.errors,
    };
  }
  
  private parseStatement(): AST.Statement | null {
    this.skipNewlines();
    
    // Import X from Y
    if (this.check(TokenType.IMPORT)) {
      return this.parseImportStatement();
    }
    
    // from X import Y
    if (this.check(TokenType.FROM)) {
      return this.parseFromStatement();
    }
    
    // Create X [ ... ]
    if (this.check(TokenType.CREATE)) {
      return this.parseCreateStatement();
    }
    
    // Repeat local X [ ... ]
    if (this.check(TokenType.REPEAT)) {
      return this.parseRepeatStatement();
    }
    
    // function X(...) { ... }
    if (this.check(TokenType.FUNCTION)) {
      return this.parseFunctionDeclaration();
    }
    
    // local X = ...
    if (this.check(TokenType.LOCAL)) {
      return this.parseLocalDeclaration();
    }
    
    // if ... { ... }
    if (this.check(TokenType.IF)) {
      return this.parseIfStatement();
    }
    
    // while ... { ... }
    if (this.check(TokenType.WHILE)) {
      return this.parseWhileStatement();
    }
    
    // for ... { ... }
    if (this.check(TokenType.FOR)) {
      return this.parseForStatement();
    }
    
    // return ...
    if (this.check(TokenType.RETURN)) {
      return this.parseReturnStatement();
    }
    
    // Expression or assignment
    return this.parseExpressionStatement();
  }
  
  private parseImportStatement(): AST.ImportStatement {
    const token = this.advance(); // consume 'Import'
    
    const name = this.consume(TokenType.IDENTIFIER, 'Expected import name').lexeme;
    
    this.consume(TokenType.FROM, "Expected 'from' after import name");
    
    const from = this.consume(TokenType.IDENTIFIER, 'Expected module name').lexeme;
    
    this.consumeNewlineOrEnd();
    
    return {
      type: 'ImportStatement',
      name,
      from,
      token,
    };
  }
  
  private parseFromStatement(): AST.FromImportStatement | AST.DoStatement {
    const token = this.advance(); // consume 'from'
    
    // Check for "from X.Y do Z"
    let modulePath = this.consume(TokenType.IDENTIFIER, 'Expected module name').lexeme;
    
    while (this.match(TokenType.DOT)) {
      modulePath += '.' + this.consume(TokenType.IDENTIFIER, 'Expected identifier after dot').lexeme;
    }
    
    // "from sandbox.level do function.run"
    if (this.check(TokenType.DO)) {
      this.advance(); // consume 'do'
      
      let action = this.consume(TokenType.IDENTIFIER, 'Expected action').lexeme;
      while (this.match(TokenType.DOT)) {
        action += '.' + this.consume(TokenType.IDENTIFIER, 'Expected identifier').lexeme;
      }
      
      this.consumeNewlineOrEnd();
      
      return {
        type: 'DoStatement',
        module: modulePath,
        action,
        token,
      };
    }
    
    // "from X import Y, Z"
    this.consume(TokenType.IMPORT, "Expected 'import' after module name");
    
    const imports: string[] = [];
    do {
      imports.push(this.consume(TokenType.IDENTIFIER, 'Expected import name').lexeme);
    } while (this.match(TokenType.COMMA));
    
    this.consumeNewlineOrEnd();
    
    return {
      type: 'FromImportStatement',
      module: modulePath,
      imports,
      token,
    };
  }
  
  private parseCreateStatement(): AST.CreateStatement {
    const token = this.advance(); // consume 'Create'
    
    const elementType = this.consume(TokenType.IDENTIFIER, 'Expected element type').lexeme;
    
    let name: string | undefined;
    
    // Optional name after type
    if (this.check(TokenType.IDENTIFIER)) {
      name = this.advance().lexeme;
    }
    
    this.skipNewlines();
    this.consume(TokenType.LEFT_BRACKET, "Expected '[' after create statement");
    this.skipNewlines();
    
    const properties: AST.PropertyAssignment[] = [];
    const imports: AST.ImportStatement[] = [];
    
    while (!this.check(TokenType.RIGHT_BRACKET) && !this.isAtEnd()) {
      this.skipNewlines();
      
      // Nested imports inside [ ]
      if (this.check(TokenType.IMPORT)) {
        const importStmt = this.parseImportStatement();
        imports.push(importStmt);
      } else if (this.check(TokenType.IDENTIFIER)) {
        const propName = this.advance().lexeme;
        
        // Check for property assignment with = or .
        if (this.match(TokenType.EQUAL)) {
          const value = this.parseExpression();
          properties.push({
            type: 'PropertyAssignment',
            name: propName,
            value,
            token: this.previous(),
          });
        } else if (this.match(TokenType.DOT)) {
          // X.function=Y
          const subProp = this.consume(TokenType.IDENTIFIER, 'Expected property name').lexeme;
          this.consume(TokenType.EQUAL, "Expected '=' after property");
          const value = this.parseExpression();
          properties.push({
            type: 'PropertyAssignment',
            name: `${propName}.${subProp}`,
            value,
            token: this.previous(),
          });
        }
      }
      
      this.skipNewlines();
    }
    
    this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after create block");
    
    return {
      type: 'CreateStatement',
      elementType,
      name,
      properties,
      imports,
      token,
    };
  }
  
  private parseRepeatStatement(): AST.RepeatStatement {
    const token = this.advance(); // consume 'Repeat'
    
    let modifier: 'local' | null = null;
    
    if (this.check(TokenType.LOCAL)) {
      this.advance();
      modifier = 'local';
    }
    
    // Parse description (e.g., "button creation")
    let description = '';
    while (!this.check(TokenType.LEFT_BRACKET) && !this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
      description += this.advance().lexeme + ' ';
    }
    description = description.trim();
    
    this.skipNewlines();
    this.consume(TokenType.LEFT_BRACKET, "Expected '[' after repeat statement");
    this.skipNewlines();
    
    const properties: AST.PropertyAssignment[] = [];
    
    while (!this.check(TokenType.RIGHT_BRACKET) && !this.isAtEnd()) {
      this.skipNewlines();
      
      if (this.check(TokenType.IDENTIFIER)) {
        const propName = this.advance().lexeme;
        
        if (this.match(TokenType.EQUAL)) {
          const value = this.parseExpression();
          properties.push({
            type: 'PropertyAssignment',
            name: propName,
            value,
            token: this.previous(),
          });
        } else if (this.match(TokenType.DOT)) {
          const subProp = this.consume(TokenType.IDENTIFIER, 'Expected property name').lexeme;
          this.consume(TokenType.EQUAL, "Expected '=' after property");
          const value = this.parseExpression();
          properties.push({
            type: 'PropertyAssignment',
            name: `${propName}.${subProp}`,
            value,
            token: this.previous(),
          });
        }
      }
      
      this.skipNewlines();
    }
    
    this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after repeat block");
    
    return {
      type: 'RepeatStatement',
      modifier,
      description,
      properties,
      token,
    };
  }
  
  private parseFunctionDeclaration(): AST.FunctionDeclaration {
    const token = this.advance(); // consume 'function'
    
    const name = this.consume(TokenType.IDENTIFIER, 'Expected function name').lexeme;
    
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after function name");
    
    const parameters: string[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        parameters.push(this.consume(TokenType.IDENTIFIER, 'Expected parameter name').lexeme);
      } while (this.match(TokenType.COMMA));
    }
    
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameters");
    
    this.skipNewlines();
    
    const body = this.parseBlock();
    
    return {
      type: 'FunctionDeclaration',
      name,
      parameters,
      body,
      token,
    };
  }
  
  private parseLocalDeclaration(): AST.VariableDeclaration {
    const token = this.advance(); // consume 'local'
    
    const name = this.consume(TokenType.IDENTIFIER, 'Expected variable name').lexeme;
    
    let initializer: AST.Expression | null = null;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.parseExpression();
    }
    
    this.consumeNewlineOrEnd();
    
    return {
      type: 'VariableDeclaration',
      name,
      initializer,
      isLocal: true,
      token,
    };
  }
  
  private parseIfStatement(): AST.IfStatement {
    const token = this.advance(); // consume 'if'
    
    const condition = this.parseExpression();
    
    this.skipNewlines();
    
    const thenBranch = this.parseBlock();
    
    let elseBranch: AST.Statement[] | null = null;
    
    this.skipNewlines();
    
    if (this.match(TokenType.ELSE)) {
      this.skipNewlines();
      if (this.check(TokenType.IF)) {
        elseBranch = [this.parseIfStatement()];
      } else {
        elseBranch = this.parseBlock();
      }
    }
    
    return {
      type: 'IfStatement',
      condition,
      thenBranch,
      elseBranch,
      token,
    };
  }
  
  private parseWhileStatement(): AST.WhileStatement {
    const token = this.advance(); // consume 'while'
    
    const condition = this.parseExpression();
    
    this.skipNewlines();
    
    const body = this.parseBlock();
    
    return {
      type: 'WhileStatement',
      condition,
      body,
      token,
    };
  }
  
  private parseForStatement(): AST.ForStatement {
    const token = this.advance(); // consume 'for'
    
    const variable = this.consume(TokenType.IDENTIFIER, 'Expected variable name').lexeme;
    
    // Expect 'in' keyword (as identifier)
    const inKeyword = this.consume(TokenType.IDENTIFIER, "Expected 'in' after variable");
    if (inKeyword.lexeme !== 'in') {
      this.error(inKeyword, "Expected 'in' keyword");
    }
    
    const iterable = this.parseExpression();
    
    this.skipNewlines();
    
    const body = this.parseBlock();
    
    return {
      type: 'ForStatement',
      variable,
      iterable,
      body,
      token,
    };
  }
  
  private parseReturnStatement(): AST.ReturnStatement {
    const token = this.advance(); // consume 'return'
    
    let value: AST.Expression | null = null;
    
    if (!this.check(TokenType.NEWLINE) && !this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      value = this.parseExpression();
    }
    
    this.consumeNewlineOrEnd();
    
    return {
      type: 'ReturnStatement',
      value,
      token,
    };
  }
  
  private parseBlock(): AST.Statement[] {
    if (this.check(TokenType.LEFT_BRACE)) {
      this.advance(); // consume '{'
      this.skipNewlines();
      
      const statements: AST.Statement[] = [];
      
      while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
        const stmt = this.parseStatement();
        if (stmt) {
          statements.push(stmt);
        }
        this.skipNewlines();
      }
      
      this.consume(TokenType.RIGHT_BRACE, "Expected '}' after block");
      
      return statements;
    } else if (this.check(TokenType.LEFT_BRACKET)) {
      this.advance(); // consume '['
      this.skipNewlines();
      
      const statements: AST.Statement[] = [];
      
      while (!this.check(TokenType.RIGHT_BRACKET) && !this.isAtEnd()) {
        const stmt = this.parseStatement();
        if (stmt) {
          statements.push(stmt);
        }
        this.skipNewlines();
      }
      
      this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after block");
      
      return statements;
    } else {
      // Single statement
      const stmt = this.parseStatement();
      return stmt ? [stmt] : [];
    }
  }
  
  private parseExpressionStatement(): AST.Statement {
    const expr = this.parseExpression();
    
    // Check for assignment
    if (this.match(TokenType.EQUAL)) {
      const value = this.parseExpression();
      
      this.consumeNewlineOrEnd();
      
      return {
        type: 'AssignmentStatement',
        target: expr,
        value,
        token: this.previous(),
      };
    }
    
    this.consumeNewlineOrEnd();
    
    return {
      type: 'ExpressionStatement',
      expression: expr,
    };
  }
  
  private parseExpression(): AST.Expression {
    return this.parseOr();
  }
  
  private parseOr(): AST.Expression {
    let left = this.parseAnd();
    
    while (this.match(TokenType.OR)) {
      const token = this.previous();
      const right = this.parseAnd();
      left = {
        type: 'BinaryExpression',
        operator: 'or',
        left,
        right,
        token,
      };
    }
    
    return left;
  }
  
  private parseAnd(): AST.Expression {
    let left = this.parseEquality();
    
    while (this.match(TokenType.AND)) {
      const token = this.previous();
      const right = this.parseEquality();
      left = {
        type: 'BinaryExpression',
        operator: 'and',
        left,
        right,
        token,
      };
    }
    
    return left;
  }
  
  private parseEquality(): AST.Expression {
    let left = this.parseComparison();
    
    while (this.match(TokenType.EQUAL_EQUAL, TokenType.BANG_EQUAL)) {
      const token = this.previous();
      const operator = token.type === TokenType.EQUAL_EQUAL ? '==' : '!=';
      const right = this.parseComparison();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
        token,
      };
    }
    
    return left;
  }
  
  private parseComparison(): AST.Expression {
    let left = this.parseTerm();
    
    while (this.match(TokenType.LESS, TokenType.LESS_EQUAL, TokenType.GREATER, TokenType.GREATER_EQUAL)) {
      const token = this.previous();
      const operators: Partial<Record<TokenType, string>> = {
        [TokenType.LESS]: '<',
        [TokenType.LESS_EQUAL]: '<=',
        [TokenType.GREATER]: '>',
        [TokenType.GREATER_EQUAL]: '>=',
      };
      const operator = operators[token.type] || '<';
      const right = this.parseTerm();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
        token,
      };
    }
    
    return left;
  }
  
  private parseTerm(): AST.Expression {
    let left = this.parseFactor();
    
    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const token = this.previous();
      const operator = token.type === TokenType.PLUS ? '+' : '-';
      const right = this.parseFactor();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
        token,
      };
    }
    
    return left;
  }
  
  private parseFactor(): AST.Expression {
    let left = this.parseUnary();
    
    while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT, TokenType.CARET)) {
      const token = this.previous();
      const operators: Partial<Record<TokenType, string>> = {
        [TokenType.STAR]: '*',
        [TokenType.SLASH]: '/',
        [TokenType.PERCENT]: '%',
        [TokenType.CARET]: '^',
      };
      const operator = operators[token.type] || '*';
      const right = this.parseUnary();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
        token,
      };
    }
    
    return left;
  }
  
  private parseUnary(): AST.Expression {
    if (this.match(TokenType.MINUS, TokenType.BANG, TokenType.NOT)) {
      const token = this.previous();
      const operator = token.type === TokenType.MINUS ? '-' : 'not';
      const operand = this.parseUnary();
      return {
        type: 'UnaryExpression',
        operator,
        operand,
        token,
      };
    }
    
    return this.parseCall();
  }
  
  private parseCall(): AST.Expression {
    let expr = this.parsePrimary();
    
    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        const args: AST.Expression[] = [];
        
        if (!this.check(TokenType.RIGHT_PAREN)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.COMMA));
        }
        
        const token = this.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments");
        
        expr = {
          type: 'CallExpression',
          callee: expr,
          arguments: args,
          token,
        };
      } else if (this.match(TokenType.DOT)) {
        const property = this.consume(TokenType.IDENTIFIER, 'Expected property name after dot').lexeme;
        expr = {
          type: 'MemberExpression',
          object: expr,
          property,
          token: this.previous(),
        };
      } else if (this.match(TokenType.LEFT_BRACKET)) {
        const index = this.parseExpression();
        const token = this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after index");
        expr = {
          type: 'IndexExpression',
          object: expr,
          index,
          token,
        };
      } else {
        break;
      }
    }
    
    return expr;
  }
  
  private parsePrimary(): AST.Expression {
    // Literals
    if (this.match(TokenType.NUMBER)) {
      return {
        type: 'LiteralExpression',
        value: this.previous().literal as number,
        literalType: 'number',
        token: this.previous(),
      };
    }
    
    if (this.match(TokenType.STRING)) {
      return {
        type: 'LiteralExpression',
        value: this.previous().literal as string,
        literalType: 'string',
        token: this.previous(),
      };
    }
    
    if (this.match(TokenType.TRUE)) {
      return {
        type: 'LiteralExpression',
        value: true,
        literalType: 'boolean',
        token: this.previous(),
      };
    }
    
    if (this.match(TokenType.FALSE)) {
      return {
        type: 'LiteralExpression',
        value: false,
        literalType: 'boolean',
        token: this.previous(),
      };
    }
    
    if (this.match(TokenType.NULL)) {
      return {
        type: 'LiteralExpression',
        value: null,
        literalType: 'null',
        token: this.previous(),
      };
    }
    
    // Array literal
    if (this.match(TokenType.LEFT_BRACKET)) {
      const elements: AST.Expression[] = [];
      
      if (!this.check(TokenType.RIGHT_BRACKET)) {
        do {
          this.skipNewlines();
          elements.push(this.parseExpression());
          this.skipNewlines();
        } while (this.match(TokenType.COMMA));
      }
      
      const token = this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after array elements");
      
      return {
        type: 'ArrayExpression',
        elements,
        token,
      };
    }
    
    // Object literal
    if (this.match(TokenType.LEFT_BRACE)) {
      const properties: { key: string; value: AST.Expression }[] = [];
      
      if (!this.check(TokenType.RIGHT_BRACE)) {
        do {
          this.skipNewlines();
          const key = this.consume(TokenType.IDENTIFIER, 'Expected property name').lexeme;
          this.consume(TokenType.COLON, "Expected ':' after property name");
          const value = this.parseExpression();
          properties.push({ key, value });
          this.skipNewlines();
        } while (this.match(TokenType.COMMA));
      }
      
      const token = this.consume(TokenType.RIGHT_BRACE, "Expected '}' after object properties");
      
      return {
        type: 'ObjectExpression',
        properties,
        token,
      };
    }
    
    // Grouping
    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression");
      return {
        type: 'GroupExpression',
        expression: expr,
      };
    }
    
    // Function expression
    if (this.match(TokenType.FUNCTION)) {
      this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'function'");
      
      const parameters: string[] = [];
      if (!this.check(TokenType.RIGHT_PAREN)) {
        do {
          parameters.push(this.consume(TokenType.IDENTIFIER, 'Expected parameter name').lexeme);
        } while (this.match(TokenType.COMMA));
      }
      
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameters");
      
      this.skipNewlines();
      
      const body = this.parseBlock();
      
      return {
        type: 'FunctionExpression',
        parameters,
        body,
        token: this.previous(),
      };
    }
    
    // Identifier
    if (this.match(TokenType.IDENTIFIER)) {
      return {
        type: 'IdentifierExpression',
        name: this.previous().lexeme,
        token: this.previous(),
      };
    }
    
    this.error(this.peek(), 'Expected expression');
    return {
      type: 'LiteralExpression',
      value: null,
      literalType: 'null',
      token: this.peek(),
    };
  }
  
  // Helper methods
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }
  
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }
  
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }
  
  private peek(): Token {
    return this.tokens[this.current];
  }
  
  private previous(): Token {
    return this.tokens[this.current - 1];
  }
  
  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }
  
  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    this.error(this.peek(), message);
    return this.peek();
  }
  
  private consumeNewlineOrEnd(): void {
    if (this.check(TokenType.NEWLINE)) {
      this.advance();
    } else if (this.check(TokenType.SEMICOLON)) {
      this.advance();
    }
    // Allow EOF without newline
  }
  
  private skipNewlines(): void {
    while (this.check(TokenType.NEWLINE)) {
      this.advance();
    }
  }
  
  private error(token: Token, message: string): void {
    const line = token.line;
    const column = token.column;
    
    // Get the source line for context
    const lines = this.source.split('\n');
    const sourceLine = lines[line - 1] || '';
    
    this.errors.push({
      message,
      line,
      column,
      length: token.length || 1,
      source: sourceLine,
      suggestion: this.getSuggestion(token, message),
    });
  }
  
  private getSuggestion(token: Token, message: string): string | undefined {
    // Provide helpful suggestions based on common errors
    if (message.includes("Expected '['")) {
      return "Create and Repeat statements need a '[' block";
    }
    if (message.includes("Expected 'from'")) {
      return "Import syntax: Import X from Y";
    }
    return undefined;
  }
  
  private synchronize(): void {
    this.advance();
    
    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.NEWLINE) return;
      if (this.previous().type === TokenType.SEMICOLON) return;
      
      switch (this.peek().type) {
        case TokenType.IMPORT:
        case TokenType.FROM:
        case TokenType.CREATE:
        case TokenType.REPEAT:
        case TokenType.FUNCTION:
        case TokenType.LOCAL:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.FOR:
        case TokenType.RETURN:
          return;
      }
      
      this.advance();
    }
  }
}
