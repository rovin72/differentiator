import {num, add, multiply, divide, exponent, func}from "./ast.js";
import {isSame} from "./astUtils.js";

export function simplify(derivative){
    switch (derivative.kind){
        case "num":
        case "constant":
        case "var":
            return derivative;
        case "function": {
            const arg = simplify(derivative.arg);
            switch (derivative.name) {
                case "sin":
                    if (arg.kind==="num"){
                        if (arg.value===0){
                            return num(0)
                        }
                    } else if (arg.kind==="constant"){
                        if (arg.value==="pi"){
                            return num(0)
                        }
                    }
                    return func("sin", arg);
                case "cos":
                    if (arg.kind==="num"){
                        if (arg.value===0){
                            return num(1)
                        }
                    } else if (arg.kind==="constant"){
                        if (arg.value==="pi"){
                            return num(-1)
                        }
                    }
                    return func("cos",arg);
                case "tan": //tan is its own case incase special angles get added in the future
                    if (arg.kind==="num"){
                        if (arg.value===0){
                            return num(0)
                        }
                    } else if (arg.kind==="constant"){
                        if (arg.value==="pi"){
                            return num(0)
                        }
                    }
                    return func("tan",arg);
                case "sec":
                    if (arg.kind==="num"){
                        if (arg.value===0){
                            return num(1)
                        }
                    } else if (arg.kind==="constant"){
                        if (arg.value==="pi"){
                            return num(-1)
                        }
                    }
                    return func("sec",arg);
                case "ln":
                    if (arg.kind==="num"){
                        if (arg.value===1){
                            return num(0)
                        }
                    }
                    else if (arg.kind==="constant"){
                        if (arg.value==="e"){
                            return num(1)
                        }
                    }
                    return func("ln",simplify(arg));
                case "log":
                    if (arg.kind==="num"){
                        if (arg.value===1){
                            return num(0)
                        }
                    }
                    return func("log",simplify(arg));
                case "sqrt":
                    if (arg.kind==="num"){
                        if (Number.isInteger(Math.sqrt(arg.value))){
                            return num(Math.sqrt(arg.value));
                        }
                    }
                    return func("sqrt",arg);
                default:
                    return func(derivative.name,arg);
            }
        }
        case "add": {
            const left = simplify(derivative.left);
            const right = simplify(derivative.right);
            if (left.kind==="num" && right.kind==="num"){
                return num(left.value+right.value);
            }
            else if (left.kind==="num"){
                if (left.value===0){
                    return right;
                }
            } 
            else if (right.kind==="num"){
                if (right.value===0){
                    return left;
                }
            }
            return add(left, right);
        }
        case "subtract": {
            const left = simplify(derivative.left);
            const right = simplify(derivative.right);
            if (left.kind==="num" && right.kind==="num"){
                return num(left.value-right.value);
            }
            else if (left.kind==="num"){
                if (left.value===0){
                    return multiply(num(-1), right);
                }
            } 
            else if (right.kind==="num"){
                if (right.value===0){
                    return left;
                }
            }
            if (isSame(left,right)){
                return num(0);
            }
            return add(left, multiply(num(-1),right));
        }
        case "multiply": {
            const left = simplify(derivative.left);
            const right = simplify(derivative.right);
            if (left.kind==="num"&&right.kind==="num"){
                return num(left.value*right.value);
            }
            else if (left.kind==="num"){
                if (left.value===1){
                    return right;
                } 
                else if (left.value===0){
                    return num(0);
                } 
            } //TODO: Add rules for multiplication to simplify 2*x*2 probs need to also
            else if (right.kind==="num"){
                if (right.value===1){
                    return left;
                }
                else if (right.value===0){
                    return num(0);
                } 
                else if (right.value===-1){
                    return multiply(num(-1),left);
                }
            }
            if (left.kind==="divide" && right.kind==="divide"){
                return simplify(divide(multiply(left.left, right.left), multiply(left.right, right.right)));
            }
            else if (left.kind==="divide"){
                return simplify(divide(multiply(right, left.left), left.right));
            } else if (right.kind==="divide"){
                return simplify(divide(multiply(left, right.left),right.right));
            }
            return multiply(left, right);
        }
        case "divide": {
            const left = simplify(derivative.left);
            const right = simplify(derivative.right);
            if (left.kind==="num"&&right.kind==="num"){
                if (right.value===0){
                    throw new Error("Division by zero");
                }
                if (left.value===right.value){
                    return num(1);
                }
                else if (left.value===0){
                    return num(0);
                }
                else if (right.value===1){
                    return left;
                }
                else if (right.value===-1){
                    return num(-left.value);
                }
                else if (left.value%right.value===0){
                    return num(left.value/right.value);
                }
            }
            else if (right.kind==="num"){
                if (right.value===1){
                    return left;
                }
                else if (right.value===0){
                    throw new Error("Division by zero");
                }
                else if (right.value===-1){
                    return multiply(num(-1),left);
                }
            }
            else if (left.kind==="num"){
                if (left.value===0){
                    return num(0);
                }
            }
            if (isSame(left,right)){
                return num(1);
            }
            return divide(left,right);
        }
        case "exponent": {
            const left=simplify(derivative.left);
            const right=simplify(derivative.right);
            if (left.kind==="num" && right.kind==="num"){
                if (right.value>=0 && Number.isInteger(right.value)){
                    return num(Math.pow(left.value, right.value));
                }
                else if (right.value==-1 && left.value!==0){
                    return divide(num(1), left);
                } 
                else if (right.value<-1 && left.value!==0 && Number.isInteger(right.value)){
                    return divide(num(1), num(Math.pow(left.value,-right.value)));
                }
            }
            else if (right.kind==="num"){
                if (right.value===1){
                    return left;
                }
                else if (right.value===0){
                    return num(1);
                }
                else if (right.value<0){
                    return divide(num(1),exponent(left, num(-right.value)));
                }
            }
            else if (left.kind==="num"){
                if (left.value===1){
                    return num(1);
                }
            }
            return exponent(left,right);
        }
        case "negate": {
            const arg =simplify(derivative.arg);
            if (arg.kind==="num"){
                return num(-arg.value);
            }
            return multiply(num(-1),arg);
        }
        default:
            throw new Error("Unrecognised AST NODE");
    }
}

