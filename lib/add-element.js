/**
 * @file 生成mip组件
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';
const cli = require('./cli');
const fs = require('fs');
const path = require('path');
const boilerplate = require('./boilerplate');

function exec(config) {
    const elementName = config.elementName;
    const baseDir = config.baseDir || process.cwd();

    const files = boilerplate.element({
        name: elementName,
        custom: config.custom
    });

    const elementDir = path.join(baseDir, elementName);

    // 检查是否可以覆盖
    if (fs.existsSync(elementDir)) {
        if (!config.force) {
            cli.warn('存在同名组件!');
            return;
        }
    }
    else {
        fs.mkdirSync(elementDir);
    }

    files.forEach(function (file) {
        file.save(baseDir);
        cli.info('generate file success:', cli.chalk.green(file.path));
    });

}

exports.exec = exec;
