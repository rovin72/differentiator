//Functions to create AST nodes/tokens
const num = (value) => ({kind: "num", value: value});
const constant = (value) => ({kind: "constant", value: value});
const vari = (value) => ({kind: "var", value: value});
const op = (value) => ({kind: "op", value: value});
const add = (left, right) => ({kind: "add", left: left, right: right});
const subtract = (left, right) => ({kind: "subtract", left: left, right: right});
const multiply = (left, right) => ({kind: "multiply", left: left, right: right});
const divide = (left, right) => ({kind: "divide", left: left, right: right});
const exponent = (base, power) => ({kind: "exponent", left: base, right: power});
const negate = (value) => ({kind: "negate", arg: value});
const func = (type, arg) => ({kind: "function", name: type, arg:arg});

export {num, constant, vari, op, add, subtract, multiply, divide, exponent, negate, func};
