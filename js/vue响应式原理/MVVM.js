class MVVM {
  constructor(options) {
    this.$data = options.data
    this.$el = options.el
    this.init()
    this.initDom()
  }
  init() {

  }
  initDom()
}

/**
 * 数据劫持
 */
class Observe {
  constructor(data) {
    this.observe(data)
  }
  observe(data) {
    if (data && typeof data === 'object') {
      for(let key in data) {
        this.defineReactive(data, key, data[key])
      }
    }
  }
  defineReactive(obj, key, value) {
    this.observe(data)
    Object.defineProperty(obj, {
      get() {
        return value
      },
      set(newVal) {
        if (value != newVal) {
          // 如果赋值还是一个对象的话，需要再次转化get,set方法
          this.observe(newVal)
          value = newVal
        }
      }
    })
  }
}
