var Traveler = require('./Traveler');
var mount = require('./mount');
var roomManager = require('./roomManager');

roomManager.initRoom();
module.exports.loop = function(){
    mount();
    for(let name in Game.creeps){
        if(Game.creeps[name].memory.role === 'base'){
            Game.creeps[name].base();
        }
    }
}