const userInput=document.getElementById("userInput");
const button=document.getElementById("Confirm");
const num = (value) => ({kind: "num", value: value});
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

}

function tokenise(text){
    text=text.replace(/\s+/g,"");
    const digitBreak=["+","-","*","/","(",")"];
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
            if (numStr==="pi"){
                tokens.push(num(Math.PI));
            }
            else if (numStr==="e"){
                tokens.push(num(Math.E));
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
        if(currentToken && (currentToken.kind==="num"|| currentToken.kind==="var"||currentToken.kind==="lparen"||currentToken.kind==="function")){
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
        if (shiftTok.kind==="num" || shiftTok.kind==="var"){
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


button.addEventListener("click",main);