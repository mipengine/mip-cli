/**
 * @file 添加mip页面命令
 * @author mengke01(kekee000@gmail.com)
 */

const cli = require('./cli');
const fs = require('fs');
const path = require('path');
const boilerplate = require('./boilerplate');
const string = require('./util/string');

// mip 内置的 组件列表
const BUILD_IN_COMPONENTS = {
    'mip-pix': true,
    'mip-img': true,
    'mip-carousel': true,
    'mip-iframe': true,
    'mip-video': true
};

function getModule(name) {
    var url = 'https://c.mipcdn.com/static/v1/${0}/${0}.js';
    // 通过组件平台上传的组件引用地址不一样
    const extensionsMap = require('./util/config').get('mip-cli-extensions-map');
    if (extensionsMap && extensionsMap[name]) {
        url = 'https://c.mipcdn.com/extensions/platform/v1/${0}/${0}.js';
    }
    return string.format(url, [name]);
}


function exec(config) {
    const fileName = config.fileName;
    const baseDir = config.baseDir || process.cwd();
    const modules = config.modules || [];

    if (fs.existsSync(path.join(baseDir, fileName)) && !config.force) {
        cli.error('存在同名页面!');
        return;
    }

    if (config.custom) {
        boilerplate.mipcustom({
            name: fileName
        }).forEach(file => {
            file.save(baseDir);
            cli.info('generate config success:', cli.chalk.green(file.path));
        });
    } else {
        // 获取引用元素路径，过滤掉内置元素
        const elements = modules.filter(function (module) {
                return !BUILD_IN_COMPONENTS[module];
            })
            .map(function (module) {
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
}

exports.exec = exec;