export function collectTerms(expression){
    const plus=(term1, term2)=>num(term1.value+term2.value);
    const collectExp=(oldPower,newPower)=>(simplify(collectTerms(add(oldPower,newPower))))

    function addTermToGroup(group, term, addingVal, operation=plus){
        let Added=false;
        for (let key of group.keys()){
            if (isSame(key, term)){
                group.set(key, operation(group.get(key),addingVal));
                Added=true;
                break;
            }
        }
        if (!Added){
            group.set(term, addingVal);
        }
    }
    
    

    switch (expression.kind) {
        case "num":
        case "var":
        case "constant":
            return expression;
        case "function":
            return func(expression.name, collectTerms(expression.arg));
        case "add": {
            const addends=flatten(expression, "add");
            const simplifiedAddends=[];
            for (let addend of addends){
                simplifiedAddends.push(collectTerms(addend));
            }
            const groupedAddends = new Map();
            for (let addend of simplifiedAddends){
                switch (addend.kind) {
                    case "num":
                        groupedAddends.set("nums", (groupedAddends.get("nums")||0)+addend.value);
                        break;
                    case "multiply":{
                        const factors=flatten(addend, "multiply");
                        const noncoeff=[];
                        let coeff=1;
                        for (let factor of factors){
                            if (factor.kind==="num"){
                                coeff*=factor.value;
                            }
                            else {
                                noncoeff.push(factor);
                            }
                        }
                        const term=unflatten(noncoeff, multiply)
                        addTermToGroup(groupedAddends, term, num(coeff));
                        break;
                    }
                    case "constant":
                    case "var":
                    case "function":
                    case "divide":
                    case "exponent":  
                    default:
                        addTermToGroup(groupedAddends, addend, num(1));
                        break;

                }
            }
            const termList=[];
            for (let [term, coeff] of groupedAddends.entries()){
                if (term==="nums"){
                    continue;
                } else if (isSame(coeff,num(0))){
                    continue;
                } else if (isSame(coeff,num(1))){
                    termList.push(term);
                } else {
                    termList.push(multiply(coeff, term));
                }
            }
            if((groupedAddends.get("nums")||0)!==0){
                termList.push(num(groupedAddends.get("nums")));
            }
            return unflatten(termList,add);
        }

        case "multiply": {
            const factors=flatten(expression, "multiply");
            const simplifiedFactors=[];
            for (let factor of factors){
                simplifiedFactors.push(collectTerms(factor));
            }
            const groupedFactors = new Map();
            for (let factor of simplifiedFactors){
                switch (factor.kind) {
                    case "num":
                        groupedFactors.set("nums", (groupedFactors.get("nums") ?? 1)*factor.value);
                        break;
                    case "exponent":
                        addTermToGroup(groupedFactors, factor.left, factor.right, collectExp);
                        break;
                    case "var":
                    case "divide":
                    case "constant":
                    case "function":
                    case "add": 
                    default:
                        addTermToGroup(groupedFactors, factor, num(1), collectExp);
                        break;
                }
            }
            const termList=[];
            if (groupedFactors.get("nums")===0){
                return num(0);
            }
            else if((groupedFactors.get("nums") ?? 1)!==1){
                termList.push(num(groupedFactors.get("nums")));
            }
            for (let [term, coeff] of groupedFactors.entries()){
                if (term==="nums"){
                    continue;
                } else if (isSame(coeff,num(0))){
                    continue;
                } else if (isSame(coeff,num(1))){
                    termList.push(term);
                } else {
                    termList.push(exponent(term,coeff));
                }
            }
            return unflatten(termList,multiply);
        }
        case "divide":
            return divide(collectTerms(expression.left),collectTerms(expression.right));
        case "exponent":
            return exponent(collectTerms(expression.left),collectTerms(expression.right));
        default:
            throw new Error("Unrecognised node type");
    }
}

function flatten(expression, type){
    let currentList=[];
    if (expression.kind===type){
        const left=flatten(expression.left,type);
        const right=flatten(expression.right,type);
        currentList=[...left,...right];
        return currentList;
    }
    else {
        currentList.push(expression);
        return currentList;
    }
}

function unflatten(expressionList, type){
    if (expressionList.length===0){
        if (type === add){
            return num(0);
        } else if (type === multiply){
            return num(1);
        }
    } else if (expressionList.length===1){
        return expressionList[0];
    } else {
        return type(unflatten(expressionList.slice(0,-1),type),expressionList.slice(-1)[0]);
    }
}