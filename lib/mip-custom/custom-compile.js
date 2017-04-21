/**
 * @file 定制化 MIP 组件编译
 * @author wupeng(smartfutureplayer@gmail.com)
 */

'use strict';
const cli = require('../cli');
const fs = require('fs');
const path = require('path');
const boilerplate = require('../boilerplate');
const execSync = require('child_process').execSync;
const common = require('./custom-common');
const request = require('request');
const constVarible = require('./custom-defined');
const validator = require('../validate');
const Promise = require('bluebird');

let tmp;
let dist;
let type;
let promiseArr = [];

/***************preview**********************/
function compilePreview (customItems, data, cb) {
    handleCompile(function () {
        merge();
        if (data) {
            data = getOnlineJson(customItems, data);
        } else {
            data = getOfflineJson(customItems, data);
        }
        cb && cb(data);
        execSync('rm -rf ' + path.resolve(rootPath, tmp));
        execSync('rm -rf ' + path.resolve(rootPath, dist));
    });
}

function getOnlineJson (customItems, data) {
    data.data.template.forEach(function (items) {
        items.forEach(function (item) {
            let packageFile = path.resolve(rootPath, 'src/template', item.tplName, 'package.json');
            let content = common.readFile(packageFile);
            let version = JSON.parse(content).version;
            var pth = path.resolve(rootPath, dist, template, item.tplName, version, item.tplName + '.html');
            item.tpl = encodeURIComponent(common.readFile(pth));
        });
    });
    return data;
}

function getOfflineJson (customItems) {
    let content = '';
    let data = {
        "status": {
            "errorno": 0,
            "errmsg": ""
        },
        "data": {
            "common": {},
            "template": []
        }
    };

    customItems.forEach(function (items) {
        let itemsArr = [];
        items.forEach(function (item) {
            let files = item.split('/');
            let fileName = files[files.length - 1];
            let obj = {};
            let packageFile = path.resolve(rootPath, 'src/template', fileName, 'package.json');
            let content = common.readFile(packageFile);
            let version = JSON.parse(content).version;
            let pth = path.resolve(rootPath, dist, template, fileName, version, fileName + '.html');
            obj.tpl = encodeURIComponent(common.readFile(pth));
            let dataPath = path.resolve(rootPath, src, template, fileName, fileName + '.json');
            obj.tpldata = JSON.parse(common.readFile(dataPath));
            itemsArr.push(obj);
        });
        data.data.template.push(itemsArr);
    });
    return data;
}

/***************compile**********************/

function compileOnline () {
    handleCompile(function () {
        merge();
        let tmpPath = path.resolve(rootPath, tmp);
        execSync('rm -rf ' + tmpPath);
    });
}

/***************common**********************/

function handleCompile (cb) {
    const distPath = path.resolve(rootPath, dist, template);
    const originPath = path.resolve(rootPath, tmp, template);
    common.removeFile(component, path.resolve(rootPath, dist));

    let command = 'mip-extension-optimise ' + originPath + ' -o ' + distPath + ' ' + component;
    execSync(command);
    common.build(rootPath, path.resolve(rootPath, src, 'static'), path.resolve(rootPath, dist, 'static')).then(function () {
        common.build(rootPath, path.resolve(rootPath, src, 'deps'), path.resolve(rootPath, dist, 'deps')).then(function () {
            cb && cb();
        });
    });
}

function initData (obj) {
    tmp = obj.tmp;
    dist = obj.dist;
    type = obj.type;
}

function handleFile (pth) {
    if (component) {
        var componentArr = component.split(' ');
        componentArr.forEach(function (item) {
            var componentPath = path.resolve(rootPath, src, 'template', item);
            let files = fs.readdirSync(componentPath);
            files.forEach(function (file) {
                let filePath = path.resolve(componentPath, file);
                if (fs.statSync(filePath).isFile()) {
                    promiseArr.push(handleCustom(filePath));
                }
            });
        });
    } else {
        if (fs.statSync(pth).isDirectory()) {
            let files = fs.readdirSync(pth);
            files.forEach(function (file) {
                handleFile(path.resolve(pth, file));
            });
        } else if (fs.statSync(pth).isFile()) {
            promiseArr.push(handleCustom(pth));
        }
    }
}

function handlePath (pth) {
    if (!common.existsFile(pth)) {
        handlePath(path.dirname(pth));
        fs.mkdirSync(pth);
    }
}

function handleCustom (pth) {
    return Promise.fromCallback(function (callback) {
        let ct = '';
        let files = pth.split('/');
        let baseName = files[files.length - 2];
        let filePath = path.resolve(rootPath, tmp, template, baseName, path.basename(pth));
        let writePath = path.resolve(rootPath, tmp, template, baseName);

        if (!common.isValidFile(pth) || type == preview) {
            callback();
            return;
        }
        handlePath(writePath);
        validator.validate({
            pth: pth,
            custom: true,
            cb: function (success, error) {
                if (!success) {
                    errors = error;
                    callback(error);
                } else {
                    if (common.isCSS(pth)) {
                        ct = common.cssScope(pth, getExtensionName(pth));
                    } else if (common.isJS(pth) || common.isOther(pth)) {
                        ct = common.readFile(pth);
                    } else if (common.isHTML(pth)) {
                        ct = common.readFile(pth);
                    }
                    common.writeFile(filePath, ct);
                    callback();
                }
            }
        });
    });
}

