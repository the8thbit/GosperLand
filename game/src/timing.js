class Timing {
    constructor() {
        this.tickInterval = 0;
        this.fpsInterval = 250;
        this.frameDependent = false;
        this.ticksAtLastFPSCheck = 0;
        this.ticksSinceLastFPSCheck = 0;
        this.startFrameTime = new Date();
        this.endFrameTime = new Date();
        this.timeDelta = 0;
        this.gameSpeed = 1;
        this.maxAdjust = 0.2;
        this.totalTickCount = 0;
        this.timeElapsed = 0;
        this.fps = 0;
        this.paused = false;
        setTimeout(this.calculateFps.bind(this), 1);
    }
    runTick() {
        this.startFrameTime = new Date();
        this.timeDelta = (this.startFrameTime - this.endFrameTime);

        if (this.frameDependent) { this.timeDelta = 1; }

        GLOBAL.gfx.moveView(GLOBAL.input.x_momentum, GLOBAL.input.y_momentum);
        if (GLOBAL.input.mouseDown) {
            GLOBAL.input.x_momentum = 0;
            GLOBAL.input.y_momentum = 0;
        } else {
            if (GLOBAL.input.x_momentum > 0) {
                GLOBAL.input.x_momentum -= GLOBAL.input.x_momentum_degrade * this.timeDelta;
                GLOBAL.input.x_momentum = Math.max(GLOBAL.input.x_momentum, 0);
            } else if (GLOBAL.input.x_momentum < 0) {
                GLOBAL.input.x_momentum += GLOBAL.input.x_momentum_degrade * this.timeDelta;
                GLOBAL.input.x_momentum = Math.min(GLOBAL.input.x_momentum, 0);
            }

            if (GLOBAL.input.y_momentum > 0) {
                GLOBAL.input.y_momentum -= GLOBAL.input.y_momentum_degrade * this.timeDelta;
                GLOBAL.input.y_momentum = Math.max(GLOBAL.input.y_momentum, 0);
            } else if (GLOBAL.input.y_momentum < 0) {
                GLOBAL.input.y_momentum += GLOBAL.input.y_momentum_degrade * this.timeDelta;
                GLOBAL.input.y_momentum = Math.min(GLOBAL.input.y_momentum, 0);
            }
        }
        this.totalTickCount += 1;
        if(!this.paused) {
            GLOBAL.map.updateMap();
            if (GLOBAL.map.tileSelected) {
                GLOBAL.gfx.setTileInfo(GLOBAL.map.tileSelected);
            } else if (GLOBAL.map.gosperSelected) {
                GLOBAL.gfx.setGosperInfo(GLOBAL.map.gosperSelected);
            }
        }
        GLOBAL.gfx.updateCanvas(1);
        this.endFrameTime = new Date();
        setTimeout(this.runTick.bind(this), this.tickInterval);
    }
    timeAdjust(valueToAdjust) {
        let adjustRate = Math.min(this.maxAdjust, this.timeDelta/1000 * this.gameSpeed);
        return valueToAdjust * adjustRate;
    }
    framerateAdjust(valueToAdjust) {
        let adjustRate = this.timeDelta/1000;
        return valueToAdjust * adjustRate;
    }
    calculateFps() {
        let lastfps = this.fps;
        this.ticksSinceLastFPSCheck = this.totalTickCount - this.ticksAtLastFPSCheck;
        this.ticksAtLastFPSCheck = this.totalTickCount;
        this.timeElapsed += this.fpsInterval;
        if (this.fpsInterval !== 0) {
            this.fps = (this.ticksSinceLastFPSCheck/(this.fpsInterval/1000) + lastfps)/2;
        }
        setTimeout(this.calculateFps.bind(this), this.fpsInterval);
    }
}