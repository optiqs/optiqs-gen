import ts from 'typescript'

export interface VerifiedDeclaration extends ts.PropertySignature {
  readonly __brand: unique symbol
}

export abstract class TypeNodeHandler {
  abstract isOfTypeNode(typeNode: ts.TypeNode): boolean
  abstract isDeclarationOfTypeNode(valueDeclaration: ts.PropertySignature): valueDeclaration is VerifiedDeclaration
  abstract createNode(
    checker: ts.TypeChecker,
    parent: TypeNode | undefined,
    valueDeclaration: VerifiedDeclaration
  ): TypeNode
}

export interface TypeNode {
  parent: TypeNode | undefined
  valueDeclaration: ts.PropertySignature | ts.InterfaceDeclaration
  typeNode: ts.TypeNode
  typeParameters: ts.NodeArray<ts.TypeNode>
  typeSymbols: ts.Symbol[]
  propertyName: string
  propertyTypeName: string
  nodeDeclaration: string
  getComposition: (value: string) => string
}

export const toTitleCase = (s: string) => {
  const camelCase = s.replace(/-([a-z])/g, matches => matches[1].toUpperCase())
  return camelCase[0].toUpperCase() + camelCase.slice(1)
}