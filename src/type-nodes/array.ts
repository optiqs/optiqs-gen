import ts from 'typescript'

export const isArrayTypeNode = (typeNode: ts.TypeNode): typeNode is ts.ArrayTypeNode | ts.TypeReferenceNode => {
  if (ts.isArrayTypeNode(typeNode)) return true
  else if (ts.isTypeReferenceNode(typeNode) && typeNode.typeName.getText() === 'Array') return true
  else return false
}

export const getArrayTypeParameters = (typeNode: ts.ArrayTypeNode | ts.TypeReferenceNode) => {
  if (ts.isArrayTypeNode(typeNode))
    return typeNode.elementType ? ts.createNodeArray([typeNode.elementType]) : undefined
  return typeNode.typeArguments
}
