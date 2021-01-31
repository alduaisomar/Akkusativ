Image.prototype.load = function(url, callback){
    var thisImg = this;
    var xmlHTTP = new XMLHttpRequest();
    xmlHTTP.open('GET', url,true);
    xmlHTTP.responseType = 'arraybuffer';
    xmlHTTP.onload = function(e) {
        //console.log('onloadcomplete');
        var blob = new Blob([this.response]);
        thisImg.src = window.URL.createObjectURL(blob);
        if (callback) callback();
    };
    xmlHTTP.onprogress = function(e) {
        //console.log('onprogress');
        thisImg.completedPercentage = parseInt((e.loaded / e.total) * 100);
    };
    xmlHTTP.onloadstart = function() {
        //console.log('onloadstart');
        thisImg.completedPercentage = 0;
    };
    xmlHTTP.send();
};
Image.prototype.completedPercentage = 0;
