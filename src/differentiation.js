import {num, add, subtract, multiply, divide, exponent, func, negate}from "./ast.js";
import {dependsOn} from "./astUtils.js";

export function derive(tree, differentiatingVar="x"){
    //rules sum and difference product chain power trig ln exponentials
    const d=(tree)=>derive(tree, differentiatingVar);
    const derivative=tree;
    switch (derivative.kind) {
        case "num":
            return num(0);
        case "constant":
            return num(0);
        case "var":
            return num(derivative.value===differentiatingVar ? 1 : 0);
        case "add":
            return add(d(derivative.left), d(derivative.right));
        case "subtract":
            return subtract(d(derivative.left), d(derivative.right));
        case "multiply":
            if (!dependsOn(derivative.left, differentiatingVar)){
                return multiply(derivative.left, d(derivative.right));
            } 
            else if (!dependsOn(derivative.right, differentiatingVar)){
                return multiply(derivative.right, d(derivative.left));
            } 
            else {
                return add(multiply(d(derivative.left), derivative.right), multiply(d(derivative.right), derivative.left));
            }
        case "divide":
            if (!dependsOn(derivative.right, differentiatingVar)){
                return divide(d(derivative.left), derivative.right);
            }
            else if (!dependsOn(derivative.left, differentiatingVar)){
                return negate(divide(multiply(derivative.left, d(derivative.right)), exponent(derivative.right, num(2))));
            }
            else {
                return divide(subtract(multiply(d(derivative.left), derivative.right), multiply(d(derivative.right), derivative.left)), exponent(derivative.right, num(2)));
            }
        case "exponent":
            if (!dependsOn(derivative.right, differentiatingVar)){
                return multiply(multiply(derivative.right, exponent(derivative.left, subtract(derivative.right, num(1)))), d(derivative.left));
            } 
            else if (!dependsOn(derivative.left, differentiatingVar)){
                return multiply(multiply(func("ln", derivative.left), derivative), d(derivative.right));
            } 
            else {
                return multiply(derivative, add(multiply(d(derivative.right), func("ln", derivative.left)), divide(multiply(d(derivative.left), derivative.right), derivative.left)));
            }
        case "negate":
            return negate(d(derivative.arg))
        case "function":
            switch (derivative.name) {
                case "sin":
                    return multiply(func("cos", derivative.arg), d(derivative.arg));
                case "cos":
                    return multiply(negate(func("sin", derivative.arg)), d(derivative.arg));
                case "tan":
                    return multiply(exponent(func("sec", derivative.arg), num(2)), d(derivative.arg));
                case "sec":
                    return multiply(multiply(func("sec", derivative.arg), func("tan", derivative.arg)), d(derivative.arg));
                case "csc":
                    return multiply(negate(multiply(func("csc", derivative.arg), func("cot", derivative.arg))), d(derivative.arg));
                case "cot":
                    return multiply(negate(exponent(func("csc", derivative.arg), num(2))), d(derivative.arg));
                case "arcsin":
                    return divide(d(derivative.arg), func("sqrt", subtract(num(1), exponent(derivative.arg, num(2)))));
                case "arccos":
                    return negate(divide(d(derivative.arg), func("sqrt", subtract(num(1), exponent(derivative.arg, num(2))))));
                case "arctan":
                    return divide(d(derivative.arg), add(num(1), exponent(derivative.arg, num(2))));
                case "sqrt":
                    return divide(d(derivative.arg), multiply(num(2), func("sqrt", derivative.arg)));
                case "ln":
                    return divide(d(derivative.arg), derivative.arg);
                case "log":
                    return divide(d(derivative.arg), multiply(func("ln", num(10)), derivative.arg));
                default:
                    throw new Error("Unrecognised Function");
            }
        default:
            throw new Error("Unrecognised Token");
    }
}