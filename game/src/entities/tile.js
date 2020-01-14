class Tile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.gosperIndex = null;

        let hslValues = [];
        for (let i=0; i<3; i++) {
            let influencers = [];
            let baseValues = []; 
            for (let j=0; j<4; j++) {
                noise.seed(GLOBAL.map.noiseSeeds[i][j]);
                influencers.push(noise.simplex2(x/50, y/50) * 0.5 + 0.5);
            }
            noise.seed(GLOBAL.map.noiseSeeds[i][4]);
            baseValues.push((noise.simplex2(x/5, y/5) * 0.5 + 0.5) * influencers[0]);
            noise.seed(GLOBAL.map.noiseSeeds[i][5]);
            baseValues.push((noise.simplex2(x/15, y/15) * 0.5 + 0.5) * influencers[1]);
            noise.seed(GLOBAL.map.noiseSeeds[i][6]);
            baseValues.push((noise.simplex2(x/50, y/50) * 0.5 + 0.5) * influencers[2]);
            noise.seed(GLOBAL.map.noiseSeeds[i][7]);
            baseValues.push((noise.simplex2(x/75, y/75) * 0.5 + 0.5) * influencers[3]);

            let valueSum = 0;
            let influencerSum = 0;
            for (let j=0; j<4; j++) {
                valueSum += baseValues[j];
                influencerSum += influencers[j];
            }
            hslValues.push(valueSum/influencerSum);
        }

        this.difficulty = hslValues[0];
        this.advantage = hslValues[1];
        this.light = hslValues[2];

        this.color = GLOBAL.gfx.hslToHex(
            0.3 + this.difficulty * 0.6,
            this.advantage*0.8 + 0.1,
            this.light * 0.7,
        );
    }
}