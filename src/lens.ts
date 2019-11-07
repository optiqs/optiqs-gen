import ts from 'typescript'
import {Tree} from './tree'

export interface LensNode {
  readonly id: string
  readonly propName: string
  readonly parentId: string
  readonly children?: LensNode[]
}

const toTitleCase = (s: string) => s[0].toUpperCase() + s.slice(1)

export const genLens = (originType: string, prop: string) => {
  const value = `const get${toTitleCase(
    prop
  )}From${originType} = Lens.fromProp<${originType}>()('${prop}')`
  console.log(value)
  return value
}

export const getPropTypeNode = (decl: ts.Declaration) => {
  if (ts.isPropertySignature(decl) && decl.type) {
    const declType = decl.type
    if (ts.isArrayTypeNode(declType)) {
      const elemType = declType.elementType
      return elemType
    } else {
      return declType
    }
  } else {
    return undefined
  }
}

export const getPropName = (decl: ts.Declaration) => {
  if (ts.isPropertySignature(decl) && decl.type) {
    return decl.name.getText()
  } else {
    return ''
  }
}

export const buildTree = (
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
  existingTree?: Tree<LensNode>
): Tree<LensNode> => {
  const tree =
    existingTree ||
    new Tree<LensNode>({
      propName: '-',
      id: symbol.name,
      parentId: '-',
      children: []
    })
  if (symbol === undefined) {
    return tree
  }
  const members = symbol.members
  if (members === undefined) {
    return tree
  }
  members.forEach(({valueDeclaration}) => {
    if (ts.isPropertySignature(valueDeclaration) && valueDeclaration.type) {
      tree.addChild(
        {
          id: getPropTypeNode(valueDeclaration)!.getText(),
          propName: getPropName(valueDeclaration),
          parentId: symbol.name
        },
        symbol.name
      )
      const typeNode = getPropTypeNode(valueDeclaration)
      if (typeNode && ts.isTypeNode(typeNode)) {
        const type = checker.getTypeFromTypeNode(typeNode)
        if (type.symbol) {
          buildTree(checker, type.symbol, tree)
        }
      }
    }
  })
  return tree
}
