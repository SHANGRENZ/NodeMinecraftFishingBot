const mineflayer = require('mineflayer');
const config = require('./config');
var firstLogin = true;
var loginHealth = 0;


class Do {
    static getDistance(x1, y1, z1, x2, y2, z2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1));
    }
    static getDistanceByVec3(v1,v2) {
        return this.getDistance(v1.x,v1.y,v1.z,v2.x,v2.y,v2.z);
    }
	
	static getTime() {
        var now = new Date();
		return '[' + now.getFullYear() + '/' + ( now.getMonth() + 1 ) + '/' + now.getDate() + ' ' + ("0" + now.getHours()).slice(-2) + ':' + ("0" + now.getMinutes()).slice(-2) + ':' + ("0" + now.getSeconds()).slice(-2) + '] ';
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
    static playerBobberEntity = undefined;

    static timer;
}
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
bot.on('entitySpawn', function(entity){
    if(entity.mobType == 'Fishing Bobber'){
        if(Do.getDistanceByVec3(entity.position,bot.player.entity.position) < config.bobberDistance){//close to player
            Player.playerBobberEntity = entity;
        }  
    }
        
});
bot.on('entityUpdate',function(entity){
    if(!entity || Player.playerBobberEntity == undefined) return;
    if (entity.uuid == Player.playerBobberEntity.uuid){
        if(entity.velocity.y < config.bobberYVelocity){
            bot.activateItem();
            Do.log('[FishBot]Hooked!');
            setTimeout(() => {
                bot.activateItem();
                Player.throw_time = new Date().getTime();
            }, 2000);
        }
    }
});

bot.once('spawn', async function() {
    var window = bot.inventory;

    if(bot.heldItem != null && bot.heldItem.name == 'fishing_rod'){
        Do.log('[FishBot]Holding fishing rod');
        return;
    }
    var fishingRod = bot.inventory.findItemRangeName(bot.inventory.inventoryStart, bot.inventory.inventoryEnd, 'fishing_rod');
    if(fishingRod) { // have fishing rod
        Do.log('[FishBot]Changing to fishing rod');
        await bot.moveSlotItem(fishingRod.slot , bot.inventory.hotbarStart + bot.quickBarSlot);
    } else { // no fishing rod
        Do.log('[FishBot]Warning! No fishing rod in inventory')
    }

    if(bot.heldItem != null && bot.heldItem.name == 'fishing_rod'){
        Do.log('[FishBot]Having changed item to fishing rod')
    } else {
        Do.log('[FishBot]Someting went wrong when changing the fishing rod')
    }
});


bot.on('login', function() {
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
            process.exit(0);//health < 10 and not recovering
        }
        if (bot.health < 5){
            process.exit(0);//health < 5 dangerous
        }
    }
    Do.log('Health Update.');
  });

bot.on('kicked',function(err){
    Do.log(err);
    process.exit(-1);
});
bot.on('end',function(err){
    Do.log(err);
    process.exit(-2);
}); 
bot.on('error', function (err) {
    Do.log('ERROR OCCURED,EXITING');
    Do.log(err);
    process.exit(1);
});

