//encoding utf-8

var mc = require('minecraft-protocol');
const { threadId } = require('worker_threads');
var config = require('./config');

var firstLogin = true;
var loginHealth = 0;
var haveChangedFishingRod = false;

var xpLevel = 0;
var health = 20;
var food = 20;
var foodSat = 0;

var client = mc.createClient({
    host: config.server_host,
    port: config.server_port,
    username: config.username,
    password: config.password,
    auth: config.auth
});

client.on('sound_effect', function(packet) {
    if(packet.soundId == 369){//咬钩 1.15.2为73
		var sound_distance = (Do.getDistance(packet.x, packet.y, packet.z, Player.fishrod_x, Player.fishrod_y, Player.fishrod_z) / 8).toFixed(2);
		Do.log('[FishBot]Sound Distance: ' + sound_distance);
        if(sound_distance <= config.fishrod_distance){
            client.write('use_item', {hand: 0});
            Do.log('[FishBot]Hooked!');
            setTimeout(() => {
                client.write('use_item', {hand: 0});
                Player.throw_time = new Date().getTime();
            }, 2000);
        }else{
            Do.log('[FishBot]Far Fishing Sound');
        }
    }
    if(packet.soundId == 173){//入水 1.15.2为258
        var tnow = new Date().getTime();
        if(tnow > Player.throw_time && tnow - Player.throw_time <= config.afterthrow_timeout){//浮标入水后会持续产生入水音效 设置超时以避免重复计入
			Do.log('[FishBot]Bobber in water');
            Player.fishrod_x = packet.x;
            Player.fishrod_y = packet.y;
            Player.fishrod_z = packet.z;
        }
    }
});  
client.on('window_items', function(packet) {
    if(haveChangedFishingRod == false){
        try {
            if(packet.items[Player.heldItemIndex].itemId == 797){ //1.15.2为622
                Do.log('[FishBot]Holding fishing rod');
                haveChangedFishingRod = true;
                return;
            }else{
                Do.log('[FishBot]Changing to fishing rod');
            }
        } catch (error) {
            Do.log('[FishBot]Changing to fishing rod');
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
        haveFishrod ? Do.log('[FishBot]Having changed item to fishing rod') : Do.log('[FishBot]Warning! No fishing rod in inventory');
        haveChangedFishingRod = true;
    }
});
client.on('held_item_slot', function(packet){
    Player.heldItemIndex = packet.slot + 36;
});

client.on('login', function(packet) {
    Do.log('[FishBot]Joined in the game');
    setTimeout(() => {
        client.write('use_item', {hand: 0});
        Player.throw_time = new Date().getTime();
    }, 3000);
    Player.timer = setInterval(() => {
        var tnow = new Date().getTime();
        if(tnow > Player.throw_time && tnow - Player.throw_time >= config.auto_rethrow){
            client.write('use_item', {hand: 0});
            Do.log('[FishBot]Rethrow');
            Player.throw_time = tnow;
            client.write('use_item', {hand: 0}); 
        }
    }, 1000);
});
client.on('experience',function(packet){
    xpLevel = packet.level;

});
client.on('update_health', function (packet) {
    health = packet.health.toFixed(0);
    food = packet.food.toFixed(0);
    foodSat = packet.foodSaturation.toFixed(0);
    if (firstLogin){
        loginHealth = packet.health;
        firstLogin = false;
    }
    
    if (packet.health < 10){
        if (packet.health >= loginHealth){
            Do.log("HP is recovering");
        }
        else{
            process.exit(0);//血量小于10但没在恢复 退出
        }
        if (packet.health < 5){
            process.exit(0);//血量小于5 过于危险 退出
        }
    }
    
  });

 client.on('kick_disconnect', function (packet) {
    Do.log('Kicked for ' + packet.reason);
    process.exit(1);
 });
  
  
 client.on('disconnect', function (packet) {
    Do.log('disconnected: ' + packet.reason)
    process.exit(1);
 });
  
 client.on('end', function () {
    Do.log('Connection lost')
    process.exit(1);
 });
  
 client.on('error', function (err) {
    Do.log('ERROR OCCURED,EXITING');
    Do.log(err);
    process.exit(1);
 });


class Do {
    static getDistance(x1, y1, z1, x2, y2, z2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1));
    }
	
	static getTime() {
        var now = new Date();
		return '[' + now.getFullYear() + '/' + ( now.getMonth() + 1 ) + '/' + now.getDay() + ' ' + ("0" + now.getHours()).slice(-2) + ':' + ("0" + now.getMinutes()).slice(-2) + ':' + ("0" + now.getSeconds()).slice(-2) + '] ';
	}
    static getXpLevel() {
        return '[XpLevel:' + xpLevel +']';
    }
    static getHealthInf() {
        return '[Health:' + health + ',Food:'+ food + ',FoodSat:' + foodSat + ']';
    }
    static log(log){
        console.log(Do.getTime() + Do.getXpLevel() + Do.getHealthInf() + log);
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