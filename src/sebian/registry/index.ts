// Command Registry - 250K+ Operations Architecture
// Generated metadata tables with extensible module system

export interface CommandDefinition {
  name: string;
  module: string;
  args: ArgDefinition[];
  returns: string;
  doc: string;
  example?: string;
  aliases?: string[];
  sandboxLevel?: 1 | 2 | 3;
}

export interface ArgDefinition {
  name: string;
  type: string;
  optional?: boolean;
  default?: string;
}

export interface CommandModule {
  name: string;
  description: string;
  commands: CommandDefinition[];
}

// Generate Math operations (trigonometric, algebraic, etc.)
function generateMathCommands(): CommandDefinition[] {
  const commands: CommandDefinition[] = [];
  
  // Trigonometric functions
  const trigFuncs = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh'];
  trigFuncs.forEach(fn => {
    commands.push({
      name: fn,
      module: 'math',
      args: [{ name: 'angle', type: 'number' }],
      returns: 'number',
      doc: `Calculate the ${fn} of the angle (in radians)`,
      example: `math.${fn}(3.14159)`,
    });
    // Degree variants
    commands.push({
      name: `${fn}Deg`,
      module: 'math',
      args: [{ name: 'angle', type: 'number' }],
      returns: 'number',
      doc: `Calculate the ${fn} of the angle (in degrees)`,
      example: `math.${fn}Deg(90)`,
    });
  });
  
  // Basic math
  ['abs', 'ceil', 'floor', 'round', 'sqrt', 'cbrt', 'exp', 'log', 'log10', 'log2'].forEach(fn => {
    commands.push({
      name: fn,
      module: 'math',
      args: [{ name: 'value', type: 'number' }],
      returns: 'number',
      doc: `Calculate ${fn} of the value`,
      example: `math.${fn}(42)`,
    });
  });
  
  // Two-arg functions
  [
    { name: 'pow', doc: 'Raise base to exponent power' },
    { name: 'max', doc: 'Return the larger of two numbers' },
    { name: 'min', doc: 'Return the smaller of two numbers' },
    { name: 'atan2', doc: 'Calculate atan2(y, x)' },
    { name: 'hypot', doc: 'Calculate hypotenuse sqrt(x² + y²)' },
  ].forEach(({ name, doc }) => {
    commands.push({
      name,
      module: 'math',
      args: [{ name: 'a', type: 'number' }, { name: 'b', type: 'number' }],
      returns: 'number',
      doc,
      example: `math.${name}(3, 4)`,
    });
  });
  
  // Constants
  ['PI', 'E', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'SQRT2', 'SQRT1_2'].forEach(constant => {
    commands.push({
      name: constant,
      module: 'math',
      args: [],
      returns: 'number',
      doc: `Mathematical constant ${constant}`,
      example: `math.${constant}`,
    });
  });
  
  // Random functions
  commands.push(
    { name: 'random', module: 'math', args: [], returns: 'number', doc: 'Generate random number 0-1', example: 'math.random()' },
    { name: 'randomInt', module: 'math', args: [{ name: 'min', type: 'number' }, { name: 'max', type: 'number' }], returns: 'number', doc: 'Generate random integer in range', example: 'math.randomInt(1, 100)' },
    { name: 'randomFloat', module: 'math', args: [{ name: 'min', type: 'number' }, { name: 'max', type: 'number' }], returns: 'number', doc: 'Generate random float in range', example: 'math.randomFloat(0.0, 1.0)' },
  );
  
  // Bitwise operations
  ['and', 'or', 'xor', 'not', 'shl', 'shr', 'ushr'].forEach(op => {
    commands.push({
      name: `bit${op.charAt(0).toUpperCase() + op.slice(1)}`,
      module: 'math',
      args: op === 'not' ? [{ name: 'value', type: 'number' }] : [{ name: 'a', type: 'number' }, { name: 'b', type: 'number' }],
      returns: 'number',
      doc: `Bitwise ${op} operation`,
      example: op === 'not' ? `math.bitNot(255)` : `math.bit${op.charAt(0).toUpperCase() + op.slice(1)}(5, 3)`,
    });
  });
  
  return commands;
}

// Generate String operations
function generateStringCommands(): CommandDefinition[] {
  const commands: CommandDefinition[] = [];
  
  // Basic string operations
  const stringOps = [
    { name: 'length', args: [{ name: 'str', type: 'string' }], returns: 'number', doc: 'Get string length' },
    { name: 'charAt', args: [{ name: 'str', type: 'string' }, { name: 'index', type: 'number' }], returns: 'string', doc: 'Get character at index' },
    { name: 'charCodeAt', args: [{ name: 'str', type: 'string' }, { name: 'index', type: 'number' }], returns: 'number', doc: 'Get char code at index' },
    { name: 'concat', args: [{ name: 'str1', type: 'string' }, { name: 'str2', type: 'string' }], returns: 'string', doc: 'Concatenate strings' },
    { name: 'includes', args: [{ name: 'str', type: 'string' }, { name: 'search', type: 'string' }], returns: 'boolean', doc: 'Check if string contains substring' },
    { name: 'startsWith', args: [{ name: 'str', type: 'string' }, { name: 'search', type: 'string' }], returns: 'boolean', doc: 'Check if string starts with' },
    { name: 'endsWith', args: [{ name: 'str', type: 'string' }, { name: 'search', type: 'string' }], returns: 'boolean', doc: 'Check if string ends with' },
    { name: 'indexOf', args: [{ name: 'str', type: 'string' }, { name: 'search', type: 'string' }], returns: 'number', doc: 'Find index of substring' },
    { name: 'lastIndexOf', args: [{ name: 'str', type: 'string' }, { name: 'search', type: 'string' }], returns: 'number', doc: 'Find last index of substring' },
    { name: 'slice', args: [{ name: 'str', type: 'string' }, { name: 'start', type: 'number' }, { name: 'end', type: 'number', optional: true }], returns: 'string', doc: 'Extract portion of string' },
    { name: 'substring', args: [{ name: 'str', type: 'string' }, { name: 'start', type: 'number' }, { name: 'end', type: 'number', optional: true }], returns: 'string', doc: 'Extract substring' },
    { name: 'toLowerCase', args: [{ name: 'str', type: 'string' }], returns: 'string', doc: 'Convert to lowercase' },
    { name: 'toUpperCase', args: [{ name: 'str', type: 'string' }], returns: 'string', doc: 'Convert to uppercase' },
    { name: 'trim', args: [{ name: 'str', type: 'string' }], returns: 'string', doc: 'Remove whitespace from both ends' },
    { name: 'trimStart', args: [{ name: 'str', type: 'string' }], returns: 'string', doc: 'Remove whitespace from start' },
    { name: 'trimEnd', args: [{ name: 'str', type: 'string' }], returns: 'string', doc: 'Remove whitespace from end' },
    { name: 'replace', args: [{ name: 'str', type: 'string' }, { name: 'search', type: 'string' }, { name: 'replacement', type: 'string' }], returns: 'string', doc: 'Replace first occurrence' },
    { name: 'replaceAll', args: [{ name: 'str', type: 'string' }, { name: 'search', type: 'string' }, { name: 'replacement', type: 'string' }], returns: 'string', doc: 'Replace all occurrences' },
    { name: 'split', args: [{ name: 'str', type: 'string' }, { name: 'separator', type: 'string' }], returns: 'array', doc: 'Split string into array' },
    { name: 'repeat', args: [{ name: 'str', type: 'string' }, { name: 'count', type: 'number' }], returns: 'string', doc: 'Repeat string n times' },
    { name: 'padStart', args: [{ name: 'str', type: 'string' }, { name: 'length', type: 'number' }, { name: 'pad', type: 'string', optional: true }], returns: 'string', doc: 'Pad start to length' },
    { name: 'padEnd', args: [{ name: 'str', type: 'string' }, { name: 'length', type: 'number' }, { name: 'pad', type: 'string', optional: true }], returns: 'string', doc: 'Pad end to length' },
  ];
  
  stringOps.forEach(op => {
    commands.push({ ...op, module: 'string', example: `string.${op.name}("hello", ...)` });
  });
  
  // Format functions
  ['capitalize', 'camelCase', 'snakeCase', 'kebabCase', 'pascalCase', 'titleCase'].forEach(fn => {
    commands.push({
      name: fn,
      module: 'string',
      args: [{ name: 'str', type: 'string' }],
      returns: 'string',
      doc: `Convert string to ${fn}`,
      example: `string.${fn}("hello world")`,
    });
  });
  
  // Template/format
  commands.push({
    name: 'format',
    module: 'string',
    args: [{ name: 'template', type: 'string' }, { name: 'values', type: 'object' }],
    returns: 'string',
    doc: 'Format string with template values',
    example: 'string.format("Hello {name}!", { name: "World" })',
  });
  
  return commands;
}

