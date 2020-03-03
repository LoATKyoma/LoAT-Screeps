var roomTask = require('./task');
var configRoom = require('./config.room');
var territoryRooms = [];
var remoteRooms = [];
var roomsConfig = {};
var configCheckExpiration = {};

class roomManager {
    /**
    * 对房间信息进行初始化
    */
    static initRoom() {
        let rooms = _.filter(Game.rooms,r=>(r.controller&&r.controller.my));
        territoryRooms = _.map(rooms,r=>r.name);
        if(_.isUndefined(Memory.remoteRooms)){
            Memory.remoteRooms = [];
        }
        else{
            remoteRooms = _.cloneDeep(Memory.remoteRooms);
        }
        //初始化房间
        territoryRooms.forEach(e=>{
            roomTask.init(e);
            roomsConfig[e] = {};
            //真实能量等级，由能量储量决定
            let room = Game.rooms[e];
            let ctrlLevel = room.controller.level
            if(room.energyCapacityAvailable>=configRoom.roomRealLevelConfig[ctrlLevel-1]){
                roomsConfig[e].realLevel = ctrlLevel;
            }
            else{
                roomsConfig[e].realLevel = ctrlLevel - 1;
            }
            //房间数量配置
            roomsConfig[e].numConfig = _.cloneDeep(configRoom.numConfig[roomsConfig[e].realLevel.toString()]);
            configCheckExpiration[e] = {};
        });
    }
    static checkMineral(roomName){
        if(configCheckExpiration[e].mineral && configCheckExpiration[e].mineral<Game.time){
            return CHECK_COOLDOWN;
        }
        let room = Game.rooms[roomName];
        //mineral尚未可以使用
        if(_.isUndefined(room.extractor) || _.isUndefined(room.mineral)){
            configCheckExpiration[e].mineral = Math.ceil(Math.random()*200)+200+Game.time();
            return MINERAL_INVALID;
        }
        //mineral尚在冷却中
        else if(room.mineral.tickToRegeneration){
            configCheckExpiration[e].mineral = room.mineral.tickToRegeneration+Game.time();
            return MINERAL_RUNOUT;
        }
        //mineral可以开采
        else{
            configCheckExpiration[e].mineral = Math.ceil(Math.random()*200)+200+Game.time();
            return MINERAL_READY;
        }
    }
    static checkController(roomName){
        if(configCheckExpiration[e].controller && configCheckExpiration[e].controller<Game.time){
            return CHECK_COOLDOWN;
        }
        let room = Game.rooms[roomName];
        configCheckExpiration[e].controller = Math.ceil(Math.random()*500)+500+Game.time;
        //controller还在升级中
        if(room.controller.level<8){
            return CONTROLLER_UPGRADE;
        }
        //controller的掉级倒计时比较健康
        else if(room.controller.ticksToDowngrade>=CONTROLLER_DOWNGRADE_DANGER){
            return CONTROLLER_HEALTHY;
        }
        //controller即将掉级
        else{
            return CONTROLLER_DOWNGRADE;
        }
    }
    static adaptCreepAmount(roomName){
        //管理mineralHarvester的数量
        let ret = this.checkMineral(roomName);
        if(ret !== CHECK_COOLDOWN){
            if(ret === MINERAL_INVALID || ret === MINERAL_RUNOUT){
                roomsConfig[roomName].numConfig.mineralHarvester = 0;
            }
            else if(ret === MINERAL_READY){
                roomsConfig[roomName].numConfig.mineralHarvester = 1;
            }
        }
        //管理upgrader的数量
        ret = this.checkController(roomName);
        if(ret !== CHECK_COOLDOWN){
            if(ret === CONTROLLER_UPGRADE){
                //todo 根据能量情况调节
            }
            else if(ret === CONTROLLER_HEALTHY){
                roomsConfig[roomName].numConfig.upgrader = 0;
            }
            else if(ret === CONTROLLER_DOWNGRADE){
                roomsConfig[roomName].numConfig.upgrader = 1;
            }
        }
    }
}

module.exports = roomManager;

//一些返回码常量
const CHECK_COOLDOWN = -1;
const MINERAL_READY = 0;
const MINERAL_RUNOUT = 1;
const MINERAL_INVALID = 2;
const CONTROLLER_UPGRADE = 3;
const CONTROLLER_HEALTHY = 4;
const CONTROLLER_DOWNGRADE = 5;
//其他设定常量
const ENERGYLEVEL_LOW = 160000;
const ENERGYLEVEL_MIDDLE = 300000;
const ENERGYLEVEL_HIGH = 500000;
const TERMINAL_FULL = 980000;
const CONTROLLER_DOWNGRADE_DANGER = 50000

/**
 * 用于新增外矿房间
 * @param {string | array} 新增的房间
 */
global.addRemoteRooms = function(room){
    //添加单个房间
    if(_.isString(room)){
        //检查是否已经存在
        if(!_.includes(Memory.remoteRooms,room)){
            Memory.remoteRooms.push(room);
            remoteRooms.push(room);
            console.log('添加成功！');
            return true;
        }
        console.log('房间已经存在');
        return false;
    }
    //添加多个房间
    else if(_.isArray(room)){
        let unionList = _.union(Memory.remoteRooms,room);
        Memory.remoteRooms = unionList;
        remoteRooms = unionList;
        console.log('添加成功！');
        return true;
    }
    console.log('参数错误！');
    return false;
}
/**
 * 用于移除外矿房间
 * @param {string | array} 房间名或者房间序列
 */
global.removeRemoteRooms = function(room){
    //移除单个房间
    if(_.isString(room)){
        //检查是否已经存在
        if(_.includes(Memory.remoteRooms,room)){
            _.pull(Memory.remoteRooms,room);
            _.pull(remoteRooms,room);
            console.log('移除成功！');
            return true;
        }
        console.log('房间不存在');
        return false;
    }
    //移除多个房间
    else if(_.isArray(room)){
        let afterRemove = _.difference(Memory.remoteRooms,room);
        Memory.remoteRooms = afterRemove;
        remoteRooms = afterRemove;
        console.log('移除成功！');
        return true;
    }
}