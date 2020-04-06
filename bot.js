var mc = require('minecraft-protocol');
var config = require('./config');

var client = mc.createClient({
    host: config.server_host,
    port: config.server_port,
    username: config.username,
    password: config.password
});

client.on('sound_effect', function(packet){
    if(packet.soundId == 73){
        client.write('use_item', {hand: 0});
        console.log('fished!');
        setTimeout(() => {
            client.write('use_item', {hand: 0});
        }, 2000);
    }
});

client.on('window_items', function(packet){
    packet.items.forEach(item => {
        if(item.present != false){
            console.log(item);
        }
    });
});

client.on('login', function(packet){
    client.write('chat', {message: '爷 加入了游戏'});
    client.write('use_item', {hand: 0});
});