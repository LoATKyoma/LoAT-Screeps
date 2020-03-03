/**
 * spawn管理
 */

module.exports = function(){
    _.assign(Room.prototype,roomExpension);
}

var bodysKey = new Set([WORK,MOVE,ATTACK,RANGED_ATTACK,TOUGH,HEAL,CLAIM,CARRY]);
var nameNumber = 0;

var roomExpension = {
    /**
     * 增加spawn任务
     * @param {object} bodys 身体部件的对象
     * @param {string} name 名字
     * @param {memory} opts 关于creep的初始化memory
     * @param {int} priority 优先级
     */
    addSpawnTask(bodys,name,opts,priority){
        //参数类型检查
        if(!_.isObject(bodys) || !_.isString(name) || !_.isObject(opts) || !_.isNumber(priority)){
            console.log('传入参数错误');
            return false;
        }
        //解释body
        let bodyArray = this.explainBodys(bodys);
        if(_.isUndefined(bodyArray)){
            console.log('body解释失败');
            return false;
        }
        //打包任务
        let spawnTask = {bodys:bodyArray,name:name,opts:opts,priority:priority};
        //将任务插入房间的任务序列中
        if(_.isUndefined(this.memory.spawnList)){
            this.memory.spawnList = [];
        }
        if(this.memory.spawnList.length === 0){
            this.memory.spawnList.push(spawnTask);
        }
        else{
            let isInsert = false;
            for(let index in this.memory.spawnList){
                if(this.memory.spawnList[index].priority>priority){
                    this.memory.spawnList.splice(index,0,spawnTask);
                    isInsert = true;
                    break;
                }
            }
            if(!isInsert){
                this.memory.spawnList.push(spawnTask);
            }
        }
        return true;
    },
    /**
     * 解释身体部件
     * @param {object} bodys 
     */
    explainBodys(bodys){
        //参数类型检查
        if(!_.isObject(bodys)){
            return undefined;
        }
        let bodyArray = [];
        for(let type in bodys){
            let amount = bodys[type];
            //检查type字段是否合法
            if(!bodysKey.has(type.toLowerCase())){
                console.log('body字段不合法');
                return undefined;
            }
            for(let index = 0; index<amount; index++){
                bodyArray.push(type.toLowerCase());
            }
        }
        if(bodyArray.length>50){
            console.log('body长度不合法');
            return undefined;
        }
        return bodyArray;
    },
    /**
     * spawn工作函数
     */
    spawnWork(){
        //没有任务则返回
        if(!this.memory.spawnList || this.memory.spawnList.length === 0){
            return;
        }
        //寻找可以用的spawn
        let spawn = this.spawns.find(function(s){
            return !s.spawning;
        });
        if(_.isUndefined(spawn)){
            return;
        }
        //获取spawn任务并进行处理
        let spawnTask = this.memory.spawnList[0];
        let ret = spawn.spawnCreep(spawnTask.bodys,spawnTask.name,spawnTask.opts);
        if(ret === OK){
            this.memory.spawnList.shift();
            console.log(`产地:${this.name} | 名字:${spawnTask.name} 正在生成`);
        }
        return;
    },
    /**
     * 房间创建creep函数
     * @param {string} workRoom 房间名
     * @param {object} bodys 身体部件对象
     * @param {string} role 角色名字
     * @param {int} priority 优先级
     * @param {object} opts 可选参数，指定的opts
     */
    createCreep(workRoom,bodys,role,priority,opts = undefined){
        //参数类型检查
        if(!_.isString(workRoom) || !_.isObject(bodys) || !_.isString(role) || !_.isNumber(priority) || (!_.isUndefined(opts) && !_.isObject(opts))){
            console.log('传入参数错误');
            return undefined;
        }
        let defaultOpts = {memory:{workRoom:workRoom,spawnRoom:this.name,role:role}};
        opts = opts||defaultOpts;
        let name = workRoom + '_' + role + '_' + Game.time%10000 + '_' + nameNumber;
        let isOk = this.addSpawnTask(bodys,name,opts,priority);
        if(isOk){
            nameNumber = (nameNumber+1)%100;
            return name;
        }
        else{
            return undefined;
        }
    }
}