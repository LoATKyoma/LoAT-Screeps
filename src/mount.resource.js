var mountCreepBehavior = require('./mount.creep.behavior');
module.exports = function(){
    _.assign(Source.prototype,resourceExtension);
    _.assign(Mineral.prototype,resourceExtension);
    _.assign(Deposit.prototype,resourceExtension);
}

var resourceExtension = {
    /**
     * 判断一个矿点是否在被采集
     */
    isMining(){
        if(miningPoint.has(this.id)){
            return true;
        }
        else{
            return false;
        }
    }
}