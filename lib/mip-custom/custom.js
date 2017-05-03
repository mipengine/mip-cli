/**
 * @file 定制化 MIP 组件编译
 * @author wupeng(smartfutureplayer@gmail.com)
 */

'use strict';
const fs = require('fs');
const fecs = require('fecs');
const path = require('path');
const cli = require('../cli');
const common = require('./custom-common');
const cmp = require('./custom-compile');
const validator = require('mip-validator')();
const boilerplate = require('../boilerplate');
const constVarible = require('./custom-defined');
const execSync = require('child_process').execSync;

var custom = {
    exec: function (config) {
        let filePath = config && config.files && config.files.length
                        ? config.files[0] : null;
        if (!filePath) {
            return;
        }
        rootPath = path.resolve(config.baseDir, filePath);
        component = common.handleDependence(rootPath, config.files.slice(1));
        filePath = path.resolve(rootPath, src, template);
        config.type = compile;
        cmp.exec(config);
    }
}

exports.exec = custom.exec;
