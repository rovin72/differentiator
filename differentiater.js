const userInput=document.getElementById("userInput");
const button=document.getElementById("Confirm");

function main() {
    const userText=userInput.value.toLowerCase();
    parseText(userText);

}

class operation {
    constructor(value="",operator=null, parent=null, children=[]) {
        this.children=[];
        this.parent=parent;
        this.operator=operator;
        this.value=value;
    }
}

function parseText(text, subTree=null){
    //step 1 understand ()
    //step 2 split by +-
    const operationTree = subTree ?? new operation(text);

    const additionSplit=text.split(/(?<=[\w)])(?=[+-])/); //split by + and - but keep the operator with the term
    if (additionSplit.length>1){
        for (const term of additionSplit){ //for each term, create a new operation and add it to the tree
            let child;
            switch (term[0]) {
                case "-":
                    child=new operation(term.slice(1),"-",operationTree);
                    break;

                case "+":
                    child=new operation(term.slice(1),"+",operationTree);
                    break;
            
                default:
                    child=new operation(term,"+",operationTree);
                    break;
            }
            operationTree.children.push(child);
        }
        for (const child of operationTree.children){
            parseText(child.value, child);
        }
    } else {

    }


    
    //step 3 insert *'s
    //split by * /
    //code a test run

    //use a tree to store nums and operators

    //basically make a calc
}
button.addEventListener("click",main)