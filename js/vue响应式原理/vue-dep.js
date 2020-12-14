class Dep {
  constructor() {
    this.subs = []
  }
  addSub(newSub) {
    this.subs.push(newSub)
  }
  notify() {
    this.subs.forEach((sub) => {
      sub.update()
    })
  }
}

const dep = new Dep()
const sub1 = {
  update() {
    console.log('sub1 update.........')
  }
}
const sub2 = {
  update() {
    console.log('sub2 update.........')
  }
}
dep.addSub(sub1)
dep.addSub(sub2)

dep.notify()
