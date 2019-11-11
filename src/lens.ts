import ts from 'typescript'
import {Tree} from './tree'
import {isArrayTypeNode, getArrayTypeParameters} from './type-nodes'

export interface LensNode {
  readonly id: string
  readonly kind: 'lens' | 'traversal' | 'fold'
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

export const genCompositions = (rootTypeName: string, path: LensNode[]) => {
  const composed = path.reduce<string>((prev, curr) => {
    const currValue = createLensIdentifier(curr.parentId, curr.propName)
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
      kind: 'lens',
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
    if (valueDeclaration && ts.isPropertySignature(valueDeclaration) && valueDeclaration.type) {
      const typeNode = valueDeclaration.type
      if (!typeNode || !ts.isTypeNode(typeNode)) return
      if (isArrayTypeNode(typeNode)) {
        const params = getArrayTypeParameters(typeNode)
        if (params) {
          tree.addChild(
            {
              id: params[0].getText(),
              kind: 'traversal',
              propName: getPropName(valueDeclaration),
              parentId: symbol.name
            },
            symbol.name
          )
          const type = checker.getTypeFromTypeNode(params[0])
          if (type.symbol) {
            buildTree(checker, type.symbol, tree)
          }
        }
      } else {
        tree.addChild(
          {
            id: typeNode.getText(),
            kind: 'lens',
            propName: getPropName(valueDeclaration),
            parentId: symbol.name
          },
          symbol.name
        )
        const type = checker.getTypeFromTypeNode(typeNode)
        if (type.symbol) {
          buildTree(checker, type.symbol, tree)
        }
      }
    }
  })
  return tree
}
