/**
 * @file 初始化mip项目命令
 * @author mengke01(kekee000@gmail.com)
 */
const cli = require('./cli');
const boilerplate = require('./boilerplate');
const fs = require('fs');
const path = require('path');

function exec(config) {
    const baseDir = config.baseDir || process.cwd();
    const mipConfigPath = path.join(baseDir, 'mip.config');

    if (fs.existsSync(mipConfigPath) && !config.force) {
        cli.error('已存在mip配置!');
        return;
    }

    boilerplate.config({isCustom: config.custom}).forEach(file => {
        file.save(baseDir);
        cli.info('generate config success:', cli.chalk.green(file.path));
    });
}


exports.exec = exec;
