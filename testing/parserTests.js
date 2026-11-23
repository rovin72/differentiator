import {num, constant, vari, add, subtract, multiply, divide, exponent, negate, func} from "../src/ast.js";
export const parserTests ={
    "Basic Parsing":[{
        name: "Single number",
        input: "5",
        expectedoutput:num(5)
    },
    {
        name: "Decimal number",
        input: "1.32",
        expectedoutput:num(1.32)
    },
    {
        name: "Single var",
        input: "x",
        expectedoutput:vari("x")
    },
    {
        name: "Pi constant",
        input: "pi",
        expectedoutput:constant("pi")
    },
    {
        name: "e constant",
        input: "e",
        expectedoutput:constant("e")
    }],
    "Arithmetic Parsing": [{
        name: "Addition", 
        input: "x+y",
        expectedoutput: add(vari("x"),vari("y"))
    },
    {
        name: "Subtraction", 
        input: "x-y",
        expectedoutput: subtract(vari("x"),vari("y"))
    },
    {
        name: "Multiplication", 
        input: "x*y",
        expectedoutput: multiply(vari("x"),vari("y"))
    },
    {
        name: "Division", 
        input: "x/y",
        expectedoutput: divide(vari("x"),vari("y"))
    },
    {
        name: "Exponentiation", 
        input: "x^y",
        expectedoutput: exponent(vari("x"),vari("y"))
    },
    {
        name: "Negative number", 
        input: "-5",
        expectedoutput: negate(num(5))
    },
    {
        name: "Negative variable", 
        input: "-x",
        expectedoutput: negate(vari("x"))
    }],
    "Operator Precedence": [{
        name: "Multiplication before addition", 
        input: "x+y*z",
        expectedoutput: add(vari("x"),multiply(vari("y"),vari("z")))
    },
    {
        name: "Division before subtraction", 
        input: "x-y/z",
        expectedoutput: subtract(vari("x"),divide(vari("y"),vari("z")))
    },
    {
        name: "Parentheses", 
        input: "(x-y)*z",
        expectedoutput: multiply(subtract(vari("x"),vari("y")),vari("z"))
    },
    {
        name: "Nested parentheses", 
        input: "((x+y))",
        expectedoutput: add(vari("x"),vari("y"))
    },
    {
        name: "Subtraction Associativity", 
        input: "x-y-z",
        expectedoutput: subtract(subtract(vari("x"),vari("y")),vari("z"))
    },
    {
        name: "Division Associativity", 
        input: "x/y/z",
        expectedoutput: divide(divide(vari("x"),vari("y")),vari("z"))
    },
    {
        name: "Exponentiation Associativity", 
        input: "x^y^z",
        expectedoutput: exponent(vari("x"),exponent(vari("y"),vari("z")))
    }],
    "Implicit Multiplication": [{
        name: "Variable and number", 
        input: "2x",
        expectedoutput: multiply(num(2),vari("x"))
    },
    {
        name: "Number and variable",
        input: "x2",
        expectedoutput: multiply(vari("x"),num(2))
    },
    {
        name: "variable and variable",
        input: "xy",
        expectedoutput: multiply(vari("x"),vari("y"))
    },
    {
        name: "Number and parentheses",
        input: "2(x+1)",
        expectedoutput: multiply(num(2),add(vari("x"),num(1)))
    },
    {
        name: "Adjacent parentheses",
        input: "(x+1)(x-1)",
        expectedoutput: multiply(add(vari("x"),num(1)),subtract(vari("x"),num(1)))
    },
    {
        name: "Variable and Parentheses",
        input: "x(y+1)",
        expectedoutput: multiply(vari("x"),add(vari("y"),num(1)))
    },
    {
        name: "Multiple Factors",
        input: "2xy",
        expectedoutput: multiply(multiply(num(2),vari("x")),vari("y"))
    },
    {
        name: "Implicit and explicit",
        input: "2x*3y",
        expectedoutput: multiply(multiply(multiply(num(2),vari("x")),num(3)),vari("y"))
    }],
    "Function Parsing": [{
        name: "Sine function",
        input: "sin(x)",
        expectedoutput: func("sin",vari("x"))
    },
    {
        name: "Cosine function",
        input: "cos(x)",
        expectedoutput: func("cos",vari("x"))
    },
    {
        name: "Tangent function",
        input: "tan(x)",
        expectedoutput: func("tan",vari("x"))
    },
    {
        name: "Logarithm function",
        input: "log(x)",
        expectedoutput: func("log",vari("x"))
    },
    {
        name: "Natural Logarithm function",
        input: "ln(x)",
        expectedoutput: func("ln",vari("x"))
    },
    {
        name: "Square Root function",
        input: "sqrt(x)",
        expectedoutput: func("sqrt",vari("x"))
    },
    {
        name: "Inverse Sine function",
        input: "arcsin(x)",
        expectedoutput: func("arcsin",vari("x"))
    },
    {
        name: "Inverse Cosine function",   
        input: "arccos(x)",
        expectedoutput: func("arccos",vari("x"))
    },
    {
        name: "Inverse Tangent function",
        input: "arctan(x)",
        expectedoutput: func("arctan",vari("x"))
    },
    {
        name: "Nested Functions",
        input: "sin(cos(x))",
        expectedoutput: func("sin",func("cos",vari("x")))
    },
    {
        name: "Functions of an expression",
        input: "sin(x+y)",
        expectedoutput: func("sin",add(vari("x"),vari("y")))
    },
    {
        name: "Function with implicit multiplication",
        input: "2sin(x)",
        expectedoutput: multiply(num(2),func("sin",vari("x")))
    }],
    "Additional Tests": [{
        name: "Polynomial with implicit multiplication",
        input: "2x^2+3x+1",
        expectedoutput: add(add(multiply(num(2),exponent(vari("x"),num(2))),multiply(num(3),vari("x"))),num(1))
    },
    {
        name: "Rational function with implicit multiplication",
        input: "2(x^2+1)/(x-1)",
        expectedoutput: divide(multiply(num(2),add(exponent(vari("x"),num(2)),num(1))),subtract(vari("x"),num(1)))
    },
    {
        name: "Nested exponents",
        input: "x^(y^z+1)",
        expectedoutput: exponent(vari("x"),add(exponent(vari("y"),vari("z")),num(1)))
    },
    {
        name: "Trig expression",
        input: "sin(x)^2+cos(y)^2",
        expectedoutput: add(exponent(func("sin",vari("x")),num(2)),exponent(func("cos",vari("y")),num(2)))
    },
    {
        name: "Multiple Variables and Functions",
        input: "sin(cos(x)) + tan(y) - log(z)",
        expectedoutput: subtract(add(func("sin",func("cos",vari("x"))),func("tan",vari("y"))),func("log",vari("z")))
    },
    {
        name: "Negative Exponent",
        input: "x^-2",
        expectedoutput: exponent(vari("x"),negate(num(2)))
    }],
    "Invalid Inputs": [{
        name: "Mismatched Parentheses Right",
        input: "(x+y"
    },
    {
        name: "Empty Input",
        input: ""
    },
    {
        name: "Missing Operand Right",
        input: "x-"
    },
    {
        name: "Missing operand left",
        input: "+y"
    },
    {
        name: "Only Operator",
        input: "+"
    },
    {
        name: "Mismatched Parentheses left",
        input: "x+y)"
    },
    {
        name: "Empty Parentheses",
        input: "()"
    },
    {
        name: "Double Operators",
        input: "x**y"
    },
    {
        name: "Empty Function",
        input: "sin()"
    },
    {
        name:"Invalid Char",
        input: "x@y"
    }]
}