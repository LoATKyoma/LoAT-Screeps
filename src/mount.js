var mountRoomProperty = require('./mount.room.property');
var mountRoomSpawn = require('./mount.room.spawn');
var mountCreepBehavior = require('./mount.creep.behavior');
var mountCreepRole = require('./mount.creep.role');

var mountResource = require('./mount.resource');

module.exports = function(){
    if(!global.hasExtension){
        console.log('重新挂载拓展')
        mountRoomProperty();
        mountRoomSpawn();
        mountCreepBehavior();
        mountCreepRole();

        mountResource();
        
        global.hasExtension = true;
    }
    mountCreepBehavior.moveCache={};
}