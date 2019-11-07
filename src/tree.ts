export class Tree<T extends {id: string; children?: T[]}> {
  private root: T

  constructor(data: T) {
    this.root = data
  }

  treeTraverseDF(fn: (_: T) => void, node: T = this.root) {
    node.children && node.children.forEach(child => this.treeTraverseDF(fn, child))
    fn(node)
  }

  treeTraverseBF(fn: (_: T) => void, node: T = this.root) {
    fn(node)
    node.children && node.children.forEach(child => this.treeTraverseBF(fn, child))
  }

  addChild(child: T, insertNodeId: string = this.root.id) {
    this.treeTraverseBF(node => {
      if (node.id === insertNodeId) {
        if (!node.children) {
          node.children = [child]
        } else {
          node.children.push(child)
        }
      }
    })
  }
}
