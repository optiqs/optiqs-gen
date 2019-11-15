import ts from 'typescript'
import {TypeNode, TypeNodeHandler, VerifiedDeclaration, toTitleCase} from './type-node'
import uuid from 'uuid-random'

export abstract class RecordNodeHandler extends TypeNodeHandler {
  static isOfTypeNode(
    typeNode: ts.TypeNode | undefined
  ): typeNode is ts.TypeReferenceNode {
    if (!typeNode) return false
    else if (ts.isTypeReferenceNode(typeNode) && typeNode.typeName.getText() === 'Record')
      return true
    else return false
  }

  static isDeclarationOfTypeNode(
    valueDeclaration: ts.PropertySignature
  ): valueDeclaration is VerifiedDeclaration {
    const typeNode = valueDeclaration.type
    return RecordNodeHandler.isOfTypeNode(typeNode)
  }

  static createNode(
    checker: ts.TypeChecker,
    parent: TypeNode,
    valueDeclaration: VerifiedDeclaration
  ): TypeNode {
    return new RecordNode(checker, parent, valueDeclaration)
  }
}

export class RecordNode implements TypeNode {
  private _checker: ts.TypeChecker

  id: string
  parent: TypeNode
  valueDeclaration: VerifiedDeclaration
  typeNode: ts.TypeReferenceNode
  typeParameters: ts.NodeArray<ts.TypeNode>
  typeSymbols: ts.Symbol[]
  propertyName: string
  propertyTypeName: string
  nodeDeclaration: string

  constructor(checker: ts.TypeChecker, parent: TypeNode, valueDeclaration: VerifiedDeclaration) {
    this.id = uuid()
    this.parent = parent
    this._checker = checker
    this.valueDeclaration = valueDeclaration
    this.typeNode = valueDeclaration.type as ts.TypeReferenceNode
    this.typeParameters = this.typeNode.typeArguments!
    this.typeSymbols = this.typeParameters
      .map(this._checker.getTypeFromTypeNode)
      .filter(typ => typ.isClassOrInterface())
      .map(typ => typ.symbol)
    this.propertyName = valueDeclaration.name.getText()
    this.propertyTypeName = this.typeSymbols[0].name
    this.nodeDeclaration =
      `const get${toTitleCase(this.propertyName)}From${parent.propertyTypeName} = Lens.fromProp<${parent.propertyTypeName}>()('${this.propertyName}')\n` +
      `const getByIdFrom${toTitleCase(this.propertyTypeName)} = Lens.fromProp<Record<string, ${this.propertyTypeName}>>()`
  }

  getComposition(value: string) {
    return `get${toTitleCase(this.propertyName)}From${this.parent.propertyTypeName}.composeLens(getByIdFrom${toTitleCase(this.propertyName)})`
  }
}