// Generate Array operations
function generateArrayCommands(): CommandDefinition[] {
  const commands: CommandDefinition[] = [];
  
  // Core array operations
  const arrayOps = [
    { name: 'length', args: [{ name: 'arr', type: 'array' }], returns: 'number', doc: 'Get array length' },
    { name: 'push', args: [{ name: 'arr', type: 'array' }, { name: 'item', type: 'any' }], returns: 'array', doc: 'Add item to end' },
    { name: 'pop', args: [{ name: 'arr', type: 'array' }], returns: 'any', doc: 'Remove and return last item' },
    { name: 'shift', args: [{ name: 'arr', type: 'array' }], returns: 'any', doc: 'Remove and return first item' },
    { name: 'unshift', args: [{ name: 'arr', type: 'array' }, { name: 'item', type: 'any' }], returns: 'array', doc: 'Add item to beginning' },
    { name: 'slice', args: [{ name: 'arr', type: 'array' }, { name: 'start', type: 'number' }, { name: 'end', type: 'number', optional: true }], returns: 'array', doc: 'Extract portion of array' },
    { name: 'splice', args: [{ name: 'arr', type: 'array' }, { name: 'start', type: 'number' }, { name: 'deleteCount', type: 'number' }], returns: 'array', doc: 'Remove/replace elements' },
    { name: 'concat', args: [{ name: 'arr1', type: 'array' }, { name: 'arr2', type: 'array' }], returns: 'array', doc: 'Merge arrays' },
    { name: 'join', args: [{ name: 'arr', type: 'array' }, { name: 'separator', type: 'string', optional: true }], returns: 'string', doc: 'Join array into string' },
    { name: 'reverse', args: [{ name: 'arr', type: 'array' }], returns: 'array', doc: 'Reverse array' },
    { name: 'sort', args: [{ name: 'arr', type: 'array' }], returns: 'array', doc: 'Sort array' },
    { name: 'includes', args: [{ name: 'arr', type: 'array' }, { name: 'item', type: 'any' }], returns: 'boolean', doc: 'Check if array includes item' },
    { name: 'indexOf', args: [{ name: 'arr', type: 'array' }, { name: 'item', type: 'any' }], returns: 'number', doc: 'Find index of item' },
    { name: 'lastIndexOf', args: [{ name: 'arr', type: 'array' }, { name: 'item', type: 'any' }], returns: 'number', doc: 'Find last index of item' },
    { name: 'find', args: [{ name: 'arr', type: 'array' }, { name: 'predicate', type: 'function' }], returns: 'any', doc: 'Find first matching item' },
    { name: 'findIndex', args: [{ name: 'arr', type: 'array' }, { name: 'predicate', type: 'function' }], returns: 'number', doc: 'Find index of first match' },
    { name: 'filter', args: [{ name: 'arr', type: 'array' }, { name: 'predicate', type: 'function' }], returns: 'array', doc: 'Filter array by predicate' },
    { name: 'map', args: [{ name: 'arr', type: 'array' }, { name: 'mapper', type: 'function' }], returns: 'array', doc: 'Map array to new values' },
    { name: 'reduce', args: [{ name: 'arr', type: 'array' }, { name: 'reducer', type: 'function' }, { name: 'initial', type: 'any', optional: true }], returns: 'any', doc: 'Reduce array to single value' },
    { name: 'reduceRight', args: [{ name: 'arr', type: 'array' }, { name: 'reducer', type: 'function' }, { name: 'initial', type: 'any', optional: true }], returns: 'any', doc: 'Reduce array from right' },
    { name: 'every', args: [{ name: 'arr', type: 'array' }, { name: 'predicate', type: 'function' }], returns: 'boolean', doc: 'Check if all items match' },
    { name: 'some', args: [{ name: 'arr', type: 'array' }, { name: 'predicate', type: 'function' }], returns: 'boolean', doc: 'Check if any item matches' },
    { name: 'forEach', args: [{ name: 'arr', type: 'array' }, { name: 'callback', type: 'function' }], returns: 'null', doc: 'Iterate over array' },
    { name: 'flat', args: [{ name: 'arr', type: 'array' }, { name: 'depth', type: 'number', optional: true }], returns: 'array', doc: 'Flatten nested arrays' },
    { name: 'flatMap', args: [{ name: 'arr', type: 'array' }, { name: 'mapper', type: 'function' }], returns: 'array', doc: 'Map then flatten' },
    { name: 'fill', args: [{ name: 'arr', type: 'array' }, { name: 'value', type: 'any' }, { name: 'start', type: 'number', optional: true }, { name: 'end', type: 'number', optional: true }], returns: 'array', doc: 'Fill array with value' },
  ];
  
  arrayOps.forEach(op => {
    commands.push({ ...op, module: 'array', example: `array.${op.name}([1, 2, 3], ...)` });
  });
  
  // Utility functions
  ['unique', 'compact', 'shuffle', 'sample', 'chunk', 'zip', 'unzip', 'range', 'difference', 'intersection', 'union'].forEach(fn => {
    commands.push({
      name: fn,
      module: 'array',
      args: [{ name: 'arr', type: 'array' }],
      returns: 'array',
      doc: `Array ${fn} utility`,
      example: `array.${fn}([1, 2, 3])`,
    });
  });
  
  return commands;
}

