export default (msg: string, min = -Infinity, max = Infinity) => 
    (value: string) => {
        if (value && (value.length > max || value.length < min)) {
            if (min != -Infinity && max != Infinity) {
                return `${msg}长度必须在 ${min}-${max} 个字符之间`
            } else if (min != -Infinity) {
                return `${msg}长度必须大于 ${min} 个字符`
            } else if (max != Infinity) {
                return `${msg}长度必须小于 ${max} 个字符`
            }
        }
        return true
    }

