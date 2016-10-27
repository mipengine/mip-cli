/**
 * @file 初始化mip项目命令
 * @author mengke01(kekee000@gmail.com)
 */
const cli = require('./cli');
const localModule = require('./util/module');
const config = require('./util/config');

const UPDATE_CHECK_INTERVAL = 24 * 3600 * 1000; // 自动检查更新间隔，1天

function update() {
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
