/**
 * @author xiajing
 * @date 2019/8/21 14:53
 */
// 基类 调度
class Vue {
    constructor(options) {
        this.$el = options.el
        this.$data = options.data
        let computed = options.computed
        if (this.$el) {
            // 把数据全部转化成用Object.defineProperty来定义， 数据劫持
            new Observe(this.$data)
                // 把数据获取操作 vm上的取值操作 都代理到vm.$data
            for (let key in computed) { // 有依赖关系
                Object.defineProperty(this.$data, key, {
                    get: () => {
                        return computed[key].call(this)
                    }
                })
            }
            this.proxyVm(this.$data)
            new Compile(this.$el, this)
        }
    }
    proxyVm(data) {
        for (let key in data) { // {school: {name, age}}
            Object.defineProperty(this, key, {
                get() {
                    return data[key] // 进行了转化操作
                }
            })
        }
    }
}

// 观察者(发布订阅) 被观察者
// vm.$watch(vm, 'school.name', (newVal) => {})
class Dep {
    constructor() {
            this.subs = [] // 存放所有的watcher
        }
        // 订阅
    addSub(watcher) {
            this.subs.push(watcher)
        }
        // 发布
    notify() {
        this.subs.forEach(wacther => wacther.update())
    }
}
class Watcher {
    constructor(vm, expr, cb) {
        this.vm = vm
        this.expr = expr
        this.cb = cb
            // 默认先存放一个老值
        this.oldValue = this.get()
    }
    get() {
        Dep.target = this // 先把自己放在this上
            // 取值 把这个观察者和数据 关联起来
        let value = CommonUtils.getValue(this.vm, this.expr)
        Dep.target = null // 不取消，任何值取值 都会添加watcher
        return value
    }
    update() { // 数据变化后，会调用观察者的update方法
        let newValue = CommonUtils.getValue(this.vm, this.expr)
        if (newValue !== this.oldValue) {
            this.cb(newValue)
        }
    }
}

// 数据劫持
class Observe {
    constructor(data) {
        this.observer(data)
    }
    observer(data) {
        if (data && typeof data === 'object') {
            for (let key in data) {
                this.defineReactive(data, key, data[key])
                    // console.log(data, key, data[key])
                    // console.log(data[key])
            }
        }
    }
    defineReactive(obj, key, value) {
        this.observer(value)
            // flag 给每个属性都加上一个具有发布订阅的功能
        let dep = new Dep()
        Object.defineProperty(obj, key, {
            get() {
                // flag  创建wather时, 会取到对应的内容，并把wather放到全局上
                Dep.target && dep.addSub(Dep.target)
                return value
            },
            set: (newVal) => {
                if (value !== newVal) {
                    // 如果赋得值也是个对象的话，需要再次转化get,set方法
                    this.observer(newVal)
                    value = newVal
                        // flag
                    dep.notify()
                }
            }
        })
    }
}

class Compile {
    constructor(el, vm) {
        // 判断el属性是不是一个元素,如果不是元素,那就获取他
        this.el = this.isElementNode(el) ? el : document.querySelector(el)
            // console.log(this.el)
            // 把当前节点中的元素 获取到放到内存中
        let fragment = this.node2fragment(this.el)
            // console.log(fragment)
            // 把节点中的内容进行替换
            // 编译模板, 用数据编译
        this.vm = vm
        this.compile(fragment)
            // 把内容在塞到页面中
        this.el.appendChild(fragment)
    }
    node2fragment(node) { // 把节点移动到内存中
            let fragment = document.createDocumentFragment() // 创建一个文档碎片
            let firstChild
            while (firstChild = node.firstChild) {
                // console.log(firstChild)
                // console.log(firstChild.nodeType)
                fragment.appendChild(firstChild)
            }
            return fragment
        }
        // 用来编译内存中的dom节点
    compile(fragment) {
            // 拿到子节点，当前dom的第一层，并不包含li, {{school.name}}
            let childNodes = fragment.childNodes
                // console.log(childNodes)
            childNodes.forEach(child => {
                if (this.isElementNode(child)) {
                    this.compileElement(child)
                        // console.log('element', child)
                        // 如果是元素的话， 需要把自己传进去，在去遍历子节点
                    this.compile(child)
                } else {
                    this.compileText(child)
                        // console.log('text', child)
                }
            })
        }
        // 编译元素
    compileElement(el) {
            let attributes = el.attributes // 类数组
                // console.log(attributes)
            let arr = [...attributes]
            arr.forEach(attr => {
                    let { name, value: expr } = attr
                    // console.log(name)
                    // console.log(value)
                    if (this.isDirective(name)) { // 判断是否有v-model指令 v-html v-text v-bind
                        // console.log(el)
                        let [, directtive] = name.split('-')
                        CommonUtils[directtive](el, expr, this.vm)
                    }
                })
                // console.log(el)
                // console.log(this.vm)
        }
        // 判断是否有v-model
    isDirective(attrName) {
            return attrName.startsWith('v-model')
        }
        // 编译文本
    compileText(node) { // 判断当前文本节点中内容是否包含{{}}
        let content = node.textContent
        if (/\{\{(.+?)\}\}/.test(content)) {
            // console.log(content)
            const text = 'text'
            CommonUtils[text](node, content, this.vm)
        }
    }
    isElementNode(node) { // 是不是元素节点
        return node.nodeType === 1
    }
}

// 公用类
CommonUtils = {
    // 根据表达式获取到对应的数据
    getValue(vm, expr) { // vm.$data  school.name [school, name]
        // console.log(vm.$data)
        // console.log(expr)
        return expr.split('.').reduce((data, current) => {
            // console.log(data) school
            // console.log(current) name
            return data[current]
        }, vm.$data)
    },
    setValue(vm, expr, value) { // school.name 'xj'
        expr.split('.').reduce((data, current, index, arr) => {
            if (index === arr.length - 1) {
                data[current] = value
                return data[current]
            }
            return data[current]
        }, vm.$data)
    },
    /**
     * 解析v-model这个指令
     * @param node 节点 <input type="text" v-model='school.name'>
     * @param expr 表达式 school.name
     * @param vm 当前实例 this.vm.$data
     */
    model: function(node, expr, vm) {
        let fn = this.updater['modelUpdater']
            // flag 给输入框加一个观察者，如果数据更新会触发此方法, 会拿新值给输入框赋予值
        new Watcher(vm, expr, (newVal) => {
            fn(node, newVal)
        })
        node.addEventListener('input', (e) => {
            let value = e.target.value // 获取用户输入的内容
            this.setValue(vm, expr, value)
        })
        let value = this.getValue(vm, expr)
        fn(node, value)
    },
    html() {

    },
    // 遍历表达式，将内容重新替换成一个完成的内容，返回回去
    getContentValue(vm, expr) {
        return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            return this.getValue(vm, args[1])
        })
    },
    text: function(node, expr, vm) { // expr => {{a}} {{b}} {{c}}
        // console.log(node)
        // console.log(expr)
        let fn = this.updater['textUpdater']
        let content = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            // flag 给表达式每个{{}} 都加上观察者
            new Watcher(vm, args[1], (newVal) => {
                fn(node, this.getContentValue(vm, expr))
            })
            return this.getValue(vm, args[1])
        })
        fn(node, content)
    },
    updater: {
        // 把数据插入到节点中
        modelUpdater(node, value) {
            node.value = value
        },
        htmlUpdater() {},
        // 处理文本节点， 文本用textContent, 元素用value
        textUpdater(node, value) {
            node.textContent = value
        }
    }
}