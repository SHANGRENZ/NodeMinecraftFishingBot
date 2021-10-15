const mineflayer = require('mineflayer');
const config = require('./config');
var firstLogin = true;
var loginHealth = 0;
var haveChangedFishingRod = false;


const bot = mineflayer.createBot({
    host: config.server_host,
    port: config.server_port,
    username: config.username,
    password: config.password,
    auth: config.auth
}); 
/*
function init(){
    const mcData = require('minecraft-data')(bot.version);
}

bot.once('spawn',init());
*/
bot.on('hardcodedSoundEffectHeard', function(soundId, soundCategory, position, volume, pitch) {   
    if(soundId == 369){//咬钩
		var sound_distance = (Do.getDistance(position.x, position.y, position.z, Player.fishrod_x, Player.fishrod_y, Player.fishrod_z) / 8).toFixed(2);
		Do.log('[FishBot]Sound Distance: ' + sound_distance);
        if(sound_distance <= config.fishrod_distance){
            bot.activateItem();
            Do.log('[FishBot]Hooked!');
            setTimeout(() => {
                bot.activateItem();
                Player.throw_time = new Date().getTime();
            }, 2000);
        }else{
            Do.log('[FishBot]Far Fishing Sound');
        }
    }
    if(soundId == 173){//入水
        var tnow = new Date().getTime();
        if(tnow > Player.throw_time && tnow - Player.throw_time <= config.afterthrow_timeout){//浮标入水后会持续产生入水音效 设置超时以避免重复计入
			Do.log('[FishBot]Bobber in water');
            Player.fishrod_x = position.x;
            Player.fishrod_y = position.y;
            Player.fishrod_z = position.z;
        }
    }
}); 
bot.on('window_items', function(packet) {
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
                    bot.write('window_click', {
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
bot.on('held_item_slot', function(packet){
    Player.heldItemIndex = packet.slot + 36;
});

bot.on('login', function(packet) {
    Do.log('[FishBot]Joined in the game');
    setTimeout(() => {
        bot.activateItem();
        Player.throw_time = new Date().getTime();
    }, 3000);
    Player.timer = setInterval(() => {
        var tnow = new Date().getTime();
        if(tnow > Player.throw_time && tnow - Player.throw_time >= config.auto_rethrow){
            bot.activateItem();
            Do.log('[FishBot]Rethrow');
            Player.throw_time = tnow;
            bot.activateItem(); 
        }
    }, 1000);
});

bot.on('health', function () {
    if (firstLogin){
        loginHealth = bot.health;
        firstLogin = false;
    }
    
    if (bot.health < 10){
        if (bot.health >= loginHealth){
            Do.log("HP is recovering");
        }
        else{
            process.exit(0);//血量小于10但没在恢复 退出
        }
        if (bot.health < 5){
            process.exit(0);//血量小于5 过于危险 退出
        }
    }
    
  });

 bot.on('kick_disconnect', function (packet) {
    Do.log('Kicked for ' + packet.reason);
    process.exit(1);
 });
  
  
 bot.on('disconnect', function (packet) {
    Do.log('disconnected: ' + packet.reason)
    process.exit(1);
 });
  
 bot.on('end', function () {
    Do.log('Connection lost')
    process.exit(1);
 });
  
 bot.on('error', function (err) {
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
        return '[XpLevel:' + bot.experience.level +']';
    }
    static getHealthInf() {
        return '[Health:' + (bot.health || 0).toFixed(0) + ',Food:'+ (bot.food || 0).toFixed(0) + ',FoodSat:' + (bot.foodSaturation || 0).toFixed(0) + ']';
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