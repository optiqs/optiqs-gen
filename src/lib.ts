import ts from 'typescript'
import {TypeNodeTree} from './type-node-tree'
import {Tree} from './tree'
import {TypeNode, ArrayNodeHandler, toTitleCase, RecordNodeHandler} from './type-nodes'
import {RootNode} from './type-nodes/root'

export interface GeneratorOutput {
  fileName: string
  statements: string[]
  tree: Tree<TypeNode>
}

const main = (program: ts.Program, rootTypeName: string) => {
  const checker = program.getTypeChecker()
  const output: GeneratorOutput[] = []

  const visit = (node: ts.Node, fileName: string) => {
    if (!ts.isInterfaceDeclaration(node)) {
      return
    }

    const symbol = checker.getSymbolAtLocation(node.name)
    if (symbol === undefined || symbol.name !== rootTypeName) {
      return
    }

    const typ = checker.getTypeAtLocation(node)
    const typeNode = checker.typeToTypeNode(typ)
    if (!typeNode) return

    const rootNode: TypeNode = new RootNode(typeNode, node, symbol)
    const typeNodeTree = new TypeNodeTree(rootNode, checker, [ArrayNodeHandler, RecordNodeHandler]).getTree()
    const statements: string[] = []
    typeNodeTree.traverseBF(node => {
      statements.push(node.nodeDeclaration)
    })
    statements.push('\n')
    typeNodeTree.traversePaths(path => {
      const composition = path.reduce((prev, curr) => {
        return `${curr.getComposition(prev)}`
      }, '')
      const name = `const select${toTitleCase(
        path[path.length - 1].propertyName
      )}From${rootTypeName}`
      statements.push(`${name} = ${composition}`)
    })

    output.push({
      fileName,
      statements,
      tree: typeNodeTree
    })
  }

  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      ts.forEachChild(sourceFile, node => visit(node, sourceFile.fileName))
    }
  }

  return output
}

/**
 * Generate lenses from one or more files.
 * @param files List of file paths
 * @param rootTypeName Name of the symbol to search for.
 */
export const fromFiles = (files: string[], rootTypeName: string) =>
  main(
    ts.createProgram(files, {
      target: ts.ScriptTarget.ES2015,
      module: ts.ModuleKind.CommonJS
    }),
    rootTypeName
  )

/**
 * Generate lenses from source code.
 * @param fileName Name of the file
 * @param source Source code for the file
 * @param rootTypeName Name of the symbol to search for.
 */
export const fromSource = (fileName: string, source: string, rootTypeName: string) => {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.ES2015)
  const compilerHost = ts.createCompilerHost({})

  // Load the in-memory source file when requested
  compilerHost.getSourceFile = (sourceFileName, _languageVersion, _onError) => {
    if (sourceFileName === fileName) {
      return sourceFile
    }
    return undefined
  }

  return main(
    ts.createProgram({
      rootNames: ['test.ts'],
      options: {},
      host: compilerHost
    }),
    rootTypeName
  )
}
