import ts from 'typescript'

const toTitleCase = (s: string) => s[0].toUpperCase() + s.slice(1)

const program = ts.createProgram(process.argv.slice(2), {
  target: ts.ScriptTarget.ES2015,
  module: ts.ModuleKind.CommonJS
})
const checker = program.getTypeChecker()

const genLens = (destinationType: string, originType: string, prop: string) => {
  const value = `const get${toTitleCase(
    destinationType
  )} = Lens.fromProp<${originType}>()('${prop}')`
  console.log(value)
  return value
}

const getPropType = (decl: ts.Declaration) => {
  if (ts.isPropertySignature(decl) && decl.type) {
    const declType = decl.type
    if (ts.isArrayTypeNode(declType)) {
      const elemType = declType.elementType
      return elemType.getText()
    } else {
      return declType.getText()
    }
  } else {
    return ''
  }
}

const getPropName = (decl: ts.Declaration) => {
  return decl.getChildAt(0).getText()
}

/**
 * Currently the traversal goes through each interface in each file,
 * which works for generating bare lenses but not compositions
 * 
 * Ideally the traversal would occur top to bottom, allowing us
 * to easily compute the composition, but that does not seem to
 * work across multiple files. Alternatively, traversing bottom up
 * seems to work even across file boundaries.
 */
const _visit = (symbol: ts.Symbol) => {
  if (symbol === undefined) {
    return
  }
  const members = symbol.members
  if (members === undefined) {
    return
  }
  members.forEach(({ valueDeclaration }) => {
    const propName = getPropName(valueDeclaration)
    const propType = getPropType(valueDeclaration)
    genLens(propType, symbol.name, propName)
  })
}

const visit = (node: ts.Node) => {
  if (!ts.isInterfaceDeclaration(node)) {
    return
  }
  const symbol = checker.getSymbolAtLocation(node.name)
  if (symbol === undefined) {
    return
  }
  _visit(symbol)
}

for (const sourceFile of program.getSourceFiles()) {
  if (!sourceFile.isDeclarationFile) {
    ts.forEachChild(sourceFile, visit)
  }
}

/* Traversal

  To traverse top to bottom (A -> ... -> S) the following can be used
  Currently it doesn't work across file boundaries, so if you have files
  a.ts which imports b.ts, it will not see the symbols on b.ts

  An alternative is to traverse bottom to top, which appears to work
  when using node.parent

*/

// const firstChild = elemType.getChildAt(0)
// const f = elemType.getSourceFile()
// if (firstChild) {
//   const declaration = checker.getSymbolAtLocation(firstChild)
//   if (declaration) {
//     _visit(declaration)
//   }
// }
