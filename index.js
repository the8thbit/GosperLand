document.addEventListener("DOMContentLoaded", function(e) {
    noise.seed(Math.random());
    populateCells(worldWidth, worldHeight);
    drawCanvas();
    runTick();
});



//init
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth - 400;
canvas.height = window.innerHeight - 60;

let difficultyNoiseSeed = Math.random();
let advantageNoiseSeed = Math.random();
let lightNoiseSeed = Math.random();

let cellWidth = 32;
let cellHeight = 32;
let cellBorderThickness = 1;
let bodyPadding = 20;
let fixedNumLeng = 5;

let redrawInterval = 0;
let tickInterval = 0;
let totalTickCount = 0;
let ticksUntilRedraw = redrawInterval;

let x_viewPos = 0;
let y_viewPos = 0;

let mouseDown = false;
let mouseMoved = false;
let x_mouseDownPos = 0;
let y_mouseDownPos = 0;

let paused = false;
let selectType = "terrain";
let cellSelected = null;
let creatureSelected = null;

let worldWidth = 100;
let worldHeight = 100;

let cellGrid = [];
let creatureList = [];

let populateCells = (x_size, y_size) => {
    cellGrid = new Array(x_size);

    for (let i=0; i < cellGrid.length; i++) {
        cellGrid[i] = new Array(y_size);
    }

    for (let i=0; i < x_size; i++) {
        for (let j=0; j < y_size; j++) {
            cellGrid[i][j] = new Terrain(i, j);
            if (Math.random() > 0.80 && Math.random() > cellGrid[i][j].difficulty) {
                creatureList.push(new Creature(i, j));
                cellGrid[i][j].creature = creatureList.length;
            }
        }
    }
}



//math functions
let x_cellToPxPos = (x_cellPos) => {
    return Math.max(0, x_cellPos * (cellWidth + (cellBorderThickness)) + cellBorderThickness); 
}

let y_cellToPxPos = (y_cellPos) => {
    return Math.max(0, y_cellPos * (cellHeight + (cellBorderThickness)) + cellBorderThickness); 
}

let x_pxToCellPos = (x_pxPos) => {
    return Math.max(0, Math.floor((x_pxPos-cellBorderThickness)/(cellWidth+cellBorderThickness)));
}

let y_pxToCellPos = (y_pxPos) => {
    return Math.max(0, Math.floor((y_pxPos-cellBorderThickness)/(cellHeight+cellBorderThickness)));
}

