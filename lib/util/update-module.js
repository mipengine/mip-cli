/**
 * @file 更新cli相关依赖模块
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';
const fs = require('fs');
const path = require('path');
const request = require('request');
const string = require('./string');
const cli = require('../cli');
const spawn = require('./spawn');

const REGISTRY_URL = 'https://registry.npmjs.org/${0}/latest'; // 请求的npm registry url
const NODE_MODULES = path.resolve(__dirname, '../../node_modules'); // 当前依赖的node_modules目录

/**
 * 检查当前模块的版本
 *
 * @param  {string} moduleName 模块名称
 * @return {Promise}
 */
function checkVersion(moduleName) {
    return new Promise((resolve, reject) => {
        const registryUrl = string.format(REGISTRY_URL, [moduleName]);
        console.log(registryUrl)
        request({
            url: registryUrl,
            timeout: 10000,
        }, (err, res, body) => {
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
                    cli.info('A newer version of cli template is available', latestVersion);
                    resolve(latestVersion, localVersion);
                }
                else {
                    resolve(false);
                }
            }
            else {
                cli.warn('fetch cli template version failed!');
                reject();
            }
        });
    });
}

/**
 * 更新当前模块
 *
 * @param  {string} moduleName 模块名称
 * @return {Promise}
 */
function updateVersion(moduleName) {

    return new Promise((resolve, reject) => {
        const npm = spawn('npm', ['install', '-g', moduleName], {
            stdio: 'inherit'
        });

        npm.on('close', function (code) {
            if (code !== 0) {
                reject(new Error(code));
                return;
            }

            resolve(moduleName);
        });
    });
}

/**
 * 检查并且更新当前依赖的模块
 *
 * @param  {string} moduleName 模块名称
 * @return {Promise}
 */
module.exports = function (moduleName) {
    const modulePath = path.resolve(NODE_MODULES, moduleName);
    if (!fs.existsSync(modulePath)) {
        cli.warn('module not found: ' + moduleName);
    }

    return new Promise((resolve) => {
        // 失败回调，这里不希望有更新失败的情况，所以只有resolve
        var updateFailed = function (e) {
            if (e) {
                cli.warn(e.message);
            }

            resolve(false);
        };

        checkVersion(moduleName).then((latestVersion) => {
            if (!latestVersion) {
                updateFailed();
                return;
            }
            updateVersion(moduleName).then(() => {
                resolve(latestVersion);
            }, updateFailed);
        }, updateFailed);
    });
};
