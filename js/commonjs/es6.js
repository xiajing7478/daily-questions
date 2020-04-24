/**
 * @author xiajing
 * @date 2020/4/21 18:09
 */
var basicNum = 10
function add(a, b) {
	return a + b
}
setTimeout(() => {
	basicNum = 20
})
export {
	add,
	basicNum
}
