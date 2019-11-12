import ts from 'typescript'
import {LensNode} from '../lens'
import {TypeNode} from './type-node'

export class RecordNode implements TypeNode {
  private _checker: ts.TypeChecker

  constructor(checker: ts.TypeChecker) {
    this._checker = checker
  }

  isOfTypeNode(typeNode: ts.TypeNode): typeNode is ts.TypeReferenceNode {
    if (ts.isTypeReferenceNode(typeNode) && typeNode.typeName.getText() === 'Record') return true
    else return false
  }

  getEquivalentLensNode(id: string, name: string, parentId: string): LensNode {
    return {
      id,
      parentId,
      kind: 'lens',
      propName: name
    }
  }

  getUnderlyingTypeSymbol(typeNode: ts.TypeNode) {
    if (!this.isOfTypeNode(typeNode)) return undefined
    const params = typeNode.typeArguments
    const type = this._checker.getTypeFromTypeNode(params![1])
    return type.symbol
  }
}
