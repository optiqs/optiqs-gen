import ts from 'typescript'
import {LensNode} from '../lens'

export interface TypeNode {
  isOfTypeNode: (typeNode: ts.TypeNode) => boolean
  getEquivalentLensNode: (id: string, name: string, parentId: string) => LensNode
  getUnderlyingTypeSymbol: (typeNode: ts.TypeNode) => ts.Symbol | undefined
}
