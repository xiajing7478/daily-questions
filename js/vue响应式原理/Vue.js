    /**
     * https://www.cnblogs.com/kidney/p/6052935.html
     * 1.输入框以及文本节点与data中的数据绑定
     * 2.输入框内容变化时，data中的数据同步变化。即 view => model 的变化。
     * 3.data中的数据变化时，文本节点的内容同步变化。即 model => view 的变化。
     * 
     * 
     * 每当 new 一个 Vue，主要做了两件事：第一个是监听数据：observe(data)，第二个是编译 HTML：nodeToFragement(id)。
     * 在监听数据的过程中，会为 data 中的每一个属性生成一个主题对象 dep。
     * 在编译 HTML 的过程中，会为每个与数据绑定相关的节点生成一个订阅者 watcher，watcher 会将自己添加到相应属性的 dep 中。
     * 我们已经实现：修改输入框内容 => 在事件回调函数中修改属性值 => 触发属性的 set 方法。
     * 接下来我们要实现的是：发出通知 dep.notify() => 触发订阅者的 update 方法 => 更新视图。
     * 这里的关键逻辑是：如何将 watcher 添加到关联属性的 dep 中。
     * 
     * 
     * 
     * 总结：
     * 1.定义Vue对象，声明vue的data里面的属性值，准备初始化触发observe方法
     * 2.在Observe定义过响应式方法Object.defineProperty()的属性，在初始化的时候，通过Watcher对象进行addDep的操作。
     * 即每定义一个vue的data的属性值，就添加到一个Watcher对象到订阅者里面去。
     * 3.每当形成一个Watcher对象的时候，去定义它的响应式。即Object.defineProperty()定义。
     * 这就导致了一个Observe里面的getter&setter方法与订阅者形成一种依赖关系。
     * 4.由于依赖关系的存在，每当数据的变化后，会导致setter方法，从而触发notify通知方法，通知订阅者我的数据改变了，你需要更新。
     * 5.订阅者会触发内部的update方法，从而改变vm实例的值，以及每个Watcher里面对应node的nodeValue，即视图上面显示的值。
     * 6.Watcher里面接收到了消息后，会触发改变对应对象里面的node的视图的value值，而改变视图上面的值。
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
                // 取值 把这个观察者和数据 关联起来
            let value = Utils.getValue(this.vm, this.expr)
            Dep.target = null // 不取消，任何值取值 都会添加watcher
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
                // 给每个属性都加上一个具有发布订阅的功能
            let dep = new Dep()
            Object.defineProperty(obj, key, {
                get() {
                    // 创建watcher时, 会取到对应的内容，并把watcher放到全局上
                    Dep.target && dep.addSub(Dep.target)
                    return value
                },
                set: (newVal) => {
                    if (value !== newVal) {
                        // 如果赋得值也是个对象的话，需要再次转化get,set方法
                        this.observe(newVal)
                        value = newVal
                        dep.notify()
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
            new Watcher(vm, expr, (newVal) => {
                this.updateElement(node, newVal)
            })
            node.addEventListener('input', (e) => {
                let value = e.target.value.trim()
                this.setValue(vm, expr, value)
            })
            let value = this.getValue(vm, expr)
            this.updateElement(node, value)
        },
        text: function(node, expr, name, vm) {
            let content = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
                new Watcher(vm, args[1], (newVal) => {
                    this.updateText(node, this.getContentValue(vm, expr))
                })
                return this.getValue(vm, args[1])
            })
            this.updateText(node, content)
                // node.nodeValue = this.getValue(vm, name)
        },
        getContentValue(vm, expr) {
            return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
                return this.getValue(vm, args[1])
            })
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