// 单向链表的节点
class Node {
  constructor(element) {
    this.element = element
    this.next = null
  }
}

class LinkedList {
  constructor() {
    this.head = null
    this.size = 0
  }
  append(element) {
    const node = new Node(element)
    if (this.head === null) {
      this.head = node
    } else {
      const current = this.getNode(this.size - 1)
      current.next = node
    }
    this.size ++
  }
  appendAt(postion, element) {
    if(postion < 0 || postion > this.size) {
      throw new Error('postion outrange')
    }
    const node = new Node(element)
    if (postion === 0) {
      node.next = this.head
      this.head = node
    } else {
      let prev = this.getNode(postion - 1)
      node.next = prev.next
      prev.next = node
    }
    this.size ++ 
  }
  removeAt(postion) {
    if(postion < 0 || postion >= this.size) {
      throw new Error('postion outrange')
    }
    let current = this.head
    if (postion === 0) {
      this.head = current.next
    } else {
      let pre = this.getNode(postion - 1)
      current = pre.next
      pre.next = current.next
    }
    this.size--
  }
  indexof(element) {
    let current = this.head
    for (var i = 0 ; i<this.size; i++) {
      if (current.element === element) {
        return i
      }
      current = current.next
    }
  }
  getNode(index) {
    if(index < 0 || index >= this.size) {
      throw new Error('index outrange')
    }
    let current = this.head
    for (var i = 0 ; i<index; i++) {
      current = current.next
    }
    return current
  }
  reverse() {

  }
  removAll() {

  }
  isCiycle() {
    
  }
}


const linkedList = new LinkedList()
linkedList.append(1)
linkedList.append(2)
linkedList.append(3)
linkedList.append(4)
linkedList.appendAt(2, 2.5)
// console.log(linkedList)
console.dir(linkedList, {
  depth: 100
})


