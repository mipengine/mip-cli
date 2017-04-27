/**
 * @file mip页面验证
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';

const fs = require('fs');
const cli = require('./cli');
const path = require('path');
const fecs = require('fecs');
const validator = require('mip-validator')();
const common = require('./mip-custom/custom-common');
const defined = require('./mip-custom/custom-defined');

var validatorModule = {
    validatePth: function (filePath, isCustom, cb) {
        if (!fs.existsSync(filePath)) {
            cb && cb(false);
            return;
        }
        let content;
        if (isCustom) {
            content = header + fs.readFileSync(filePath, 'utf-8') + footer;
        } else {
            content = fs.readFileSync(filePath, 'utf-8')
        }
        let errs = validator.validate(content);
        if (errs && errs.length) {
            cli.log('validate error', cli.chalk.green(filePath));
            errs.forEach(error => {
                cli.error('line', error.line, 'col', error.col +  ':', error.message);
            });
            cb && cb(false, errs);
        }
        else {
            cli.log('validate success', cli.chalk.green(filePath));
            cb && cb(true);
        }
    },

    fecsCheck: function (pth, cb) {
        let options = {
            _: [pth],
            type: 'js,css',
            stream: false,
            rule: true,
            silent: true,
            color: true
        };
        fecs.check(options, function (success, error) {
            if (success) {
                cli.log('validate success', cli.chalk.green(pth));
            } else {
                cli.log('validate error', cli.chalk.green(pth));
            }
            cb && cb(success, error);
        });
    },

    validate: function (obj) {
        if (common.isHTML(obj.pth)) {
            this.validatePth(obj.pth, obj.custom, obj.cb);
        } else if (common.isJS(obj.pth) || common.isCSS(obj.pth)) {
            this.fecsCheck(obj.pth, obj.cb);
        } else {
            obj.cb && obj.cb(true);
        }
    },

    exec: function (config) {
        const baseDir = config.baseDir || process.cwd();
        const files = config.files;
        files.forEach(file => {
            let filePath = path.resolve(baseDir, file);
            this.validate({
                pth: filePath,
                custom: config.custom
            });
        });
    }
}

module.exports = validatorModule;
