import {evaluate} from "./evaluation.js";
import {varList} from "./astUtils.js";

export function derivativeCheck(derivative, original, differentiatingVar="x"){
    const testPoints=[3.41,0.137,-0.862,1.37,-0.347,-2.71,0.291,-1.23,2.63,0.418,1.91,0.673,4.3,0.829,-0.826];
    const varsList=[...new Set(varList(original))];
    let passcount=0;
    let skipcount=0;
    let failcount=0;
    const failedPoints=[];
    const h=1e-5;
    for (let i=0; i<testPoints.length; i++){
        const testobject={};
        for (let j=0; j<varsList.length; j++){
            testobject[varsList[j]]=testPoints.at(testPoints.length-i-j-1);
        }
        let derivativeEval;
        try {
            derivativeEval=evaluate(derivative, testobject);
        }
        catch (error) {
            console.error("Error evaluating derivative at test point: "+testobject[differentiatingVar]+" with error: "+error);
            failcount++;
            failedPoints.push({testobject:testobject, derivativeEval:undefined, firstprinciplesEval:undefined, error: error.toString()});
            continue;
        }
        if (!dependsOn(original, differentiatingVar)){
            if (!Number.isFinite(derivativeEval)){
                failcount++;
                console.log("Failed at test point: "+testobject[differentiatingVar]+" with derivative: "+derivativeEval+" and first principles: 0");
                failedPoints.push({testobject:testobject, derivativeEval:derivativeEval, firstprinciplesEval:0, error:"non-finite derivative"});
            }
            else{
                if (Math.abs(derivativeEval)>1e-6){
                    failcount++;
                    console.log("Failed at test point: "+testobject[differentiatingVar]+" with derivative: "+derivativeEval+" and first principles: 0");
                    failedPoints.push({testobject:testobject, derivativeEval:derivativeEval, firstprinciplesEval:0, error:"derivative not zero"});
                } else {
                    passcount++;
                }
            }
        }
        else {
            const step=Math.max(1,Math.abs(testobject[differentiatingVar]))*h;
            const xinch={...testobject, [differentiatingVar]: testobject[differentiatingVar]+step};
            const xdech={...testobject, [differentiatingVar]: testobject[differentiatingVar]-step};
            let firstprinciplesEval;
            try {
                firstprinciplesEval=(evaluate(original,xinch)-evaluate(original,xdech))/(2*step);
            } catch (error) {
                console.error("Error evaluating first principles at test point: "+testobject[differentiatingVar]+" with error: "+error);
                failcount++;
                failedPoints.push({testobject:testobject, derivativeEval:derivativeEval, firstprinciplesEval:firstprinciplesEval, error:error.toString()});
                continue;
            }
            if (!Number.isFinite(firstprinciplesEval)){
                skipcount++;
            }
            else if (!Number.isFinite(derivativeEval)){
                failcount++;
                console.log("Failed at test point: "+testobject[differentiatingVar]+" with derivative: "+derivativeEval+" and first principles: "+firstprinciplesEval);
                failedPoints.push({testobject:testobject, derivativeEval:derivativeEval, firstprinciplesEval:firstprinciplesEval, error:"non-finite derivative"});
            }
            else{
                if (Math.abs(derivativeEval-firstprinciplesEval)>1e-6*Math.max(1,Math.abs(firstprinciplesEval),Math.abs(derivativeEval))){
                    failcount++;
                    console.log("Failed at test point: "+testobject[differentiatingVar]+" with derivative: "+derivativeEval+" and first principles: "+firstprinciplesEval);
                    failedPoints.push({testobject:testobject, derivativeEval:derivativeEval, firstprinciplesEval:firstprinciplesEval, error:"derivative and first principles differ"});
                } else {
                    passcount++;
                }
            }
        }
    }
    if (skipcount>0){
        console.warn("Skipped "+skipcount+" tests due to NaN/Infinity");
    }
    console.log("Pass count: "+passcount+", Skip count: "+skipcount+", Fail count: "+failcount);
    const passed=(failcount===0 && passcount>6);
    let reason="ok";
    if (!passed){
        if (failcount>0){
            reason="Failed at:"+JSON.stringify(failedPoints);
        } else if (passcount<=6){
            reason="Not enough tests passed:"+passcount+" passed, "+skipcount+" skipped, "+failcount+" failed";
        }
    }
    return {passed: passed, counts: {passcount: passcount, skipcount: skipcount, failcount: failcount}, reason: reason};
}