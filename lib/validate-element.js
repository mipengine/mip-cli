/**
 * @file mip组件验证，验证组件目录或者组件zip压缩文件
 * 通过校验的组件可以提交到extensions仓库
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';
const validator = require('mip-extension-validator');
const fs = require('fs');
const path = require('path');
const cli = require('./cli');
// fecs ignore file
const FECS_IGNORE_FILE = path.resolve(__dirname, 'fecs-ignore.conf');

function readIgnoreFile() {
    if (fs.existsSync(FECS_IGNORE_FILE)) {
        let ignoredPattern = fs.readFileSync(FECS_IGNORE_FILE, 'utf-8')
            .split(/\r?\n/).filter(line => {
                line = line.trim();
                return line !== '' && line[0] !== '#';
            });
        return ignoredPattern;
    }
    return null;
}

function report(data, cb) {

    if (data.status === 0) {
        cli.log('validate success', cli.chalk.green(data.name));
        cb && cb(true, 'validate success');
        return;
    }

    cli.log('validate error', cli.chalk.green(data.name));
    const errors = data.errors
        .map(file => {
            file.type = 'ERROR';
            return file;
        })
        .concat(data.warns.map(file => {
            file.type = 'WARNING';
            return file;
        }))
        .sort((a, b) => (a.file > b.file ? 1 : -1));

    for (let i = 0, curPath = '', file; file = errors[i]; i++) {
        if (curPath !== file.file) {
            curPath = file.file;
            cli.log(cli.chalk.cyan(file.file));
        }

        cb && cb(false, file.message);
        cli.log(
            cli.chalk[file.type === 'ERROR' ? 'red' : 'yellow'](file.type),
            file.row > -1 ? 'line: ' + file.row + ' col: ' + file.col : '',
            file.message
        );
    }
}

exports.exec = function (config, cb) {
    const baseDir = config.baseDir || process.cwd();
    const filePath = path.join(baseDir, config.file);
    if (!fs.existsSync(filePath)) {
        cb && cb(false, 'path not exist!');
        return;
    }

    let validatorConfig = {
        ignore: readIgnoreFile()
    };

    let result = filePath.match(/\.zip$/)
        ? validator.validateZip(filePath, validatorConfig)
        : validator.validate(filePath, validatorConfig);

    result.then(data => {
        report(data, cb);
    }, e => {
        cb && cb(false, e.message);
        cli.error(filePath, '\n', e.message);
    });
};
