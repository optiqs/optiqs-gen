import ts from 'typescript'
import {TypeNode} from './type-node'

export class RootNode implements TypeNode {
  
  parent: undefined
  valueDeclaration: ts.InterfaceDeclaration
  typeNode: ts.TypeNode
  typeParameters: ts.NodeArray<ts.TypeNode>
  typeSymbols: ts.Symbol[]
  propertyName: string
  propertyTypeName: string
  nodeDeclaration: string  

  constructor(typeNode: ts.TypeNode, interfaceDeclaration: ts.InterfaceDeclaration, symbol: ts.Symbol) {
    this.typeNode = typeNode
    this.typeParameters = ts.createNodeArray([])
    this.typeSymbols = [symbol]
    this.propertyName = ''
    this.propertyTypeName = interfaceDeclaration.name.getText()
    this.valueDeclaration = interfaceDeclaration
    this.nodeDeclaration = ''
  }

  getComposition(_: string) {
    return ''
  }

}