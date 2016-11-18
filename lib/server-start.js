/**
 * @file 启动mip调试器
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';
const express = require('express');
const cli = require('./cli');
const getIPAddress = require('./util/get-ip-address');
const server = require('./server');
const livereload = require('livereload');
const path = require('path');

function startServer(config) {
    const app = express();
    const ip = getIPAddress();

    app.use(server(config))
        .use(express.static(config.baseDir));

    // 配置了mip项目目录，则增加mip项目调试路径
    if (config.mipDir) {
        cli.info('mip main debug path', cli.chalk.green(config.mipDir));
        app.use('/miplocal', express.static(config.mipDir));
    }

    app.listen(config.port, () => {
            cli.info('mip server start at:',
                cli.chalk.green('http://' + ip + ':' + config.port)
            );
        })
        .on('error', e => {
            if (e.code === 'EADDRINUSE') {
                cli.error(cli.chalk.yellow('PORT ' + config.port + ' already in use, please retry again!'));
                process.exit();
            }
            else {
                throw e;
            }
        });

    // livereload配置
    if (config.livereload) {
        const lrServer = livereload.createServer({
            port: 35730,
            exclusions: ['node_modules'],
            exts: [
                'htm', 'mip', 'md',
                'less', 'styl',
                'es6'
            ],
            delay: 500
        });
        lrServer.server.on('error', e => {
            if (e.code === 'EADDRINUSE') {
                cli.error(cli.chalk.yellow('PORT 35730 already in use, please retry again!'));
                process.exit();
            }
            else {
                throw e;
            }
        });

        // 监听mip页面
        let watches = [
            config.baseDir + '/**/*.html',
            config.baseDir + '/**/*.htm',
            config.baseDir + '/**/*.mip'
        ];

        // 监听mip组件
        if (config.extensionsDir && path.resolve(config.baseDir) !== path.resolve(config.extensionsDir)) {
            watches.splice(watches.length, 0,
                config.extensionsDir + '/**/*.js',
                config.extensionsDir + '/**/*.less',
                config.extensionsDir + '/**/*.md'
            );
        }

        lrServer.watch(watches);
        cli.info('livereload server start at:',
            cli.chalk.green('http://' + ip + ':35730')
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
 * @param  {string} config.mipDir 配置本地mip仓库目录，用于mip主项目调试
 */
exports.exec = function (config) {
    const startExtensionsServer = function () {
        cli.info('start extensions debug server');
        config.extensionsDir = config.extensionsDir || process.cwd();
        startServer(config);
    };

    if (false === config.isExtensionsDir) {
        startServer(config);
    }
    // 直接标识是mip-extensions项目
    else if (true === config.isExtensionsDir) {
        startExtensionsServer();
    }
    // 判断目录是否是mip-extensions项目
    else {
        require('./util/is-extensions-dir')(config.baseDir)
            .then(isExtensionsDir => {
                if (isExtensionsDir) {
                    config.isExtensionsDir = true;
                    startExtensionsServer();
                }
                else {
                    startServer(config);
                }
            }, e => {
                throw e;
            });
    }
};
