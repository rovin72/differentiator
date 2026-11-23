function dependsOn(node, v){
    switch (node.kind) {
        case "constant":
        case "num": return false;
        case "var": return node.value===v;
        case "negate":
        case "function": return dependsOn(node.arg,v);
        default:
            return (dependsOn(node.left,v)||dependsOn(node.right,v));
    }
}

function isSame(expression1, expression2){
    if (expression1.kind===expression2.kind){
        switch (expression1.kind) {
            case "num":
            case "var":
            case "constant":
                return expression1.value===expression2.value;
            case "negate":
                return isSame(expression1.arg,expression2.arg);
            case "function":
                if (expression1.name===expression2.name){
                    return isSame(expression1.arg,expression2.arg);
                }
                else{
                    return false;
                }
            case "add":
            case "subtract":
            case "multiply":
            case "divide":
            case "exponent":
                return (isSame(expression1.left,expression2.left) && isSame(expression1.right, expression2.right));
            default:
                return false;
        }
    }
    else {
        return false;
    }
}

function varList(expression){
    switch (expression.kind) {
        case "num":
        case "constant":
            return []
        case "add":
        case "subtract":
        case "multiply":
        case "divide":
        case "exponent":
            return [...varList(expression.left),...varList(expression.right)];
        case "function":
        case "negate":
            return varList(expression.arg);
        case "var":
            return [expression.value]
        default:
            throw new Error("AST Type not found");
    }
} //make return a set of unique variables instead of a list with duplicates

export {dependsOn, isSame, varList};