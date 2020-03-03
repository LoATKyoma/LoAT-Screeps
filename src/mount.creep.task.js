/**
 * 与角色任务相关的各类函数
 */
var roomTask = require('./task');

module.exports = function(){
    _.assign(Creep.prototype,creepExtension);
}

var creepExtension = {
    /**
     * 获取填充的对象
     */
    getFill(){
        let targets = roomTask[this.room.name].fill.map(Game.getObjectById);
        let coordinate = [this.pos.x,this.pos.y];
        let bestTar = _.min(targets,t=>t.pos.getRangeTo(coordinate[0],coordinate[1]));
        if(bestTar){
            roomTask.removeTask(this.room.name,'fill',bestTar.id);
            roomTask.lockTask(bestTar.id);
            this.memory.curTask = bestTar.id;
        }
        return bestTar;
    },
    /**
     * 获取维修对象
     */
    getRepair(){
        let id;
        if(roomTask[this.room.name].repair.length > 0){
            id = roomTask[this.room.name].repair.pop();
            roomTask.lockTask(bestTar.id);
            this.memory.curTask = id;
        }
        return Game.getObjectById(id);
    },
    /**
     * 获取刷墙对象
     */
    getWall(){
        let targets = roomTask[this.room.name].wall.map(Game.getObjectById);
        let bestTar = _.min(targets,w=>w.hits);
        if(bestTar){
            roomTask.removeTask(this.room.name,'wall',bestTar.id);
            roomTask.lockTask(bestTar.id);
            this.memory.curTask = bestTar.id;
        }
        return bestTar;
    },
    /**
     * 获取攻击对象
     */
    getBuild(){
        let id;
        if(roomTask[this.room.name].build.length > 0){
            id = roomTask[this.room.name].build.pop();
            roomTask.lockTask(bestTar.id);
            this.memory.curTask = id;
        }
        return Game.getObjectById(id);
    },
    /**
     * 较为复杂的任务读取
     * @param {*} type 
     */
    readTask(type){
        //第一次读取任务
        if(_.isUndefined(this.memory.curTask)){
            let keys = _.keys(roomTask[this.room.name][type]);
            let foundKey = _.find(keys,k=>!roomTask.isRuning(k));
            if(foundKey){
                this.memory.curTask = foundKey;
                roomTask.lockTask(foundKey);
            }
            else{
                return false;
            }
        }
        let taskInfo = _.cloneDeep(roomTask[this.room.name][type][this.memory.curTask]);
        return taskInfo;
    },
    /**
     * 任务结束,清理任务相关的信息
     * @param {string} 任务类型
     */
    complete(type){
        if(_.isUndefined(this.memory.curTask)){
            return false;
        }
        //四种简单类型的任务，已经在任务列表中移除了，所以只要清理一下creep的记忆就可以了
        if(_.includes(['fill','wall','repair','build'],type)){
            roomTask.unlockTask(this.memory.curTask);
            this.memory.curTask = undefined;
            return true;
        }
        //其他比较复杂的任务
        if(_.includes(['powerBank','transfer','deposit'],type)){
            roomTask.unlockTask(this.memory.curTask);
            roomTask.removeTask(this.room.name,type,this.memory.curTask);
            this.memory.curTask = undefined;
            return true;
        }
        return false;
    }
}