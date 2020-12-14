class Observer {
  constructor(data) {
    // 如果不是对象，直接返回
    if (!data || typeof data !== 'object') {
      return
    }
    this.data = data
    this.walk()
  }
  walk() { // 对传入的数据进行数据劫持
    for (let key in this.data) {
      this.defineReactive(this.data, key, this.data[key])
    }
  }
  defineReactive(obj, key, val) {
    const dep = new Dep() // 创建当前属性的发布者
    new Observer(val) // val的值可能还是一个对象，递归遍历
    Object.defineProperty(obj, key, {
      get() {
        // 如果当前有对该属性的依赖项,则加入到发布者的订阅队列中
        if (Dep.target) {
          dep.addSub(Dep.target)
        }
        return val
      },
      set(newVal) {
        if (val === newVal) {
          return
        }
        val = newVal
        new Observer(newVal)
        dep.notify()
      }
    })
  }
}

/**
 * 发布者
 * 将依赖该属性的watcher都加入subs数组，当该属性改变的时候，则调用所有依赖该属性的watcher的更新函数，触发更新。
 */
class Dep {
  constructor() {
    this.subs = []
  }
  addSub(sub){
    if (this.subs.indexOf(sub) < 0) {
      this.subs.push(sub)
    }
  }
  notify() {
    this.subs.forEach((sub) => {
      sub.update()
    })
  }
}
Dep.target = null

/**
 * 观察者
 */
class Watcher {
  constructor(vm, keys, updateCb) {
    this.vm = vm
    this.keys = keys
    this.updateCb = updateCb
    this.value = null
    this.get()
  }
  get() { // 根据vm和keys获取最新的观察值
    // 将Dep的依赖项设置为当前的watcher,并且根据传入的keys遍历获取到最新值。
    // 在这个过程中，由于会调用observer对象属性的getter方法，因此在遍历过程中这些对象属性的发布者就将watcher添加到订阅者队列里。
    // 因此，当这一过程中的某一对象属性发生变化的时候，则会触发watcher的update方法
    Dep.target = this
    const keys = this.keys.split('.')
    let value = this.vm
    keys.forEach(_key => {
      value = value[_key]
    })
    this.value = value
    Dep.target = null
    return this.value
  }
  update() {
    const oldValue = this.value
    const newValue = this.get()
    if (oldValue !== newValue) {
      this.updateCb(oldValue, newValue)
    }
  }
}


class MVVM {
  constructor({data, el}) {
    this.data = data
    this.el = el
    this.init()
    this.initDom()
  }
  init() {
    new Observer(this.data) // 对this.data进行数据劫持
    // 传入的el可以是selector， 也可以是元素, 因此要做一层处理，保证this.$el的值是一个元素节点
    this.$el = this.isElementNode(this.el) ? this.el : document.querySelector(this.el)
    // 将this.data的属性都绑定到this上，这样用户就可以直接通过this.xxx来访问this.data.xxx的值
    for (let key in this.data) {
      this.defineReactive(key)
    }
  }
  initDom() {
    const fragment = this.node2Fragment()
    this.compile(fragment)
    document.body.appendChild(fragment)
  }
  // 将节点转为fragment,通过fragment来操作DOM，可以获得更高的效率
  // 因为如果直接操作DOM节点的话，每次修改DOM都会导致DOM的回流或重绘，而将其放在fragment里，修改fragment不会导致DOM回流和重绘
  // 当在fragment一次性修改完后，在直接放回到DOM节点中
  node2Fragment() {
    const fragment = document.createDocumentFragment()
    let firstChild
    while (firstChild = this.$el.firstChild) {
      fragment.appendChild(firstChild)
    }
    return fragment
  }
  defineReactive(key) {
   Object.defineProperty(this, key, {
     get() {
       return this.data[key]
     },
     set(newVal) {
       this.data[key] = newVal
     }
   })
  }
  // 是否是属性节点
  isElementNode(node) {
    return node.nodeType === 1
  }

  compile(node) {
    if (this.isElementNode(node)) {
      // 如果元素节点, 则遍历它额属性, 编译其中的指令
      const attrs = node.attributes
      Array.prototype.forEach.call(attrs, (attr) => {
        if (this.isDirective(attr)) {
          CompileUtils.compileModelAttr(this.data, node, attr)
        }
      })
    }
    // 若节点有子节点的话，则对子节点进行编译
    if (node.childNodes && node.childNodes.length > 0) {
      Array.prototype.forEach.call(node.childNodes, (child) => {
        this.compile(node)
      })
    }
  }
  isDirective(attr) {
    // 检测属性是否是指令(vue的指令是v-开头)
    return attr.nodeName.indexOf('v-') >= 0
  }
}

const CompileUtils = {
  compileModelAttr(vm, node, attr) {

  }
}

// let data = {
//   name: 'xiajing',
//   info: {
//     grade: '高三',
//     age: 18
//   }
// }

// new Observer(data)
// // 侦听data对象的name属性，dang data.name发生变化时候, 触发cb回调函数
// new Watcher(data, 'name', (oldValue, newValue) => {
//   console.log('oldValue', oldValue)
//   console.log('newValue', newValue)
// })
// data.name = 'zhangqin'
// new Watcher()



