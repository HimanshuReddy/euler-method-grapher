const algebrite = require('algebrite');
const chart = require('chart.js');


// Handles building the chart
const graphElement = document.getElementById('graph');
let chartData = {}
const chartOptions = {}
const graph = new chart(graphElement, {
    type: 'line',
    data: {
        datasets: [{
            label: 'Sample Values',
            data: [{
                x: -1, 
                y: -2
            }, {
                x: 2, 
                y: 3
            }, {
                x: 5,
                y: -10
            }],
            borderWidth: 1,
            lineTension: 0
        }]
    },
    options: {
        scales: {
            xAxes: [{
                type: 'linear',
                position: 'bottom'
            }]
        }
    }
});


// Handles getting data from the form 
const formElement = document.getElementById('inputForm');
formElement.addEventListener("submit", (event) => {
    event.preventDefault();
    
    const formInfo = document.forms['inputForm'].elements;
    const expression = formInfo[0].value;
    const independentVar = formInfo[1].value;
    const numSteps = parseFloat(formInfo[2].value);
    const stepSize = parseFloat(formInfo[3].value);
    const startingX = parseFloat(formInfo[4].value);
    const startingY = parseFloat(formInfo[5].value);

    const solution = findSolution(expression, independentVar, startingX, startingY);
    document.getElementById("solution_display").innerHTML = 
        solution.hasSolution ? `Solution: ${solution.value}`: solution.value;
    
    updateChart(expression, independentVar, numSteps, stepSize, startingX, startingY);
});


// Updates the graph when new data is submitted
// Input: expression -> 
// NOTE: This function is not a pure function, and will modify the chart object when called.
const updateChart = (expression, independentVar, numSteps, stepSize, startingX, startingY) => {
    // Inital variables
    const solution = findSolution(expression, independentVar, startingX, startingY);
    let solutionPoints = [];
    let newDatasets = [];
    let C;

    // Code to add approximation values to graph
    newDatasets.push({
        label: 'Euler Approximation',
        data:  generateApproximationValues(expression, independentVar, numSteps, stepSize, startingX, startingY),
        lineTension: 0,
        backgroundColor: 'rgb(255, 156, 150)',
        borderColor: 'rgb(255, 73, 64)'
    })

    // Graphs the solution to the differential equation if one is found
    if (solution.hasSolution) {
        // Generates the solution points for the graph
        for (let i = 0; i <= numSteps; i++) {
            let currentX = startingX + stepSize*i;
            let currentY = evaluateValue(solution.value, independentVar, currentX).value;
            solutionPoints.push({x: currentX, y: currentY});
        }
        // Adds a solution equation to the graph
        newDatasets.push({
            label: 'Solution Equation',
            data: solutionPoints,
            cubicInterpolationMode: 'monotone',
            backgroundColor: 'rgb(158, 215, 255)',
            borderColor: 'rgb(31, 162, 255)'
        })
    }
    
    
    // Updates the graph
    graph.data.datasets = newDatasets;
    graph.update();
}


// Tries to find a solution to (integrate) the differential equation
// Input: expression -> The differential equation
//        varOfIntegration -> The variable to integrate with respect to 
// Output: An object with the solution to the differential equation in the 
//         format {hasSolution: boolean, value: string}, or an error string if no solution was found
const findSolution = (expression, independentVar, startingX, startingY) => {
    let returnObj = {};
    let C;
    try {
        let solution = algebrite.integral(expression, independentVar).toString();
        returnObj.hasSolution = true;
        C = (startingY - evaluateValue(solution, independentVar, startingX).value).toString();
        returnObj.value = C >= 0 ? solution + " + " + C : solution + C;
    } catch (err) {
        returnObj.hasSolution = false;
        returnObj.value = "A solution to the given differential equation wasn't found";
    }
    return returnObj;
}


// Generates an array of points for the euler's approximation graph
// Input: expression -> The differential equation
//        independentVar -> The variable to substitute in values for
//        numSteps -> How many points to approximate
//        stepSize -> The change in x 
//        startingX -> The x-coordinate of the starting point
//        startingY -> The y-coordinate of the starting point
// Output: An array of objects, with each object in the format {x: number, y: number}
const generateApproximationValues = (expression, independentVar, numSteps, stepSize, startingX, startingY) => {
    const solutionPoints = [];
    solutionPoints.push({x: startingX, y: startingY});

    let currentX = startingX;
    let currentY = startingY;
    for(let i = 0; i < numSteps; i++) {
        let slope = evaluateValue(expression, independentVar, currentX).value;
        currentX += stepSize;
        currentY += slope*stepSize;
        solutionPoints.push({x: currentX, y: currentY});
    }
    return solutionPoints;
}


// Evaluates a function at a certain value and returns the numerical output
// Input: expression -> The expression to be evaluated
//        variable -> The independent variable, to replace with the value
//        value -> The constant value to be plugged into the expression
// Output: An object with the format {wasSuccessful: boolean, value: string}
const evaluateValue = (expression, variable, value) => {
    let algebriteEvaluation = "";
    let returnObj = {};
    try {
        algebriteEvaluation = algebrite.eval(expression, variable, value).toString();
        algebriteEvaluation = algebriteEvaluation.split("...").join("");
        algebriteEvaluation = parseFloat(eval(algebriteEvaluation)); 
        returnObj.wasSuccessful = true;
        returnObj.value = algebriteEvaluation;
        return returnObj;
    } catch (err) {
        console.log(err);
        returnObj.wasSuccessful = false;
        returnObj.value = "NaN";
        return returnObj;
    } 
}
 