/**
 * @file 添加mip页面命令
 * @author mengke01(kekee000@gmail.com)
 */

const cli = require('./cli');
const fs = require('fs');
const path = require('path');
const boilerplate = require('./boilerplate');
const string = require('./util/string');

function getModule(name) {
    return string.format('https://mipcache.bdstatic.com/static/${0}/v1.0.0/${0}.js', [name]);
}

function exec(config) {
    const fileName = config.fileName;
    const baseDir = config.baseDir || process.cwd();
    const modules = config.modules || [];

    if (fs.existsSync(path.join(baseDir, fileName)) && !config.force) {
        cli.error('存在同名页面!');
        return;
    }

    // 获取引用元素路径
    const elements = modules.map(function (module) {
        return getModule(module);
    });

    const files = boilerplate.page({
        name: fileName,
        elements: elements
    });

    files.forEach(function (file) {
        file.save(baseDir);
        cli.info('generate file success:', cli.chalk.green(file.path));
    });
}

exports.exec = exec;
