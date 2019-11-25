import ts from 'typescript'
import {TypeNode, TypeNodeHandler, VerifiedDeclaration, toTitleCase} from './type-node'
import uuid from 'uuid-random'
import {useImport} from '../imports'

export abstract class RecordNodeHandler extends TypeNodeHandler {
  static isOfTypeNode(
    typeNode: ts.TypeNode | undefined
  ): typeNode is ts.TypeReferenceNode | ts.TypeLiteralNode {
    if (!typeNode) return false
    else if (ts.isTypeReferenceNode(typeNode) && typeNode.typeName.getText() === 'Record')
      return true
    else if (
      ts.isTypeLiteralNode(typeNode) &&
      (typeNode as any).nextContainer.type.typeName.escapedText
    )
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
  typeNode: ts.TypeReferenceNode | ts.TypeLiteralNode
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
    this.typeNode = valueDeclaration.type as ts.TypeReferenceNode | ts.TypeLiteralNode
    if (ts.isTypeLiteralNode(this.typeNode)) {
      const typeParameters: ts.TypeNode[] = []
      this.typeNode.members.forEach(member => {
        member.forEachChild(child => {
          const typ = checker.getTypeAtLocation(child)
          const typeNode = checker.typeToTypeNode(typ)
          if (typeNode) {
            typeParameters.push(typeNode)
          }
        })
      })
      this.typeParameters = ts.createNodeArray(typeParameters)
    } else {
      this.typeParameters = this.typeNode.typeArguments!
    }
    this.typeSymbols = this.typeParameters
      .filter(ts.isTypeNode)
      .map(node => {
        const typ = this._checker.getTypeFromTypeNode(node)
        if (typ && typ.symbol) {
          return typ
        }
        return (node as any).typeName ? (node as any).typeName : {}
      })
      .filter(typ => !!typ.symbol)
      .map(typ => typ.symbol)
    console.log(this.typeSymbols)
    this.propertyName = valueDeclaration.name.getText()
    this.propertyTypeName = this.typeSymbols[0].name
    this.nodeDeclaration =
      `const get${toTitleCase(this.propertyName)}From${parent.propertyTypeName} = ${useImport(
        'Lens',
        'monocle-ts'
      )}.fromProp<${parent.propertyTypeName}>()('${this.propertyName}')\n` +
      `const getByIdFrom${toTitleCase(this.propertyTypeName)} = ${useImport(
        'Lens',
        'monocle-ts'
      )}.fromProp<Record<string, ${this.propertyTypeName}>>()`
  }

  getComposition(value: string) {
    return `get${toTitleCase(this.propertyName)}From${
      this.parent.propertyTypeName
    }.composeLens(getByIdFrom${toTitleCase(this.propertyName)})`
  }
}
