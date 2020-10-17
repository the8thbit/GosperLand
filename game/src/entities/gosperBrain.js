class GosperBrain {
    constructor(inputNodeCount, parent=null) {
        if (parent) {
            this.mutationRate = parent.mutationRate;
            this.complexity = parent.complexity;

            this.nodeCounts = JSON.parse(JSON.stringify(parent.nodeCounts));
            this.weights = JSON.parse(JSON.stringify(parent.weights));
            this.nodeCounts[0] = inputNodeCount; 
            this.weights[0].length = inputNodeCount;
        } else {
            this.mutationRate = 0.1;

            this.nodeCounts = []; 
            this.nodeCounts.push(inputNodeCount);
            for (let i=0; i<randIntBetween(0, 3); i++) {
                this.nodeCounts.push(randIntBetween(1, 64));
            }
            this.nodeCounts.push(1);
            this.weights = [];

            for (let i=0; i<this.nodeCounts.length; i++) {
                this.weights.push(new Array());
                let weightCount = this.nodeCounts[i];
                if (i > 0) {
                    weightCount *= this.nodeCounts[i-1];
                }
                for (let j=0; j<weightCount; j++) {
                    this.weights[i].push((Math.random()-0.5)*2);
                }
            }
            this.complexity = 0.00001;
            for (let i=0; i<this.nodeCounts.length; i++) {
                this.complexity *= this.nodeCounts[i];
            }
        }
    }

    mutateWeights() {
        //very small chance of adding or removing a hidden layer
        if (Math.random() < 0.01) {
            let mutationRoll = Math.random();
            if (mutationRoll < 0.5 && this.nodeCounts.length > 2) {
                let layerToCut = randIntBetween(1, this.nodeCounts.length-2);
                this.nodeCounts.splice(layerToCut, 1);
                this.weights.splice(layerToCut, 1);
            } else if (mutationRoll > 0.5 && this.nodeCounts.length < 5) {
                let posToAddNewLayer = randIntBetween(1,this.nodeCounts.length-2);
                this.nodeCounts.splice(posToAddNewLayer, 0, randIntBetween(1, 64));
                this.weights.splice(posToAddNewLayer, 0, new Array());
                for (let i=0; i<this.nodeCounts[posToAddNewLayer]; i++) {
                    this.weights[posToAddNewLayer].push((Math.random()-0.5)*2);
                }
            }
        }

        //small chance of adding or removing neurons in a random hidden layer
        if (Math.random() < 0.1) {
            let layerToModify = randIntBetween(1, this.nodeCounts.length-2);
            let newCount = Math.max(1, Math.min(64, this.nodeCounts[layerToModify] + randIntBetween(-3,3)));
            if (newCount >= this.nodeCounts[layerToModify]) {
                let numberOfNewWeights = newCount - this.nodeCounts[layerToModify];
                for (let i=0; i<numberOfNewWeights; i++) {
                    this.weights[layerToModify].push((Math.random()-0.5)*2);
                }
            } else {
                this.weights[layerToModify].length = newCount;
            }
            this.nodeCounts[layerToModify] = newCount;
        }

        //choose 50 random weights and modify them by a random value who's range is determined by mutationRate
        for (let i=0; i<50; i++) {
            let layerToMutate = randIntBetween(0, this.weights.length-1);
            let weightToMutate = randIntBetween(0, this.weights[layerToMutate].length-1);
            this.weights[layerToMutate][weightToMutate] += (Math.random()-0.5)*this.mutationRate;
        }

        this.complexity = 0.00001;
        for (let i=0; i<this.nodeCounts.length; i++) {
            this.complexity *= this.nodeCounts[i];
        }
    }

    evaluateInputs(inputs, layer=0) {
        let layerOutputs = [];

        for (let i=0; i<this.nodeCounts[layer+1]; i++) {
            let output = 0;
            for (let j=0; j<this.nodeCounts[layer]; j++) {
                if (inputs[j]) {
                    if (layer === 0) {
                        inputs[j] *= this.weights[layer][j];
                    }
                    output += this.activationFunc(inputs[j]*this.weights[layer+1][this.nodeCounts[layer]*i + j]);
                    //output += inputs[j]*this.weights[layer+1][this.nodeCounts[layer]*i + j];
                }
            }
            layerOutputs.push(output);
        }

        if (layer+1 < this.nodeCounts.length-1) {
            return this.evaluateInputs(layerOutputs, layer+1);
        } else {
            return layerOutputs[0];
        }
    }

    activationFunc(value) {
        return ((value/(1 + Math.abs(value))) > Math.random());
    }
}