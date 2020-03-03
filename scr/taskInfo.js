function powerBankInfo(posArray,amount,decayTime,timeStamp) {
    this.posArray = _.cloneDeep(posArray);
    this.amount = amount;
    this.decayTime = decayTime;
    this.timeStamp = timeStamp;
}

function depositInfo(posArray) {
    this.posArray = _.cloneDeep(posArray);
}

function transferInfo(from,resourceType,amount){
    this.from = from;
    this.resourceType = resourceType;
    this.amount = amount;
}