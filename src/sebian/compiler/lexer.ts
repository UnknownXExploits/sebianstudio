// Sebian Lexer - Tokenizes Sebian source code
// Handles the exact syntax style: Import, from, Create, Repeat, etc.

export enum TokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  IDENTIFIER = 'IDENTIFIER',
  
  // Keywords
  IMPORT = 'IMPORT',
  FROM = 'FROM',
  CREATE = 'CREATE',
  REPEAT = 'REPEAT',
  LOCAL = 'LOCAL',
  FUNCTION = 'FUNCTION',
  IF = 'IF',
  ELSE = 'ELSE',
  WHILE = 'WHILE',
  FOR = 'FOR',
  RETURN = 'RETURN',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  NULL = 'NULL',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  DO = 'DO',
  
  // Operators
  PLUS = 'PLUS',           // +
  MINUS = 'MINUS',         // -
  STAR = 'STAR',           // *
  SLASH = 'SLASH',         // /
  PERCENT = 'PERCENT',     // %
  CARET = 'CARET',         // ^
  
  // Comparison
  EQUAL = 'EQUAL',         // =
  EQUAL_EQUAL = 'EQUAL_EQUAL', // ==
  BANG = 'BANG',           // !
  BANG_EQUAL = 'BANG_EQUAL',   // !=
  LESS = 'LESS',           // <
  LESS_EQUAL = 'LESS_EQUAL',   // <=
  GREATER = 'GREATER',     // >
  GREATER_EQUAL = 'GREATER_EQUAL', // >=
  
  // Delimiters
  LEFT_PAREN = 'LEFT_PAREN',     // (
  RIGHT_PAREN = 'RIGHT_PAREN',   // )
  LEFT_BRACKET = 'LEFT_BRACKET', // [
  RIGHT_BRACKET = 'RIGHT_BRACKET', // ]
  LEFT_BRACE = 'LEFT_BRACE',     // {
  RIGHT_BRACE = 'RIGHT_BRACE',   // }
  COMMA = 'COMMA',               // ,
  DOT = 'DOT',                   // .
  COLON = 'COLON',               // :
  SEMICOLON = 'SEMICOLON',       // ;
  NEWLINE = 'NEWLINE',           // \n
  
  // Special
  EOF = 'EOF',
  ERROR = 'ERROR',
}

export interface Token {
  type: TokenType;
  lexeme: string;
  literal: string | number | boolean | null;
  line: number;
  column: number;
  length: number;
}

const KEYWORDS: Record<string, TokenType> = {
  'Import': TokenType.IMPORT,
  'import': TokenType.IMPORT,
  'from': TokenType.FROM,
  'From': TokenType.FROM,
  'Create': TokenType.CREATE,
  'create': TokenType.CREATE,
  'Repeat': TokenType.REPEAT,
  'repeat': TokenType.REPEAT,
  'local': TokenType.LOCAL,
  'Local': TokenType.LOCAL,
  'function': TokenType.FUNCTION,
  'Function': TokenType.FUNCTION,
  'if': TokenType.IF,
  'If': TokenType.IF,
  'else': TokenType.ELSE,
  'Else': TokenType.ELSE,
  'while': TokenType.WHILE,
  'While': TokenType.WHILE,
  'for': TokenType.FOR,
  'For': TokenType.FOR,
  'return': TokenType.RETURN,
  'Return': TokenType.RETURN,
  'true': TokenType.TRUE,
  'True': TokenType.TRUE,
  'false': TokenType.FALSE,
  'False': TokenType.FALSE,
  'null': TokenType.NULL,
  'Null': TokenType.NULL,
  'and': TokenType.AND,
  'And': TokenType.AND,
  'or': TokenType.OR,
  'Or': TokenType.OR,
  'not': TokenType.NOT,
  'Not': TokenType.NOT,
  'do': TokenType.DO,
  'Do': TokenType.DO,
};

export class Lexer {
  private source: string;
  private tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;
  private column = 1;
  private lineStart = 0;
  
