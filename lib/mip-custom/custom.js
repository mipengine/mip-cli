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
const compile = require('./custom-compile');
const validator = require('mip-validator')();
const boilerplate = require('../boilerplate');
const constVarible = require('./custom-defined');
const execSync = require('child_process').execSync;

const tmp = 'tmp';
const dist = 'dist';

var custom = {
    exec: function (config) {
        let filePath = config && config.files && config.files.length
                        ? config.files[0] : null;
        if (!filePath) {
            return;
        }
        rootPath = path.resolve(config.baseDir, filePath);
        component = common.handleDependence(rootPath, config.files.slice(1));
        component = component ? component.join(' ') : '';
        filePath = path.resolve(rootPath, src, template);
        compile.exec({
            filePath: filePath,
            dist: dist,
            tmp: tmp,
            type: compile,
            self: custom
        });
    }
}

exports.exec = custom.exec;
