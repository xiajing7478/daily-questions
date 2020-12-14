const obj = {}

let val = 'xia'

Object.defineProperty(obj, 'name', {
	get() {
		return val
	},
	set(v) {
		val = v
	}
})

console.log(obj.name)
obj.name = 'jing'
console.log(obj.name)
