/**
 * 各种角色的函数
 */
module.exports = function(){
    _.assign(Creep.prototype,creepExtension);
}

fillList = {};
creepExtension = {
    /**
     * 执行采集，填充，建筑和升级的基础creep
     */
    base(){
        if(this.spawning){
            return;
        }
        if(_.isString(this.memory.state)){
            switch(this.memory.state){
                //采集资源任务，当采集满了，就切换状态
                case 'harvest':{
                    if(this.store.getFreeCapacity() === 0){
                        if(this.pos.roomName !== this.memory.spawnRoom || this.isOnExit()){
                            this.moveToTargetRoom(this.memory.spawnRoom);
                            break;
                        }
                        this.memory.targetId = undefined;
                        this.memory.state = 'idle';
                        break;
                    }
                    if(this.pos.roomName !== this.memory.workRoom || this.isOnExit()){
                        this.moveToTargetRoom(this.memory.workRoom);
                        break;
                    }
                    if(_.isUndefined(this.memory.target)){
                        let target = this.pos.findClosestByPath(FIND_SOURCES);
                        if(target){
                            this.memory.targetId = target.id;
                        }
                        this.harvestResource(target);
                    }
                    else{
                        let target = Game.getObjectById(this.memory.targetId);
                        this.harvestResource(target);
                    }
                    break;
                }
                //升级任务
                case 'upgrade':{
                    if(this.store.getUsedCapacity()===0){
                        this.memory.state = 'harvest'
                        this.memory.targetId = undefined;
                        break;
                    }
                    this.upgrade(this.room.controller);
                    break;
                }
                //填充任务
                case 'fill':{
                    if(this.store.getUsedCapacity()===0){
                        this.memory.state = 'harvest'
                        this.memory.targetId = undefined;
                        break;
                    }
                    //能量填满回归idle
                    if(this.room.energyAvailable===this.room.energyCapacityAvailable){
                        this.memory.state = 'idle';
                        fillList[this.room.name] = undefined;
                        break;
                    }
                    //初始化填充列表
                    if(_.isUndefined(fillList[this.room.name]) || fillList[this.room.name].length === 0){
                        temp = _.filter(this.room.spawns,s=>s.store.getFreeCapacity(RESOURCE_ENERGY)>0).concat(_.filter(this.room.extensions,e=>e.store.getFreeCapacity(RESOURCE_ENERGY)>0));
                        fillList[this.room.name] = _.map(temp,s=>s.id);
                    }
                    //选择最近的
                    let targets = fillList[this.room.name].map(Game.getObjectById);
                    let x = this.pos.x;
                    let y = this.pos.y
                    let closestTar = _.min(targets,t=>t.pos.getRangeTo(x,y));
                    if(closestTar.store.getFreeCapacity(RESOURCE_ENERGY) === 0){
                        _.pull(fillList[this.room.name],closestTar.id);
                        break;
                    }
                    this.transferTo(closestTar,RESOURCE_ENERGY);
                    break;
                }
                case 'build':{break;}
            }
            if(this.memory.state === 'idle'){
                if(this.store.getUsedCapacity()===0){
                    this.memory.state = 'harvest';
                }
                else if(this.room.energyAvailable<this.room.energyCapacityAvailable){
                    this.memory.state = 'fill';
                }
                else{
                    this.memory.state = 'upgrade';
                }
                
            }
        }
        //初始化
        else{
            if(this.pos.roomName === this.memory.workRoom && !this.isOnExit()){
                this.memory.state = 'idle';
            }
            else{
                this.moveToTargetRoom(this.memory.workRoom);
            }
        }
    }
}