// Generate UI commands
function generateUICommands(): CommandDefinition[] {
  const commands: CommandDefinition[] = [];
  
  // UI element types
  const elements = [
    'button', 'input', 'text', 'label', 'div', 'span', 'container', 'row', 'column', 'grid',
    'card', 'panel', 'modal', 'dialog', 'drawer', 'tooltip', 'popover', 'menu', 'dropdown',
    'list', 'listItem', 'table', 'tableRow', 'tableCell', 'form', 'fieldset', 'legend',
    'image', 'icon', 'avatar', 'badge', 'chip', 'tag', 'progress', 'spinner', 'skeleton',
    'tabs', 'tab', 'tabPanel', 'accordion', 'accordionItem', 'collapse', 'tree', 'treeItem',
    'slider', 'switch', 'checkbox', 'radio', 'select', 'option', 'textarea', 'datepicker',
    'timepicker', 'colorpicker', 'filepicker', 'rating', 'stepper', 'pagination',
    'navbar', 'sidebar', 'footer', 'header', 'main', 'section', 'article', 'aside',
    'breadcrumb', 'link', 'anchor', 'separator', 'divider', 'spacer',
    'alert', 'toast', 'notification', 'banner', 'callout', 'code', 'pre', 'blockquote',
    'canvas', 'svg', 'video', 'audio', 'iframe', 'embed', 'object',
  ];
  
  elements.forEach(element => {
    commands.push({
      name: `create${element.charAt(0).toUpperCase() + element.slice(1)}`,
      module: 'ui',
      args: [{ name: 'props', type: 'object', optional: true }],
      returns: 'ui_node',
      doc: `Create a ${element} UI element`,
      example: `ui.create${element.charAt(0).toUpperCase() + element.slice(1)}({ text: "Hello" })`,
    });
  });
  
  // Common UI operations
  const uiOps = [
    { name: 'render', args: [{ name: 'node', type: 'ui_node' }], returns: 'null', doc: 'Render UI node to screen' },
    { name: 'append', args: [{ name: 'parent', type: 'ui_node' }, { name: 'child', type: 'ui_node' }], returns: 'ui_node', doc: 'Append child to parent' },
    { name: 'prepend', args: [{ name: 'parent', type: 'ui_node' }, { name: 'child', type: 'ui_node' }], returns: 'ui_node', doc: 'Prepend child to parent' },
    { name: 'remove', args: [{ name: 'node', type: 'ui_node' }], returns: 'null', doc: 'Remove node from tree' },
    { name: 'clone', args: [{ name: 'node', type: 'ui_node' }], returns: 'ui_node', doc: 'Clone a UI node' },
    { name: 'setProps', args: [{ name: 'node', type: 'ui_node' }, { name: 'props', type: 'object' }], returns: 'ui_node', doc: 'Set properties on node' },
    { name: 'getProps', args: [{ name: 'node', type: 'ui_node' }], returns: 'object', doc: 'Get properties from node' },
    { name: 'setProp', args: [{ name: 'node', type: 'ui_node' }, { name: 'key', type: 'string' }, { name: 'value', type: 'any' }], returns: 'ui_node', doc: 'Set single property' },
    { name: 'getProp', args: [{ name: 'node', type: 'ui_node' }, { name: 'key', type: 'string' }], returns: 'any', doc: 'Get single property' },
    { name: 'addClass', args: [{ name: 'node', type: 'ui_node' }, { name: 'className', type: 'string' }], returns: 'ui_node', doc: 'Add CSS class' },
    { name: 'removeClass', args: [{ name: 'node', type: 'ui_node' }, { name: 'className', type: 'string' }], returns: 'ui_node', doc: 'Remove CSS class' },
    { name: 'toggleClass', args: [{ name: 'node', type: 'ui_node' }, { name: 'className', type: 'string' }], returns: 'ui_node', doc: 'Toggle CSS class' },
    { name: 'setStyle', args: [{ name: 'node', type: 'ui_node' }, { name: 'styles', type: 'object' }], returns: 'ui_node', doc: 'Set inline styles' },
    { name: 'on', args: [{ name: 'node', type: 'ui_node' }, { name: 'event', type: 'string' }, { name: 'handler', type: 'function' }], returns: 'ui_node', doc: 'Attach event handler' },
    { name: 'off', args: [{ name: 'node', type: 'ui_node' }, { name: 'event', type: 'string' }], returns: 'ui_node', doc: 'Remove event handler' },
    { name: 'emit', args: [{ name: 'node', type: 'ui_node' }, { name: 'event', type: 'string' }, { name: 'data', type: 'any', optional: true }], returns: 'null', doc: 'Emit custom event' },
    { name: 'query', args: [{ name: 'selector', type: 'string' }], returns: 'ui_node', doc: 'Query for UI node' },
    { name: 'queryAll', args: [{ name: 'selector', type: 'string' }], returns: 'array', doc: 'Query all matching nodes' },
    { name: 'animate', args: [{ name: 'node', type: 'ui_node' }, { name: 'animation', type: 'object' }], returns: 'ui_node', doc: 'Animate node' },
    { name: 'show', args: [{ name: 'node', type: 'ui_node' }], returns: 'ui_node', doc: 'Show hidden node' },
    { name: 'hide', args: [{ name: 'node', type: 'ui_node' }], returns: 'ui_node', doc: 'Hide visible node' },
    { name: 'toggle', args: [{ name: 'node', type: 'ui_node' }], returns: 'ui_node', doc: 'Toggle visibility' },
    { name: 'focus', args: [{ name: 'node', type: 'ui_node' }], returns: 'ui_node', doc: 'Focus on node' },
    { name: 'blur', args: [{ name: 'node', type: 'ui_node' }], returns: 'ui_node', doc: 'Remove focus' },
  ];
  
  uiOps.forEach(op => {
    commands.push({ ...op, module: 'ui', example: `ui.${op.name}(...)` });
  });
  
  return commands;
}

