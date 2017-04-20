/**
 * @file 定制化 MIP 组件编译
 * @author wupeng(smartfutureplayer@gmail.com)
 */

'use strict';
const cli = require('../cli');
const fs = require('fs');
const path = require('path');
const boilerplate = require('../boilerplate');
const fecs = require('fecs');
const execSync = require('child_process').execSync;
const common = require('./custom-common');
const validator = require('mip-validator')();
const request = require('request');
const constVarible = require('./custom-defined');
const compile = require('./custom-compile');

const dist = "preview-dist-middle";
const tmp = "preview-tmp-middle";

function exec(config, cb) {
    let customData = config.mipCustomData;
    let customItems = config.mipCustomItems;
    let customDir = config.mipCustomDir;
    rootPath = config.baseDir || process.cwd();
    rootPath = path.resolve(rootPath, customDir);
    let filePath = path.resolve(rootPath, src, template);
    if (customData) {
        request(
            {
                url: customData,
                timeout: 10000
            },
            function (err, res, body) {
                if (!err && res.statusCode === 200) {
                    let data = JSON.parse(body);
                    let tplName = [];
                    let tplsData = data.data;
                    if (tplsData && tplsData.template) {
                        var tplData = tplsData.template;
                        tplData.forEach(function (items) {
                            items.forEach(function (item) {
                                let isExisted = false;
                                tplName.forEach(function (tpl) {
                                    if (tpl === item.tplName) {
                                        isExisted = true;
                                    }
                                });
                                if (!isExisted) {
                                    tplName.push(template + '/' + item.tplName);
                                }
                            });
                        });
                    }
                    tplName = common.handleDependence(rootPath, tplName);
                    component = tplName.join(' ');
                    // handleFile(filePath);
                    // compile(customItems, data, cb);
                    compile.exec({
                        filePath: filePath,
                        customItems: customItems,
                        data: data,
                        cb: cb,
                        dist: dist,
                        tmp: tmp,
                        type: 'preview'
                    });
                }
                else {
                    cli.warn('fetch mip custom data failed.');
                }
            }
        );
    } else {
        let exts = [];
        customItems.forEach(function (item) {
            exts = exts.concat(item);
        });
        exts = common.handleDependence(rootPath, exts);
        exts.forEach(function (item) {
            var im = item.split('/');
            component += im[im.length - 1] + ' ';
        });
        // handleFile(filePath);
        // compile(customItems, null, cb);
        compile.exec({
            filePath: filePath,
            customItems: customItems,
            data: null,
            cb: cb,
            dist: dist,
            tmp: tmp,
            type: 'preview'
        });
    }
}

exports.exec = exec;
