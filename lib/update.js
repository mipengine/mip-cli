/**
 * @file 初始化mip项目命令
 * @author mengke01(kekee000@gmail.com)
 */
const cli = require('./cli');
const localModule = require('./util/module');
const config = require('./util/config');

const UPDATE_CHECK_INTERVAL = 24 * 3600 * 1000; // 检查更新间隔

function update() {
    return localModule.checkAndUpdate('mip-cli-boilerplate').then((info) => {
        if (info) {
            config.setDefault('lastUpdate', Date.now());
            cli.info('update template success, new version',
                cli.chalk.green(info.latest || info.local));
        }
        else {
            cli.warn('update template failed.');
        }
    });
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
        update: false
    });
}


exports.exec = exec;
