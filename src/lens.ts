import ts from 'typescript'
import {Tree} from './tree'

export interface LensNode {
  readonly id: string
  readonly propName: string
  readonly parentId: string
  readonly children?: LensNode[]
}

/**
 * Convert a string to TitleCase
 * @param s String to convert
 */
const toTitleCase = (s: string) => {
  const camelCase = s.replace(/-([a-z])/g, matches => matches[1].toUpperCase())
  return camelCase[0].toUpperCase() + camelCase.slice(1)
}

/**
 * Create an identifier for a lens
 * @param originType Type the prop comes from
 * @param prop Prop to access
 */
export const createLensIdentifier = (originType: string, prop: string) =>
  `get${toTitleCase(prop)}From${toTitleCase(originType)}`

export const genLens = (originType: string, prop: string) => {
  const value = `const ${createLensIdentifier(
    originType,
    prop
  )} = Lens.fromProp<${originType}>()('${prop}')`
  return value
}

export const genCompositions = (rootTypeName: string, list: string[], ) => {
  const composed = list.reduce((prev, curr) => {
    if (!prev) return curr
    return `${prev}.compose(${curr})`
  }, '')
  const composedSplit = list[list.length - 1].split(/(?=[A-Z])/)
  const name = composedSplit[1]
  const value = `const select${name}From${rootTypeName} = ${composed}`
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
