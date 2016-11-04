/**
 * @file mip页面验证
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';
const validator = require('mip-validator')();
const path = require('path');
const fs = require('fs');
const cli = require('./cli');

function validate(filePath) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    let errs = validator.validate(content);
    if (errs && errs.length) {
        cli.log('validate error', cli.chalk.green(filePath));
        errs.forEach(error => {
            cli.error('line', error.line, 'col', error.col +  ':', error.message);
        });
    }
    else {
        cli.log('validate success', cli.chalk.green(filePath));
    }

}

exports.exec = function (config) {
    const baseDir = config.baseDir || process.cwd();
    const files = config.files;
    files.forEach(file => {
        let filePath = path.resolve(baseDir, file);
        validate(filePath);
    });
};