function htmlCompile (pth) {
    if (pth.match(/\.html$/)) {
        let results;
        let output = '';
        let content = common.readFile(pth);
        let reg = new RegExp('{{>>([^{]*)}}', 'g');
        while ((results = reg.exec(content)) != null)  {
            if (results && results.length > 0) {
                let name = results[1];
                name = name.trim();
                if (!common.isHTML(name)
                    && !common.isJS(name)
                    && !common.isCSS(name)) {
                    let packageFile = path.resolve(rootPath, 'src', name, 'package.json');
                    let pct = common.readFile(packageFile);
                    pct = JSON.parse(pct);

                    let file = name.split('/');
                    file = file[file.length - 1];
                    let tplPath = path.resolve(rootPath, dist, template, file, pct.version, file + '.html');
                    output = common.readFile(tplPath);
                    content = content.replace(results[0], output);
                }
            }
        }
        common.writeFile(pth, content);
    }
}

function handleLink (pth) {
    if (pth.match(/\.html$/)) {
        let results;
        let output = '';
        let content = common.readFile(pth);
        let reg = new RegExp('{{>>([^{]*)}}', 'g');

        while ((results = reg.exec(content)) != null)  {
            if (results && results.length > 0) {
                let name = results[1];
                name = name.trim();
                if (common.isHTML(name)
                    || common.isJS(name)
                    || common.isCSS(name)) {
                    let filePath = path.resolve(rootPath, dist, name);
                    if (common.isCSS(filePath)) {
                        filePath = filePath.replace(path.extname(filePath), '.css');
                    }
                    let ct;
                    if (common.existsFile(filePath)) {
                        ct = wrapContent(filePath, true, getExtensionName(pth));
                    } else {
                        ct = '';
                    }
                    content = content.replace(results[0], ct);
                }
            }
        }
        common.writeFile(pth, content);
    }
}

function wrapContent (pth, wrapCss, extName) {
    var ct = "";
    if (common.isJS(pth)) {
        ct = '<script>'
            + common.readFile(pth)
            + '</script>';
    } else if (common.isHTML(pth)) {
        ct = common.readFile(pth);
    } else if (wrapCss && common.isCSS(pth)) {
        ct = common.cssScope(pth, extName);
        ct = '<style>'
            + ct
            + '</style>';
    }
    return ct;
}

function getExtensionName (pth) {
    if (!pth) {
        return;
    }
    var fileName = path.basename(pth);
    var extName = path.extname(pth);
    return fileName.replace(extName, '');
}

function merge () {
    let distPath = path.resolve(rootPath, dist, template);
    let distFiles = fs.readdirSync(distPath);
    distFiles.forEach(function (cFlile) {
        let cFilePath = path.resolve(rootPath, distPath, cFlile);
        let cFliles = fs.readdirSync(cFilePath);
        cFliles.forEach(function (file) {
            let output = '';
            let filePath = path.resolve(cFilePath, file);
            let files = fs.readdirSync(filePath);
            files.forEach(function (ct) {
                let contentPath = path.resolve(filePath, ct);
                output += wrapContent(contentPath);
            });
            let fileName = filePath.split('/');
            fileName = fileName.length > 0 ? fileName[fileName.length - 2] : '';
            if (!common.existsFile(filePath)) {
                fs.mkdirSync(filePath);
            }
            execSync('rm -rf ' + path.resolve(filePath, '*'));
            common.writeFile(path.resolve(filePath, fileName + '.html'), output);
        });
    });

    distFiles.forEach(function (cFlile) {
        let cFilePath = path.resolve(rootPath, distPath, cFlile);
        let cFliles = fs.readdirSync(cFilePath);
        cFliles.forEach(function (file) {
            let output = '';
            let filePath = path.resolve(cFilePath, file);
            let files = fs.readdirSync(filePath);
            files.forEach(function (ct) {
                let contentPath = path.resolve(filePath, ct);
                if (contentPath.match(/\.html$/)) {
                    htmlCompile(contentPath, rootPath);
                }
            });
        });
    });

    distFiles.forEach(function (cFlile) {
        let cFilePath = path.resolve(rootPath, distPath, cFlile);
        let cFliles = fs.readdirSync(cFilePath);
        cFliles.forEach(function (file) {
            let output = '';
            let filePath = path.resolve(cFilePath, file);
            let files = fs.readdirSync(filePath);
            files.forEach(function (ct) {
                let contentPath = path.resolve(filePath, ct);
                if (contentPath.match(/\.html$/)) {
                    handleLink(contentPath, rootPath);
                }
            });
        });
    });
}

function exec (obj) {
    if (!obj) {
        return;
    }
    initData(obj);
    handleFile(obj.filePath);
    if (type === preview) {
        compilePreview(obj.customItems, obj.data, obj.cb);
    } else {
        Promise.all(promiseArr).then(compileOnline).catch (function (err) {
            cli.error('请解决log信息中的错误才能进行编译！')
            process.exit();
        });
    }
}

exports.exec = exec;