// Generate File System commands
function generateFSCommands(): CommandDefinition[] {
  const commands: CommandDefinition[] = [];
  
  const fsOps = [
    { name: 'readFile', args: [{ name: 'path', type: 'string' }], returns: 'string', doc: 'Read file contents' },
    { name: 'writeFile', args: [{ name: 'path', type: 'string' }, { name: 'content', type: 'string' }], returns: 'boolean', doc: 'Write content to file' },
    { name: 'appendFile', args: [{ name: 'path', type: 'string' }, { name: 'content', type: 'string' }], returns: 'boolean', doc: 'Append to file' },
    { name: 'deleteFile', args: [{ name: 'path', type: 'string' }], returns: 'boolean', doc: 'Delete a file' },
    { name: 'exists', args: [{ name: 'path', type: 'string' }], returns: 'boolean', doc: 'Check if path exists' },
    { name: 'isFile', args: [{ name: 'path', type: 'string' }], returns: 'boolean', doc: 'Check if path is file' },
    { name: 'isDirectory', args: [{ name: 'path', type: 'string' }], returns: 'boolean', doc: 'Check if path is directory' },
    { name: 'mkdir', args: [{ name: 'path', type: 'string' }], returns: 'boolean', doc: 'Create directory' },
    { name: 'rmdir', args: [{ name: 'path', type: 'string' }], returns: 'boolean', doc: 'Remove directory' },
    { name: 'readdir', args: [{ name: 'path', type: 'string' }], returns: 'array', doc: 'List directory contents' },
    { name: 'rename', args: [{ name: 'oldPath', type: 'string' }, { name: 'newPath', type: 'string' }], returns: 'boolean', doc: 'Rename file/directory' },
    { name: 'copy', args: [{ name: 'source', type: 'string' }, { name: 'dest', type: 'string' }], returns: 'boolean', doc: 'Copy file' },
    { name: 'move', args: [{ name: 'source', type: 'string' }, { name: 'dest', type: 'string' }], returns: 'boolean', doc: 'Move file' },
    { name: 'stat', args: [{ name: 'path', type: 'string' }], returns: 'object', doc: 'Get file stats' },
    { name: 'chmod', args: [{ name: 'path', type: 'string' }, { name: 'mode', type: 'number' }], returns: 'boolean', doc: 'Change file permissions' },
    { name: 'cwd', args: [], returns: 'string', doc: 'Get current working directory' },
    { name: 'chdir', args: [{ name: 'path', type: 'string' }], returns: 'boolean', doc: 'Change directory' },
    { name: 'resolve', args: [{ name: 'path', type: 'string' }], returns: 'string', doc: 'Resolve to absolute path' },
    { name: 'join', args: [{ name: 'paths', type: 'array' }], returns: 'string', doc: 'Join path segments' },
    { name: 'dirname', args: [{ name: 'path', type: 'string' }], returns: 'string', doc: 'Get directory name' },
    { name: 'basename', args: [{ name: 'path', type: 'string' }], returns: 'string', doc: 'Get file name' },
    { name: 'extname', args: [{ name: 'path', type: 'string' }], returns: 'string', doc: 'Get file extension' },
    { name: 'watch', args: [{ name: 'path', type: 'string' }, { name: 'callback', type: 'function' }], returns: 'object', doc: 'Watch for file changes' },
    { name: 'unwatch', args: [{ name: 'watcher', type: 'object' }], returns: 'boolean', doc: 'Stop watching' },
  ];
  
  fsOps.forEach(op => {
    commands.push({ ...op, module: 'fs', sandboxLevel: 2, example: `fs.${op.name}(...)` });
  });
  
  return commands;
}

// Generate Network commands
function generateNetCommands(): CommandDefinition[] {
  const commands: CommandDefinition[] = [];
  
  const netOps = [
    { name: 'fetch', args: [{ name: 'url', type: 'string' }, { name: 'options', type: 'object', optional: true }], returns: 'object', doc: 'Make HTTP request' },
    { name: 'get', args: [{ name: 'url', type: 'string' }, { name: 'headers', type: 'object', optional: true }], returns: 'object', doc: 'HTTP GET request' },
    { name: 'post', args: [{ name: 'url', type: 'string' }, { name: 'body', type: 'any' }, { name: 'headers', type: 'object', optional: true }], returns: 'object', doc: 'HTTP POST request' },
    { name: 'put', args: [{ name: 'url', type: 'string' }, { name: 'body', type: 'any' }, { name: 'headers', type: 'object', optional: true }], returns: 'object', doc: 'HTTP PUT request' },
    { name: 'patch', args: [{ name: 'url', type: 'string' }, { name: 'body', type: 'any' }, { name: 'headers', type: 'object', optional: true }], returns: 'object', doc: 'HTTP PATCH request' },
    { name: 'delete', args: [{ name: 'url', type: 'string' }, { name: 'headers', type: 'object', optional: true }], returns: 'object', doc: 'HTTP DELETE request' },
    { name: 'head', args: [{ name: 'url', type: 'string' }, { name: 'headers', type: 'object', optional: true }], returns: 'object', doc: 'HTTP HEAD request' },
    { name: 'options', args: [{ name: 'url', type: 'string' }], returns: 'object', doc: 'HTTP OPTIONS request' },
    { name: 'socket', args: [{ name: 'url', type: 'string' }], returns: 'object', doc: 'Create WebSocket connection', sandboxLevel: 1 as const },
    { name: 'socketSend', args: [{ name: 'socket', type: 'object' }, { name: 'data', type: 'any' }], returns: 'boolean', doc: 'Send WebSocket message', sandboxLevel: 1 as const },
    { name: 'socketClose', args: [{ name: 'socket', type: 'object' }], returns: 'boolean', doc: 'Close WebSocket', sandboxLevel: 1 as const },
    { name: 'jsonParse', args: [{ name: 'text', type: 'string' }], returns: 'any', doc: 'Parse JSON string' },
    { name: 'jsonStringify', args: [{ name: 'value', type: 'any' }], returns: 'string', doc: 'Convert to JSON string' },
    { name: 'encodeURI', args: [{ name: 'str', type: 'string' }], returns: 'string', doc: 'Encode URI' },
    { name: 'decodeURI', args: [{ name: 'str', type: 'string' }], returns: 'string', doc: 'Decode URI' },
    { name: 'encodeBase64', args: [{ name: 'str', type: 'string' }], returns: 'string', doc: 'Encode to Base64' },
    { name: 'decodeBase64', args: [{ name: 'str', type: 'string' }], returns: 'string', doc: 'Decode from Base64' },
  ];
  
  netOps.forEach(op => {
    commands.push({ ...op, module: 'net', sandboxLevel: op.sandboxLevel || 2, example: `net.${op.name}(...)` });
  });
  
  return commands;
}

