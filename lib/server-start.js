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
const https = require('https');
const fs = require('fs');
const customPreview = require('./mip-custom/custom-preview');

const url = 'https://mipcache.bdstatic.com/static/v1/mip-custom/mip-custom.js';

function startServer(config) {
    const app = express();
    const ip = getIPAddress();

    app.use(server(config))
        .use(express.static(config.baseDir));

    // 配置了mip项目目录，则增加mip项目调试路径
    if (config.mipDir) {
        cli.info('mip main debug path', cli.chalk.green(config.mipDir));

        // 用来做路径映射，mip.js 会映射到带版本号的mip-xx.xx.xx.js文件
        // mip.css 会映射到带版本号的mip-xx.xx.xx.css文件
        app.use('/miplocal', function (req, res, next) {
            if (req.path.indexOf('/dist/mip.js') >= 0 || req.path.indexOf('/dist/mip.css') >= 0) {
                if (fs.existsSync(path.resolve(config.mipDir, './' + req.path))) {
                    next();
                    return;
                }

                var packageInfo = null;
                try {
                    packageInfo = JSON.parse(fs.readFileSync(config.mipDir + '/package.json', 'utf-8'));
                }
                catch (e) {
                    cli.warn('no mipdir package.json file!');
                }

                if (packageInfo) {
                    var newUrl = req.originalUrl.replace(
                        /\/dist\/mip\.(js|css)/, '/dist/mip-' + packageInfo.version + '.$1');
                    res.redirect(newUrl);
                    return;
                }
            }
            next();
        });

        app.use('/miplocal', express.static(config.mipDir));
    }

    if (config.mipCustomDir) {
        app.use('/mipcustom', function (req, res) {
            if (req.path.indexOf('/common') > -1) {
                let conf = Object.assign({
                    pathName: req.path.slice(1),
                    query: req.query
                }, config);
                new customPreview.preview().start(conf, function (data) {
                    res.json(data);
                });
            } else {
                let pth = path.join(config.baseDir, config.mipCustomDir, '/dist', req.path);
                res.sendFile(pth);
            }
        });

        if (!config.extensionsDir) {
            app.use('/local-custom-loader', function (req, res) {
                if (req.path.indexOf('/mip-custom.js') === -1) {
                    return;
                }
                https.get(url, response => {
                    let data = '';
                    response.on('data', d => {
                        data += d;
                    });
                    response.on('end', () => {
                        let result;
                        let reg = new RegExp('https://mipengine.baidu.com/', 'g');
                        while ((result = reg.exec(data)) != null)  {
                            if (result) {
                                data = data.replace(result, '/mipcustom/');
                            }
                        }
                        res.send(data);
                    });
                });
            });
        }
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
        let exclusions = ['node_modules'];
        // 豁免定制化目录中的文件夹
        if (config.mipCustomDir) {
            exclusions.push(path.join(config.baseDir, config.mipCustomDir, 'dist'));
            exclusions.push(path.join(config.baseDir, config.mipCustomDir, 'tmp'));
        }
        const lrServer = livereload.createServer({
            port: 35730,
            exclusions: exclusions,
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
            config.baseDir + '/**/*.mip',
            config.baseDir + '/**/*.js',
            config.baseDir + '/**/*.less'
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

        // 监控mip项目改变，通知livereload
        if (config.mipDir) {
            require('./server/mipmain-watcher')
                .start(config.mipDir)
                .on('change', () => {
                    cli.info('refresh mip main module');
                    lrServer.refresh(config.mipDir);
                });
        }
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
