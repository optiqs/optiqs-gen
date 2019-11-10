export class Tree<T extends {id: string; children?: T[]}> {
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
    listFn: (list: string[]) => void,
    fn: (node: T) => string,
    node: T = this.root,
    list: string[] = []
  ) {
    if (node.id !== this.root.id)
      list.push(fn(node))
    if (node.children && node.children.length) {
      node.children.forEach(child => this.traversePaths(listFn, fn, child, list))
    }
    if (node.id !== this.root.id) {
      listFn(list)
      list.pop()
    }
  }

  addChild(child: T, insertNodeId: string = this.root.id) {
    this.traverseBF(node => {
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
