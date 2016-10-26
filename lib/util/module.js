/**
 * @file 相关依赖模块检查更新工具
 *
 * exports.check(moduleName) 检查当前模块的版本
 * exports.update(moduleName) 更新当前模块
 * exports.checkAndUpdate(moduleName) 检查并且更新当前依赖的模块
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';
const fs = require('fs');
const path = require('path');
const request = require('request');
const string = require('./string');
const cli = require('../cli');

const REGISTRY_URL = 'https://registry.npmjs.org/${0}/latest'; // 请求的npm registry url
const NODE_MODULES = path.resolve(__dirname, '../../node_modules'); // 当前依赖的node_modules目录

/**
 * 检查当前模块的版本
 *
 * @param  {string} moduleName 模块名称
 * @return {Promise}
 */
exports.check = function (moduleName) {
    return new Promise((resolve, reject) => {
        const registryUrl = string.format(REGISTRY_URL, [moduleName]);
        request(
            {
                url: registryUrl,
                timeout: 10000
            },
            (err, res, body) => {
                if (!err && res.statusCode === 200) {
                    const latestVersion = JSON.parse(body).version;
                    // 本地package路径
                    const packagePath = path.resolve(NODE_MODULES, moduleName, 'package.json');
                    let localVersion = '0.0.0';
                    if (fs.existsSync(packagePath)) {
                        const module = require(packagePath);
                        localVersion = module.version;
                    }

                    if (latestVersion !== localVersion) {
                        cli.info('A newer version of', moduleName, 'is available',
                                cli.chalk.green(latestVersion));
                        resolve({
                            latest: latestVersion,
                            local: localVersion
                        });
                    }
                    else {
                        resolve({
                            local: localVersion
                        });
                    }
                }
                else {
                    cli.warn('fetch module', moduleName, 'version failed!');
                    reject(new Error('failed to get registry!'));
                }
            }
        );
    });
};

/**
 * 更新当前模块
 *
 * @param  {string} moduleName 模块名称
 * @return {Promise}
 */
exports.update = function (moduleName) {
    return new Promise((resolve, reject) => {
        const exec = require('child_process').exec;
        let command = 'cd "' + NODE_MODULES + '" && '
            + 'npm install ' + moduleName;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(error));
                return;
            }
            cli.info(stdout);
            resolve(moduleName);
        });
    });
};


/**
 * 检查并且更新当前依赖的模块，返回本次更新的信息：
 * {
 *     update: true, // 是否更新完毕
 *     latest: 'latest version',
 *     local: 'local version'
 * }
 *
 * @param  {string} moduleName 模块名称
 * @return {Promise}
 */
exports.checkAndUpdate = function (moduleName) {
    const modulePath = path.resolve(NODE_MODULES, moduleName);
    if (!fs.existsSync(modulePath)) {
        cli.warn('module not found: ' + moduleName);
    }

    return new Promise(resolve => {
        // 失败回调，这里不希望有更新失败的情况，所以只有resolve
        const updateFailed = function (e) {
            if (e) {
                cli.warn(e.message);
            }
            resolve(false);
        };

        exports.check(moduleName).then(info => {
            // 没有当前最新版本
            if (!info.latest) {
                info.update = false;
                resolve(info);
                return;
            }

            exports.update(moduleName).then(() => {
                // 清空当前的模块引用
                const modulePath = path.resolve(NODE_MODULES, moduleName, 'index.js');
                delete require.cache[modulePath];
                info.update = true;
                resolve(info);
            }, updateFailed);
        }, updateFailed);
    });
};
