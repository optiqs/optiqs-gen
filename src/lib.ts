import ts from 'typescript'
import {buildTree, genLens} from './lens'

const main = (program: ts.Program) => {
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
}

/**
 * Generate lenses from one or more files.
 * @param files List of file paths
 */
export const fromFiles = (files: string[]) =>
  main(
    ts.createProgram(files, {
      target: ts.ScriptTarget.ES2015,
      module: ts.ModuleKind.CommonJS
    })
  )

/**
 * Generate lenses from source code.
 * @param fileName Name of the file
 * @param source Source code for the file
 */
export const fromSource = (fileName: string, source: string) => {
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
    })
  )
}
