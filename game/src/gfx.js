class Gfx {
    constructor() {
        this.canvas = document.getElementById("canvas");
        this.ctx = canvas.getContext("2d");

        this.x_viewPos = 0;
        this.y_viewPos = 0;
        this.viewZoom = 1; 
        this.viewPosMoveRate = 1.5;

        this.tileWidth = Math.floor(32*this.viewZoom/2)*2;
        this.tileHeight = Math.floor(32*this.viewZoom/2)*2;
        this.tileBorderThickness = Math.floor(1*this.viewZoom);
        this.bodyPadding = $('body').innerWidth()-$('body').width();

        this.redrawInterval = 0;
        this.ticksUntilRedraw = this.redrawInterval;

        this.visibleSigFigs = 5;
    }
    init() {
        this.ctx.scale(this.viewZoom, this.viewZoom);
        this.resizeCanvas(window.innerWidth, window.innerHeight);
        this.x_viewPos = Math.round(this.x_tilePosToPxPos(GLOBAL.map.worldWidth)/2 - this.canvas.width/2);
        this.y_viewPos = Math.round(this.y_tilePosToPxPos(GLOBAL.map.worldHeight)/2 - this.canvas.height/2);
        $("#game-speed").html(GLOBAL.timing.gameSpeed);
        this.updateGameInfoBox();
    }
    zoomIn() {
        if (this.viewZoom < 1) {
            this.viewZoom *= 2;
            this.tileWidth = Math.floor(32*this.viewZoom/2)*2;
            this.tileHeight = Math.floor(32*this.viewZoom/2)*2;
            this.tileBorderThickness = Math.floor(1*this.viewZoom);
            this.ctx.scale(this.viewZoom, this.viewZoom);
            this.moveView(0,0);
            this.drawCanvas();
            if (this.viewZoom >= 1) {
                this.alterInterface(
                    ["#zoom-in-button"], //disable
                    ["#zoom-out-button"] //enable
                );
            } else {
                this.alterInterface(
                    [], //disable
                    ["#zoom-out-button"] //enable
                );
            }
        }
    }
    zoomOut() {
        if (this.tileWidth/2 >= 2 && this.tileHeight/2 >= 2) {
            this.viewZoom /= 2;
            this.ctx.scale(this.viewZoom, this.viewZoom);
            this.tileWidth = Math.floor(32*this.viewZoom/2)*2;
            this.tileHeight = Math.floor(32*this.viewZoom/2)*2;
            this.tileBorderThickness = Math.floor(1*this.viewZoom);
            this.resizeCanvas(window.innerWidth, window.innerHeight);
            this.moveView(-this.canvas.width, -this.canvas.height);
            this.drawCanvas();
            if (this.tileWidth/2 < 2 || this.tileHeight/2 < 2) {
                this.alterInterface(
                    ["#zoom-out-button"], //disable
                    ["#zoom-in-button"] //enable
                );
            } else {
                this.alterInterface(
                    [], //disable
                    ["#zoom-in-button"] //enable
                );
            }
        }
    }
    resizeCanvas(baseWidth, baseHeight) {
        let widthMod = 0;
        let heightMod = 0;
        
        widthMod -= $("#control-panel").outerWidth();
        widthMod -= $("#info-panel").outerWidth();
        widthMod -= this.bodyPadding;
        widthMod -= $('#canvas').outerWidth() - $('#canvas').width();
        heightMod -= this.bodyPadding;
        heightMod -= $('#canvas').outerHeight() - $('#canvas').height();
        this.canvas.width = baseWidth + widthMod;
        this.canvas.height = baseHeight + heightMod;
    }
    moveView(x_delta, y_delta) {
        let worldWidthPx = this.x_tilePosToPxPos(GLOBAL.map.worldWidth);
        let worldHeightPx = this.y_tilePosToPxPos(GLOBAL.map.worldHeight);

        if (worldWidthPx >= this.canvas.width) {
            this.x_viewPos -= Math.round(x_delta);
            this.x_viewPos = Math.max(this.x_viewPos, 0);
            this.x_viewPos = Math.min(this.x_viewPos, worldWidthPx-this.canvas.width);
        } else {
            this.x_viewPos = Math.round(-(this.canvas.width-worldWidthPx)/2);
        }
        if (worldHeightPx >= this.canvas.height) {
            this.y_viewPos -= Math.round(y_delta);
            this.y_viewPos = Math.max(this.y_viewPos, 0);
            this.y_viewPos = Math.min(this.y_viewPos, worldHeightPx-this.canvas.height);
        } else {
            this.y_viewPos = Math.round(-(this.canvas.height-worldHeightPx)/2);
        }
        this.drawCanvas();
    }
    drawCanvas() {
        this.ctx.setTransform(1,0,0,1,0,0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.translate(-this.x_viewPos, -this.y_viewPos);
        this.drawGrid();
    }
    drawGrid() {
        let i_min = Math.max(0, Math.floor(this.x_pxPosToTilePos(this.x_viewPos)));
        let i_max = Math.min(GLOBAL.map.worldWidth-1, i_min + Math.ceil(this.x_pxPosToTilePos(this.canvas.width)) + 1);
        let j_min = Math.max(0, Math.floor(this.y_pxPosToTilePos(this.y_viewPos)));
        let j_max = Math.min(GLOBAL.map.worldHeight-1, j_min + Math.ceil(this.y_pxPosToTilePos(this.canvas.height)) + 1);

        for (let i=i_min; i <= i_max; i++) {
            for (let j=j_min; j <= j_max; j++) {
                this.drawTile(i, j);
            }      
        }
    }
    drawTile(x, y) {
        let tile = GLOBAL.map.tileGrid[x][y];
        let color = tile.color;
        let gosperIndex = tile.gosperIndex;
        let isSelected = false;
        let x_tileBasePos = this.tileBorderThickness+(x*(this.tileWidth+this.tileBorderThickness));
        let y_tileBasePos = this.tileBorderThickness+(y*(this.tileHeight+this.tileBorderThickness));

        if (GLOBAL.map.tileSelected) {
            if (GLOBAL.map.tileSelected.x === x && GLOBAL.map.tileSelected.y === y) {
                isSelected = true;
                this.ctx.fillStyle = "yellow";
                this.ctx.fillRect(
                    x_tileBasePos-this.tileBorderThickness,
                    y_tileBasePos-this.tileBorderThickness,
                    this.tileWidth+2,
                    this.tileHeight+2
                );
            }
        } else if (GLOBAL.map.gosperSelected) {
            if (GLOBAL.map.gosperSelected.x === x && GLOBAL.map.gosperSelected.y === y) {
                isSelected = true;
                this.ctx.fillStyle = "cyan";
                this.ctx.fillRect(
                    x_tileBasePos-this.tileBorderThickness,
                    y_tileBasePos-this.tileBorderThickness,
                    this.tileWidth+2,
                    this.tileHeight+2
                );
            }
        }
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x_tileBasePos+isSelected,
            y_tileBasePos+isSelected,
            this.tileWidth-(isSelected*2),
            this.tileHeight-(isSelected*2)
        );

        if (gosperIndex !== null) {
            let gosper = GLOBAL.map.gosperList[gosperIndex];
            if (this.viewZoom >= 0.5) {
                let borderRed = 255;
                let borderBlue = 255;
                let borderGreen = 255;
                if (gosper.age <= gosper.minReproductiveAge) {
                    borderRed = 255/gosper.minReproductiveAge*gosper.age;
                    borderBlue = 255/gosper.minReproductiveAge*gosper.age;
                } else if (gosper.age >= gosper.maxReproductiveAge) {
                    borderRed = 255*(gosper.maxAge-gosper.age)/(gosper.maxAge-gosper.maxReproductiveAge);
                    borderGreen = 255*(gosper.maxAge-gosper.age)/(gosper.maxAge-gosper.maxReproductiveAge);
                }

                if (gosper.energy <= gosper.maxEnergy * 0.2) {
                    borderRed = Math.max(0, borderRed - 255*(1-(gosper.energy/(gosper.maxEnergy*0.2))));
                    borderBlue = Math.max(0, borderBlue - 255*(1-(gosper.energy/(gosper.maxEnergy*0.2))));
                    borderGreen = Math.max(0, borderGreen - 255*(1-(gosper.energy/(gosper.maxEnergy*0.2))));
                }

                this.ctx.fillStyle = this.rgbToHex(borderRed, borderGreen, borderBlue);
                this.ctx.fillRect(
                    x_tileBasePos+Math.floor(this.viewZoom*4),
                    y_tileBasePos+Math.floor(this.viewZoom*4),
                    this.tileWidth-Math.floor(this.viewZoom*8),
                    this.tileHeight-Math.floor(this.viewZoom*8)
                );
                this.ctx.fillStyle = this.rgbToHex(gosper.color[0], gosper.color[1], gosper.color[2]);
                this.ctx.fillRect(
                    x_tileBasePos+Math.floor(this.viewZoom*6),
                    y_tileBasePos+Math.floor(this.viewZoom*6),
                    this.tileWidth-Math.floor(this.viewZoom*12),
                    this.tileHeight-Math.floor(this.viewZoom*12)
                );
                if (gosper.action === "move") {
                    this.ctx.fillStyle = "white";
                    this.ctx.fillRect(
                        x_tileBasePos+Math.floor(this.viewZoom*14),
                        y_tileBasePos+Math.floor(this.viewZoom*14),
                        this.tileWidth-Math.floor(this.viewZoom*28),
                        this.tileHeight-Math.floor(this.viewZoom*28)
                    );
                } else if (gosper.action === "bud") {
                    this.ctx.fillStyle = "black";
                    this.ctx.fillRect(
                        x_tileBasePos+Math.floor(this.viewZoom*14),
                        y_tileBasePos+Math.floor(this.viewZoom*14),
                        this.tileWidth-Math.floor(this.viewZoom*28),
                        this.tileHeight-Math.floor(this.viewZoom*28)
                    );
                }
            } else {
                this.ctx.fillStyle = "white";
                this.ctx.fillRect(
                    x_tileBasePos,
                    y_tileBasePos,
                    this.tileWidth,
                    this.tileHeight
                );
                this.ctx.fillStyle = this.rgbToHex(gosper.color[0], gosper.color[1], gosper.color[2]);
                this.ctx.fillRect(
                    x_tileBasePos+1,
                    y_tileBasePos+1,
                    this.tileWidth-2,
                    this.tileHeight-2
                );
            }
        }
    }
    updateCanvas(tickDelta) {
        this.ticksUntilRedraw -= tickDelta;
        if (this.ticksUntilRedraw <= 0) {
            this.ticksUntilRedraw = this.redrawInterval;
            this.drawCanvas();
        }
    }
    selectEntity(x_screnPos, y_screenPos) {
        let x = x_screnPos - this.bodyPadding - 174 + this.x_viewPos;
        let y = y_screenPos - this.bodyPadding + this.y_viewPos;
        let x_tilePos = this.x_pxPosToTilePos(x);
        let y_tilePos = this.y_pxPosToTilePos(y);
        let tile = GLOBAL.map.tileGrid[x_tilePos][y_tilePos];
        let gosperIndex = tile.gosperIndex;
        let gosper = GLOBAL.map.gosperList[gosperIndex];

        if (GLOBAL.input.selectType === "tile") {
            this.setTileInfo(tile);
        } else {
            this.setGosperInfo(gosper);
        }
    }
    setTileInfo(tile) {
        let gosper = GLOBAL.map.gosperList[tile.gosperIndex];
        GLOBAL.map.tileSelected = tile;
        GLOBAL.map.gosperSelected = null;

        $("#tile-difficulty").html(tile.difficulty.toFixed(this.visibleSigFigs));
        $("#tile-advantage").html(tile.advantage.toFixed(this.visibleSigFigs));
        $("#tile-light").html(tile.light.toFixed(this.visibleSigFigs));
        if (gosper) {
            $("#tile-gosper").html(gosper.name);
        } else {
            $("#tile-gosper").html("");
        }
        $("#tilex").html(tile.x);
        $("#tiley").html(tile.y);
        this.drawCanvas();
    }

    setGosperInfo(gosper) {
        if (gosper) {
            GLOBAL.map.gosperSelected = gosper;
            GLOBAL.map.tileSelected = null;

            $("#gosper-name").html(gosper.name);
            $("#gosper-action").html(gosper.action);
            $("#gosper-action-progress").html(gosper.actionProgress.toFixed(this.visibleSigFigs));
            $("#gosper-alive").html(gosper.isAlive);
            $("#gosper-photosynth").html(gosper.photoSynth.toFixed(this.visibleSigFigs));
            $("#gosper-energy").html(gosper.energy.toFixed(this.visibleSigFigs));
            $("#gosper-max-energy").html(gosper.maxEnergy.toFixed(this.visibleSigFigs));
            $("#gosper-age").html(gosper.age.toFixed(this.visibleSigFigs));
            $("#gosper-max-age").html(gosper.maxAge.toFixed(this.visibleSigFigs));
            $("#gosper-move-freq").html(gosper.moveFreq.toFixed(this.visibleSigFigs));
            $("#gosper-bud-freq").html(gosper.budFreq.toFixed(this.visibleSigFigs));
            $("#gosper-min-bud-age").html(gosper.minBudAge.toFixed(this.visibleSigFigs));
            $("#gosper-max-bud-age").html(gosper.maxBudAge.toFixed(this.visibleSigFigs));
            $("#gosper-move-speed").html(gosper.moveSpeed.toFixed(this.visibleSigFigs));
            $("#gosper-bud-speed").html(gosper.budSpeed.toFixed(this.visibleSigFigs));
            this.drawCanvas();
        }
    }
    alterInterface(selectArray=[], enableArray=[], hideArray=[], unhideArray=[], clearArray=[]) {
        for (let i=0; i<selectArray.length; i++) {
            $(selectArray[i]).removeClass("enabled-button");
            $(selectArray[i]).addClass("disabled-button");
        }
        for (let i=0; i<enableArray.length; i++) {
            $(enableArray[i]).removeClass("disabled-button");
            $(enableArray[i]).addClass("enabled-button");
        }
        for (let i=0; i<hideArray.length; i++) {
            $(hideArray[i]).addClass("hidden");
        }
        for (let i=0; i<unhideArray.length; i++) {
            $(unhideArray[i]).removeClass("hidden");
        }
        for (let i=0; i<clearArray.length; i++) {
            $(clearArray[i]).html("");
        }
    }
    updateGameInfoBox() {
        $("#game-fps").html(GLOBAL.timing.fps.toFixed(this.visibleSigFigs));
        $("#game-total-gospers").html(GLOBAL.map.totalGosperCount);
        $("#game-live-gospers").html(GLOBAL.map.liveGosperCount);
        $("#game-longest-lineage").html(GLOBAL.map.longestLineage);
        setTimeout(this.updateGameInfoBox.bind(this), 500);
    }
    x_tilePosToPxPos(x_tilePos) {
        return Math.max(0, x_tilePos*(this.tileWidth+(this.tileBorderThickness))+this.tileBorderThickness); 
    }
    y_tilePosToPxPos(y_tilePos) {
        return Math.max(0, y_tilePos*(this.tileHeight+(this.tileBorderThickness))+this.tileBorderThickness); 
    }
    x_pxPosToTilePos(x_pxPos) {
        return Math.max(0, Math.floor((x_pxPos-this.tileBorderThickness)/(this.tileWidth+this.tileBorderThickness)));
    }
    y_pxPosToTilePos(y_pxPos) {
        return Math.max(0, Math.floor((y_pxPos-this.tileBorderThickness)/(this.tileHeight+this.tileBorderThickness)));
    }
    hslToHex(h, s, l) {
        let rgb = this.hslToRgb(h, s, l);
        return this.rgbToHex(rgb[0], rgb[1], rgb[2]);
    }
    hslToRgb(h, s, l) {
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
    rgbToHex(r, g, b) {
        let componentToHex = (c) => {
            var hex = Math.floor(c).toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }
}