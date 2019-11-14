export class Tree<T extends {propertyTypeName: string; children?: T[]}> {
  private root: T

  constructor(data: T) {
    this.root = data
  }

  traverseDF(fn: (_: T) => void, node: T = this.root) {
    node.children && node.children.forEach(child => this.traverseDF(fn, child))
    fn(node)
  }

  traverseBF(fn: (node: T) => void, node: T = this.root) {
    fn(node)
    node.children && node.children.forEach(child => this.traverseBF(fn, child))
  }

  traversePaths(
    listFn: (list: T[]) => void,
    node: T = this.root,
    path: T[] = []
  ) {
    if (node.propertyTypeName !== this.root.propertyTypeName)
      path.push(node)
    if (node.children && node.children.length) {
      node.children.forEach(child => this.traversePaths(listFn, child, path))
    }
    if (node.propertyTypeName !== this.root.propertyTypeName) {
      listFn(path)
      path.pop()
    }
  }

  addChild(child: T, insertNodeId: string = this.root.propertyTypeName) {
    this.traverseBF(node => {
      if (node.propertyTypeName === insertNodeId) {
        if (!node.children) {
          node.children = [child]
        } else {
          node.children.push(child)
        }
      }
    })
  }
}
