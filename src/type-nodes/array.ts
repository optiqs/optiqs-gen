import ts from 'typescript'
import {LensNode} from '../lens'

interface NodeResult {
  typeSymbol: ts.Symbol
  lensNode: LensNode
}

export class ArrayNode {
  private _checker: ts.TypeChecker

  private getArrayTypeParameters(typeNode: ts.ArrayTypeNode | ts.TypeReferenceNode) {
    if (ts.isArrayTypeNode(typeNode))
      return typeNode.elementType ? ts.createNodeArray([typeNode.elementType]) : undefined
    return typeNode.typeArguments
  }

  constructor(checker: ts.TypeChecker) {
    this._checker = checker
  }

  static isArrayTypeNode(
    typeNode: ts.TypeNode
  ): typeNode is ts.ArrayTypeNode | ts.TypeReferenceNode {
    if (ts.isArrayTypeNode(typeNode)) return true
    else if (ts.isTypeReferenceNode(typeNode) && typeNode.typeName.getText() === 'Array')
      return true
    else return false
  }

  static getEquivalentLensNode(id: string, name: string, parentId: string): LensNode {
    return {
      id,
      parentId,
      kind: 'traversal',
      propName: name
    }
  }

  getUnderlyingTypeSymbol(node: ts.ArrayTypeNode | ts.TypeReferenceNode) {
    const params = this.getArrayTypeParameters(node)
    const type = this._checker.getTypeFromTypeNode(params![0])
    return type.symbol
  }

}
