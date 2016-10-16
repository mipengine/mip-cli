/**
 * @file 启动mip调试器
 * @author mengke01(kekee000@gmail.com)
 */

const express = require('express');
const cli = require('./cli');
const getIPAddress = require('./util/get-ip-address');
const handler = require('./handlers');
const livereload = require('livereload');
function startServer(config) {
    const app = express();
    const ip = getIPAddress();

    app.use(handler(config))
        .use(express.static(config.baseDir))
        .listen(config.port, () => {
            cli.info('mip server start at:',
                cli.chalk.green('http://' + ip + ':' + config.port)
            );
        });

    // livereload配置
    if (config.livereload) {
        server = livereload.createServer({
            exclusions: ['node_modules'],
            exts: [
                'htm', 'mip', 'md',
                'less', 'styl',
                'es6'
            ],
            delay: 200
        });

        // 监听mip页面
        var watches = [
            config.baseDir + '/**/*.html',
            config.baseDir + '/**/*.htm',
            config.baseDir + '/**/*.mip'
        ];

        // 监听mip组件
        if (config.extensionsDir) {
            watches.splice(watches.length, 0,
                config.extensionsDir + '/**/*.js',
                config.extensionsDir + '/**/*.less',
                config.extensionsDir + '/**/*.md'
            );
        }

        server.watch(watches);
        cli.info('livereload server start at:',
            cli.chalk.green('http://' + ip + ':35729')
        );
    }
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
