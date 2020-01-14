class Map {
    constructor() {
        this.worldWidth = 160;
        this.worldHeight = 100;

        this.noiseSeeds = [];
        this.tileGrid = [];
        this.gosperList = [];
        this.availGosperList = [];

        this.totalGosperCount = 0;
        this.liveGosperCount = 0;
        this.longestLineage = 0;

        this.tileSelected = null;
        this.gosperSelected = null;
    }
    init() {
        for (let i=0; i<3; i++) {
            this.noiseSeeds.push([]);
            for (let j=0; j<8; j++) {
                this.noiseSeeds[i].push(Math.random());
            }
        }
        this.populateTiles(this.worldWidth, this.worldHeight);
    }
    populateTiles(x_size, y_size) {
        this.tileGrid = new Array(x_size);

        for (let i=0; i < this.tileGrid.length; i++) {
            this.tileGrid[i] = new Array(y_size);
        }

        for (let i=0; i < x_size; i++) {
            for (let j=0; j < y_size; j++) {
                this.tileGrid[i][j] = new Tile(i, j);
                if (Math.random() > 0.80 && Math.random() > this.tileGrid[i][j].difficulty) {
                    this.createGosper(i, j);
                }
            }
        }
    }
    createGosper(x, y, parent=null) {
        if (this.availGosperList.length) {
            let gosperIndex = this.availGosperList.pop();
            this.tileGrid[x][y].gosperIndex = gosperIndex;
            this.gosperList[gosperIndex] = new Gosper(gosperIndex, x, y, parent);
        } else {
            this.tileGrid[x][y].gosperIndex = this.gosperList.length;
            this.gosperList.push(new Gosper(this.gosperList.length, x, y, parent));
        }
        this.totalGosperCount += 1;
        this.liveGosperCount += 1;
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
