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
  )}From${originType} = Lens.fromProp<${originType}>()('${prop}')`
  console.log(value)
  return value
}

const getPropTypeNode = (decl: ts.Declaration) => {
  if (ts.isPropertySignature(decl) && decl.type) {
    const declType = decl.type
    if (ts.isArrayTypeNode(declType)) {
      const elemType = declType.elementType
      return elemType
    } else {
      return declType
    }
  } else {
    return undefined
  }
}

const getPropName = (decl: ts.Declaration) => {
  if (ts.isPropertySignature(decl) && decl.type) {
    return decl.name.getText()
  } else {
    return ''
  }
}

const _visit = (symbol: ts.Symbol) => {
  if (symbol === undefined) {
    return
  }
  const members = symbol.members
  if (members === undefined) {
    return
  }
  members.forEach(({valueDeclaration}) => {
    if (ts.isPropertySignature(valueDeclaration) && valueDeclaration.type) {
      genLens(getPropName(valueDeclaration), symbol.name, getPropName(valueDeclaration))
      const typeNode = getPropTypeNode(valueDeclaration)
      if (typeNode && ts.isTypeNode(typeNode)) {
        const type = checker.getTypeFromTypeNode(typeNode)
        if (type.symbol) {
          _visit(type.symbol)
        }
      }
    }
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
  if (symbol.name === 'A') {
    console.log('** Lens Generation **')
    _visit(symbol)
  }
}

for (const sourceFile of program.getSourceFiles()) {
  if (!sourceFile.isDeclarationFile) {
    ts.forEachChild(sourceFile, visit)
  }
}