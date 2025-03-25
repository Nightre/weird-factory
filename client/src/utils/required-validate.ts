export default (msg: string) => (value: string) => (value && value.length > 0) || msg