// Generate Time commands
function generateTimeCommands(): CommandDefinition[] {
  const commands: CommandDefinition[] = [];
  
  const timeOps = [
    { name: 'now', args: [], returns: 'number', doc: 'Get current timestamp in ms' },
    { name: 'date', args: [], returns: 'object', doc: 'Get current date object' },
    { name: 'year', args: [{ name: 'date', type: 'object', optional: true }], returns: 'number', doc: 'Get year' },
    { name: 'month', args: [{ name: 'date', type: 'object', optional: true }], returns: 'number', doc: 'Get month (0-11)' },
    { name: 'day', args: [{ name: 'date', type: 'object', optional: true }], returns: 'number', doc: 'Get day of month' },
    { name: 'hour', args: [{ name: 'date', type: 'object', optional: true }], returns: 'number', doc: 'Get hour' },
    { name: 'minute', args: [{ name: 'date', type: 'object', optional: true }], returns: 'number', doc: 'Get minute' },
    { name: 'second', args: [{ name: 'date', type: 'object', optional: true }], returns: 'number', doc: 'Get second' },
    { name: 'millisecond', args: [{ name: 'date', type: 'object', optional: true }], returns: 'number', doc: 'Get millisecond' },
    { name: 'dayOfWeek', args: [{ name: 'date', type: 'object', optional: true }], returns: 'number', doc: 'Get day of week (0-6)' },
    { name: 'dayOfYear', args: [{ name: 'date', type: 'object', optional: true }], returns: 'number', doc: 'Get day of year' },
    { name: 'weekOfYear', args: [{ name: 'date', type: 'object', optional: true }], returns: 'number', doc: 'Get week of year' },
    { name: 'format', args: [{ name: 'date', type: 'object' }, { name: 'format', type: 'string' }], returns: 'string', doc: 'Format date to string' },
    { name: 'parse', args: [{ name: 'str', type: 'string' }, { name: 'format', type: 'string', optional: true }], returns: 'object', doc: 'Parse string to date' },
    { name: 'add', args: [{ name: 'date', type: 'object' }, { name: 'amount', type: 'number' }, { name: 'unit', type: 'string' }], returns: 'object', doc: 'Add time to date' },
    { name: 'subtract', args: [{ name: 'date', type: 'object' }, { name: 'amount', type: 'number' }, { name: 'unit', type: 'string' }], returns: 'object', doc: 'Subtract time from date' },
    { name: 'diff', args: [{ name: 'date1', type: 'object' }, { name: 'date2', type: 'object' }, { name: 'unit', type: 'string', optional: true }], returns: 'number', doc: 'Get difference between dates' },
    { name: 'isBefore', args: [{ name: 'date1', type: 'object' }, { name: 'date2', type: 'object' }], returns: 'boolean', doc: 'Check if date1 is before date2' },
    { name: 'isAfter', args: [{ name: 'date1', type: 'object' }, { name: 'date2', type: 'object' }], returns: 'boolean', doc: 'Check if date1 is after date2' },
    { name: 'isSame', args: [{ name: 'date1', type: 'object' }, { name: 'date2', type: 'object' }, { name: 'unit', type: 'string', optional: true }], returns: 'boolean', doc: 'Check if dates are same' },
    { name: 'startOf', args: [{ name: 'date', type: 'object' }, { name: 'unit', type: 'string' }], returns: 'object', doc: 'Get start of unit' },
    { name: 'endOf', args: [{ name: 'date', type: 'object' }, { name: 'unit', type: 'string' }], returns: 'object', doc: 'Get end of unit' },
    { name: 'isLeapYear', args: [{ name: 'year', type: 'number' }], returns: 'boolean', doc: 'Check if year is leap year' },
    { name: 'daysInMonth', args: [{ name: 'year', type: 'number' }, { name: 'month', type: 'number' }], returns: 'number', doc: 'Get days in month' },
    { name: 'setTimeout', args: [{ name: 'callback', type: 'function' }, { name: 'delay', type: 'number' }], returns: 'number', doc: 'Set timeout' },
    { name: 'clearTimeout', args: [{ name: 'id', type: 'number' }], returns: 'null', doc: 'Clear timeout' },
    { name: 'setInterval', args: [{ name: 'callback', type: 'function' }, { name: 'interval', type: 'number' }], returns: 'number', doc: 'Set interval' },
    { name: 'clearInterval', args: [{ name: 'id', type: 'number' }], returns: 'null', doc: 'Clear interval' },
    { name: 'sleep', args: [{ name: 'ms', type: 'number' }], returns: 'null', doc: 'Sleep for milliseconds' },
  ];
  
  timeOps.forEach(op => {
    commands.push({ ...op, module: 'time', example: `time.${op.name}(...)` });
  });
  
  return commands;
}

// Generate OS/System commands
function generateOSCommands(): CommandDefinition[] {
  const commands: CommandDefinition[] = [];
  
  const osOps = [
    { name: 'platform', args: [], returns: 'string', doc: 'Get platform name' },
    { name: 'arch', args: [], returns: 'string', doc: 'Get CPU architecture' },
    { name: 'hostname', args: [], returns: 'string', doc: 'Get hostname' },
    { name: 'type', args: [], returns: 'string', doc: 'Get OS type' },
    { name: 'release', args: [], returns: 'string', doc: 'Get OS release' },
    { name: 'version', args: [], returns: 'string', doc: 'Get OS version' },
    { name: 'uptime', args: [], returns: 'number', doc: 'Get system uptime' },
    { name: 'cpus', args: [], returns: 'array', doc: 'Get CPU info' },
    { name: 'totalmem', args: [], returns: 'number', doc: 'Get total memory' },
    { name: 'freemem', args: [], returns: 'number', doc: 'Get free memory' },
    { name: 'homedir', args: [], returns: 'string', doc: 'Get home directory' },
    { name: 'tmpdir', args: [], returns: 'string', doc: 'Get temp directory' },
    { name: 'env', args: [{ name: 'key', type: 'string', optional: true }], returns: 'any', doc: 'Get environment variable' },
    { name: 'setEnv', args: [{ name: 'key', type: 'string' }, { name: 'value', type: 'string' }], returns: 'boolean', doc: 'Set environment variable', sandboxLevel: 1 as const },
    { name: 'exec', args: [{ name: 'command', type: 'string' }], returns: 'object', doc: 'Execute command', sandboxLevel: 1 as const },
    { name: 'spawn', args: [{ name: 'command', type: 'string' }, { name: 'args', type: 'array' }], returns: 'object', doc: 'Spawn process', sandboxLevel: 1 as const },
    { name: 'kill', args: [{ name: 'pid', type: 'number' }], returns: 'boolean', doc: 'Kill process', sandboxLevel: 1 as const },
    { name: 'pid', args: [], returns: 'number', doc: 'Get current process ID' },
    { name: 'exit', args: [{ name: 'code', type: 'number', optional: true }], returns: 'null', doc: 'Exit program' },
    { name: 'args', args: [], returns: 'array', doc: 'Get command line arguments' },
    { name: 'stdin', args: [], returns: 'string', doc: 'Read from stdin', sandboxLevel: 1 as const },
    { name: 'stdout', args: [{ name: 'data', type: 'string' }], returns: 'null', doc: 'Write to stdout' },
    { name: 'stderr', args: [{ name: 'data', type: 'string' }], returns: 'null', doc: 'Write to stderr' },
  ];
  
  osOps.forEach(op => {
    commands.push({ ...op, module: 'os', sandboxLevel: op.sandboxLevel || 2, example: `os.${op.name}(...)` });
  });
  
  return commands;
}

