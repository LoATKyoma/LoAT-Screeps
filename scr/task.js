//房间任务对象
var roomWallsHitsMax = {};
var fillExpiration = {};
var wallExpiration = {};
var repairExpiration = {};
var buildExpiration = {};
var addExpiration = {};
var roomTask = {
    //初始化房间任务
    runingTask:new Set(),
    init(roomName){
        console.log(`初始化房间${roomName}...`);
        if(!_.isUndefined(this[roomName])){
            return;
        }
        roomWallsHitsMax[roomName] = 50000000;
        this[roomName] = {
            'fill':[],
            'repair':[],
            'wall':[],
            'build':[],
        }
        let room = Game.rooms[roomName];
        if(_.isUndefined(room.memory.taskSave)){
            room.memory.taskSave = {};
            room.memory.taskSave.transfer = {};
            room.memory.taskSave.powerBank = {};
            room.memory.taskSave.deposit = {};
        }
        this[roomName].transfer = _.cloneDeep(room.memory.taskSave.transfer);
        this[roomName].powerBank = _.cloneDeep(room.memory.taskSave.powerBank);
        this[roomName].deposit = _.cloneDeep(room.memory.taskSave.deposit);
    },
    //四组常规获取任务的方法
    checkFill(roomName){
        room = Game.rooms[roomName];
        let roomTask = this;
        if(room.energyAvailable<room.energyCapacityAvailable && (_.isUndefined(fillExpiration[roomName]) || fillExpiration[roomName]<Game.time)){
            this[roomName].fill = this[roomName].fill.concat(_.map(_.filter(room.extensions,s=>(roomTask.isRuning(s.id) && s.store.getFreeCapacity(RESOURCE_ENERGY)>0)),s=>s.id));
            fillExpiration[this.roomName] = Game.time+20;
        }
    },
    checkWall(roomName){
        room = Game.rooms[roomName];
        if(this[roomName].wall.length === 0 && (_.isUndefined(wallExpiration[roomName]) || wallExpiration[roomName]<Game.time)){
            this[roomName].wall = _.map(_.filter(room.walls,s=>s.hits<roomWallsHitsMax[roomName]).concat(_.filter(room.ramparts,s=>s.hits<roomWallsHitsMax[roomName])),s=>s.id);
            wallExpiration[roomName] = Game.time+500;
        }
    },
    checkRepair(roomName){
        room = Game.rooms[roomName];
        if(this[roomName].repair.length === 0 && (_.isUndefined(repairExpiration[roomName]) || repairExpiration[roomName]<Game.time)){
            this[roomName].repair = _.map(_.filter(room.roads,r=>(r.hits<r.hitsMax)).concat(_.filter(room.containers,c=>c.hits<c.hitsMax)),s=>s.id);
            repairExpiration[roomName] = Game.time+750;
        }
    },
    checkBuild(roomName){
        room = Game.rooms[roomName];
        if(this[roomName].build.length === 0 && (_.isUndefined(buildExpiration[roomName]) || buildExpiration[roomName]<Game.time)){
            this[roomName].build = this[roomName].concat(_.map(room.find(FIND_MY_CONSTRUCTION_SITES),c=>c.id));
            repairExpiration[roomName] = Game.time+750;
        }
    },
    /**
     * 锁定正在运行的任务
     * @param {string} key 任务的关键值
     */
    lockTask(key){
        if(!this.runingTask.has(key)){
            this.runingTask.add(key);
        }
    },
    /**
     * 解锁正在运行的任务
     * @param {string} key 任务的键值
     */
    unlockTask(key){
        if(this.runingTask.has(key)){
            this.runingTask.delete(key);
        }
    },
    /**
     * 检查任务是否正在进行
     * @param {string} key 任务的关键值
     */
    isRuning(key){
        if(this.runingTask.has(key)){
            return true;
        }
        return false;
    },
    /**
     * 移除任务
     * @param {*} roomName 任务所属的房间
     * @param {*} type 任务类型
     * @param {string} key 任务的关键值
     */
    removeTask(roomName,type,key){
        switch(type){
            case 'fill':{
                _.pull(this[roomName].fill,key);
                this.unlockTask(key);
                break;
            }
            case 'repair':{
                _.pull(this[roomName].repair,key);
                this.unlockTask(key);
                break;
            }
            case 'wall':{
                _.pull(this[roomName].wall,key);
                this.unlockTask(key);
                break;
            }
            case 'build':{
                _.pull(this[roomName].build,key);
                this.unlockTask(key);
                break;
            }
            case 'transfer':{
                delete this[roomName].transfer[key];
                delete Game.rooms[roomName].memory.taskSave.transfer[key];
                this.unlockTask(key);
                break;
            }
            case 'powerBank':{
                delete this[roomName].powerBank[key];
                delete Game.rooms[roomName].memory.taskSave.powerBank[key];
                this.unlockTask(key);
                break;
            }
            case 'deposit':{
                delete this[roomName].powerBank[key];
                delete Game.rooms[roomName].memory.taskSave.deposit[key];
                this.unlockTask(key);
                break;
            }
            default:{return false;}
        }
        return true;
    },
    /**
     * 往任务队列中添加任务
     * @param {string} roomName 房间名
     * @param {string} type 任务类型
     * @param {string} key 键
     * @param {object} value 任务信息
     */
    addTask(roomName,type,key,value = undefined){
        if(this.runingTask.has(key)){
            return false;
        }
        switch(type){
            case 'fill':{
                if(_.isUndefined(addExpiration[key]) || addExpiration[key]<Game.time){
                    if(this.isRuning(key) || _.includes(this[roomName].fill,key)){
                        addExpiration[key] = Game.time + _.random(10,15)*2;
                        break;
                    }
                    this[roomName].fill.push(key);
                    addExpiration[key] = Game.time + _.random(10,15)*2;
                }
                break;
            }
            case 'repair':{
                if(_.isUndefined(addExpiration[key]) || addExpiration[key]<Game.time){
                    if(this.isRuning(key) || _.includes(this[roomName].repair,key)){
                        addExpiration[key] = Game.time + _.random(10,15)*2;
                        break;
                    }
                    this[roomName].repair.push(key);
                    addExpiration[key] = Game.time + _.random(10,15)*2;
                }
                break;
            }
            case 'wall':{
                if(_.isUndefined(addExpiration[key]) || addExpiration[key]<Game.time){
                    if(this.isRuning(key) || _.includes(this[roomName].wall,key)){
                        addExpiration[key] = Game.time + _.random(10,15)*2;
                        break;
                    }
                    this[roomName].wall.push(key);
                    addExpiration[key] = Game.time + _.random(10,15)*2;
                }
                break;
            }
            case 'build':{
                if(_.isUndefined(addExpiration[key]) || addExpiration[key]<Game.time){
                    if(this.isRuning(key) || _.includes(this[roomName].build,key)){
                        addExpiration[key] = Game.time + _.random(10,15)*2;
                        break;
                    }
                    this[roomName].build.push(key);
                    addExpiration[key] = Game.time + _.random(10,15)*2;
                }
                break;
            }
            case 'powerBank':{
                if(_.isUndefined(addExpiration[key]) || addExpiration[key]<Game.time){
                    if(this.isRuning(key) || _.isObject(this[roomName].powerBank[key])){
                        console.log('任务已存在')
                        addExpiration[key] = Game.time + _.random(10,15)*2;
                        break;
                    }
                    this[roomName].powerBank[key] = _.cloneDeep(value);
                    Game.rooms[roomName].memory.taskSave.powerBank[key] = _.cloneDeep(value);
                    console.log('添加成功');
                    addExpiration[key] = Game.time + _.random(10,15)*2;
                }
                break;
            }
            case 'deposit':{
                if(_.isUndefined(addExpiration[key]) || addExpiration[key]<Game.time){
                    if(this.isRuning(key) || _.isObject(this[roomName].deposit[key])){
                        addExpiration[key] = Game.time + _.random(10,15)*2;
                        break;
                    }
                    this[roomName].deposit[key] = _.cloneDeep(value);
                    Game.rooms[roomName].memory.taskSave.deposit[key] = _.cloneDeep(value)
                    addExpiration[key] = Game.time + _.random(10,15)*2;
                }
                break;
            }
            case 'transfer':{
                if(_.isUndefined(addExpiration[key]) || addExpiration[key]<Game.time){
                    if(this.isRuning(key) || _.isObject(this[roomName].transfer[key])){
                        addExpiration[key] = Game.time + _.random(10,15)*2;
                        break;
                    }
                    this[roomName].transfer[key] = _.cloneDeep(value);
                    Game.rooms[roomName].memory.taskSave.transfer[key] = _.cloneDeep(value)
                    addExpiration[key] = Game.time + _.random(10,15)*2;
                }
                break;
            }
            default:{}
        }
        return true;
    }
};

module.exports = roomTask;
module.exports.fillExpiration = fillExpiration;
module.exports.wallExpiration = wallExpiration;
module.exports.roomWallsHitsMax = roomWallsHitsMax;
module.exports.repairExpiration = repairExpiration;
module.exports.buildExpiration = buildExpiration;