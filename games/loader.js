var fs = require('fs'),
    path = require('path');

function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function(file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

function validModule(path){
    var items = fs.readdirSync(__dirname + '/' + path);
    return items.indexOf("settings.html") > -1
           && items.indexOf("index.html") > -1
           && items.indexOf("static") > -1
           && items.indexOf("server.js") > -1;
}


module.exports = function(app, express){
    var modulePaths = getDirectories(__dirname).filter(function(path){ return validModule(path); });
    return modulePaths.map(function(path){
        app.use('/' + path, express.static(__dirname + '/' + path + '/static'));
        return { "module": require(__dirname + '/' + path + '/server.js'),
                 "name": path,
                 "settingsForm": __dirname + '/' + path + '/settings.html',
                 "basePage": __dirname + '/' + path + '/index.html'};
    });
}
