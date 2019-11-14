import ts from 'typescript'
import {Tree} from './tree'
import {TypeNode, TypeNodeHandler} from './type-nodes'

const toTitleCase = (s: string) => {
  const camelCase = s.replace(/-([a-z])/g, matches => matches[1].toUpperCase())
  return camelCase[0].toUpperCase() + camelCase.slice(1)
}

export class TypeNodeTree {
  private _root: TypeNode
  private _tree: Tree<TypeNode>
  private _checker: ts.TypeChecker
  private _handlers: TypeNodeHandler[]

  constructor(rootNode: TypeNode, checker: ts.TypeChecker, handlers: TypeNodeHandler[]) {
    this._root = rootNode
    this._tree = new Tree<TypeNode>(rootNode)
    this._checker = checker
    this._handlers = handlers
    this.buildTree(rootNode)
  }

  registerNodeHandler(handler: TypeNodeHandler) {
    this._handlers.push(handler)
  }

  getTree() {
    return this._tree
  }

  static createLensIdentifier(originType: string, prop: string) {
    return `get${toTitleCase(prop)}From${toTitleCase(originType)}`
  }

  static genLens(originType: string, prop: string) {
    const value = `const ${TypeNodeTree.createLensIdentifier(
      originType,
      prop
    )} = Lens.fromProp<${originType}>()('${prop}')`
    return value
  }

  static genRecordLens(originType: string, prop: string, idField = 'id') {
    const value = `const ${TypeNodeTree.createLensIdentifier(
      originType,
      prop
    )} = Lens.fromProp<Record<${originType}['${idField}'], ${originType}>>()`
    return value
  }

  static genTraversal(traversalId: string) {
    const value = `const ${traversalId.toLowerCase()}Traversal = fromTraversable(array)<${traversalId}>()`
    return value
  }

  // static genCompositions(rootTypeName: string, path: LensNode[]) {
  //   const composed = path.reduce<string>((prev, curr) => {
  //     const currValue = TypeNodeTree.createLensIdentifier(curr.parentId, curr.propName)
  //     if (curr.kind === 'traversal') {
  //       return `${currValue}.composeTraversal(${curr.id.toLowerCase()}Traversal)`
  //     } else if (curr.kind === 'record') {
  //       return `${currValue}.compose(getByIdFrom${curr.id})`
  //     }
  //     if (!prev) return currValue
  //     return `${prev}.composeLens(${currValue})`
  //   }, '')
  //   const propName = path.map(p => p.propName)[path.length - 1].split(/(?=[A-Z])/)[0]
  //   const value = `const select${toTitleCase(propName)}From${rootTypeName} = ${composed}`
  //   return value
  // }

  private buildTree(node: TypeNode = this._root): Tree<TypeNode> {
    if (node.typeSymbols.length === 0) {
      return this._tree
    }
    const members = node.typeSymbols[0].members
    if (members === undefined) {
      return this._tree
    }
    members.forEach(({valueDeclaration}) => {
      if (valueDeclaration && ts.isPropertySignature(valueDeclaration)) {
        const handled = this._handlers.some(handler => {
          if (handler.isDeclarationOfTypeNode(valueDeclaration)) {
            const createdNode = handler.createNode(this._checker, node, valueDeclaration)
            this._tree.addChild(createdNode)
            this.buildTree(createdNode)
            return true
          }
        })
        if (!handled) {
          // this._tree.addChild(
          //   {
          //     id: typeNode.getText(),
          //     propName: this.getPropName(valueDeclaration),
          //     parentId: symbol.name
          //   },
          //   symbol.name
          // )
          // const typ = this._checker.getTypeFromTypeNode(typeNode)
          // if (typ.symbol) {
          //   this.buildTree(typ.symbol)
          // }
        }
      }
    })
    return this._tree
  }
}
