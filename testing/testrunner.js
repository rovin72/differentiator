import {parseText} from "../src/parser.js";
import {derive} from "../src/differentiation.js";
import {simplify, collectTerms} from "../src/simplification.js";
import {isSame} from "../src/astUtils.js";
import {calculate} from "../src/index.js";
import {derivativeCheck} from "../src/derivativeCheck.js";
import {parserTests} from "./parserTests.js";
import {printAST} from "../src/astUtils.js";

function main() {
    let totalPassed=0;
    let totalFailed=0;
    console.log("--------------------\nRunning Parser Tests\n--------------------");
    for (let testCategory of Object.keys(parserTests)){
        let passed=0;
        let failed=0;
        console.log("\n" + testCategory + ":");
        if (testCategory==="Invalid Inputs"){
            for (let test of parserTests[testCategory]){
                try {
                    const result=parseText(test.input);
                    console.log("FAIL "+test.name+"\ninput: "+test.input+"\nexpected: Error\nresult: "+printAST(result));
                    totalFailed++;
                    failed++;
                }
                catch (error){
                    console.log("PASS "+test.name);
                    passed++;
                    totalPassed++;
                }
            }
        }
        else {
            for (let test of parserTests[testCategory]){
                const result=parseText(test.input);
                if (!isSame(test.expectedoutput,result)){
                    console.log("FAIL "+test.name+"\ninput: "+test.input+"\nexpected: "+printAST(test.expectedoutput)+"\nresult: "+printAST(result));
                    totalFailed++;
                    failed++;
                }
                else {
                    console.log("PASS "+test.name);
                    totalPassed++;
                    passed++;
                }
            }
        }
        console.log("Completed "+testCategory+" tests. Passed: "+passed+", Failed: "+failed+", Success Rate: "+String(passed/(passed+failed)*100).slice(0,5)+"%");
    }
    console.log("Parser tests completed. Passed: "+totalPassed+", Failed: "+totalFailed+", Success Rate: "+String(totalPassed/(totalPassed+totalFailed)*100).slice(0,5)+"%"); 
}

main();