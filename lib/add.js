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

function exec(fileName, force, modules) {
    const baseDir = process.cwd();

    if (fs.existsSync(path.join(baseDir, fileName)) && !force) {
        cli.error('存在同名页面!');
        return;
    }

    // 获取引用元素路径
    var elements = modules.map(function (module) {
        return getModule(module);
    });

    var files = boilerplate.page({
        name: fileName,
        elements: elements
    });

    files.forEach(function (file) {
        file.save(baseDir);
        cli.info('generate file success:', cli.chalk.green(file.path));
    });

}


exports.exec = exec;
