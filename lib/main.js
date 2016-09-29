/**
 * @file 主入口
 * @author errorrik(errorrik@gmail.com)
 */


var minimist = require('minimist');


/**
 * 主入口函数
 *
 * @param {string=} cwd 运行目录
 * @param {Object} args 命令参数
 */
function main(cwd, args) {
    cwd = cwd || process.cwd();
    args = args || minimist(process.argv.slice(2));

    console.log('Hello MIP Command line!');
    console.log(JSON.stringify(args, null, 4));
}

exports = module.exports = main;
