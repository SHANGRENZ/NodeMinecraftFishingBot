var mc = require('minecraft-protocol');
var config = require('./config');

var client = mc.createClient({
    host: config.server_host,
    port: config.server_port,
    username: config.username,
    password: config.password
});

client.on('sound_effect', function(packet) {
    if(packet.soundId == 73){//咬钩
        if(Do.getDistance(packet.x, packet.y, packet.z, Player.fishrod_x, Player.fishrod_y, Player.fishrod_z) / 8 <= config.fishrod_distance){
            client.write('use_item', {hand: 0});
            console.log('上钩!');
            setTimeout(() => {
                client.write('use_item', {hand: 0});
                Player.throw_time = new Date().getTime();
            }, 2000);
        }else{
            console.log('远处的钓鱼声');
        }
    }
    if(packet.soundId == 258){//入水
        var tnow = new Date().getTime();
        if(tnow > Player.throw_time && tnow - Player.throw_time >= config.afterthrow_timeout){
            Player.fishrod_x = packet.x;
            Player.fishrod_y = packet.y;
            Player.fishrod_z = packet.z;
        }
    }
    
});

client.on('window_items', function(packet) {
    try {
        if(packet.items[Player.heldItemIndex].itemId == 346){
            console.log('已持有鱼竿');
            return;
        }else{
            console.log('拿了别的什么, 待切换至鱼竿');
        }
    } catch (error) {
        console.log('两手空空, 待切换至鱼竿');
    }
    var haveFishrod = false;
    packet.items.every(function(item, index){
        if(item.present != false){
            if(item.itemId == 346){
                client.write('window_click', {
                    windowId: packet.windowId,
                    slot: index,
                    mouseButton: 0,
                    action: 1,
                    mode: 2,
                    item
                });
                haveFishrod = true;
                return false;//break
            }
        }
        return true;
    });
    if(!haveFishrod) console.log('注意! 没有在背包内找到钓鱼竿');
    if(haveFishrod) console.log('已在背包内找到钓鱼竿并切换');
});

client.on('held_item_slot', function(packet){
    Player.heldItemIndex = packet.slot + 36;
})

client.on('login', function(packet) {
    console.log('已加入游戏');
    setTimeout(() => {
        client.write('use_item', {hand: 0});
        Player.throw_time = new Date().getTime();
    }, 3000);
    Player.timer = setInterval(() => {
        var tnow = new Date().getTime();
        if(tnow > Player.throw_time && tnow - Player.throw_time >= config.auto_rethrow){
            client.write('use_item', {hand: 0});
            console.log('重抛');
        }
    }, 1000);
});

 client.on('kick_disconnect', function (packet) {
    console.info(color('Kicked for ' + packet.reason, 'blink+red'));
    process.exit(1);
 });
  
  
 client.on('disconnect', function (packet) {
    console.log('[' + new Date + ']' + 'disconnected: ' + packet.reason)
    process.exit(1);
 });
  
 client.on('end', function () {
    console.log('[' + new Date + ']' + 'Connection lost')
    process.exit(1);
 });
  
 client.on('error', function (err) {
    console.log('[' + new Date + ']' + 'Error occured');
    console.log(err);
    process.exit(1);
 });


class Do {
    static getDistance(x1, y1, z1, x2, y2, z2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1));
    }
}
class Player {
    static heldItemIndex = 0;
    static fishrod_x = 0;
    static fishrod_y = 0;
    static fishrod_z = 0;
    static throw_time = 0;

    static timer;
}