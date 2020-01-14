let GLOBAL = {};

document.addEventListener("DOMContentLoaded", function(e) {
    GLOBAL.timing = new Timing();
    GLOBAL.gfx = new Gfx();
    GLOBAL.input = new Input();
    GLOBAL.map = new Map();

    GLOBAL.gfx.init();
    GLOBAL.input.init();
    GLOBAL.map.init();

    GLOBAL.gfx.drawCanvas();
    $("#loading-screen").addClass("hidden");
    $("#game-screen").removeClass("hidden");
    GLOBAL.timing.runTick();
});
