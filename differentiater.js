const userInput=document.getElementById("userInput");
const button=document.getElementById("Confirm");

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

function main() {
    const userText=userInput.value.toLowerCase();
    const userMath=parseText(userText);
    const derivative=derive(userMath);
    console.log(derivative);
    let simplified=simplify(derivative);
    console.log(simplified);
    let prevSimplified;
    let iterations=0;
    const maxIterations=10;
    do {
        prevSimplified=simplified;
        simplified=simplify(collectTerms(simplified));
        iterations++
    } while (!isSame(prevSimplified,simplified) && iterations<maxIterations);
    console.log(simplified);
    if (iterations>=maxIterations){
        console.error("simplifying took too long");
    }

}

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

function tokenise(text){
    text=text.replace(/\s+/g,"");
    const operations=["+","-","*","/","^"];
    const tokens = [];
    let pos=0;
    const digitRegex=/^[0-9]+(\.[0-9]+)?/;
    const functionRegex=/^(sin|cos|tan|sec|csc|cot|log|sqrt|ln|arcsin|arccos|arctan)/;
    const constantsRegex=/^(pi|e)/;
    while (pos<text.length){
        let numStr="";
        let funcStr="";
        if (text.slice(pos).match(functionRegex)){
            funcStr=text.slice(pos).match(functionRegex)[0];
        }
        if (text.slice(pos).match(constantsRegex)){
            numStr=text.slice(pos).match(constantsRegex)[0];
        }
        if (text.slice(pos).match(digitRegex)){
            numStr=text.slice(pos).match(digitRegex)[0];
        }
        if (numStr!==""){
            if (numStr==="pi"||numStr==="e"){
                tokens.push(constant(numStr));
            }
            else {
                tokens.push(num(parseFloat(numStr)));
            }
            pos+=numStr.length;
        }
        else if (funcStr!==""){
            tokens.push({kind: "function", name: funcStr})
            pos+=funcStr.length;
        }
        else if (operations.includes(text[pos])) {
            tokens.push(op(text[pos]));
            pos++;
        }
        else if (text[pos]==="("){
            tokens.push({kind: "lparen"});
            pos++;
        }
        else if (text[pos]===")"){
            tokens.push({kind: "rparen"});
            pos++;
        }
        else if (text[pos].match(/[a-zA-Z]/)){
            tokens.push(vari(text[pos]));
            pos++;
        }
        else {
            throw new Error("Symbol at position "+pos+" is unknown");
        }
    }
    return tokens;
}

class TokenParser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    advance() {
        if (this.pos>=this.tokens.length){
            throw new Error("No more tokens to advance to");
        } 
        else {
            return this.tokens[this.pos++];
        }

    }

    peek() {
        return this.tokens[this.pos];
    }

    isOp(operation){
        const currentToken=this.peek();
        if(currentToken && currentToken.kind==="op" && currentToken.value===operation){
            return true;
        }

        return false;
    }

    startsOp(){
        const currentToken=this.peek();
        if(currentToken && (currentToken.kind==="num"|| currentToken.kind==="var"||currentToken.kind==="lparen"||currentToken.kind==="function"||currentToken.kind==="constant")){
            return true;
        }
        return false;
    }

    parseSum(){
        let left=this.parseProduct();
        while (this.isOp("+")||this.isOp("-")){
            const operator=this.advance();
            const right=this.parseProduct();
            left=operator.value === "+" ? add(left, right) : subtract(left, right);
        }
        return left;
    }

    parseProduct(){
        let left=this.parseUnary();
        while (this.isOp("*")||this.isOp("/")||this.startsOp()){
            if (this.startsOp()){
                left=multiply(left, this.parseExponent());// Implicit multiplication
            } else {
                const operator=this.advance();
                const right=this.parseUnary();
                left=operator.value === "*" ? multiply(left, right) : divide(left, right);
            }
        }
        return left;
    }

    parseUnary(){
        if (this.isOp("-")){
            this.advance();
            return negate(this.parseUnary());
        }
        return this.parseExponent();
    }

    parseExponent(){
        let left=this.parseFactor();
        if (this.isOp("^")) {
            this.advance();
            left=exponent(left, this.parseUnary());
        }
        return left;
    }

    parseFactor(){
        const shiftTok=this.advance();
        if (shiftTok.kind==="num" || shiftTok.kind==="var" || shiftTok.kind==="constant"){
            return shiftTok;
        }
        else if (shiftTok.kind==="function"){
            const open=this.advance();
            if (open.kind!=="lparen"){
                throw new Error("No parentheses after the function call \nAt position: "+this.pos);
            }
            const result=this.parseSum();
            const close=this.advance();
            if (close.kind!=="rparen"){
                throw new Error("Mismatched parentheses\nAt position: "+this.pos);
            }
            return func(shiftTok.name, result);
        }
        else if (shiftTok.kind==="lparen"){
            const result=this.parseSum();
            const close=this.advance() // Consume the closing parentheses
            if (close.kind !== "rparen") {
                throw new Error("Mismatched parentheses\nAt position: "+this.pos);
            }
            return result;
        }
        else {
            throw new Error("Unexpected token: " + shiftTok.kind);
        }
    }
}


function parseText(text){
    const tokenisedText=tokenise(text);//
    console.log(tokenisedText);
    const parser= new TokenParser(tokenisedText)
    const tree=parser.parseSum();
    if (parser.pos !== tokenisedText.length) {
        throw new Error("Unexpected tokens remaining after parsing");
    }
    console.log(tree);
    return tree;
}

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

function derive(tree, differentiatingVar="x"){
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

function simplify(derivative){
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

function collectTerms(expression){
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

function evaluate(expression, substitutions={}){
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

button.addEventListener("click",main);