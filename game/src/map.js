class Map {
    constructor() {
        this.worldWidth = 180;
        this.worldHeight = 120;
        this.maxGospers = -1;
        this.spawnCooldown = 1;
        this.timeUntilNextSpawn = 0;

        this.noiseSeeds = [];
        this.tileGrid = [];
        this.tileShimmerList = [];
        this.gosperList = [];
        this.availGosperList = [];

        this.totalGosperCount = 0;
        this.liveGosperCount = 0;
        this.gosperCorpseCount = 0;
        this.longestLineage = 0;
        this.timeOfDay = 1.0;
        this.dayTime = 1.0;
        this.updateAllTiles = false;

        this.tileSelected = null;
        this.gosperSelected = null;
    }
    init() {
        for (let i=0; i<3; i++) {
            this.noiseSeeds.push([]);
            for (let j=0; j<=8; j++) {
                this.noiseSeeds[i].push(Math.random());
            }
        }
        this.populateTiles(this.worldWidth, this.worldHeight);
    }
    increaseTimeOfDay() {
        this.timeOfDay += GLOBAL.timing.timeAdjust(0.1 * this.dayTime);
        if (this.timeOfDay >= 2.0) {
            this.timeOfDay = 2.0;
            this.dayTime = -1.0;
        } else if (this.timeOfDay <= -1.0) {
            this.timeOfDay = -1.0;
            this.dayTime = 1.0;
        }

        if (this.timeOfDay >= 0.2 && this.timeOfDay <= 0.8) {
            $("#sun-filter").css("background-color", `rgba(
                0,
                0,
                0,
                `+(1-(Math.min(0.8, Math.max(0.2, this.timeOfDay))+0.2))+`
            ) `);
        }
    }
    updateMap() {
        this.spawnCooldown = this.liveGosperCount * 0.001;
        this.timeUntilNextSpawn += GLOBAL.timing.timeAdjust(1);
        let coolDown = Math.max(this.spawnCooldown, 0.001);
        if (this.timeUntilNextSpawn >= coolDown) {
            let spawnCount = Math.floor(this.timeUntilNextSpawn/coolDown);
            for (let i=0; i<spawnCount; i++) {
                this.createGosper(
                    randIntBetween(0, this.worldWidth-1),
                    randIntBetween(0, this.worldHeight-1)
                );
            }
            this.timeUntilNextSpawn = this.timeUntilNextSpawn - coolDown*spawnCount;
        }
        this.updateTiles();
        this.updateGospers();
    }
    updateGospers() {
        for (let i=0; i < GLOBAL.map.gosperList.length; i++) {
            if (GLOBAL.map.gosperList[i] !== null) {
                GLOBAL.map.gosperList[i].tick();
            }
        }
    }
    updateTiles() {
        this.increaseTimeOfDay();
        for (let i=0; i < GLOBAL.timing.timeAdjust(this.tileShimmerList.length/20); i++) {
            let j = randIntBetween(0, this.tileShimmerList.length-1);
            this.tileGrid[this.tileShimmerList[j][0]][this.tileShimmerList[j][1]].shimmerTile();
        }

        if (this.updateAllTiles) {
            this.updateAllTiles = false;
            for (let i=0; i < this.worldWidth; i++) {
                for (let j=0; j < this.worldHeight; j++) {
                    this.tileGrid[i][j].updateTile();
                }
            }
        }
    }
    populateTiles(x_size, y_size) {
        this.tileGrid = new Array(x_size);

        for (let i=0; i < this.tileGrid.length; i++) {
            this.tileGrid[i] = new Array(y_size);
        }

        for (let i=0; i < x_size; i++) {
            for (let j=0; j < y_size; j++) {
                this.tileGrid[i][j] = new Tile(i, j);
            }
        }
    }
    createGosper(x, y, parent=null) {
        if (this.tileIsAvailible(x,y) && (this.maxGospers < 0 || this.gosperList.length < this.maxGospers)) {
            this.tileGrid[x][y].changed = true;
            let gosperIndex = this.gosperList.length;
            if (this.availGosperList.length) {
                gosperIndex = this.availGosperList.pop();
                this.tileGrid[x][y].gosperIndex = gosperIndex;
                this.gosperList[gosperIndex] = new Gosper(gosperIndex, x, y, parent);
            } else {
                this.tileGrid[x][y].gosperIndex = this.gosperList.length;
                this.gosperList.push(new Gosper(this.gosperList.length, x, y, parent));
                
            }
            this.totalGosperCount += 1;
            this.liveGosperCount += 1;
            return gosperIndex;
        }
    }
    
    tileIsAvailible(x, y) {
        if (
            x >= 0 &&
            y >= 0 &&
            this.tileGrid.length > x &&
            this.tileGrid[x].length > y &&
            this.tileGrid[x][y].gosperIndex === null
        ) {
            return true;
        } else {
            return false;
        }
    }    
}
