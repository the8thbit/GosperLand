class Gosper {
    constructor(index, x_pos, y_pos, parent=null) {
        this.gosperIndex = index;
        this.uniqueID = GLOBAL.map.totalGosperCount;
        this.parentID = null;
        this.grandparentID = null;
        this.childrenIDs = [];
        this.brain = null;
        this.isAlive = true;
        this.exists = true;
        this.changed = true;
        this.age = 0;
        this.lineageLength = 0;
        this.actionFrequency = 0.1;
        this.brainMutateFrequency = 0.05;

        this.totalPointBankPoints = 200;
        this.attacked = [];
        this.attackedBy = [];
        this.attackedCountdown = 0;

        this.x = x_pos;
        this.y = y_pos;

        this.targetTile = null;
        this.targetGosper = null;
        this.targetGosperIndex = null;
        this.action = null;
        this.actionProgress = 0;

        this.actionSpeed = null;
        this.actionCost = null;

        this.moveCost = 0.001;
        this.budCost = 500;
        this.eatCost = 0.01;
        this.attackCost = 0.01;
        this.lightBaseEnergy = 6.5;
        this.passiveEnergyLoss = 100;
        this.progressToAction = 0;
        this.ageRate = 1;
        this.digestionEnergyGain = 1;
        this.fullEnergyDigestionSpeed = 20;
        this.digestionSpeed = 120;

        this.pointBankStats = [
            //BASE   MOD  MIN MAX  MULT  COMP
            [ 0,     (0), 0,  100, 0.01, (0) ], //PHOTOSYNTH
            [ 0,     (0), 0,  100, 10,   (0) ], //STOMACH_SIZE
            [ 0,     (0), 0,  100, 0.01, (0) ], //ATTACK
            [ 0,     (0), 0,  100, 0.01, (0) ], //DEFENSE
            [ 10.0,  (0), 0,  100, 0.01, (0) ], //MOVE_SPEED
            [ 0.025, (0), 0,  100, 0.01, (0) ], //BUD_SPEED
            [ 1.0,   (0), 0,  100, 0.01, (0) ], //EAT_SPEED
            [ 1.5,   (0), 0,  100, 0.01, (0) ], //ATK_SPEED
            [ 20,    (0), 0,  300, 10,   (0) ], //MAX_ENERGY
            [ 50,    (0), 0,  300, 10,   (0) ], //MAX_AGE
            [ 0.05,  (0), 0,  45,  0.01, (0) ], //MIN_BUD_AGE_REDUCE
            [ 0.05,  (0), 0,  45,  0.01, (0) ]  //MAX_BUD_AGE_BOOST
        ];
        
        this.name = "";
        for (let i=0; i < randIntBetween(3, 10); i++) {
            this.name += String.fromCharCode(randIntBetween(65, 95));
        }

        if (parent === null) {
            this.color = [
                randIntBetween(0, 255),
                randIntBetween(0, 255),
                randIntBetween(0, 255)
            ];
            this.genPointBankStats();

            let inputComplexity = Math.random()-0.2;
            let inputCount = 0;
            this.inputToggles = [];
            for (let i=0; i<55; i++) {
                if (inputComplexity > Math.random()) {
                    this.inputToggles.push(true);
                    inputCount += 1;
                } else {
                    this.inputToggles.push(false);
                } 
            }
            this.brain = new GosperBrain(inputCount*9);
            if (this.brain.complexity > 10) {
                this.kill();
            }

            this.age = Math.floor(this.getPBS(PBS_MAX_AGE)*Math.random()/2);
            this.energy = Math.random() * this.getPBS(PBS_MAX_ENERGY);
            this.foodInStomach = Math.max(0,
                this.getPBS(PBS_STOMACH_SIZE) *
                Math.random()
            );
        } else {
            this.parentID = parent.uniqueID;
            this.grandparentID = parent.parentID;
            this.lineageLength = parent.lineageLength + 1;

            this.color = [
                Math.min(255, Math.max(0, parent.color[0] + randIntBetween(-10, 10))),
                Math.min(255, Math.max(0, parent.color[1] + randIntBetween(-10, 10))),
                Math.min(255, Math.max(0, parent.color[2] + randIntBetween(-10, 10))),
            ];
            this.genPointBankStats(parent);

            this.inputToggles = JSON.parse(JSON.stringify(parent.inputToggles));
            let inputCount = parent.brain.nodeCounts[0];
            if (this.brainMutateFrequency > Math.random()) {
                if (0.05 > Math.random()) {
                    for (let i=0; i<randIntBetween(0,19); i++) {
                        if (Math.random() > 0.5) {
                            let togglePos = randIntBetween(0,54);
                            if (this.inputToggles[togglePos]) {
                                this.inputToggles[togglePos] = false;
                                inputCount -= 1;
                            } else {
                                this.inputToggles[togglePos] = true;
                                inputCount += 1;
                            }
                        }
                    }
                }
                this.brain = new GosperBrain(inputCount*9, parent.brain);
                this.brain.mutateWeights();
                if (this.brain.complexity > 20) {
                    this.kill();
                }
            } else {
                this.brain = parent.brain;
            }

            this.foodInStomach = Math.max(0, parent.foodInStomach/2 - Math.random());
            this.energy = parent.energy/2 - Math.random();
        }

        if (this.lineageLength > GLOBAL.map.longestLineage) {
            GLOBAL.map.longestLineage = this.lineageLength;
        }
    }

    genPointBankStats(parent=null) {
        if (parent===null) {
            let pointsRemaining = this.totalPointBankPoints;
            let raffleTickets = [];

            for (let i=0; i <= 8; i++) {
                let numOfTickets = randIntBetween(1, 5);
                for (let j=0; j < Math.pow(numOfTickets, 2); j++) {
                    raffleTickets.push(i);
                }
            }

            while (pointsRemaining > 0) {
                let roll = randIntBetween(0, raffleTickets.length-1);
                let winner = raffleTickets[roll];

                if (
                    this.pointBankStats[winner][STAT_MAX] === null ||
                    this.pointBankStats[winner][STAT_MOD] < this.pointBankStats[winner][STAT_MAX]
                ) {
                    this.pointBankStats[winner][STAT_MOD] += 1;
                    pointsRemaining -= 1;
                }
            }
        } else {
            this.pointBankStats = JSON.parse(JSON.stringify(parent.pointBankStats)); //deep copy
            let pointsToRealoc = Math.max(0, randIntBetween(-80, 20));
            let pointsRemaining = 0;

            while (pointsToRealoc > 0) {
                let loser = randIntBetween(0, this.pointBankStats.length-1);

                if (
                    this.pointBankStats[loser][STAT_MIN] === null ||
                    this.pointBankStats[loser][STAT_MOD] > this.pointBankStats[loser][STAT_MIN]
                ) {
                    this.pointBankStats[loser][STAT_MOD] -= 1;
                    pointsToRealoc -= 1;
                    pointsRemaining += 1;
                }
            }
            while (pointsRemaining > 0) {
                let winner = randIntBetween(0, this.pointBankStats.length-1);

                if (
                    this.pointBankStats[winner][STAT_MAX] === null ||
                    this.pointBankStats[winner][STAT_MOD] < this.pointBankStats[winner][STAT_MAX]
                ) {
                    this.pointBankStats[winner][STAT_MOD] += 1;
                    pointsRemaining -= 1;
                }
            }
        }
        for (let i=0; i<this.pointBankStats.length; i++) {
            this.pointBankStats[i][STAT_COMP] = 
                this.pointBankStats[i][STAT_BASE] + 
                (this.pointBankStats[i][STAT_MOD]*this.pointBankStats[i][STAT_MULT])
            ;
        }
    }

    getPBS(statConst) {
        return this.pointBankStats[statConst][STAT_COMP];
    }

    getMinBudAge() {
        let maxAge = this.getPBS(PBS_MAX_AGE);
        let minBudAgeReduce = this.getPBS(PBS_MIN_BUD_AGE_REDUCE);
        return (maxAge * (0.50-minBudAgeReduce));
    }
    getMaxBudAge() {
        let maxAge = this.getPBS(PBS_MAX_AGE);
        let maxBudAgeBoost = this.getPBS(PBS_MAX_BUD_AGE_BOOST);
        return (maxAge * (0.50+maxBudAgeBoost));
    }

    //meter changing functions
    digestFood() {
        if (this.foodInStomach > 0) {
            if (this.energy < this.getPBS(PBS_MAX_ENERGY)) {
                let modifier = Math.min(1.0, this.foodInStomach/GLOBAL.timing.timeAdjust(this.digestionSpeed));
                this.changeEnergy(this.digestionSpeed * this.digestionEnergyGain * modifier);
                this.foodInStomach -= GLOBAL.timing.timeAdjust(this.digestionSpeed) * modifier;
            } else {
                let modifier = Math.min(1.0, this.foodInStomach/GLOBAL.timing.timeAdjust(this.fullEnergyDigestionSpeed));
                this.foodInStomach -= GLOBAL.timing.timeAdjust(this.fullEnergyDigestionSpeed) * modifier;
            }
            
        }
    }
    changeEnergy(energyDelta) {
        this.energy += GLOBAL.timing.timeAdjust(energyDelta);
    }
    changeEnergyTimeIndependent(energyDelta) {
        this.energy += energyDelta;
    }
    changeAge(ageDelta) {
        this.age += GLOBAL.timing.timeAdjust(ageDelta);
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
        if (this.progressToAction < 1) {
            this.progressToAction += GLOBAL.timing.timeAdjust(Math.random());
            this.action = ACTION_WAIT;
            this.clearAction();
            this.changed = false;
        } else {
            this.progressToAction -= 1;
            let i_min = Math.max(0, this.x-1);
            let i_max = Math.min(GLOBAL.map.worldWidth-1, this.x+1);
            let j_min = Math.max(0, this.y-1);
            let j_max = Math.min(GLOBAL.map.worldHeight-1, this.y+1);
    
            let inputs = [];

            for (let i=i_min; i <= i_max; i++) {
                for (let j=j_min; j <= j_max; j++) {
                    let tile = GLOBAL.map.tileGrid[i][j];
                    let gosper = null;

                    if (tile.gosperIndex) {
                        gosper = GLOBAL.map.gosperList[tile.gosperIndex];
                    }

                    if (this.inputToggles[0]) { inputs.push(this.x-i); }
                    if (this.inputToggles[1]) { inputs.push(this.y-j); }
                    if (this.inputToggles[2]) { inputs.push(GLOBAL.map.tileGrid[this.x][this.y].difficulty - tile.difficulty); }
                    if (this.inputToggles[3]) { inputs.push(GLOBAL.map.tileGrid[this.x][this.y].advantage - tile.advantage); }
                    if (this.inputToggles[4]) { inputs.push(GLOBAL.map.tileGrid[this.x][this.y].light - tile.light); }
                    if (this.inputToggles[5]) { inputs.push(tile.difficulty); }
                    if (this.inputToggles[6]) { inputs.push(tile.advantage); }
                    if (this.inputToggles[7]) { inputs.push(tile.light); }

                    if (gosper !== null) {
                        let attacked = false;
                        let attackedBy = false;
                        for (let i=0; i < this.attacked.length; i++) {
                            if (this.attacked[i] === gosper.uniqueID) {
                                attacked = true;
                                break;
                            }
                        }
                        for (let i=0; i < gosper.attacked.length; i++) {
                            if (gosper.attacked[i] === this.uniqueID) {
                                attackedBy = true;
                                break;
                            }
                        }

                        this.inputToggles[8] && inputs.push(NN_IS_OCCUPIED);
                        if (this.inputToggles[9] && this.x === i && this.y === j) {
                            inputs.push(NN_IS_ME);
                        } else if (this.inputToggles[9]) {
                            inputs.push(NN_IS_NOT_ME);
                        }
                        if (this.inputToggles[10] && gosper.isAlive) {
                            inputs.push(NN_IS_ALIVE);
                        } else if (this.inputToggles[10]) {
                            inputs.push(NN_IS_NOT_ALIVE);
                        }
                        if (this.inputToggles[11] && gosper.uniqueID === this.parentID) {
                            inputs.push(NN_IS_PARENT);
                        } else if (this.inputToggles[11]) {
                            inputs.push(NN_IS_NOT_PARENT);
                        }
                        if (this.inputToggles[12] && this.uniqueID === gosper.parentID) {
                            inputs.push(NN_IS_CHILD);
                        } else if (this.inputToggles[12]) {
                            inputs.push(NN_IS_NOT_CHILD);
                        }
                        if (this.inputToggles[13] && gosper.uniqueID === this.grandParentID) {
                            inputs.push(NN_IS_GRANDPARENT);
                        } else if (this.inputToggles[13]) {
                            inputs.push(NN_IS_NOT_GRANDPARENT);
                        }
                        if (this.inputToggles[14] && this.uniqueID === gosper.grandParentID) {
                            inputs.push(NN_IS_GRANDCHILD);
                        } else if (this.inputToggles[14]) {
                            inputs.push(NN_IS_NOT_GRANDCHILD);
                        }
                        if (this.inputToggles[15] && attacked) {
                            inputs.push(NN_ATTACKED);
                        } else if (this.inputToggles[15]) {
                            inputs.push(NN_DID_NOT_ATTACK);
                        }
                        if (this.inputToggles[16] && attackedBy) {
                            inputs.push(NN_ATTACKED_BY);
                        } else if (this.inputToggles[16]) {
                            inputs.push(NN_NOT_ATTACKED_BY);
                        }
                        this.inputToggles[17] && inputs.push(Math.abs(this.color[0] - gosper.color[0]));
                        this.inputToggles[18] && inputs.push(Math.abs(this.color[1] - gosper.color[1]));
                        this.inputToggles[19] && inputs.push(Math.abs(this.color[2] - gosper.color[2]));
                        this.inputToggles[20] && inputs.push(this.getPBS(PBS_PHOTOSYNTH) - gosper.getPBS(PBS_PHOTOSYNTH));
                        this.inputToggles[21] && inputs.push(this.getPBS(PBS_STOMACH_SIZE) - gosper.getPBS(PBS_STOMACH_SIZE));
                        this.inputToggles[22] && inputs.push(this.getPBS(PBS_ATTACK) - gosper.getPBS(PBS_ATTACK));
                        this.inputToggles[23] && inputs.push(this.getPBS(PBS_DEFENSE) - gosper.getPBS(PBS_DEFENSE));
                        this.inputToggles[24] && inputs.push(this.getPBS(PBS_MOVE_SPEED) - gosper.getPBS(PBS_MOVE_SPEED));
                        this.inputToggles[25] && inputs.push(this.getPBS(PBS_BUD_SPEED) - gosper.getPBS(PBS_BUD_SPEED));
                        this.inputToggles[26] && inputs.push(this.getPBS(PBS_EAT_SPEED) - gosper.getPBS(PBS_EAT_SPEED));
                        this.inputToggles[27] && inputs.push(this.getPBS(PBS_ATK_SPEED) - gosper.getPBS(PBS_ATK_SPEED));
                        this.inputToggles[28] && inputs.push(this.getPBS(PBS_MAX_ENERGY) - gosper.getPBS(PBS_MAX_ENERGY));
                        this.inputToggles[29] && inputs.push(this.getPBS(PBS_MAX_AGE) - gosper.getPBS(PBS_MAX_AGE));
                        this.inputToggles[30] && inputs.push(this.getMinBudAge() - gosper.getMinBudAge());
                        this.inputToggles[31] && inputs.push(this.getMaxBudAge() - gosper.getMaxBudAge());
                        this.inputToggles[32] && inputs.push(this.energy - gosper.energy);
                        this.inputToggles[33] && inputs.push(this.age - gosper.age);

                        this.inputToggles[34] && inputs.push(Math.abs(gosper.color[0]));
                        this.inputToggles[35] && inputs.push(Math.abs(gosper.color[1]));
                        this.inputToggles[36] && inputs.push(Math.abs(gosper.color[2]));
                        this.inputToggles[37] && inputs.push(gosper.getPBS(PBS_PHOTOSYNTH));
                        this.inputToggles[38] && inputs.push(gosper.getPBS(PBS_STOMACH_SIZE));
                        this.inputToggles[39] && inputs.push(gosper.getPBS(PBS_ATTACK));
                        this.inputToggles[40] && inputs.push(gosper.getPBS(PBS_DEFENSE));
                        this.inputToggles[41] && inputs.push(gosper.getPBS(PBS_MOVE_SPEED));
                        this.inputToggles[42] && inputs.push(gosper.getPBS(PBS_BUD_SPEED));
                        this.inputToggles[43] && inputs.push(gosper.getPBS(PBS_EAT_SPEED));
                        this.inputToggles[44] && inputs.push(gosper.getPBS(PBS_ATK_SPEED));
                        this.inputToggles[45] && inputs.push(gosper.getPBS(PBS_MAX_ENERGY));
                        this.inputToggles[46] && inputs.push(gosper.getPBS(PBS_MAX_AGE));
                        this.inputToggles[47] && inputs.push(gosper.getMinBudAge());
                        this.inputToggles[48] && inputs.push(gosper.getMaxBudAge());
                        this.inputToggles[49] && inputs.push(gosper.energy);
                        this.inputToggles[50] && inputs.push(gosper.age);

                        this.inputToggles[51] && inputs.push(gosper.energy/gosper.getPBS(PBS_MAX_ENERGY));
                        this.inputToggles[52] && inputs.push(gosper.foodInStomach/gosper.getPBS(PBS_STOMACH_SIZE));
                        this.inputToggles[53] && inputs.push(gosper.age/gosper.getPBS(PBS_MAX_AGE));
                        this.inputToggles[54] && inputs.push(gosper.action);
                    } else {
                        this.inputToggles[8] && inputs.push(NN_IS_NOT_OCCUPIED);
                        this.inputToggles[9] && inputs.push(NN_IS_NOT_ME);
                        this.inputToggles[10] && inputs.push(NN_IS_NOT_ALIVE);
                        this.inputToggles[11] && inputs.push(NN_IS_NOT_PARENT);
                        this.inputToggles[12] && inputs.push(NN_IS_NOT_CHILD);
                        this.inputToggles[13] && inputs.push(NN_IS_NOT_GRANDPARENT);
                        this.inputToggles[14] && inputs.push(NN_IS_NOT_GRANDCHILD);
                        this.inputToggles[15] && inputs.push(NN_DID_NOT_ATTACK);
                        this.inputToggles[16] && inputs.push(NN_NOT_ATTACKED_BY);
                        this.inputToggles[17] && inputs.push(0); // red delta
                        this.inputToggles[18] && inputs.push(0); // green delta
                        this.inputToggles[19] && inputs.push(0); // blue delta
                        this.inputToggles[20] && inputs.push(0); // photosynth delta
                        this.inputToggles[21] && inputs.push(0); // stomach size delta
                        this.inputToggles[22] && inputs.push(0); // attack delta
                        this.inputToggles[23] && inputs.push(0); // defense delta
                        this.inputToggles[24] && inputs.push(0); // move speed delta
                        this.inputToggles[25] && inputs.push(0); // bud speed delta
                        this.inputToggles[26] && inputs.push(0); // eat speed delta
                        this.inputToggles[27] && inputs.push(0); // atk speed delta
                        this.inputToggles[28] && inputs.push(0); // max energy delta
                        this.inputToggles[29] && inputs.push(0); // max age delta
                        this.inputToggles[30] && inputs.push(0); // min bud age delta
                        this.inputToggles[31] && inputs.push(0); // max bud age delta
                        this.inputToggles[32] && inputs.push(0); // current energy delta
                        this.inputToggles[33] && inputs.push(0); // current age delta
                        this.inputToggles[34] && inputs.push(0); // red
                        this.inputToggles[35] && inputs.push(0); // green
                        this.inputToggles[36] && inputs.push(0); // blue
                        this.inputToggles[37] && inputs.push(0); // photosynth
                        this.inputToggles[38] && inputs.push(0); // stomach size
                        this.inputToggles[39] && inputs.push(0); // attack
                        this.inputToggles[40] && inputs.push(0); // defense
                        this.inputToggles[41] && inputs.push(0); // move speed
                        this.inputToggles[42] && inputs.push(0); // bud speed
                        this.inputToggles[43] && inputs.push(0); // eat speed
                        this.inputToggles[44] && inputs.push(0); // atk speed
                        this.inputToggles[45] && inputs.push(0); // max energy
                        this.inputToggles[46] && inputs.push(0); // max age
                        this.inputToggles[47] && inputs.push(0); // min bud age
                        this.inputToggles[48] && inputs.push(0); // max bud age
                        this.inputToggles[49] && inputs.push(0); // current energy
                        this.inputToggles[50] && inputs.push(0); // current age
                        this.inputToggles[51] && inputs.push(0); // energy percent
                        this.inputToggles[52] && inputs.push(0); // food percent
                        this.inputToggles[53] && inputs.push(0); // age percent
                        this.inputToggles[54] && inputs.push(0); // current action
                    }
                }
            }
            
            let tileIndex = 0;
            let actionChoice = this.brain.evaluateInputs(inputs);

            if (actionChoice === 0) {
                this.action = ACTION_WAIT;
            } else if (actionChoice <= 8) {
                this.action = ACTION_MOVE;
                tileIndex = actionChoice;
            } else if (actionChoice <= 16) {
                this.action = ACTION_BUD;
                tileIndex = actionChoice - 8;
            } else if (actionChoice <= 24) {
                this.action = ACTION_EAT;
                tileIndex = actionChoice - 16;
            } else {
                this.action = ACTION_ATTACK;
                tileIndex = actionChoice - 24;
            }
    
            this.targetTile = GLOBAL.map.tileGrid[this.x][this.y];
    
            switch (tileIndex) {
                case(1):
                    if (this.x+1 < GLOBAL.map.worldWidth && this.y+1 < GLOBAL.map.worldHeight) {
                        this.targetTile = GLOBAL.map.tileGrid[this.x+1][this.y+1];
                    }
                    break;
                case(2):
                    if (this.x+1 < GLOBAL.map.worldWidth) {
                        this.targetTile = GLOBAL.map.tileGrid[this.x+1][this.y];
                    }
                    break;
                case(3):
                    if (this.x+1 < GLOBAL.map.worldWidth && this.y-1 >= 0) {
                        this.targetTile = GLOBAL.map.tileGrid[this.x+1][this.y-1];
                    }
                    break;
                case(4):
                    if (this.y+1 < GLOBAL.map.worldHeight) {
                        this.targetTile = GLOBAL.map.tileGrid[this.x][this.y+1];
                    }
                    break;
                case(5):
                    if (this.y-1 >= 0) {
                        this.targetTile = GLOBAL.map.tileGrid[this.x][this.y-1];
                    }
                    break;
                case(6):
                    if (this.x-1 >= 0 && this.y+1 < GLOBAL.map.worldHeight) {
                        this.targetTile = GLOBAL.map.tileGrid[this.x-1][this.y+1];
                    }
                    break;
                case(7):
                    if (this.x-1 >= 0) {
                        this.targetTile = GLOBAL.map.tileGrid[this.x-1][this.y];
                    }
                    break;
                case(8):
                    if (this.x-1 >= 0 && this.y-1 >= 0) {
                        this.targetTile = GLOBAL.map.tileGrid[this.x-1][this.y-1];
                    }
                    break;
            }
    
            if (this.action === ACTION_EAT || this.action === ACTION_ATTACK) {
                if (this.targetTile.gosperIndex && this.targetTile.gosperIndex !== this.gosperIndex) {
                    this.targetGosperIndex = this.targetTile.gosperIndex;
                    this.targetGosper = GLOBAL.map.gosperList[this.targetGosperIndex];
                } else {
                    this.action = ACTION_WAIT;
                }
            }
    
            this.changed = true;
            if (this.action === ACTION_MOVE) {
                this.actionSpeed = this.getPBS(PBS_MOVE_SPEED);
                this.actionCost = this.moveCost;
                this.continueAction();
            } else if (this.action === ACTION_BUD) {
                this.actionSpeed = this.getPBS(PBS_BUD_SPEED);
                this.actionCost = this.budCost;
                this.continueAction();
            } else if (this.action === ACTION_EAT) {
                this.actionSpeed = this.getPBS(PBS_BUD_SPEED);
                this.actionCost = this.eatCost;
                this.continueAction();
            } else if (this.action === ACTION_ATTACK) {
                this.actionSpeed = this.getPBS(PBS_ATK_SPEED);
                this.actionCost = this.attackCost;
                this.attacked.push(this.targetGosper.uniqueID);
                GLOBAL.map.gosperList[this.targetGosperIndex].attackedBy.push(this.uniqueID);
                this.continueAction();
            } else if (this.action === ACTION_WAIT) {
                this.clearAction();
                this.changed = false;
            }
        }
    }

    continueAction() {
        let validAction = true;
        if (this.action === ACTION_MOVE || this.action === ACTION_BUD) {
            if (
                !this.isAlive ||
                !this.targetTile ||
                !GLOBAL.map.tileIsAvailible(this.targetTile.x, this.targetTile.y)
            ) {
                validAction = false;
            }
        } else if (this.action === ACTION_EAT) {
            if (
                !this.isAlive ||
                !this.targetTile ||
                !this.targetGosper ||
                this.targetGosper.isAlive ||
                this.targetGosper.x !== this.targetTile.x ||
                this.targetGosper.y !== this.targetTile.y 
            ) {
                validAction = false;
            }
        } else if (this.action === ACTION_ATTACK) {
            if (
                !this.isAlive ||
                !this.targetTile ||
                !this.targetGosper ||
                !this.targetGosper.isAlive ||
                this.targetGosper.x !== this.targetTile.x ||
                this.targetGosper.y !== this.targetTile.y 
            ) {
                validAction = false;
            }
        }

        if (validAction) {
            this.changeActionProgress(this.actionSpeed);
        } else {
            this.clearAction();
        }
    }

    completeAction() {
        if (this.isAlive) {
            if (this.action === ACTION_BUD) {
                let childGosperIndex = GLOBAL.map.createGosper(this.targetTile.x, this.targetTile.y, this);
                this.childrenIDs.push(GLOBAL.map.gosperList[childGosperIndex].uniqueID);
                this.energy = Math.max(0, this.energy/2 - Math.random());
                this.foodInStomach = Math.max(0, this.foodInStomach/2 - Math.random());
            } else if (this.action === ACTION_MOVE) {
                GLOBAL.map.tileGrid[this.x][this.y].changed = true;
                this.targetTile.gosperIndex = GLOBAL.map.tileGrid[this.x][this.y].gosperIndex;
                GLOBAL.map.tileGrid[this.x][this.y].gosperIndex = null;
                this.x = this.targetTile.x;
                this.y = this.targetTile.y;
                GLOBAL.map.tileGrid[this.x][this.y].changed = true;
            } else if (this.action === ACTION_EAT) {
                let energyToTake = Math.min(this.targetGosper.energy, 20);

                GLOBAL.map.gosperList[this.targetGosperIndex].changeEnergyTimeIndependent(-energyToTake + (Math.random()*10));
                this.foodInStomach = Math.min(
                    this.getPBS(PBS_STOMACH_SIZE),
                    this.foodInStomach+energyToTake
                );
            } else if (this.action === ACTION_ATTACK) {
                if (this.targetGosper) {
                    let advant = GLOBAL.map.tileGrid[this.x][this.y].advantage;
                    let targetAdvant = GLOBAL.map.tileGrid[this.targetGosper.x][this.targetGosper.y].advantage;
                    let attack = advant * this.getPBS(PBS_ATTACK) * Math.random();        
                    let defense = targetAdvant * this.targetGosper.getPBS(PBS_DEFENSE) * Math.random();
                    
                    let damage = Math.max(0, attack-defense) * 1000;

                    this.targetGosper.attackedCountdown = 1;
                    GLOBAL.map.gosperList[this.targetGosperIndex].changeEnergyTimeIndependent(-damage);
                    if (GLOBAL.map.gosperList[this.targetGosperIndex].tryToKill()) { //if get kill hit, give first bite for free (encourage hunting)
                        let energyToTake = Math.min(this.targetGosper.energy, 20);

                        GLOBAL.map.gosperList[this.targetGosperIndex].changeEnergyTimeIndependent(-energyToTake + (Math.random()*10));
                        this.foodInStomach = Math.min(
                            this.getPBS(PBS_STOMACH_SIZE),
                            this.foodInStomach+energyToTake
                        );
                    }
                }
            }
            this.clearAction();
        }
    }
    clearAction() {
        this.changed = true;
        this.action = null;
        this.targetTile = null;
        this.targetGosperIndex = null;
        this.targetGosper = null;
        this.actionSpeed = null;
        this.actionCost = null;
        this.actionProgress = 0;
    }
    tick() {
        if (GLOBAL.gfx.viewZoom >= 0.5 && (
            this.age <= this.getMinBudAge() ||
            this.age >= this.getMaxBudAge() ||
            this.energy <= 0.2*this.getPBS(PBS_MAX_ENERGY)
        )) {
            this.changed = true;
        }
        if (this.isAlive) {
            if (this.action === null) {
                this.chooseAction();
            } else {
                this.continueAction();
            }

            if (this.attackedCountdown > 0) {
                this.attackedCountdown -= GLOBAL.timing.timeAdjust(1);
                if (this.attackedCountdown < 0) {
                    this.attackedCountdown = 0;
                }
            }

            let lightEnergy = this.lightBaseEnergy*GLOBAL.map.tileGrid[this.x][this.y].light;
            this.changeEnergy(-(this.passiveEnergyLoss+this.brain.complexity));
            this.changeEnergy(
                lightEnergy * lightEnergy * lightEnergy * lightEnergy *
                (((Math.min(0.8, Math.max(0.0, GLOBAL.map.timeOfDay))+0.2)/2)+0.5) *
                this.getPBS(PBS_PHOTOSYNTH)
            );
            this.digestFood();
            this.capEnergy(this.getPBS(PBS_MAX_ENERGY));
            this.changeAge(this.ageRate);
            this.tryToKill();
        } else if (this.exists) {
            this.changeEnergy(-this.passiveEnergyLoss/5);
            this.capEnergy(this.getPBS(PBS_MAX_ENERGY));
            this.tryToDestroy();
        }
    }

    capEnergy(energyCap) {
        this.energy = Math.max(0, Math.min(energyCap, this.energy));
    }
    tryToKill() {
        if (this.isAlive) {
            if (
                this.age > this.getPBS(PBS_MAX_AGE) ||
                this.energy <= 0
            ) {
                this.kill();
                return true;
            }
        }
        return false;
    }
    tryToDestroy() {
        if (this.energy <= 0) {
            this.destroy();
        }
    }
    kill() {
        this.isAlive = false;
        this.clearAction();
        GLOBAL.map.tileGrid[this.x][this.y].changed = true;
        this.name = this.name + "'s corpse"
        GLOBAL.map.liveGosperCount -= 1;
        GLOBAL.map.gosperCorpseCount += 1;
        this.energy = this.getPBS(PBS_MAX_ENERGY)/2;
    }
    destroy() {
        this.exists = false;
        GLOBAL.map.tileGrid[this.x][this.y].changed = true;
        GLOBAL.map.tileGrid[this.x][this.y].gosperIndex = null;
        GLOBAL.map.availGosperList.push(this.gosperIndex);
        GLOBAL.map.gosperList[this.gosperIndex] = null;
        this.gosperIndex = null;
        GLOBAL.map.gosperCorpseCount -= 1;
        this.x = -1;
        this.y = -1;
    }


    //utility functions
    getFertilityStatus() {
        let minBudAge = this.getMinBudAge();
        let maxBudAge = this.getMaxBudAge();
        if (this.age < minBudAge) {
            return (-1*(1-(this.age/minBudAge)));
        } else if (this.age > minBudAge) {
            return -1;
        } else {
            return (1-(this.age-minBudAge)/(maxBudAge-minBudAge));
        }
    }
    getSimilarity(targetGosper) {
        let window = this.getFRS(FRS_SIMILARITY_WINDOW);
        let similarity = [1, 1, 1];
        for (let i=0; i < similarity.length; i++) {
            if (this.color[i] > targetGosper.color[i]) {
                similarity[i] = 1-(this.color[i]-targetGosper.color[i])/(window*255);
            } else if (this.color[i] < targetGosper.color[i]) {
                similarity[i] = 1-((targetGosper.color[i]-this.color[i])/(window*255));
            }
        }
        return similarity;
    }
    getParentStatus(targetGosper) {
        if (targetGosper.parentID === this.uniqueID) {
            return true;
        } else {
            return false;
        }
    }
    getGrandParentStatus(targetGosper) {
        if (targetGosper.grandParentID === this.uniqueID) {
            return true;
        } else {
            return false;
        }
    }
    getChildStatus(targetGosper) {
        if (this.parentID === targetGosper.uniqueID) {
            return true;
        } else {
            return false;
        }
    }
    getGrandChildStatus(targetGosper) {
        if (this.grandParentID === targetGosper.uniqueID) {
            return true;
        } else {
            return false;
        }
    }
}