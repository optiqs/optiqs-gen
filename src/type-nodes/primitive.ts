import ts from 'typescript'
import {TypeNode, toTitleCase} from './type-node'
import uuid from 'uuid-random'

export class PrimitiveNode implements TypeNode {

  private _checker: ts.TypeChecker
  
  id: string
  parent: TypeNode
  valueDeclaration: ts.PropertySignature
  typeNode: ts.TypeNode
  typeParameters: ts.NodeArray<ts.TypeNode>
  typeSymbols: ts.Symbol[]
  propertyName: string
  propertyTypeName: string
  nodeDeclaration: string  

  constructor(checker: ts.TypeChecker, parent: TypeNode, valueDeclaration: ts.PropertySignature) {
    this.id = uuid()
    this.parent = parent
    this._checker = checker
    this.valueDeclaration = valueDeclaration
    this.typeNode = valueDeclaration.type!
    this.typeParameters = ts.createNodeArray([this.typeNode])
    this.typeSymbols = this.typeParameters
      .map(this._checker.getTypeFromTypeNode)
      .map(typ => typ.symbol)
    this.propertyName = valueDeclaration.name.getText()
    this.propertyTypeName = valueDeclaration.type!.getText()
    this.nodeDeclaration =
      `const get${toTitleCase(this.propertyName)}From${parent.propertyTypeName} = Lens.fromProp<${parent.propertyTypeName}>()('${this.propertyName}')`
  }

  getComposition(value: string) {
    if (!value) {
      return `get${toTitleCase(this.propertyName)}From${this.parent.propertyTypeName}`
    }
    return `${value}.composeLens(get${toTitleCase(this.propertyName)}From${this.parent.propertyTypeName})`
  }
}