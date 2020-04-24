/**
 * @author xiajing
 * @date 2020/4/21 17:37
 */
var basicNum = 10
function add(a, b) {
	return a + b
}
var obj = { num : 100 }
setTimeout(() => {
	basicNum = 20
	obj = { num: 200 }
}, 200)

// 在这里写上需要向外暴露的函数、变量
module.exports = {
	obj: obj,
	add: add,
	basicNum: basicNum
}

// exports.basicNum = basicNum
// exports.add = add
// exports.obj = obj

