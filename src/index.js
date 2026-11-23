import {parseText} from "./parser.js";
import {derive} from "./differentiation.js";
import {simplify, collectTerms} from "./simplification.js";
import {isSame} from "./astUtils.js";

export function calculate(userInput){
    const userText=userInput.toLowerCase();
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
