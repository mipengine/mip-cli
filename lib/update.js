/**
 * @file 初始化mip项目命令
 * @author mengke01(kekee000@gmail.com)
 */
const cli = require('./cli');
const updateModule = require('./util/update-module');
function exec() {
    updateModule('mip-cli-boilerplate').then((result) => {
        cli.info('update template success.');
    });
}


exports.exec = exec;
