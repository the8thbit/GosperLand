class Gosper {
    constructor(index, x_pos, y_pos, parent=null) {
        this.gosperIndex = index;
        this.isAlive = true;
        this.age = 0;
        this.lineageLength = 0;

        this.x = x_pos;
        this.y = y_pos;

        this.targetTile = null;
        this.currentAction = null;

        this.progressToAction = 0;
        this.actionProgress = 0;

        this.actionSpeed = null;
        this.actionCost = null;

        this.baseBudSpeed = 1;
        this.baseMoveSpeed = 1;

        this.moveCost = 5;
        this.budCost = 15;
        this.lightBaseEnergy = 11;
        this.passiveEnergyLoss = 100;
        this.ageRate = 1;

        this.moveSpeedMod = 0;
        this.budSpeedMod = 0;
        this.photoSynthMod = 0;
        this.maxEnergyMod = 0;
        this.maxAgeMod = 0;
        this.minBudAgeMod = 0;
        this.maxBudAgeMod = 0;

        this.name = "";
        for (let i=0; i < randIntBetween(3, 10); i++) {
            this.name += String.fromCharCode(randIntBetween(65, 95));
        }

        if (parent === null) {
            this.progressToAction = Math.random() * 0.5;
            this.color = [
                randIntBetween(0, 255),
                randIntBetween(0, 255),
                randIntBetween(0, 255)
            ];
            this.genPointBankStats();
            this.moveFreq = Math.random() * 2.5;
            this.budFreq = Math.random() * 0.3;
            this.energy = Math.random() * this.maxEnergy;
        } else {
            this.lineageLength = parent.lineageLength + 1;
            this.color = [
                Math.min(255, Math.max(0, parent.color[0] + randIntBetween(-10, 10))),
                Math.min(255, Math.max(0, parent.color[1] + randIntBetween(-10, 10))),
                Math.min(255, Math.max(0, parent.color[2] + randIntBetween(-10, 10))),
            ];
            this.genPointBankStats(parent);
            this.energy = parent.energy/2 - Math.random();
            this.moveFreq = parent.moveFreq + (Math.random() - 0.5)/10;
            this.budFreq = parent.budFreq + (Math.random() - 0.5)/1000;
        }

        if (this.lineageLength > GLOBAL.map.longestLineage) {
            GLOBAL.map.longestLineage = this.lineageLength;
        }
    }
    genPointBankStats(parent=null) {
        if (!parent) {
            let pointsRemaining = 100;
            let raffleTickets = [];

            for (let i=0; i<7; i++) {
                let numOfTickets = randIntBetween(1, 5);
                for (let j=0; j<Math.pow(numOfTickets, 2); j++) {
                    raffleTickets.push(i);
                }
            }

            while (pointsRemaining) {
                let roll = randIntBetween(0, raffleTickets.length-1);
                switch(raffleTickets[roll]) {
                    case 0:
                        if (this.photoSynthMod < 50) {
                            this.photoSynthMod += 1;
                            pointsRemaining -= 1;
                        }
                        break;
                    case 1:
                        if (this.moveSpeedMod < 100) {
                            this.moveSpeedMod += 1;
                            pointsRemaining -= 1;
                        }
                        break;
                    case 2:
                        if (this.budSpeedMod < 100) {
                            this.budSpeedMod += 1;
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
        } else {
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
                        if (this.photoSynthMod > 0) {
                            this.photoSynthMod -= 1;
                        } else {
                            i -= 1;
                        }
                        break;
                    case 1:
                        if (this.moveSpeedMod > 0) { 
                            this.moveSpeedMod -= 1;
                        } else {
                            i -= 1;
                        }
                        break;
                    case 2:
                        if (this.budSpeedMod > 0) {
                            this.budSpeedMod -= 1;
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
        }
        this.photoSynth = Math.min(1, this.photoSynthMod*0.02);
        this.moveSpeed = Math.min(1, this.moveSpeedMod*this.baseMoveSpeed*0.01);
        this.budSpeed = Math.min(1, this.budSpeedMod*this.baseBudSpeed*0.01);
        this.maxEnergy = 20 + this.maxEnergyMod*10;
        this.maxAge = 50 + this.maxAgeMod*10;
        this.minBudAge = this.maxAge*(0.45-this.minBudAgeMod/100);
        this.maxBudAge = this.maxAge*(0.55+this.maxBudAgeMod/100);
    }

    //meter changing functions
    changeEnergy(energyDelta) {
        this.energy += GLOBAL.timing.timeAdjust(energyDelta);
    }
    changeAge(ageDelta) {
        this.age += GLOBAL.timing.timeAdjust(ageDelta);
    }
    changeProgressToAction(progressDelta) {
        this.progressToAction += GLOBAL.timing.timeAdjust(progressDelta);
        if (this.progressToAction >= 1) {
            this.progressToAction = 0;
            this.chooseAction();
        }
    }
    changeActionProgress(progressDelta) {
        this.actionProgress += GLOBAL.timing.timeAdjust(progressDelta);
        this.changeEnergy(-this.actionCost*progressDelta);
        if (this.actionProgress >= this.targetTile.difficulty) {
            this.completeAction();
        }
    }

    //action related functions
    chooseAction() {
        if (Math.random() < this.moveFreq) {
            this.startMove();
            return;
        }
        if (Math.random() < this.budFreq) {
            this.startBud();
            return;
        }
    }
    continueAction() {
        if (GLOBAL.map.tileIsAvailible(this.targetTile.x, this.targetTile.y)) {
            this.changeActionProgress(this.actionSpeed);
        } else {
            this.clearAction();
        }
    }
    completeAction() {
        if (this.isAlive) {
            if (this.action === "bud") {
                GLOBAL.map.createGosper(this.targetTile.x, this.targetTile.y, this);
                this.energy = this.energy/2;
            } else if (this.action === "move") {
                this.targetTile.gosperIndex = GLOBAL.map.tileGrid[this.x][this.y].gosperIndex;
                GLOBAL.map.tileGrid[this.x][this.y].gosperIndex = null;
                this.x = this.targetTile.x;
                this.y = this.targetTile.y;
            }
            this.clearAction();
        }
    }
    clearAction() {
        this.action = null;
        this.targetTile = null;
        this.actionSpeed = null;
        this.actionCost = null;
        this.actionProgress = 0;
    }

    //actions
    startBud() {
        if(
            this.age >= this.minBudAge &&
            this.age <= this.maxBudAge
        ) {
            let availibleTiles = [];
            for (let i=-1; i <= 1; i++) {
                for (let j=-1; j <= 1; j++) {
                    let x_pos = this.x + i;
                    let y_pos = this.y + j;

                    if (GLOBAL.map.tileIsAvailible(x_pos, y_pos)) {
                        availibleTiles.push(GLOBAL.map.tileGrid[x_pos][y_pos]);
                    }
                }
            }
            if (availibleTiles.length) {
                this.action = "bud";
                this.actionSpeed = this.budSpeed;
                this.actionCost = this.budCost;
                this.targetTile = availibleTiles[randIntBetween(0, availibleTiles.length-1)];
                this.continueAction();
            }
        }
    }
    startMove() {
        let availibleTiles = [];
        for (let i=-1; i <= 1; i++) {
            for (let j=-1; j <= 1; j++) {
                let x_pos = this.x + i;
                let y_pos = this.y + j;
                if (GLOBAL.map.tileIsAvailible(x_pos, y_pos)) {
                    availibleTiles.push(GLOBAL.map.tileGrid[x_pos][y_pos]);
                }
            }
        }
        if (availibleTiles.length) {
            this.action = "move";
            this.actionSpeed = this.moveSpeed;
            this.actionCost = this.moveCost;
            this.targetTile = availibleTiles[randIntBetween(0, availibleTiles.length-1)];
            this.continueAction();
        }
    }

    tick() {
        if(!this.action) {
            this.changeProgressToAction(1);
        } else {
            this.continueAction();
        }
        if (this.isAlive) {
            let lightEnergy = this.lightBaseEnergy*GLOBAL.map.tileGrid[this.x][this.y].light;
            this.changeEnergy(-this.passiveEnergyLoss);
            this.changeEnergy(
                lightEnergy * lightEnergy * lightEnergy *
                this.photoSynth
            );
            this.capEnergy(this.maxEnergy);
            this.changeAge(this.ageRate);
            this.tryToKill();
        }
    }
    capEnergy(energyCap) {
        this.energy = Math.min(energyCap, this.energy);
    }
    tryToKill() {
        if (
            this.age > this.maxAge ||
            this.energy <= 0
        ) {
            this.kill();
        }
    }

    kill() {
        if (this.isAlive) {
            this.isAlive = false;
            GLOBAL.map.liveGosperCount -= 1;
            GLOBAL.map.tileGrid[this.x][this.y].gosperIndex = null;
            GLOBAL.map.availGosperList.push(this.gosperIndex);
            GLOBAL.map.gosperList[this.gosperIndex] = null;
            this.gosperIndex = null;
            this.x = -1;
            this.y = -1;
        }
    }
}