let randIntBetween = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hslToHex(h, s, l) {
    let rgb = hslToRgb(h, s, l);
    return rgbToHex(rgb[0], rgb[1], rgb[2]);
}
function hslToRgb(h, s, l){
    let r, g, b;
    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        let hue2rgb = (p, q, t) => {
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
let rgbToHex = (r, g, b) => {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
} 
let componentToHex = (c) => {
    var hex = Math.floor(c).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

let cellIsAvailible = (x, y) => {
    if (
        x >= 0 &&
        y >= 0 &&
        cellGrid.length > x &&
        cellGrid[x].length > y &&
        !cellGrid[x][y].creature
    ) {
        return true;
    } else {
        return false;
    }
}



//gfx
let moveView = (e) => {
    mouseMoved = true;

    if (mouseDown) {
        x_viewPos -= (e.x - x_mouseDownPos)*1.5;
        y_viewPos -= (e.y - y_mouseDownPos)*1.5;
        x_viewPos = Math.max(x_viewPos, 0);
        x_viewPos = Math.min(x_viewPos, x_cellToPxPos(worldWidth) - canvas.width);
        y_viewPos = Math.max(y_viewPos, 0);
        y_viewPos = Math.min(y_viewPos, y_cellToPxPos(worldHeight) - canvas.height);
        x_mouseDownPos = e.x;
        y_mouseDownPos = e.y;
        drawCanvas();
    }
}

let drawCanvas = () => {
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(-x_viewPos, -y_viewPos);
    drawGrid(worldWidth, worldHeight, cellWidth, cellHeight, cellBorderThickness);
}

let drawGrid = (x_size, y_size, cellWidth, cellHeight, cellBorderThickness) => {
    for (let i=0; i < x_size; i++) {
        for (let j=0; j < y_size; j++) {
            drawCell(
                cellGrid[i][j].color,
                cellGrid[i][j].creature,
                cellBorderThickness,
                i,
                j,
                cellWidth,
                cellHeight
            );
        }      
    }
}

let drawCell = (color, creatureIndex, borderThickness, x_pos, y_pos, x_size, y_size) => {
    let isSelected = false;
    if (cellSelected) {
        if (cellSelected.x === x_pos && cellSelected.y === y_pos) {
            isSelected = true;
            ctx.fillStyle = "yellow";
            ctx.fillRect(
                borderThickness+(x_pos*(x_size+borderThickness))-1,
                borderThickness+(y_pos*(y_size+borderThickness))-1,
                x_size+2,
                y_size+2
            );
        }
    } else if (creatureSelected) {
        if (creatureSelected.x === x_pos && creatureSelected.y === y_pos) {
            isSelected = true;
            ctx.fillStyle = "cyan";
            ctx.fillRect(
                (x_pos*(x_size+borderThickness)),
                (y_pos*(y_size+borderThickness)),
                x_size+borderThickness*2,
                y_size+borderThickness*2
            );
        }
    }
    
    ctx.fillStyle = color;
    ctx.fillRect(
        borderThickness+(x_pos*(x_size+borderThickness))+(isSelected),
        borderThickness+(y_pos*(y_size+borderThickness))+(isSelected),
        x_size-(isSelected*2),
        y_size-(isSelected*2)
    );
    if (creatureIndex) {
        let creature = creatureList[creatureIndex-1];
        let borderRed = 255;
        let borderBlue = 255;
        let borderGreen = 255;
        if (creature.age <= creature.minReproductiveAge) {
            borderRed = 255/creature.minReproductiveAge*creature.age;
            borderBlue = 255/creature.minReproductiveAge*creature.age;
        } else if (creature.age >= creature.maxReproductiveAge) {
            borderRed = 255*(creature.maxAge-creature.age)/(creature.maxAge-creature.maxReproductiveAge);
            borderGreen = 255*(creature.maxAge-creature.age)/(creature.maxAge-creature.maxReproductiveAge);
        }

        if (creature.energy <= creature.maxEnergy * 0.2) {
            borderRed = Math.max(0, borderRed - 255*(1-(creature.energy/(creature.maxEnergy*0.2))));
            borderBlue = Math.max(0, borderBlue - 255*(1-(creature.energy/(creature.maxEnergy*0.2))));
            borderGreen = Math.max(0, borderGreen - 255*(1-(creature.energy/(creature.maxEnergy*0.2))));
        }

        ctx.fillStyle = rgbToHex(borderRed, borderGreen, borderBlue);

        ctx.fillRect(
            borderThickness+(x_pos*(x_size+borderThickness))+4,
            borderThickness+(y_pos*(y_size+borderThickness))+4,
            x_size-8,
            y_size-8
        );
        ctx.fillStyle = rgbToHex(creature.color[0], creature.color[1], creature.color[2]);
        ctx.fillRect(
            borderThickness+(x_pos*(x_size+borderThickness))+6,
            borderThickness+(y_pos*(y_size+borderThickness))+6,
            x_size-12,
            y_size-12
        );

        if (creature.action === "move") {
            ctx.fillStyle = "white";
            ctx.fillRect(
                borderThickness+(x_pos*(x_size+borderThickness))+14,
                borderThickness+(y_pos*(y_size+borderThickness))+14,
                x_size-28,
                y_size-28
            );
        } else if (creature.action === "bud") {
            ctx.fillStyle = "black";
            ctx.fillRect(
                borderThickness+(x_pos*(x_size+borderThickness))+14,
                borderThickness+(y_pos*(y_size+borderThickness))+14,
                x_size-28,
                y_size-28
            );
        }
    }
}

let updateCanvas = (tickDelta) => {
    ticksUntilRedraw -= tickDelta;
    if (ticksUntilRedraw <= 0) {
        ticksUntilRedraw = redrawInterval;
        drawCanvas();
    }
}



//logic
class Creature {
    constructor(x_pos, y_pos, parent=null) {
        if (parent === null) {
            this.color = [
                randIntBetween(0, 255),
                randIntBetween(0, 255),
                randIntBetween(0, 255)
            ];
            
            this.moveSpeedMod = 0;
            this.budSpeedMod = 0;
            this.photoSynthMod = 0;
            this.maxEnergyMod = 0;
            this.maxAgeMod = 0;
            this.minBudAgeMod = 0;
            this.maxBudAgeMod = 0;

            let raffleTickets = [];
            for (let i=0; i<7; i++) {
                let numOfTickets = randIntBetween(1, 5);
                for (let j=0; j<Math.pow(numOfTickets, 2); j++) {
                    raffleTickets.push(i);
                }
            }

            let pointsRemaining = 100;
            while (pointsRemaining) {
                let roll = randIntBetween(0, raffleTickets.length-1);
                switch(raffleTickets[roll]) {
                    case 0:
                        if (this.moveSpeedMod < 100) {
                            this.moveSpeedMod += 1;
                            pointsRemaining -= 1;
                        }
                        break;
                    case 1:
                        if (this.budSpeedMod < 100) {
                            this.budSpeedMod += 1;
                            pointsRemaining -= 1;
                        }
                        break;
                    case 2:
                        if (this.photoSynthMod < 50) {
                            this.photoSynthMod += 1;
                            pointsRemaining -= 1;
                        }
                        break;
                    case 3:
                        this.maxEnergyMod += 1;
                        pointsRemaining -= 1;
                        break;
                    case 4:
                        this.maxAgeMod += 1;
                        pointsRemaining -= 1;
                        break;
                    case 5:
                        if (this.minBudAgeMod < 45) {
                            this.minBudAgeMod += 1;
                            pointsRemaining -= 1;
                        }
                        break;
                    case 6:
                        if (this.maxBudAgeMod < 45) {
                            this.maxBudAgeMod += 1;
                            pointsRemaining -= 1;
                        }
                        break;
                    default:
                        break;
                }
            }

            this.moveSpeed = 0.005 + Math.min(0.995, this.moveSpeedMod*0.01);
            this.budSpeed = 0.005 + Math.min(0.995, this.budSpeedMod*0.01);
            this.photoSynth = Math.min(1, this.photoSynthMod*0.02);
            this.maxEnergy = 20 + this.maxEnergyMod*10;
            this.maxAge = 50 + this.maxAgeMod*10;
            this.minBudAge = this.maxAge*(0.45-this.minBudAgeMod/100);
            this.maxBudAge = this.maxAge*(0.55+this.maxBudAgeMod/100);

            this.moveFreq = Math.random() * 0.25;
            this.budFreq = Math.random() * 0.03;
            this.energy = Math.random() * this.maxEnergy;
        } else {
            this.color = [
                Math.min(255, Math.max(0, parent.color[0] + randIntBetween(-10, 10))),
                Math.min(255, Math.max(0, parent.color[1] + randIntBetween(-10, 10))),
                Math.min(255, Math.max(0, parent.color[2] + randIntBetween(-10, 10))),
            ];
            this.moveSpeedMod = parent.moveSpeedMod;
            this.budSpeedMod = parent.budSpeedMod;
            this.photoSynthMod = parent.photoSynthMod;
            this.maxEnergyMod = parent.maxEnergyMod;
            this.maxAgeMod = parent.maxAgeMod;
            this.minBudAgeMod = parent.minBudAgeMod;
            this.maxBudAgeMod = parent.maxBudAgeMod;

            let pointsToRealoc = Math.max(0, randIntBetween(-95, 5));

            for (let i=0; i<pointsToRealoc; i++) {
                switch(randIntBetween(0, 6)) {
                    case 0:
                        if (this.moveSpeedMod > 0) { 
                            this.moveSpeedMod -= 1;
                        } else {
                            i -= 1;
                        }
                        break;
                    case 1:
                        if (this.budSpeedMod > 0) {
                            this.budSpeedMod -= 1;
                        } else {
                            i -= 1;
                        }
                        break;
                    case 2:
                        if (this.photoSynthMod > 0) {
                            this.photoSynthMod -= 1;
                        } else {
                            i -= 1;
                        }
                        break;
                    case 3:
                        if (this.maxEnergyMod > 0) {
                            this.maxEnergyMod -= 1;
                        } else {
                            i -= 1;
                        }
                        break;
                    case 4:
                        if (this.maxAgeMod > 0) {
                            this.maxAgeMod -= 1;
                        } else {
                            i -= 1;
                        }
                        break;
                    case 5:
                        if (this.minBudAgeMod > 0) {
                            this.minBudAgeMod -= 1;
                        } else {
                            i -= 1;
                        }
                        break;
                    case 6:
                        if (this.maxBudAgeMod > 0) {
                            this.maxBudAgeMod -= 1;
                        } else {
                            i -= 1;
                        }
                        break;
                    default:
                        break;
                }
            }

            for (let i=0; i<pointsToRealoc; i++) {
                switch(randIntBetween(0, 6)) {
                    case 0:
                        if (this.moveSpeedMod < 100) { 
                            this.moveSpeedMod += 1;
                        } else {
                            i -= 1;
                        }
                        break;
                    case 1:
                        if (this.budSpeedMod < 100) {
                            this.budSpeedMod += 1;
                        } else {
                            i -= 1;
                        }
                        break;
                    case 2:
                        if (this.photoSynthMod < 50) {
                            this.photoSynthMod += 1;
                        } else {
                            i -= 1;
                        }
                        break;
                    case 3:
                        this.maxEnergyMod += 1;
                        break;
                    case 4:
                        this.maxAgeMod += 1;
                        break;
                    case 5:
                        if (this.minBudAgeMod < 45) {
                            this.minBudAgeMod += 1;
                        } else {
                            i -= 1;
                        }
                        break;
                    case 6:
                        if (this.maxBudAgeMod < 45) {
                            this.maxBudAgeMod += 1;
                        } else {
                            i -= 1;
                        }
                        break;
                    default:
                        break;
                }
            }

            this.moveSpeed = 0.005 + Math.min(0.995, this.moveSpeedMod*0.01);
            this.budSpeed = 0.005 + Math.min(0.995, this.budSpeedMod*0.01);
            this.photoSynth = Math.min(1, this.photoSynthMod*0.02);
            this.maxEnergy = 20 + this.maxEnergyMod*10;
            this.maxAge = 50 + this.maxAgeMod*10;
            this.minBudAge = this.maxAge*(0.45-this.minBudAgeMod/100);
            this.maxBudAge = this.maxAge*(0.55+this.maxBudAgeMod/100);

            this.energy = parent.energy/2 - Math.random();
            this.moveFreq = parent.moveFreq + (Math.random() - 0.5)/10;
            this.budFreq = parent.budFreq + (Math.random() - 0.5)/1000;
        }
        this.isAlive = true;
        this.targetCell = null;
        this.currentAction = null;
        this.actionProgress = 0;
        this.age = 0;
        this.minReproductiveAge = this.maxAge * 0.1;
        this.maxReproductiveAge = this.maxAge * 0.9;
        this.name = "";
        for (let i=0; i < randIntBetween(3, 10); i++) {
            this.name += String.fromCharCode(randIntBetween(65, 95));
        }
        this.x = x_pos;
        this.y = y_pos;
    }
    changeEnergy(energyDelta) {
        this.energy = Math.min(this.maxEnergy, this.energy + energyDelta);
        if (this.energy <= 0) {
            this.kill();
        }
    }
    changeAge(ageDelta) {
        this.age += ageDelta;
        if (this.age > this.maxAge) {
            this.kill();
        }
    }
    bud() {
        if(
            this.age >= this.minBudAge &&
            this.age <= this.maxBudAge &&
            this.action !== "bud"
        ) {
            let availibleCells = [];
            for (let i=-1; i <= 1; i++) {
                for (let j=-1; j <= 1; j++) {
                    let x_pos = this.x + i;
                    let y_pos = this.y + j;
                    if (cellIsAvailible(x_pos, y_pos)) {
                        availibleCells.push(cellGrid[x_pos][y_pos]);
                    }
                }
            }
            if(availibleCells.length) {
                this.action = "bud";
                this.targetCell = availibleCells[randIntBetween(0, availibleCells.length-1)];
            }
        }
        if (this.action === "bud") {
            if (cellIsAvailible(this.targetCell.x, this.targetCell.y)) {
                let budProgressBaseCost = this.budSpeed;
                this.actionProgress += this.budSpeed;
                if(this.actionProgress >= this.targetCell.difficulty) {
                    budProgressBaseCost -= (this.actionProgress-this.targetCell.difficulty);
                    creatureList.push(new Creature(this.targetCell.x, this.targetCell.y, this));
                    this.energy = this.energy/2;
                    cellGrid[this.targetCell.x][this.targetCell.y].creature = creatureList.length;
                    this.clearAction();
                }
                this.changeEnergy(-budProgressBaseCost*10);
            } else {
                this.clearAction();
            }
        }
    }
    move() {
        if(this.action !== "move") {
            let availibleCells = [];
            for (let i=-1; i <= 1; i++) {
                for (let j=-1; j <= 1; j++) {
                    let x_pos = this.x + i;
                    let y_pos = this.y + j;
                    if (cellIsAvailible(x_pos, y_pos)) {
                        availibleCells.push(cellGrid[x_pos][y_pos]);
                    }
                }
            }
            if(availibleCells.length) {
                this.action = "move";
                this.targetCell = availibleCells[randIntBetween(0, availibleCells.length-1)];
            }
        }
        if (this.action === "move") {
            if (cellIsAvailible(this.targetCell.x, this.targetCell.y)) {
                let moveProgressBaseCost = this.moveSpeed;
                this.actionProgress += this.moveSpeed;
                if(this.actionProgress >= this.targetCell.difficulty) {
                    moveProgressBaseCost -= (this.actionProgress-this.targetCell.difficulty);
                    this.targetCell.creature = cellGrid[this.x][this.y].creature;
                    cellGrid[this.x][this.y].creature = 0;
                    this.x = this.targetCell.x;
                    this.y = this.targetCell.y;
                    this.clearAction();
                }
                this.changeEnergy(-moveProgressBaseCost*5);
            } else {
                this.clearAction();
            }
        }
    }
    kill() {
        if (this.isAlive) {
            this.isAlive = false;
            cellGrid[this.x][this.y].creature = 0;
            this.x = -1;
            this.y = -1;
        }
    }
    tick() {
        if (this.action === "move" || (!this.action && Math.random() < this.moveFreq)) {
            this.move();
        }
        if (this.action === "bud" || (!this.action && Math.random() < this.budFreq)) {
            this.bud();
        }
        if (this.isAlive) {
            this.changeEnergy(Math.pow(10*cellGrid[this.x][this.y].light, 2)*this.photoSynth);
            this.changeEnergy(-5);
            this.changeAge(1);
        }
    }
    clearAction() {
        this.action = null;
        this.targetCell = null;
        this.actionProgress = 0;
    }
}

class Terrain {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.creature = 0;

        noise.seed(difficultyNoiseSeed);
        this.difficulty = noise.simplex2(x/10, y/10) * 0.5 + 0.5;
        noise.seed(advantageNoiseSeed);
        this.advantage = noise.simplex2(x/10, y/10) * 0.5 + 0.5;
        noise.seed(lightNoiseSeed);
        this.light = noise.simplex2(x/10, y/10) * 0.5 + 0.5;

        this.color = hslToHex(
            (1-this.difficulty) * 0.8,
            this.advantage * 0.5 + 0.1,
            this.light * 0.4 + 0.05,
        );
    }
}

let updateCreatures = () => {
    for (let i=0; i < creatureList.length; i++) {
        if (creatureList[i].isAlive) {
            creatureList[i].tick();
        }
    }
}

let runTick = () => {
    if(!paused) {
        totalTickCount += 1;
        updateCreatures();
        updateCanvas(1);
        if (cellSelected) {
            setTerrainInfo(cellSelected);
        } else if (creatureSelected) {
            setCreatureInfo(creatureSelected);
        }
        setTimeout(runTick, tickInterval);
    }
}



//interaction
let setMouseDown = (e) => {
    mouseDown = true;
    mouseMoved = false;
    x_mouseDownPos = e.x;
    y_mouseDownPos = e.y;
}

let setTerrainInfo = (cell) => {
    let creature = creatureList[cell.creature-1];
    cellSelected = cell;
    creatureSelected = null;

    $("#cell-difficulty").html(cell.difficulty.toFixed(fixedNumLeng));
    $("#cell-advantage").html(cell.advantage.toFixed(fixedNumLeng));
    $("#cell-light").html(cell.light.toFixed(fixedNumLeng));
    if (creature) {
        $("#cell-creature").html(creature.name);
    } else {
        $("#cell-creature").html("");
    }
    $("#cellx").html(cell.x);
    $("#celly").html(cell.y);
    drawCanvas();
}

let setCreatureInfo = (creature) => {
    if (creature) {
        creatureSelected = creature;
        cellSelected = null;

        $("#creature-name").html(creature.name);
        $("#creature-action").html(creature.action);
        $("#creature-action-progress").html(creature.actionProgress.toFixed(fixedNumLeng));
        $("#creature-alive").html(creature.isAlive);
        $("#creature-photosynth").html(creature.photoSynth.toFixed(fixedNumLeng));
        $("#creature-energy").html(creature.energy.toFixed(fixedNumLeng));
        $("#creature-max-energy").html(creature.maxEnergy.toFixed(fixedNumLeng));
        $("#creature-age").html(creature.age.toFixed(fixedNumLeng));
        $("#creature-max-age").html(creature.maxAge.toFixed(fixedNumLeng));
        $("#creature-move-freq").html(creature.moveFreq.toFixed(fixedNumLeng));
        $("#creature-bud-freq").html(creature.budFreq.toFixed(fixedNumLeng));
        $("#creature-min-bud-age").html(creature.minBudAge.toFixed(fixedNumLeng));
        $("#creature-max-bud-age").html(creature.maxBudAge.toFixed(fixedNumLeng));
        $("#creature-move-speed").html(creature.moveSpeed.toFixed(fixedNumLeng));
        $("#creature-bud-speed").html(creature.budSpeed.toFixed(fixedNumLeng));
        drawCanvas();
    }
}

let setMouseUp = (e) => {
    if (!mouseMoved) {
        let x = e.x - bodyPadding + x_viewPos;
        let y = e.y - bodyPadding + y_viewPos;
        let cx = x_pxToCellPos(x);
        let cy = y_pxToCellPos(y);
        let cell = cellGrid[cx][cy];
        let cellCreature = cellGrid[cx][cy].creature;
        let creature = creatureList[cellCreature-1];

        if (selectType === "terrain") {
            setTerrainInfo(cell);
        } else {
            setCreatureInfo(creature);
        }
    }
    mouseDown = false;
    mouseMoved = false;
}

$("#pause-button").click(() => {
    if (!paused) {
        paused = true;
        $("#pause-button").removeClass("unselected-button");
        $("#pause-button").addClass("selected-button");
        $("#play-button").removeClass("selected-button");
        $("#play-button").addClass("unselected-button");
    }
});
$("#play-button").click(() => {
    if (paused) {
        paused = false;
        $("#play-button").removeClass("unselected-button");
        $("#play-button").addClass("selected-button");
        $("#pause-button").removeClass("selected-button");
        $("#pause-button").addClass("unselected-button");
        runTick();
    }
});
$("#terrain-select-button").click(() => {
    if (selectType !== "terrain") {
        selectType = "terrain";
        cellSelected = null;
        creatureSelected = null;

        $(".info-box").addClass("hidden");
        $("#terrain-info-box").removeClass("hidden");
        $("#terrain-select-button").removeClass("unselected-button");
        $("#terrain-select-button").addClass("selected-button");
        $("#creature-select-button").removeClass("selected-button");
        $("#creature-select-button").addClass("unselected-button");

        $(".creature-info").html("");
        drawCanvas();   
    }
});
$("#creature-select-button").click(() => {
    if (selectType !== "creature") {
        selectType = "creature";
        cellSelected = null;
        creatureSelected = null;

        $(".info-box").addClass("hidden");
        $("#creature-info-box").removeClass("hidden");
        $("#creature-select-button").removeClass("unselected-button");
        $("#creature-select-button").addClass("selected-button");
        $("#terrain-select-button").removeClass("selected-button");
        $("#terrain-select-button").addClass("unselected-button");

        $(".terrain-info").html("");
        drawCanvas();
    }
});

canvas.addEventListener("mousedown", setMouseDown, false);
canvas.addEventListener("mouseup", setMouseUp, false);
canvas.addEventListener("mousemove", moveView, false);