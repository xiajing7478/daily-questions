    /**
     * https://www.cnblogs.com/kidney/p/6052935.html
     * 1.输入框以及文本节点与data中的数据绑定
     * 2.输入框内容变化时，data中的数据同步变化。即 view => model 的变化。
     * 3.data中的数据变化时，文本节点的内容同步变化。即 model => view 的变化。
     **/

    class Vue {
        constructor(options) {
            this.el = options.el
            this.data = options.data
            new Observe(this.data)
            new Compile(this.el, this)
        }
    }
    // 观察者模式 被观察者
    class Dep {
        constructor() {
            this.subs = []
        }
        addSub(sub) {
            this.subs.push(sub)
        }
        notify() {
            this.subs.forEach(sub => {
                sub.update()
            })
        }
    }

    // 观察者
    class Watcher {
        constructor(vm, expr, cb) {
            this.vm = vm
            this.expr = expr
            this.cb = cb
            this.oldValue = this.get()
        }
        get() {
            Dep.target = this
            let value = Utils.getValue(this.vm, this.expr)
            Dep.target = null
            return value
        }
        update() {
            let newValue = Utils.getValue(this.vm, this.expr)
            if (newValue !== this.oldValue) {
                this.cb(newValue)
            }
        }
    }

    class Observe {
        constructor(data) {
            this.observe(data)
        }
        observe(data) {
            if (data && typeof data === 'object') {
                for (let key in data) {
                    this.defineReactive(data, key, data[key])
                }
            }
        }
        defineReactive(obj, key, value) {
            // 如果这个value还是一个对象的话，递归遍历
            this.observe(value)
            Object.defineProperty(obj, key, {
                get() {
                    return value
                },
                set(newVal) {
                    if (value !== newVal) {
                        value = newVal
                    }
                }
            })
        }
    }

    class Compile {
        constructor(el, vm) {
            this.el = this.isElementNode(el) ? el : document.querySelector(el)
            this.vm = vm
            let fragment = this.node2fragment(this.el)
            this.compile(fragment)
                // 把内容在塞到页面中
            this.el.appendChild(fragment)
        }

        // 把内存中的节点内容进行替换，编译模板，用vm.data里面数据
        compile(node) {
            let childNodes = node.childNodes || []
            childNodes.forEach(child => {
                if (this.isElementNode(child)) {
                    this.compileElement(child)
                    this.compile(child)
                } else {
                    this.compileText(child)
                }
            })
        }
        compileText(node) {
            let expr = node.textContent // {{msg}}
            let reg = /\{\{(.+?)\}\}/g
            if (reg.test(expr)) {
                let val = RegExp.$1
                Utils.text(node, expr, val, this.vm)
            }
        }
        compileElement(el) {
            let attributes = el.attributes
            let arr = [...attributes]
            arr.forEach(attr => {
                let { name, value: expr } = attr
                if (this.isDirective(name)) {
                    let [, directive] = name.split('-')
                    Utils[directive](el, expr, this.vm)
                }
            })
        }

        // 把所有的节点放到内存中
        node2fragment(node) {
            let fragment = document.createDocumentFragment()
            let firstChild
            while (firstChild = node.firstChild) {
                fragment.appendChild(firstChild)
            }
            return fragment
        }
        isElementNode(node) {
            return node.nodeType === 1
        }
        isDirective(expr) {
            return expr.startsWith('v-model')
        }
    }

    var Utils = {
        model: function(node, expr, vm) {
            node.addEventListener('input', (e) => {
                let value = e.target.value.trim()
                this.setValue(vm, expr, value)
            })
            let value = this.getValue(vm, expr)
            this.updateElement(node, value)
        },
        text: function(node, expr, name, vm) {
            let content = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
                return this.getValue(vm, args[1])
            })
            this.updateText(node, content)
                // node.nodeValue = this.getValue(vm, name)
        },
        getValue(vm, expr) {
            return expr.split('.').reduce((data, current) => {
                return data[current]
            }, vm.data)
        },
        setValue(vm, expr, value) {
            return expr.split('.').reduce((data, current, index, arr) => {
                if (index == arr.length - 1) {
                    data[current] = value
                    return data[current]
                }
                return data[current]
            }, vm.data)
        },
        updateElement: function(node, value) {
            node.value = value
        },
        updateText: function(node, nodeValue) {
            node.nodeValue = nodeValue
        }
    }