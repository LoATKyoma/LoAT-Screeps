/**
 * 扩展房间的属性，包括房间内的建筑等
 */

const multipleList = [
    STRUCTURE_SPAWN,        STRUCTURE_EXTENSION,    STRUCTURE_ROAD,         STRUCTURE_WALL,
    STRUCTURE_RAMPART,      STRUCTURE_KEEPER_LAIR,  STRUCTURE_PORTAL,       STRUCTURE_LINK,
    STRUCTURE_TOWER,        STRUCTURE_LAB,          STRUCTURE_CONTAINER,	STRUCTURE_POWER_BANK,
];

const singleList = [
    STRUCTURE_OBSERVER,     STRUCTURE_POWER_SPAWN,  STRUCTURE_EXTRACTOR,	STRUCTURE_NUKER,
];

var roomStructures = {};
var roomMineral = {}
var roomStructuresExpiration = {};

module.exports = function(){
    multipleProperty();
    singleProperty();
    mineralProperty();
}

Room.prototype._checkStructuresCache = function(){
    if(!roomStructures[this.name] || !roomStructuresExpiration[this.name] || roomStructuresExpiration[this.name]<Game.time){
        roomStructuresExpiration[this.name] = 50+Math.round((Math.random()*8-4));
        roomStructures[this.name] = _.groupBy(this.find(FIND_STRUCTURES),s=>s.structureType);
        for(let i in roomStructures[this.name]){
            roomStructures[this.name][i] = _.map(roomStructures[this.name][i],s=>s.id);
        }
        roomMineral[this.name] = _.map(this.find(FIND_MINERALS),m=>m.id);
    }
}

var multipleProperty = function(){
    multipleList.forEach(function(type){
        Object.defineProperty(Room.prototype,type+'s',{
            get:function(){
                if(this['_'+type+'s'] && this['_'+type+'s_ts'] === Game.time){
                    return this['_'+type+'s'];
                } else {
                    this._checkStructuresCache();
                    if(roomStructures[this.name][type]) {
                        this['_'+type+'s_ts'] = Game.time;
                        return this['_'+type+'s'] = roomStructures[this.name][type].map(Game.getObjectById);
                    } else {
                        this['_'+type+'s_ts'] = Game.time;
                        return this['_'+type+'s'] = [];
                    }
                }
            },
            set: function(){},
            enumerable: false,
            configurable: true
        });
    })
}

var singleProperty = function(){
    singleList.forEach(function(type){
        Object.defineProperty(Room.prototype, type, {
            get: function(){
                if(this['_'+type] && this['_'+type+'_ts'] === Game.time){
                    return this['_'+type];
                } else {
                    this._checkStructuresCache();
                    if(roomStructures[this.name][type]) {
                        this['_'+type+'_ts'] = Game.time;
                        return this['_'+type] = Game.getObjectById(roomStructures[this.name][type][0]);
                    } else {
                        this['_'+type+'_ts'] = Game.time;
                        return this['_'+type] = undefined;
                    }
                }
            },
            set: function(){},
            enumerable: false,
            configurable: true
        });
    })
}

var mineralProperty = function() {
    Object.defineProperty(Room.prototype,'mineral',{
        get: function(){
            if(this['_mineral'] && this['_mineral_ts'] === Game.time){
                return this['_mineral'];
            }
            else{
                this._checkStructuresCache();
                if(roomMineral[this.name]){
                    this['_mineral_ts'] = Game.time;
                    return this['_mineral'] = Game.getObjectById(roomMineral[this.name][0]);
                }
                else{
                    this['_mineral_ts'] = Game.time;
                    return this['_mineral'] = undefined;
                }
            }
        }
    })
}