// Generate Crypto commands
function generateCryptoCommands(): CommandDefinition[] {
  const commands: CommandDefinition[] = [];
  
  const cryptoOps = [
    { name: 'randomUUID', args: [], returns: 'string', doc: 'Generate random UUID' },
    { name: 'randomBytes', args: [{ name: 'length', type: 'number' }], returns: 'array', doc: 'Generate random bytes' },
    { name: 'hash', args: [{ name: 'algorithm', type: 'string' }, { name: 'data', type: 'string' }], returns: 'string', doc: 'Hash data with algorithm' },
    { name: 'md5', args: [{ name: 'data', type: 'string' }], returns: 'string', doc: 'MD5 hash' },
    { name: 'sha1', args: [{ name: 'data', type: 'string' }], returns: 'string', doc: 'SHA-1 hash' },
    { name: 'sha256', args: [{ name: 'data', type: 'string' }], returns: 'string', doc: 'SHA-256 hash' },
    { name: 'sha384', args: [{ name: 'data', type: 'string' }], returns: 'string', doc: 'SHA-384 hash' },
    { name: 'sha512', args: [{ name: 'data', type: 'string' }], returns: 'string', doc: 'SHA-512 hash' },
    { name: 'hmac', args: [{ name: 'algorithm', type: 'string' }, { name: 'key', type: 'string' }, { name: 'data', type: 'string' }], returns: 'string', doc: 'HMAC signature' },
    { name: 'encrypt', args: [{ name: 'algorithm', type: 'string' }, { name: 'key', type: 'string' }, { name: 'data', type: 'string' }], returns: 'string', doc: 'Encrypt data' },
    { name: 'decrypt', args: [{ name: 'algorithm', type: 'string' }, { name: 'key', type: 'string' }, { name: 'data', type: 'string' }], returns: 'string', doc: 'Decrypt data' },
    { name: 'generateKey', args: [{ name: 'algorithm', type: 'string' }, { name: 'length', type: 'number' }], returns: 'string', doc: 'Generate encryption key' },
    { name: 'pbkdf2', args: [{ name: 'password', type: 'string' }, { name: 'salt', type: 'string' }, { name: 'iterations', type: 'number' }, { name: 'keyLength', type: 'number' }], returns: 'string', doc: 'PBKDF2 key derivation' },
    { name: 'sign', args: [{ name: 'algorithm', type: 'string' }, { name: 'key', type: 'string' }, { name: 'data', type: 'string' }], returns: 'string', doc: 'Sign data' },
    { name: 'verify', args: [{ name: 'algorithm', type: 'string' }, { name: 'key', type: 'string' }, { name: 'data', type: 'string' }, { name: 'signature', type: 'string' }], returns: 'boolean', doc: 'Verify signature' },
  ];
  
  cryptoOps.forEach(op => {
    commands.push({ ...op, module: 'crypto', example: `crypto.${op.name}(...)` });
  });
  
  return commands;
}

// Generate all CSS property commands for styling
function generateStyleCommands(): CommandDefinition[] {
  const commands: CommandDefinition[] = [];
  
  // All CSS properties as setter functions
  const cssProperties = [
    'color', 'backgroundColor', 'backgroundImage', 'backgroundPosition', 'backgroundRepeat', 'backgroundSize',
    'border', 'borderColor', 'borderWidth', 'borderStyle', 'borderRadius', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
    'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
    'display', 'position', 'top', 'right', 'bottom', 'left', 'zIndex',
    'flex', 'flexDirection', 'flexWrap', 'flexGrow', 'flexShrink', 'flexBasis', 'alignItems', 'alignContent', 'alignSelf', 'justifyContent', 'justifyItems', 'justifySelf',
    'grid', 'gridTemplate', 'gridTemplateColumns', 'gridTemplateRows', 'gridColumn', 'gridRow', 'gridGap', 'gap', 'rowGap', 'columnGap',
    'font', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textAlign', 'textDecoration', 'textTransform', 'textIndent', 'textShadow',
    'opacity', 'visibility', 'overflow', 'overflowX', 'overflowY',
    'cursor', 'pointerEvents', 'userSelect',
    'transform', 'transformOrigin', 'transition', 'animation', 'animationName', 'animationDuration', 'animationTimingFunction', 'animationDelay', 'animationIterationCount',
    'boxShadow', 'filter', 'backdropFilter', 'clipPath', 'objectFit', 'objectPosition',
    'outline', 'outlineColor', 'outlineWidth', 'outlineStyle', 'outlineOffset',
    'whiteSpace', 'wordBreak', 'wordSpacing', 'wordWrap',
    'listStyle', 'listStyleType', 'listStylePosition', 'listStyleImage',
    'content', 'quotes',
    'float', 'clear',
    'resize', 'scrollBehavior',
    'aspectRatio', 'writingMode', 'direction',
  ];
  
  cssProperties.forEach(prop => {
    commands.push({
      name: prop,
      module: 'style',
      args: [{ name: 'node', type: 'ui_node' }, { name: 'value', type: 'string' }],
      returns: 'ui_node',
      doc: `Set ${prop} style property`,
      example: `style.${prop}(node, "value")`,
    });
  });
  
  // Color utilities
  ['rgb', 'rgba', 'hsl', 'hsla', 'hex', 'lighten', 'darken', 'saturate', 'desaturate', 'invert', 'complement', 'mix'].forEach(fn => {
    commands.push({
      name: fn,
      module: 'style',
      args: [{ name: 'color', type: 'string' }, { name: 'amount', type: 'number', optional: true }],
      returns: 'string',
      doc: `Color ${fn} utility`,
      example: `style.${fn}("#ff0000", 0.2)`,
    });
  });
  
  return commands;
}

