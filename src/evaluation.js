const funcTable=
{
    "sin": Math.sin,
    "cos": Math.cos,
    "tan": Math.tan,
    "sec": (arg)=>1/Math.cos(arg),
    "csc": (arg)=>1/Math.sin(arg),
    "cot": (arg)=>1/Math.tan(arg),
    "arcsin": Math.asin,
    "arccos": Math.acos,
    "arctan": Math.atan,
    "ln": Math.log,
    "log": Math.log10,
    "sqrt": Math.sqrt
}
const constTable = {
    "pi":Math.PI,
    "e":Math.E
}

export function evaluate(expression, substitutions={}){
    switch (expression.kind) {
        case "num":
            return expression.value;
        case "var":
            if (expression.value in substitutions){
                return substitutions[expression.value];
            } 
            else {
                throw new Error("Var not substituted for");
            }
        case "constant":
            return constTable[expression.value];
        case "add": {
            const left=evaluate(expression.left, substitutions);
            const right=evaluate(expression.right, substitutions);
            return left+right;
        }
        case "subtract":{
            const left=evaluate(expression.left, substitutions);
            const right=evaluate(expression.right, substitutions);
            return left-right;
        }
        case "multiply":{
            const left=evaluate(expression.left, substitutions);
            const right=evaluate(expression.right, substitutions);
            return left*right;
        }
        case "divide":{
            const left=evaluate(expression.left, substitutions);
            const right=evaluate(expression.right, substitutions);
            return left/right;
        }
        case "exponent":{
            const left=evaluate(expression.left, substitutions);
            const right=evaluate(expression.right, substitutions);
            return Math.pow(left,right);
        }
        case "negate":{
            return -evaluate(expression.arg, substitutions);
        }
        case "function":{
            return funcTable[expression.name](evaluate(expression.arg,substitutions));
        }
        default:
            throw new Error("Unrecognised Type");
    }
}