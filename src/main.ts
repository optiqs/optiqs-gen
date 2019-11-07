import ts from 'typescript'
import {buildTree, genLens} from './lens'

const program = ts.createProgram(process.argv.slice(2), {
  target: ts.ScriptTarget.ES2015,
  module: ts.ModuleKind.CommonJS
})
const checker = program.getTypeChecker()

const visit = (node: ts.Node) => {
  if (!ts.isInterfaceDeclaration(node)) {
    return
  }
  const symbol = checker.getSymbolAtLocation(node.name)
  if (symbol === undefined) {
    return
  }
  if (symbol.name === 'A') {
    const tree = buildTree(checker, symbol)
    tree.treeTraverseBF(node => {
      if (node.id === symbol.name) return
      genLens(node.parentId, node.propName)
    })
  }
}

for (const sourceFile of program.getSourceFiles()) {
  if (!sourceFile.isDeclarationFile) {
    ts.forEachChild(sourceFile, visit)
  }
}
