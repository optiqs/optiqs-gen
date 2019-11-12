import ts from 'typescript'
import {Tree} from './tree'
import {ArrayNode} from './type-nodes'

const toTitleCase = (s: string) => {
  const camelCase = s.replace(/-([a-z])/g, matches => matches[1].toUpperCase())
  return camelCase[0].toUpperCase() + camelCase.slice(1)
}

export interface LensNode {
  readonly id: string
  readonly kind: 'lens' | 'traversal' | 'fold'
  readonly propName: string
  readonly parentId: string
  readonly children?: LensNode[]
}

export class Lenses {
  private _root: ts.Symbol
  private _tree: Tree<LensNode>
  private _checker: ts.TypeChecker

  constructor(rootNode: ts.Symbol, checker: ts.TypeChecker) {
    this._root = rootNode
    this._tree = new Tree<LensNode>({
      propName: '-',
      kind: 'lens',
      id: rootNode.name,
      parentId: '-',
      children: []
    })
    this._checker = checker
    this.buildTree(rootNode)
  }

  getTree() {
    return this._tree
  }

  static createLensIdentifier(originType: string, prop: string) {
    return `get${toTitleCase(prop)}From${toTitleCase(originType)}`
  }

  static genLens(originType: string, prop: string) {
    const value = `const ${Lenses.createLensIdentifier(
      originType,
      prop
    )} = Lens.fromProp<${originType}>()('${prop}')`
    return value
  }

  static genTraversal(traversalId: string) {
    const value = `const ${traversalId.toLowerCase()}Traversal = fromTraversable(array)<${traversalId}>()`
    return value
  }

  static genCompositions(rootTypeName: string, path: LensNode[]) {
    const composed = path.reduce<string>((prev, curr) => {
      const currValue = Lenses.createLensIdentifier(curr.parentId, curr.propName)
      if (curr.kind === 'traversal') {
        return `${currValue}.composeTraversal(${curr.id.toLowerCase()}Traversal)`
      }
      if (!prev) return currValue
      return `${prev}.composeLens(${currValue})`
    }, '')
    const propName = path.map(p => p.propName)[path.length - 1].split(/(?=[A-Z])/)[0]
    const value = `const select${toTitleCase(propName)}From${rootTypeName} = ${composed}`
    return value
  }

  getPropName(decl: ts.Declaration) {
    if (ts.isPropertySignature(decl) && decl.type) {
      return decl.name.getText()
    } else {
      return ''
    }
  }

  private buildTree(symbol: ts.Symbol = this._root): Tree<LensNode> {
    if (symbol === undefined) {
      return this._tree
    }
    const members = symbol.members
    if (members === undefined) {
      return this._tree
    }
    members.forEach(({valueDeclaration}) => {
      if (valueDeclaration && ts.isPropertySignature(valueDeclaration) && valueDeclaration.type) {
        const typeNode = valueDeclaration.type
        const propName = this.getPropName(valueDeclaration)
        if (!typeNode || !ts.isTypeNode(typeNode)) return
        if (ArrayNode.isArrayTypeNode(typeNode)) {
          const arrayNode = new ArrayNode(this._checker)
          const {typeSymbol, lensNode} = arrayNode.handle(typeNode, propName, symbol)
          this._tree.addChild(lensNode, symbol.name)
          this.buildTree(typeSymbol)
        } else {
          this._tree.addChild(
            {
              id: typeNode.getText(),
              kind: 'lens',
              propName: this.getPropName(valueDeclaration),
              parentId: symbol.name
            },
            symbol.name
          )
          const type = this._checker.getTypeFromTypeNode(typeNode)
          if (type.symbol) {
            this.buildTree(type.symbol)
          }
        }
      }
    })
    return this._tree
  }
}
