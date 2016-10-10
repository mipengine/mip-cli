/**
 * @file 生成mip组件
 * @author mengke01(kekee000@gmail.com)
 */

const cli = require('./cli');
const fs = require('fs');
const path = require('path');
const boilerplate = require('./boilerplate');

/**
 * 生成mip组件模板
 *
 * @param  {string} elementName 组件名称
 * @param  {boolean} force       是否强制
 */
function exec(elementName, force) {
    const baseDir = process.cwd();

    if (!fs.existsSync(path.join(baseDir, 'extensions'))) {
        cli.error('不存在extensions目录，无法创建组件!');
        return;
    }

    var files = boilerplate.element({
        name: elementName
    });

    const elementDir = path.join(baseDir, 'extensions', elementName);

    // 检查是否可以覆盖
    if (fs.existsSync(elementDir)) {
        if (!force) {
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
