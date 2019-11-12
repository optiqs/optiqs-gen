import ts from 'typescript'
import {LensNode} from '../lens'
import {TypeNode} from './type-node'

export class ArrayNode implements TypeNode {

  private _checker: ts.TypeChecker

  private getArrayTypeParameters(typeNode: ts.ArrayTypeNode | ts.TypeReferenceNode) {
    if (ts.isArrayTypeNode(typeNode))
      return typeNode.elementType ? ts.createNodeArray([typeNode.elementType]) : undefined
    return typeNode.typeArguments
  }

  constructor(checker: ts.TypeChecker) {
    this._checker = checker
  }

  isOfTypeNode(
    typeNode: ts.TypeNode
  ): typeNode is ts.ArrayTypeNode | ts.TypeReferenceNode {
    if (ts.isArrayTypeNode(typeNode)) return true
    else if (ts.isTypeReferenceNode(typeNode) && typeNode.typeName.getText() === 'Array')
      return true
    else return false
  }

  getEquivalentLensNode(id: string, name: string, parentId: string): LensNode {
    return {
      id,
      parentId,
      kind: 'traversal',
      propName: name
    }
  }

  getUnderlyingTypeSymbol(typeNode: ts.TypeNode) {
    if (!this.isOfTypeNode(typeNode)) return undefined
    const params = this.getArrayTypeParameters(typeNode)
    const type = this._checker.getTypeFromTypeNode(params![0])
    return type.symbol
  }

}
