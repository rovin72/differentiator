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

function main() {
    const userText=userInput.value.toLowerCase();
    parseText(userText);

}

function tokenise(text){
    text=text.replace(/\s+/g,"");
    const digitBreak=["+","-","*","/","(",")"];
    const operations=["+","-","*","/","^"];
    const tokens = [];
    let pos=0;
    const digitRegex=/^[0-9]+(\.[0-9]+)?/;
    const functionRegex=/^(sin|cos|tan|log|sqrt|ln)/;
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
            return {kind: "function", name: shiftTok.name, arg:result}

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
}




button.addEventListener("click",main);