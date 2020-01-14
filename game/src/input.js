class Input {
    constructor() {
        this.mouseDown = false;
        this.mouseMoved = false;
        this.x_mouseDownPos = 0;
        this.y_mouseDownPos = 0;
        this.x_lookSpeed = 1.5;
        this.y_lookSpeed = 1.5;
        this.x_momentum_degrade = 0.2;
        this.y_momentum_degrade = 0.2;
        this.x_momentum = 0;
        this.y_momentum = 0;
        this.selectType = "tile";
    }
    init() {
        $("#info-panel").outerHeight(window.innerHeight-4);
        $("#control-panel").outerHeight(window.innerHeight-4);
        GLOBAL.gfx.canvas.addEventListener("mousedown", this.setMouseDown.bind(this), false);
        GLOBAL.gfx.canvas.addEventListener("mouseup", this.setMouseUp.bind(this), false);
        GLOBAL.gfx.canvas.addEventListener("mousemove", this.mouseMove.bind(this), false);
        GLOBAL.gfx.canvas.addEventListener("touchstart", this.setMouseDown.bind(this), false);
        GLOBAL.gfx.canvas.addEventListener("touchend", this.setMouseUp.bind(this), false);
        GLOBAL.gfx.canvas.addEventListener("touchmove", this.mouseMove.bind(this), false);
    
        $(window).resize(() => {
            GLOBAL.gfx.resizeCanvas(window.innerWidth, window.innerHeight);
            $("#info-panel").outerHeight(window.innerHeight-4);
            $("#control-panel").outerHeight(window.innerHeight-4);
        });
        $("#pause-button").click(() => {
            if (!GLOBAL.timing.paused) {
                GLOBAL.timing.paused = true;
                GLOBAL.gfx.alterInterface(
                    ["#pause-button"], //disable
                    ["#play-button"] //enable
                );
            }
        });
        $("#play-button").click(() => {
            if (GLOBAL.timing.paused) {
                GLOBAL.timing.paused = false;
                GLOBAL.gfx.alterInterface(
                    ["#play-button"], //disable
                    ["#pause-button"] //enable
                );
            }
        });
        $("#tile-select-button").click(() => {
            if (this.selectType !== "tile") {
                this.selectType = "tile";
                GLOBAL.map.tileSelected = null;
                GLOBAL.map.gosperSelected = null;
                GLOBAL.gfx.alterInterface(
                    ["#tile-select-button"], //disable
                    ["#gosper-select-button"], //enable
                    [".info-box"], //hide
                    ["#tile-info-box"], //unhide
                    [".gosper-info"] //clear
                );
                GLOBAL.gfx.drawCanvas();   
            }
        });
        $("#gosper-select-button").click(() => {
            if (GLOBAL.map.selectType !== "gosper") {
                this.selectType = "gosper";
                GLOBAL.map.tileSelected = null;
                GLOBAL.map.gosperSelected = null;
                GLOBAL.gfx.alterInterface(
                    ["#gosper-select-button"], //disable
                    ["#tile-select-button"], //enable
                    [".info-box"], //hide
                    ["#gosper-info-box"], //unhide
                    [".tile-info"] //clear
                );
                GLOBAL.gfx.drawCanvas();
            }
        });
        $("#zoom-in-button").click(() => {
            GLOBAL.gfx.zoomIn();
        });
        $("#zoom-out-button").click(() => {
            GLOBAL.gfx.zoomOut();
        });
        $("#speed-up-button").click(() => {
            if (GLOBAL.timing.gameSpeed < 64) {
                GLOBAL.timing.gameSpeed *= 2;
                if (GLOBAL.timing.gameSpeed < 1) {
                    $("#game-speed").html("1/"+1/GLOBAL.timing.gameSpeed);
                } else {
                    $("#game-speed").html(GLOBAL.timing.gameSpeed);
                }
            }
            if (GLOBAL.timing.gameSpeed >= 64) {
                GLOBAL.gfx.alterInterface(
                    ["#speed-up-button"], //disable
                    ["#slow-down-button"] //enable
                );
            } else {
                GLOBAL.gfx.alterInterface(
                    [], //disable
                    ["#slow-down-button"] //enable
                );
            }
        });
        $("#slow-down-button").click(() => {
            if (1/GLOBAL.timing.gameSpeed < 64) {
                GLOBAL.timing.gameSpeed *= 0.5;
                if (GLOBAL.timing.gameSpeed < 1) {
                    $("#game-speed").html("1/"+1/GLOBAL.timing.gameSpeed);
                } else {
                    $("#game-speed").html(GLOBAL.timing.gameSpeed);
                }
            }
            if (GLOBAL.timing.gameSpeed <= 1/64) {
                GLOBAL.gfx.alterInterface(
                    ["#slow-down-button"], //disable
                    ["#speed-up-button"] //enable
                );
            } else {
                GLOBAL.gfx.alterInterface(
                    [], //disable
                    ["#speed-up-button"] //enable
                );
            }
        });
    }

    setMouseDown(e) {
        this.mouseDown = true;
        this.mouseMoved = false;
        this.x_mouseDownPos = e.x;
        this.y_mouseDownPos = e.y;
    }
    setMouseUp(e) {
        if (e.changedTouches) {
            e = e.changedTouches[0];
            e.x = e.clientX;
            e.y = e.clientY;
        }
        if (!this.mouseMoved) {
            GLOBAL.gfx.selectEntity(e.x, e.y);
        }
        this.mouseDown = false;
        this.mouseMoved = false;
    }
    mouseMove(e) {
        if (e.touches) {
            e = e.touches[0];
            e.x = e.clientX;
            e.y = e.clientY;
        }
        if ( //add a little leway for small amounts of motion
            e.x-this.x_mouseDownPos>2 || e.y-this.y_mouseDownPos>2 ||
            e.x-this.x_mouseDownPos<-2 || e.y-this.y_mouseDownPos<-2
        ) {
            this.mouseMoved = true;
        }
        if (this.mouseDown) {
            this.x_momentum = 0;
            this.y_momentum = 0;
            let x_mouseDelta = e.x - this.x_mouseDownPos;
            let y_mouseDelta = e.y - this.y_mouseDownPos;
            if (!isNaN(x_mouseDelta) && !isNaN(y_mouseDelta)) {
                this.x_momentum = x_mouseDelta*this.x_lookSpeed;
                this.y_momentum = y_mouseDelta*this.y_lookSpeed;
            }
            this.x_mouseDownPos = e.x;
            this.y_mouseDownPos = e.y;
        }
    }
}