import ts from 'typescript'
import {buildTree, genLens, LensNode} from './lens'
import {Tree} from './tree'

export interface GeneratorOutput {
  fileName: string
  statements: string[]
  tree: Tree<LensNode>
}

const main = (program: ts.Program, rootTypeName: string) => {
  const checker = program.getTypeChecker()
  const output: GeneratorOutput[] = []

  const visit = (node: ts.Node, fileName: string) => {
    if (!ts.isInterfaceDeclaration(node)) {
      return
    }
    const symbol = checker.getSymbolAtLocation(node.name)
    if (symbol === undefined) {
      return
    }
    if (symbol.name === rootTypeName) {
      const tree = buildTree(checker, symbol)
      const statements: string[] = []
      tree.treeTraverseBF(node => {
        if (node.id === symbol.name) return
        statements.push(genLens(node.parentId, node.propName))
      })

      output.push({
        fileName,
        statements,
        tree
      })
    }
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
