function Queue(size)
{
    this.size = size;
    this.array = [];
}

Queue.prototype.add = function(elem)
{
    this.array.push(parseInt(elem));
    if(this.array.length > this.size){
        this.array.shift();
    }
}

Queue.prototype.average = function()
{
    var sum = 0;
    for(var i = 0; i < this.array.length; i++){
        sum += parseInt(this.array[i], 10);
    }
    var avg = sum/this.array.length;
    return avg;
}
