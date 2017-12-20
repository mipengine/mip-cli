/**
 * @file 初始化mip项目命令
 * @author mengke01(kekee000@gmail.com)
 */
const cli = require('./cli');
const localModule = require('./util/module');
const config = require('./util/config');

const UPDATE_CHECK_INTERVAL = 24 * 3600 * 1000; // 自动检查更新间隔，1天

// 线上组件版本列表
const EXTENSIONS_MAP_URL = 'https://c.mipcdn.com/extensions/platform/v1/map.json';

/**
 * 更新线上组件版本列表
 *
 * @return {Promise}
 */
function updateExtensionsMap() {
    const request = require('request');
    return new Promise((resolve, reject) => {
        request(
            {
                url: EXTENSIONS_MAP_URL,
                timeout: 10000
            },
            (err, res, body) => {
                if (!err && res.statusCode === 200) {
                    var map = null;

                    try {
                        map = JSON.parse(body);
                    }
                    catch (e) {
                        cli.warn('parse new extensions map error!');
                    }
                    resolve(map);
                }
                else {
                    resolve(null);
                    cli.warn('update extensions map failed.');
                }
            });
    });
}

function update() {

    updateExtensionsMap().then(map => {
        if (map) {
            config.set('mip-cli-extensions-map', map);
            cli.info('update extensions map success');
        }
    });

    const updater =  localModule.checkAndUpdate('mip-cli-boilerplate');
    updater.then(info => {
        config.setDefault({
            lastUpdate: Date.now(),
            lastVersion: info.latest || info.local
        });

        if (info) {
            if (info.latest) {
                cli.info('update template success, new version',
                    cli.chalk.green(info.latest));
            }
            else {
                cli.info('current version is the latest.');
            }
        }
        else if (!info) {
            cli.warn('update template failed.');
        }
    });

    return updater;
}

function exec(force) {
    if (force) {
        return update();
    }

    const defaultConfig = config.getDefault() || {
        lastUpdate: 0
    };

    // 超过更新间隔，执行更新
    if (Date.now() - defaultConfig.lastUpdate > UPDATE_CHECK_INTERVAL) {
        return update();
    }

    return Promise.resolve({
        update: false,
        local: defaultConfig.lastVersion || ''
    });
}


exports.exec = exec;