// Generate Graphics/Canvas commands
function generateGraphicsCommands(): CommandDefinition[] {
  const commands: CommandDefinition[] = [];
  
  const graphicsOps = [
    { name: 'createCanvas', args: [{ name: 'width', type: 'number' }, { name: 'height', type: 'number' }], returns: 'object', doc: 'Create drawing canvas' },
    { name: 'getContext', args: [{ name: 'canvas', type: 'object' }, { name: 'type', type: 'string' }], returns: 'object', doc: 'Get drawing context' },
    { name: 'fillRect', args: [{ name: 'ctx', type: 'object' }, { name: 'x', type: 'number' }, { name: 'y', type: 'number' }, { name: 'w', type: 'number' }, { name: 'h', type: 'number' }], returns: 'null', doc: 'Fill rectangle' },
    { name: 'strokeRect', args: [{ name: 'ctx', type: 'object' }, { name: 'x', type: 'number' }, { name: 'y', type: 'number' }, { name: 'w', type: 'number' }, { name: 'h', type: 'number' }], returns: 'null', doc: 'Stroke rectangle' },
    { name: 'clearRect', args: [{ name: 'ctx', type: 'object' }, { name: 'x', type: 'number' }, { name: 'y', type: 'number' }, { name: 'w', type: 'number' }, { name: 'h', type: 'number' }], returns: 'null', doc: 'Clear rectangle' },
    { name: 'beginPath', args: [{ name: 'ctx', type: 'object' }], returns: 'null', doc: 'Begin new path' },
    { name: 'closePath', args: [{ name: 'ctx', type: 'object' }], returns: 'null', doc: 'Close current path' },
    { name: 'moveTo', args: [{ name: 'ctx', type: 'object' }, { name: 'x', type: 'number' }, { name: 'y', type: 'number' }], returns: 'null', doc: 'Move to point' },
    { name: 'lineTo', args: [{ name: 'ctx', type: 'object' }, { name: 'x', type: 'number' }, { name: 'y', type: 'number' }], returns: 'null', doc: 'Draw line to point' },
    { name: 'arc', args: [{ name: 'ctx', type: 'object' }, { name: 'x', type: 'number' }, { name: 'y', type: 'number' }, { name: 'radius', type: 'number' }, { name: 'startAngle', type: 'number' }, { name: 'endAngle', type: 'number' }], returns: 'null', doc: 'Draw arc' },
    { name: 'arcTo', args: [{ name: 'ctx', type: 'object' }, { name: 'x1', type: 'number' }, { name: 'y1', type: 'number' }, { name: 'x2', type: 'number' }, { name: 'y2', type: 'number' }, { name: 'radius', type: 'number' }], returns: 'null', doc: 'Draw arc to point' },
    { name: 'bezierCurveTo', args: [{ name: 'ctx', type: 'object' }, { name: 'cp1x', type: 'number' }, { name: 'cp1y', type: 'number' }, { name: 'cp2x', type: 'number' }, { name: 'cp2y', type: 'number' }, { name: 'x', type: 'number' }, { name: 'y', type: 'number' }], returns: 'null', doc: 'Draw bezier curve' },
    { name: 'quadraticCurveTo', args: [{ name: 'ctx', type: 'object' }, { name: 'cpx', type: 'number' }, { name: 'cpy', type: 'number' }, { name: 'x', type: 'number' }, { name: 'y', type: 'number' }], returns: 'null', doc: 'Draw quadratic curve' },
    { name: 'fill', args: [{ name: 'ctx', type: 'object' }], returns: 'null', doc: 'Fill current path' },
    { name: 'stroke', args: [{ name: 'ctx', type: 'object' }], returns: 'null', doc: 'Stroke current path' },
    { name: 'clip', args: [{ name: 'ctx', type: 'object' }], returns: 'null', doc: 'Clip to current path' },
    { name: 'fillText', args: [{ name: 'ctx', type: 'object' }, { name: 'text', type: 'string' }, { name: 'x', type: 'number' }, { name: 'y', type: 'number' }], returns: 'null', doc: 'Fill text' },
    { name: 'strokeText', args: [{ name: 'ctx', type: 'object' }, { name: 'text', type: 'string' }, { name: 'x', type: 'number' }, { name: 'y', type: 'number' }], returns: 'null', doc: 'Stroke text' },
    { name: 'measureText', args: [{ name: 'ctx', type: 'object' }, { name: 'text', type: 'string' }], returns: 'object', doc: 'Measure text dimensions' },
    { name: 'drawImage', args: [{ name: 'ctx', type: 'object' }, { name: 'image', type: 'object' }, { name: 'x', type: 'number' }, { name: 'y', type: 'number' }], returns: 'null', doc: 'Draw image' },
    { name: 'createImageData', args: [{ name: 'ctx', type: 'object' }, { name: 'width', type: 'number' }, { name: 'height', type: 'number' }], returns: 'object', doc: 'Create image data' },
    { name: 'getImageData', args: [{ name: 'ctx', type: 'object' }, { name: 'x', type: 'number' }, { name: 'y', type: 'number' }, { name: 'width', type: 'number' }, { name: 'height', type: 'number' }], returns: 'object', doc: 'Get image data' },
    { name: 'putImageData', args: [{ name: 'ctx', type: 'object' }, { name: 'imageData', type: 'object' }, { name: 'x', type: 'number' }, { name: 'y', type: 'number' }], returns: 'null', doc: 'Put image data' },
    { name: 'save', args: [{ name: 'ctx', type: 'object' }], returns: 'null', doc: 'Save context state' },
    { name: 'restore', args: [{ name: 'ctx', type: 'object' }], returns: 'null', doc: 'Restore context state' },
    { name: 'scale', args: [{ name: 'ctx', type: 'object' }, { name: 'x', type: 'number' }, { name: 'y', type: 'number' }], returns: 'null', doc: 'Scale context' },
    { name: 'rotate', args: [{ name: 'ctx', type: 'object' }, { name: 'angle', type: 'number' }], returns: 'null', doc: 'Rotate context' },
    { name: 'translate', args: [{ name: 'ctx', type: 'object' }, { name: 'x', type: 'number' }, { name: 'y', type: 'number' }], returns: 'null', doc: 'Translate context' },
    { name: 'setTransform', args: [{ name: 'ctx', type: 'object' }, { name: 'a', type: 'number' }, { name: 'b', type: 'number' }, { name: 'c', type: 'number' }, { name: 'd', type: 'number' }, { name: 'e', type: 'number' }, { name: 'f', type: 'number' }], returns: 'null', doc: 'Set transform matrix' },
    { name: 'resetTransform', args: [{ name: 'ctx', type: 'object' }], returns: 'null', doc: 'Reset transform' },
    { name: 'setFillStyle', args: [{ name: 'ctx', type: 'object' }, { name: 'color', type: 'string' }], returns: 'null', doc: 'Set fill style' },
    { name: 'setStrokeStyle', args: [{ name: 'ctx', type: 'object' }, { name: 'color', type: 'string' }], returns: 'null', doc: 'Set stroke style' },
    { name: 'setLineWidth', args: [{ name: 'ctx', type: 'object' }, { name: 'width', type: 'number' }], returns: 'null', doc: 'Set line width' },
    { name: 'setLineCap', args: [{ name: 'ctx', type: 'object' }, { name: 'cap', type: 'string' }], returns: 'null', doc: 'Set line cap style' },
    { name: 'setLineJoin', args: [{ name: 'ctx', type: 'object' }, { name: 'join', type: 'string' }], returns: 'null', doc: 'Set line join style' },
    { name: 'setGlobalAlpha', args: [{ name: 'ctx', type: 'object' }, { name: 'alpha', type: 'number' }], returns: 'null', doc: 'Set global alpha' },
    { name: 'setGlobalCompositeOperation', args: [{ name: 'ctx', type: 'object' }, { name: 'operation', type: 'string' }], returns: 'null', doc: 'Set composite operation' },
    { name: 'createLinearGradient', args: [{ name: 'ctx', type: 'object' }, { name: 'x0', type: 'number' }, { name: 'y0', type: 'number' }, { name: 'x1', type: 'number' }, { name: 'y1', type: 'number' }], returns: 'object', doc: 'Create linear gradient' },
    { name: 'createRadialGradient', args: [{ name: 'ctx', type: 'object' }, { name: 'x0', type: 'number' }, { name: 'y0', type: 'number' }, { name: 'r0', type: 'number' }, { name: 'x1', type: 'number' }, { name: 'y1', type: 'number' }, { name: 'r1', type: 'number' }], returns: 'object', doc: 'Create radial gradient' },
    { name: 'createPattern', args: [{ name: 'ctx', type: 'object' }, { name: 'image', type: 'object' }, { name: 'repetition', type: 'string' }], returns: 'object', doc: 'Create pattern' },
    { name: 'addColorStop', args: [{ name: 'gradient', type: 'object' }, { name: 'offset', type: 'number' }, { name: 'color', type: 'string' }], returns: 'null', doc: 'Add gradient color stop' },
    { name: 'toDataURL', args: [{ name: 'canvas', type: 'object' }, { name: 'type', type: 'string', optional: true }], returns: 'string', doc: 'Export canvas to data URL' },
  ];
  
  graphicsOps.forEach(op => {
    commands.push({ ...op, module: 'graphics', example: `graphics.${op.name}(...)` });
  });
  
  return commands;
}