  constructor(source: string) {
    this.source = source;
  }
  
  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }
    
    this.tokens.push({
      type: TokenType.EOF,
      lexeme: '',
      literal: null,
      line: this.line,
      column: this.column,
      length: 0,
    });
    
    return this.tokens;
  }
  
  private scanToken(): void {
    const char = this.advance();
    
    switch (char) {
      case '(': this.addToken(TokenType.LEFT_PAREN); break;
      case ')': this.addToken(TokenType.RIGHT_PAREN); break;
      case '[': this.addToken(TokenType.LEFT_BRACKET); break;
      case ']': this.addToken(TokenType.RIGHT_BRACKET); break;
      case '{': this.addToken(TokenType.LEFT_BRACE); break;
      case '}': this.addToken(TokenType.RIGHT_BRACE); break;
      case ',': this.addToken(TokenType.COMMA); break;
      case '.': this.addToken(TokenType.DOT); break;
      case ':': this.addToken(TokenType.COLON); break;
      case ';': this.addToken(TokenType.SEMICOLON); break;
      case '+': this.addToken(TokenType.PLUS); break;
      case '-': this.addToken(TokenType.MINUS); break;
      case '*': this.addToken(TokenType.STAR); break;
      case '%': this.addToken(TokenType.PERCENT); break;
      case '^': this.addToken(TokenType.CARET); break;
      
      case '=':
        this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
        break;
      
      case '!':
        this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      
      case '<':
        this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      
      case '>':
        this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
        break;
      
      case '/':
        if (this.match('/')) {
          // Single line comment
          while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
          }
        } else if (this.match('*')) {
          // Multi-line comment
          this.multiLineComment();
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      
      case '#':
        // Alternative comment style
        while (this.peek() !== '\n' && !this.isAtEnd()) {
          this.advance();
        }
        break;
      
      case '\n':
        this.addToken(TokenType.NEWLINE);
        this.line++;
        this.lineStart = this.current;
        break;
      
      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace
        break;
      
      case '"':
        this.string('"');
        break;
      
      case "'":
        this.string("'");
        break;
      
      default:
        if (this.isDigit(char)) {
          this.number();
        } else if (this.isAlpha(char)) {
          this.identifier();
        } else {
          this.addErrorToken(`Unexpected character: ${char}`);
        }
    }
  }
  
  private multiLineComment(): void {
    let nesting = 1;
    while (nesting > 0 && !this.isAtEnd()) {
      if (this.peek() === '/' && this.peekNext() === '*') {
        this.advance();
        this.advance();
        nesting++;
      } else if (this.peek() === '*' && this.peekNext() === '/') {
        this.advance();
        this.advance();
        nesting--;
      } else {
        if (this.peek() === '\n') {
          this.line++;
          this.lineStart = this.current + 1;
        }
        this.advance();
      }
    }
    
    if (nesting > 0) {
      this.addErrorToken('Unterminated multi-line comment');
    }
  }
  
  private string(quote: string): void {
    const startLine = this.line;
    const startColumn = this.column;
    
    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.lineStart = this.current + 1;
      }
      if (this.peek() === '\\' && !this.isAtEnd()) {
        this.advance(); // Skip escape char
      }
      this.advance();
    }
    
    if (this.isAtEnd()) {
      this.addErrorToken('Unterminated string');
      return;
    }
    
    // Closing quote
    this.advance();
    
    // Extract string value (without quotes)
    const value = this.source.substring(this.start + 1, this.current - 1);
    const unescaped = this.unescapeString(value);
    
    this.tokens.push({
      type: TokenType.STRING,
      lexeme: this.source.substring(this.start, this.current),
      literal: unescaped,
      line: startLine,
      column: startColumn,
      length: this.current - this.start,
    });
  }
  
  private unescapeString(str: string): string {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\');
  }
  
  private number(): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }
    
    // Decimal part
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // consume .
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }
    
    // Exponent part
    if (this.peek() === 'e' || this.peek() === 'E') {
      this.advance();
      if (this.peek() === '+' || this.peek() === '-') {
        this.advance();
      }
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }
    
    const value = parseFloat(this.source.substring(this.start, this.current));
    
    this.tokens.push({
      type: TokenType.NUMBER,
      lexeme: this.source.substring(this.start, this.current),
      literal: value,
      line: this.line,
      column: this.start - this.lineStart + 1,
      length: this.current - this.start,
    });
  }
  
  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }
    
    const text = this.source.substring(this.start, this.current);
    const type = KEYWORDS[text] ?? TokenType.IDENTIFIER;
    
    let literal: string | boolean | null = null;
    if (type === TokenType.TRUE) literal = true;
    else if (type === TokenType.FALSE) literal = false;
    else if (type === TokenType.NULL) literal = null;
    
    this.tokens.push({
      type,
      lexeme: text,
      literal,
      line: this.line,
      column: this.start - this.lineStart + 1,
      length: this.current - this.start,
    });
  }
  
  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }
  
  private advance(): string {
    return this.source[this.current++];
  }
  
  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }
  
  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1];
  }
  
  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;
    this.current++;
    return true;
  }
  
  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }
  
  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') ||
           (char >= 'A' && char <= 'Z') ||
           char === '_';
  }
  
  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
  
  private addToken(type: TokenType): void {
    this.tokens.push({
      type,
      lexeme: this.source.substring(this.start, this.current),
      literal: null,
      line: this.line,
      column: this.start - this.lineStart + 1,
      length: this.current - this.start,
    });
  }
  
  private addErrorToken(message: string): void {
    this.tokens.push({
      type: TokenType.ERROR,
      lexeme: message,
      literal: null,
      line: this.line,
      column: this.start - this.lineStart + 1,
      length: this.current - this.start,
    });
  }
}
