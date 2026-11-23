import {calculate} from "./index.js";
const userInput=document.getElementById("userInput");
const button=document.getElementById("Confirm");


function main() {
    calculate(userInput.value);
}

button.addEventListener("click",main);