// Generate Audio commands
function generateAudioCommands(): CommandDefinition[] {
  const commands: CommandDefinition[] = [];
  
  const audioOps = [
    { name: 'createContext', args: [], returns: 'object', doc: 'Create audio context' },
    { name: 'createOscillator', args: [{ name: 'ctx', type: 'object' }], returns: 'object', doc: 'Create oscillator node' },
    { name: 'createGain', args: [{ name: 'ctx', type: 'object' }], returns: 'object', doc: 'Create gain node' },
    { name: 'createAnalyser', args: [{ name: 'ctx', type: 'object' }], returns: 'object', doc: 'Create analyser node' },
    { name: 'createBiquadFilter', args: [{ name: 'ctx', type: 'object' }], returns: 'object', doc: 'Create biquad filter' },
    { name: 'createDelay', args: [{ name: 'ctx', type: 'object' }, { name: 'maxDelay', type: 'number', optional: true }], returns: 'object', doc: 'Create delay node' },
    { name: 'createConvolver', args: [{ name: 'ctx', type: 'object' }], returns: 'object', doc: 'Create convolver node' },
    { name: 'createCompressor', args: [{ name: 'ctx', type: 'object' }], returns: 'object', doc: 'Create compressor node' },
    { name: 'connect', args: [{ name: 'source', type: 'object' }, { name: 'destination', type: 'object' }], returns: 'null', doc: 'Connect audio nodes' },
    { name: 'disconnect', args: [{ name: 'node', type: 'object' }], returns: 'null', doc: 'Disconnect audio node' },
    { name: 'start', args: [{ name: 'node', type: 'object' }, { name: 'when', type: 'number', optional: true }], returns: 'null', doc: 'Start audio node' },
    { name: 'stop', args: [{ name: 'node', type: 'object' }, { name: 'when', type: 'number', optional: true }], returns: 'null', doc: 'Stop audio node' },
    { name: 'setFrequency', args: [{ name: 'node', type: 'object' }, { name: 'value', type: 'number' }], returns: 'null', doc: 'Set oscillator frequency' },
    { name: 'setType', args: [{ name: 'node', type: 'object' }, { name: 'type', type: 'string' }], returns: 'null', doc: 'Set oscillator type' },
    { name: 'setGain', args: [{ name: 'node', type: 'object' }, { name: 'value', type: 'number' }], returns: 'null', doc: 'Set gain value' },
    { name: 'loadAudio', args: [{ name: 'ctx', type: 'object' }, { name: 'url', type: 'string' }], returns: 'object', doc: 'Load audio file' },
    { name: 'playBuffer', args: [{ name: 'ctx', type: 'object' }, { name: 'buffer', type: 'object' }], returns: 'object', doc: 'Play audio buffer' },
    { name: 'decodeAudioData', args: [{ name: 'ctx', type: 'object' }, { name: 'data', type: 'object' }], returns: 'object', doc: 'Decode audio data' },
    { name: 'getAnalyserData', args: [{ name: 'analyser', type: 'object' }], returns: 'array', doc: 'Get frequency data' },
    { name: 'resume', args: [{ name: 'ctx', type: 'object' }], returns: 'null', doc: 'Resume audio context' },
    { name: 'suspend', args: [{ name: 'ctx', type: 'object' }], returns: 'null', doc: 'Suspend audio context' },
    { name: 'close', args: [{ name: 'ctx', type: 'object' }], returns: 'null', doc: 'Close audio context' },
  ];
  
  audioOps.forEach(op => {
    commands.push({ ...op, module: 'audio', example: `audio.${op.name}(...)` });
  });
  
  return commands;
}

// Build complete registry
export function buildCommandRegistry(): CommandModule[] {
  return [
    { name: 'math', description: 'Mathematical operations and functions', commands: generateMathCommands() },
    { name: 'string', description: 'String manipulation functions', commands: generateStringCommands() },
    { name: 'array', description: 'Array manipulation functions', commands: generateArrayCommands() },
    { name: 'ui', description: 'UI component creation and manipulation', commands: generateUICommands() },
    { name: 'fs', description: 'File system operations', commands: generateFSCommands() },
    { name: 'net', description: 'Network and HTTP operations', commands: generateNetCommands() },
    { name: 'time', description: 'Date, time, and timer operations', commands: generateTimeCommands() },
    { name: 'os', description: 'Operating system and process operations', commands: generateOSCommands() },
    { name: 'crypto', description: 'Cryptographic operations', commands: generateCryptoCommands() },
    { name: 'style', description: 'CSS styling operations', commands: generateStyleCommands() },
    { name: 'graphics', description: 'Canvas and graphics operations', commands: generateGraphicsCommands() },
    { name: 'audio', description: 'Audio and sound operations', commands: generateAudioCommands() },
  ];
}

// Registry class for searching and accessing commands
export class CommandRegistry {
  private modules: CommandModule[];
  private commandIndex: Map<string, CommandDefinition>;
  
  constructor() {
    this.modules = buildCommandRegistry();
    this.commandIndex = new Map();
    
    // Build index for fast lookup
    this.modules.forEach(module => {
      module.commands.forEach(cmd => {
        this.commandIndex.set(`${module.name}.${cmd.name}`, cmd);
      });
    });
  }
  
  getModules(): CommandModule[] {
    return this.modules;
  }
  
  getModule(name: string): CommandModule | undefined {
    return this.modules.find(m => m.name === name);
  }
  
  getCommand(fullName: string): CommandDefinition | undefined {
    return this.commandIndex.get(fullName);
  }
  
  search(query: string, options?: { module?: string; maxResults?: number }): CommandDefinition[] {
    const results: CommandDefinition[] = [];
    const lowerQuery = query.toLowerCase();
    const maxResults = options?.maxResults ?? 50;
    
    for (const module of this.modules) {
      if (options?.module && module.name !== options.module) continue;
      
      for (const cmd of module.commands) {
        if (results.length >= maxResults) break;
        
        if (
          cmd.name.toLowerCase().includes(lowerQuery) ||
          cmd.doc.toLowerCase().includes(lowerQuery)
        ) {
          results.push(cmd);
        }
      }
    }
    
    return results;
  }
  
  getTotalCommandCount(): number {
    return this.commandIndex.size;
  }
  
  getModuleCommandCount(moduleName: string): number {
    const module = this.getModule(moduleName);
    return module?.commands.length ?? 0;
  }
}

// Singleton registry instance
export const commandRegistry = new CommandRegistry();
