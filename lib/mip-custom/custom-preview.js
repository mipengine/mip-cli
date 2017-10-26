/**
 * @file 定制化 MIP 组件预览
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
const querystring = require('querystring');

let EnvPreview = function () {};

EnvPreview.prototype.fetchData = function () {
    var me = this;
    if (!me.conf || !me.conf.path) {
        return;
    }

    request(
        {
            url: me.conf.path + me.conf.params,
            timeout: 10000
        },
        function (err, res, body) {
            if (!err && res.statusCode === 200) {
                let data;
                try {
                    data = JSON.parse(body);
                } catch (e) {
                    cli.warn('The requested data is not legal,please use json formate!');
                    return;
                }
                if (!data) {
                    cli.warn('The response data can not be empty');
                    return;
                }
                if (!data.data) {
                    cli.warn('The response "data" field of the returned data can not be empty');
                    return;
                }
                if (!data.data.template) {
                    cli.warn('The response "template" field of the returned data can not be empty');
                    return;
                }
                if (!(data.data.template instanceof Array)) {
                    cli.warn('The response "template" field must be an array type');
                    return;
                }
                let tplsData = data.data;
                let tplName = [];
                if (tplsData && tplsData.template) {
                    let tplData = tplsData.template;
                    tplData.forEach(function (items) {
                        if (!(items instanceof Array)) {
                            cli.warn('The value in the response "template" field must be an array type');
                            return;
                        }
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
                if (tplName) {
                    component = tplName;
                    me.conf.data = data;
                    compile.exec(me.conf);
                }
            }
            else {
                cli.warn('Fetch mip custom data failed. The error message is "' + err + '"');
            }
        }
    );
};

EnvPreview.prototype.start = function (config, cb) {
    let me = this;
    me.conf = Object.assign({}, config);
    me.conf.customItems = me.conf.mipCustomItems;
    me.conf.path = me.conf.mipCustomData && me.conf.mipCustomData[me.conf.pathName];
    me.conf.cb = cb;
    me.conf.type = preview;
    me.conf.params = querystring.stringify(me.conf.query);

    rootPath = config.baseDir || process.cwd();
    rootPath = path.resolve(rootPath, me.conf.mipCustomDir);


    if (me.conf.path) {
        me.fetchData();
    } else {
        me.conf.customItems.forEach(function (item) {
            component = component.concat(item);
        });
        component = common.handleDependence(rootPath, component);
        compile.exec(me.conf);
    }
};

exports.preview = EnvPreview;
