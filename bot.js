var mc = require('minecraft-protocol');
const { threadId } = require('worker_threads');
var config = require('./config');

var firstlogin = true;
var loginhealth = 0;

var client = mc.createClient({
    host: config.server_host,
    port: config.server_port,
    username: config.username,
    password: config.password
});

client.on('sound_effect', function(packet) {
    if(packet.soundId == 369){//咬钩 1.15.2为73
		var sound_distance = Do.getDistance(packet.x, packet.y, packet.z, Player.fishrod_x, Player.fishrod_y, Player.fishrod_z) / 8;
		console.log(Do.getTime() + '[FishBot]Sound Distance: ' + sound_distance);
        if(sound_distance <= config.fishrod_distance){
            client.write('use_item', {hand: 0});
            console.log(Do.getTime() + '[FishBot]上钩!');
            setTimeout(() => {
                client.write('use_item', {hand: 0});
                Player.throw_time = new Date().getTime();
            }, 2000);
        }else{
            console.log(Do.getTime() + '[FishBot]远处的钓鱼声');
        }
    }
    if(packet.soundId == 173){//入水 1.15.2为258
        var tnow = new Date().getTime();
        if(tnow > Player.throw_time && tnow - Player.throw_time <= config.afterthrow_timeout){//浮标入水后会持续产生入水音效 设置超时以避免重复计入
			console.log(Do.getTime() + '[FishBot]浮标入水');
            Player.fishrod_x = packet.x;
            Player.fishrod_y = packet.y;
            Player.fishrod_z = packet.z;
        }
    }
});  
client.on('window_items', function(packet) {
    try {
        if(packet.items[Player.heldItemIndex].itemId == 797){ //1.15.2为622
            console.log(Do.getTime() + '[FishBot]已持有鱼竿');
            return;
        }else{
            console.log(Do.getTime() + '[FishBot]拿了别的什么, 待切换至鱼竿');
        }
    } catch (error) {
        console.log(Do.getTime() + '[FishBot]两手空空, 待切换至鱼竿');
    }
    var haveFishrod = false;
    packet.items.every(function(item, index){
        if(item.present != false){
            if(item.itemId == 797){
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
    if(!haveFishrod) console.log(Do.getTime() + '[FishBot]注意! 没有在背包内找到钓鱼竿');
    if(haveFishrod) console.log(Do.getTime() + '[FishBot]已在背包内找到钓鱼竿并切换');
});
client.on('held_item_slot', function(packet){
    Player.heldItemIndex = packet.slot + 36;
});

client.on('login', function(packet) {
    console.log(Do.getTime() + '[FishBot]已加入游戏');
    setTimeout(() => {
        client.write('use_item', {hand: 0});
        Player.throw_time = new Date().getTime();
    }, 3000);
    Player.timer = setInterval(() => {
        var tnow = new Date().getTime();
        if(tnow > Player.throw_time && tnow - Player.throw_time >= config.auto_rethrow){
            client.write('use_item', {hand: 0});
            console.log(Do.getTime() + '[FishBot]重抛');
            Player.throw_time = tnow;
            client.write('use_item', {hand: 0}); 
        }
    }, 1000);
});

client.on('update_health', function (packet) {
    console.log(Do.getTime());
    console.log(packet);
    if (firstlogin){
        loginhealth = packet.health;
        firstlogin = false;
    }
    
    if (packet.health < 10){
        if (packet.health >= loginhealth){
            console.log(Do.getTime() + "在恢复");
        }
        else{
            process.exit(0);//血量小于10但没在恢复 退出
        }
        if (packet.health < 5){
            process.exit(0);//血量小于5 过于危险 退出
        }
    }
    
  })

 client.on('kick_disconnect', function (packet) {
    console.info(color('Kicked for ' + packet.reason, 'blink+red'));
    process.exit(1);
 });
  
  
 client.on('disconnect', function (packet) {
    console.log(Do.getTime() + 'disconnected: ' + packet.reason)
    process.exit(1);
 });
  
 client.on('end', function () {
    console.log(Do.getTime() + 'Connection lost')
    process.exit(1);
 });
  
 client.on('error', function (err) {
    console.log(Do.getTime() + 'Error occured');
    console.log(err);
    process.exit(1);
 });


class Do {
    static getDistance(x1, y1, z1, x2, y2, z2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1));
    }
	
	static getTime() {
		return '[' + new Date + ']';
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