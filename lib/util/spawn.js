/**
 * @file 启动spawn进程
 * @author mengke01(kekee000@gmail.com)
 */

/**
 * 对 child_process.spawn 的包装
 *
 * @param {string} command 要支持的命令
 * @param {?Array.<string>} args 要传递给 command 的参数列表
 * @property {?Object} options 配置项
 * @return {ChildProcess} 同原 spawn 的返回对象
 */
module.exports = process.env.comspec ? function (command, args, options) {
    var spawn = require('child_process').spawn;
    return spawn(
        process.env.comspec,
        ['/c', command].concat(args),
        options
    );
} : function (command, args, options) {
    var spawn = require('child_process').spawn;
    return spawn(command, args, options);
};
