//account and server config
var server_host = 'serverhost';//服务器地址
var server_port = 25565;//服务器端口
var username = 'youremail';//账号邮箱
var password = 'password';//账号密码
//var auth = 'mojang';
var auth = 'microsoft';

exports.server_host = server_host;
exports.server_port = server_port;
exports.username = username;
exports.password = password;
exports.auth = auth;

////////////

var auto_rethrow = 40000;//重抛超时。超过此时间还没有钓到鱼则尝试重新抛竿。 (毫秒)
var fishrod_distance = 25;//浮标落水点与鱼咬钩点之间的距离 小于此值便会收杆
var afterthrow_timeout = 1500;//抛竿与浮标落水的时间差，即抛竿后该段时间内的实体落水事件会被认为是浮标入水。服务器tps较低时需调高。 (毫秒)

exports.auto_rethrow = auto_rethrow;
exports.fishrod_distance = fishrod_distance;
exports.afterthrow_timeout = afterthrow_timeout;