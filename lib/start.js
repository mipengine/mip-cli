/**
 * @file 启动mip调试器
 * @author mengke01(kekee000@gmail.com)
 */

const express = require('express');
const cli = require('./cli');
const getIPAddress = require('./util/get-ip-address');
const handler = require('./handlers');

function startServer(config) {
    const app = express();
    app.use(handler(config))
        .use(express.static(config.baseDir))
        .listen(config.port, () => {
            cli.info('mip server start at:',
                cli.chalk.green('http://' + getIPAddress() + ':' + config.port)
            );
        });
}

/**
 * 启动mip调试server, 分为mip-project和mip-extensions两种启动方式
 *
 * @param  {Object} config 配置
 * @param  {string} config.baseDir 项目根目录
 * @param  {number} config.port server端口
 * @param  {boolean} config.isExtensionsDir 是否extensions目录，以便于启动不同的调试工具
 * @param  {string} config.extensionsDir 配置本地extensions目录，用于本地调试
 */
exports.exec = function (config) {

    if (false === config.isExtensionsDir) {
        startServer(config);
    }
    else {
        require('./util/is-extensions-dir')(config.baseDir)
            .then((isExtensionsDir) => {
                if (isExtensionsDir) {
                    cli.info('start extensions debug server');
                    config.extensionsDir = '.';
                    config.isExtensionsDir = true;
                }
                startServer(config);
            }, (e) => {
                throw e;
            });
    }


};
