let imports: Record<string, Set<string>> = {}

export const useImport = (identifier: string, fromModule: string) => {
  if (!imports[fromModule]) {
    imports[fromModule] = new Set()
  }
  imports[fromModule].add(identifier)
  return identifier
}

export const resetImports = () => {
  imports = {}
}

export const generateImportStatements = () => {
  const statements: string[] = []
  for (const key in imports) {
    const identifiers = Array.from(imports[key]).join(',')
    statements.push(`import {${identifiers}} from '${key}'`)
  }
  return statements.join('\n')
}
