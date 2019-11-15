import ts from 'typescript'
import {TypeNode, TypeNodeHandler, VerifiedDeclaration, toTitleCase} from './type-node'
import uuid from 'uuid-random'

export abstract class ArrayNodeHandler extends TypeNodeHandler {
  static isOfTypeNode(
    typeNode: ts.TypeNode | undefined
  ): typeNode is ts.ArrayTypeNode | ts.TypeReferenceNode {
    if (!typeNode) return false
    if (ts.isArrayTypeNode(typeNode)) return true
    else if (ts.isTypeReferenceNode(typeNode) && typeNode.typeName.getText() === 'Array')
      return true
    else return false
  }

  static isDeclarationOfTypeNode(
    valueDeclaration: ts.PropertySignature
  ): valueDeclaration is VerifiedDeclaration {
    const typeNode = valueDeclaration.type
    return ArrayNodeHandler.isOfTypeNode(typeNode)
  }

  static createNode(
    checker: ts.TypeChecker,
    parent: TypeNode,
    valueDeclaration: VerifiedDeclaration
  ): TypeNode {
    return new ArrayNode(checker, parent, valueDeclaration)
  }
}

export class ArrayNode implements TypeNode {
  private _checker: ts.TypeChecker

  id: string
  parent: TypeNode
  valueDeclaration: VerifiedDeclaration
  typeNode: ts.ArrayTypeNode | ts.TypeReferenceNode
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
    this.typeNode = valueDeclaration.type as ts.ArrayTypeNode | ts.TypeReferenceNode
    if (ts.isArrayTypeNode(this.typeNode)) {
      this.typeParameters = ts.createNodeArray([this.typeNode.elementType])
    } else {
      this.typeParameters = this.typeNode.typeArguments!
    }
    this.typeSymbols = this.typeParameters
      .map(this._checker.getTypeFromTypeNode)
      .map(typ => typ.symbol)
    this.propertyName = valueDeclaration.name.getText()
    this.propertyTypeName = this.typeSymbols[0].name
    this.nodeDeclaration =
      `const get${toTitleCase(this.propertyName)}From${parent.propertyTypeName} = Lens.fromProp<${parent.propertyTypeName}>()('${this.propertyName}')\n` +
      `const ${this.propertyTypeName.toLowerCase()}Traversal = fromTraversable(array)<${this.propertyTypeName}>()`
  }

  getComposition(value: string) {
    return `get${toTitleCase(this.propertyName)}From${this.parent.propertyTypeName}.composeTraversal(${this.propertyName.toLowerCase()}Traversal)`
  }
}
