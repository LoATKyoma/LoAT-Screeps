/**
 * creep行为函数
 */
var Traveler = require('./Traveler');

module.exports = function(){
    _.assign(Creep.prototype,creepExtension);
    creepMove();
}

/**
 * 对穿移动
 */
var moveCache = new Set();
var lastPos = {}
var resourceAll_Set = new Set(RESOURCES_ALL);
module.exports.moveCache = moveCache;
var creepMove = function(){
    if(!Creep.prototype._move){
        Creep.prototype._move = Creep.prototype.move;
    }
    Creep.prototype.move = function(direction){
        let thisPos = [this.pos.x,this.pos.y,Game.time];
        lastPos[this.name] = lastPos[this.name] || thisPos;
        moveCache.add(this.name);
        //当被挡住时实行对穿
        //if(lastPos[this.name][0] === thisPos[0] && lastPos[this.name][1] === thisPos[1] && lastPos[this.name][2]+1 === thisPos[2]){
        if((this.memory._trav.state && this.memory._trav.state[2]>0) || (this.room.storage && this.pos.getRangeTo(this.room.storage)<2)){
            let nextPos = this.getDirectionPos(direction);
            if(nextPos){
                let tarCreep = nextPos.lookFor(LOOK_CREEPS)[0] || nextPos.lookFor(LOOK_POWER_CREEPS)[0];
                if(tarCreep && !moveCache.has(tarCreep.name)){
                    let oppoDirection = (direction+3)%8+1;
                    moveCache.add(tarCreep.name);
                    tarCreep._move(oppoDirection);
                    tarCreep.say('😅');
                    this.say('😘');
                }
            }
        }
        lastPos = thisPos;
        return this._move(direction);
    }

    if(!PowerCreep.prototype._move){
        PowerCreep.prototype._move = function (target) {
            if (!this.room) {
                return ERR_BUSY
            }
            return Creep.prototype._move.call(this, target)
        }
    }
}

/**
 * 其他扩展函数
 */
var miningPoint = new Set();
module.exports.miningPoint = miningPoint;
var creepExtension = {
    /**
     * 查看creep当前看向的方向的物体
     * @param {string} type 查看的种类
     * @param {directionConstant} direction 方向常量
     */
    lookForDirection(type,direction){
        let tarpos = {
            x:this.pos.x,
            y:this.pos.y
        };
        if (direction !== 7 && direction !== 3) {
            if (direction > 7 || direction < 3) {
                --tarpos.y
            } else {
                ++tarpos.y
            }
        }
        if (direction !== 1 && direction !== 5) {
            if (direction < 5) {
                ++tarpos.x
            } else {
                --tarpos.x
            }
        }

        if (tarpos.x < 0 || tarpos.y > 49 || tarpos.x > 49 || tarpos.y < 0) {
            return undefined
        } 

        let found = this.room.lookForAt(type,tarpos.x,tarpos.y);
        return found;
    },
    getDirectionPos(direction){
        let tarpos = {
            x:this.pos.x,
            y:this.pos.y
        };
        if (direction !== 7 && direction !== 3) {
            if (direction > 7 || direction < 3) {
                --tarpos.y
            } else {
                ++tarpos.y
            }
        }
        if (direction !== 1 && direction !== 5) {
            if (direction < 5) {
                ++tarpos.x
            } else {
                --tarpos.x
            }
        }
        if (tarpos.x < 0 || tarpos.y > 49 || tarpos.x > 49 || tarpos.y < 0) {
            return undefined
        }
        return new RoomPosition(tarpos.x,tarpos.y,this.room.name);
    },
    /**
     * 寻找矿物
     * @param {FIND_SOURCE | FIND_DEPOSIT | FIND_MINERAL} type 
     */
    getMiningTarget(type){
        if(_.isUndefined(this.memory.miningId)){
            let found = _.find(this.room.find(type),s=>(!miningPoint.has(s.id)));
            if(found){
                this.memory.miningId = found.id;
                miningPoint.add(found.id);
                return found;
            }
            else{
                this.memory.miningId = null;
                return undefined;
            }
        }
        else if(_.isString(this.memory.miningId)){
            if(!miningPoint.has(this.memory.miningId)){
                miningPoint.add(this.memory.miningId);
            }
            return Game.getObjectById(this.memory.miningId);
        }
    },
    /**
     * 采集资源，适用于Mineral，Source，Deposit
     * @param {object} 采集目标
     */
    harvestResource(target){
        if(!target){
            this.say('ERR_TAR');
            return ERR_INVALID_TARGET;
        }
        if(!this.pos.isNearTo(target)){
            this.travelTo(target,{reusePath:20,ignoreCreeps:true,range:1});
            return ERR_NOT_IN_RANGE;
        }
        this.say('⛏');
        return this.harvest(target);
    },
    /**
     * 升级控制器 *未完成
     * @param {object} 升级控制器
     */
    upgrade(target){
        if(!target){
            this.say('ERR_TAR');
            return ERR_INVALID_TARGET;
        }
        
        //controller附近是否有link todo
        //否则移动到控制器附近
        if(this.pos.getRangeTo(target)>3){
            this.travelTo(target,{reusePath:20,ignoreCreeps:true,range:3});
            return ERR_NOT_IN_RANGE;
        }
        this.say('🙏');
        return this.upgradeController(target);
    },
    /**
     * 从存储器中取出资源
     * @param {object} target 需要从中取出东西的建筑物
     * @param {resourceTypeConstant} resourceType 资源类型
     * @param {number} amount 数量
     */
    withdrawFrom(target,resourceType,amount = undefined){
        if(!resourceAll_Set.has(resourceType)){
            console.log(`${this.name}:资源类型错误`);
            return false;
        }
        if(!this.pos.isNearTo(target)){
            this.travelTo(target,{reusePath:20,ignoreCreeps:true,range:1});
            return ERR_NOT_IN_RANGE;
        }
        if(_.isUndefined(amount)){
            return this.withdraw(target,resourceType);
        }
        else{
            return this.withdraw(target,resourceType,amount);
        }
    },
    /**
     * 存储资源到存储建筑中
     * @param {object} target 
     * @param {resourceTypeConstant} resourceType 
     * @param {number} amount 
     */
    transferTo(target,resourceType,amount = undefined){
        if(!resourceAll_Set.has(resourceType)){
            console.log(`${this.name}:资源类型错误`);
            return false;
        }
        if(!this.pos.isNearTo(target)){
            this.travelTo(target,{reusePath:20,ignoreCreeps:true,range:1});
            return ERR_NOT_IN_RANGE;
        }
        if(_.isUndefined(amount)){
            return this.transfer(target,resourceType);
        }
        else{
            return this.transfer(target,resourceType,amount);
        }
    },
    /**
     * 跨房间移动
     * @param {string} roomName 房间名字 
     * @param {array} roomList 房间列表
     */
    travelToTargetRoom(roomName,roomList = undefined){
        return this.travelTo(new RoomPosition(25,25,roomName),{reusePath:150,ignoreCreeps:true});
        //todo 根据房间列表移动
    },
    /**
     * 判断Creep是否在出口
     */
    isOnExit(){
        let x = this.pos.x;
        let y = this.pos.y;
        if(x === 49 || x === 0 || y === 49 || y === 0){
            return true;
        }
        return false;
    }
}
