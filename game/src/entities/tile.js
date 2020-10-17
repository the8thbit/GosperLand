class Tile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.changed = true;
        this.zoomUpdateRef = 0;
        this.gosperIndex = null;
        this.hslValues = [];
        this.originalHsl = [];
        this.shimmer = 0;

        for (let i=0; i<3; i++) {
            let influencers = [];
            let baseValues = [];
            for (let j=0; j<4; j++) {
                noise.seed(GLOBAL.map.noiseSeeds[i][j]);
                influencers.push(noise.simplex3(x/50, y/50, GLOBAL.timing.timeElapsed/50) * 0.5 + 0.5);
            }
            noise.seed(GLOBAL.map.noiseSeeds[i][4]);
            baseValues.push((noise.simplex2(x/5, y/5) * 0.5 + 0.5) * influencers[0]);
            noise.seed(GLOBAL.map.noiseSeeds[i][5]);
            baseValues.push((noise.simplex2(x/15, y/15) * 0.5 + 0.5) * influencers[1]);
            noise.seed(GLOBAL.map.noiseSeeds[i][6]);
            baseValues.push((noise.simplex2(x/50, y/50) * 0.5 + 0.5) * influencers[2]);
            noise.seed(GLOBAL.map.noiseSeeds[i][7]);
            baseValues.push((noise.simplex2(x/75, y/75) * 0.5 + 0.5) * influencers[3]);
            noise.seed(GLOBAL.map.noiseSeeds[i][8]);
            this.shimmer = Math.max(0.7, 1 - noise.simplex2(x/50, y/50)) - 0.7;

            if (this.shimmer > 0) {
                GLOBAL.map.tileShimmerList.push([this.x, this.y]);
            }

            let valueSum = 0;
            let influencerSum = 0;
            for (let j=0; j<4; j++) {
                valueSum += baseValues[j];
                influencerSum += influencers[j];
            }
            this.hslValues.push(valueSum/influencerSum);
        }
        this.originalHsl = [];
        this.originalHsl.push(this.hslValues[0]);
        this.originalHsl.push(this.hslValues[1]);
        this.originalHsl.push(this.hslValues[2]);
        this.updateTile();
    }
    shimmerTile() {
        let hslDiff = [];
        hslDiff.push(this.hslValues[0]-this.originalHsl[0]);
        hslDiff.push(this.hslValues[1]-this.originalHsl[1]);
        hslDiff.push(this.hslValues[2]-this.originalHsl[2]);

        this.hslValues[0] -= hslDiff[0]*Math.random();
        this.hslValues[1] -= hslDiff[1]*Math.random();
        this.hslValues[2] -= hslDiff[2]*Math.random();
        this.hslValues[0] += (Math.random() - 0.5)/10 * this.shimmer;
        this.hslValues[1] += (Math.random() - 0.5)/10 * this.shimmer;
        this.hslValues[2] += (Math.random() - 0.5)/10 * this.shimmer;
        this.updateTile();
    }
    updateTile() {
        this.difficulty = this.hslValues[0];
        this.advantage = this.hslValues[1];
        this.light = this.hslValues[2] + (GLOBAL.map.timeOfDay*0.05);

        this.difficulty = Math.min(1, Math.max(0, this.difficulty));
        this.advantage = Math.min(1, Math.max(0, this.advantage));
        this.light = Math.min(1, Math.max(0, this.light));

        this.color = GLOBAL.gfx.hslToHex(
            0.3 + this.difficulty * 0.6,
            this.advantage*0.8 + 0.1,
            (this.light-GLOBAL.map.timeOfDay*0.05) * 0.7
        );
        this.changed = true;
    }
}