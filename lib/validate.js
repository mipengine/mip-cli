/**
 * @file mip页面验证
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';
const validator = require('mip-validator')();
const path = require('path');
const fs = require('fs');
const cli = require('./cli');
const cwd = process.cwd();

function validate(filePath) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    let errs = validator.validate(content);
    if (errs && errs.length) {
        cli.log(cli.chalk.green(filePath));
        errs.forEach(error => {
            cli.error('line', error.line, 'col', error.col +  ':', error.message);
        });
    }

}

exports.exec = function (files) {
    files.forEach(file => {
        let filePath = path.resolve(cwd, file);
        validate(filePath);
    });
};
