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
const fis = require('fis3');
const getIPAddress = require('../util/get-ip-address');
const blp = require('mip-cli-boilerplate');

let tmp;
let dist;
let type;
let promiseArr = [];
let mapFile;

/***************preview**********************/
function compilePreview (obj) {
    let results;
    handleCompile(function () {
        merge();
        if (obj.data) {
            results = getOnlineJson(obj.customItems, obj.data);
        } else {
            results = getOfflineJson(obj.customItems, obj.data);
        }
        obj.cb && obj.cb(results);
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
            var pth = path.resolve(rootPath, dist, template, item.tplName, version, item.tplName + '.mustache');
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
            let packageFile = path.resolve(rootPath, src, files[0], fileName, 'package.json');
            let content = common.readFile(packageFile);
            let version = JSON.parse(content).version;
            let pth = path.resolve(rootPath, dist, files[0], fileName, version, fileName + '.mustache');
            obj.tpl = encodeURIComponent(common.readFile(pth));
            let dataPath = path.resolve(rootPath, src, files[0], fileName, fileName + '.json');
            obj.tplData = JSON.parse(common.readFile(dataPath));
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
    let cms = common.handleClassify(component);
    if (!common.isEmptyObject(cms)) {
        for (let key in cms) {
            let item = cms[key];
            let components = [];
            item.forEach(function (ext) {
                components.push(ext);
            });
            if (components.length === 0) {
                return;
            }
            let distPath = path.resolve(rootPath, dist, key);
            let originPath = path.resolve(rootPath, tmp, key);
            common.removeFile(distPath, components);
            let tplCommand = 'mip-extension-optimise ' + originPath + ' -o ' + distPath + ' ' + components.join(' ');
            execSync(tplCommand);
        }
    } else {
        cms = [cm, template];
        cms.forEach(function (item) {
            let distPath = path.resolve(rootPath, dist, item);
            let originPath = path.resolve(rootPath, tmp, item);
            common.removeFile(distPath);
            let tplCommand = 'mip-extension-optimise ' + originPath + ' -o ' + distPath;
            execSync(tplCommand);
        });
    }

    common.build(rootPath, path.resolve(rootPath, tmp, 'static'), path.resolve(rootPath, dist, 'static')).then(function () {
        common.build(rootPath, path.resolve(rootPath, tmp, 'deps'), path.resolve(rootPath, dist, 'deps')).then(function () {
            cb && cb();
        });
    });
}

function initData (obj) {
    tmp = obj.tmp;
    dist = obj.dist;
    type = obj.type;
}

function handleFile (pth, cb) {
    if (fs.statSync(pth).isDirectory()) {
        let files = fs.readdirSync(pth);
        files.forEach(function (file) {
            handleFile(path.resolve(pth, file), cb);
        });
    } else if (fs.statSync(pth).isFile()) {
        cb && cb(pth);
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
        let files = pth.split('/');
        let baseName = files[files.length - 2];
        if (!common.isValidFile(pth)) {
            callback();
            return;
        }
        if (type !== preview) {
            validator.validate({
                pth: pth,
                custom: true,
                cb: function (success, error) {
                    if (!success) {
                        errors = error;
                        callback(error);
                    } else {
                        callback();
                    }
                }
            });
        } else {
            callback();
        }
    });
}

function htmlCompile (pth) {
    if (pth.match(/\.mustache$/)) {
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
                    let tplPath = path.resolve(rootPath, dist, name, pct.version, file + '.mustache');
                    output = common.readFile(tplPath);
                    content = content.replace(results[0], output);
                }
            }
        }
        common.writeFile(pth, content);
    }
}

function handleLink (pth) {
    if (pth.match(/\.mustache$/)) {
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
    mergeFile(cm);
    mergeFile(template);
}

function mergeFile (catalog) {
    let distPath = path.resolve(rootPath, dist, catalog);
    if (!common.existsFile(distPath)) {
        return;
    }

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
            common.writeFile(path.resolve(filePath, fileName + '.mustache'), output);
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
                if (contentPath.match(/\.mustache$/)) {
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
                if (contentPath.match(/\.mustache$/)) {
                    handleLink(contentPath, rootPath);
                }
            });
        });
    });
}

function getCatalog (pth) {
    let catalog = '';
    if (pth.match(/\/(dist|src)\/template\//)) {
        catalog = template;
    } else if (pth.match(/\/(dist|src)\/common\//)) {
        catalog = cm;
    }
    return catalog;
}

function handleMap (pth) {
    let results;
    let content = common.readFile(pth);
    let reg = new RegExp("\<mip-.*src=[\"|\']([^\>]*)[\"|\'].*\>", "g");

    // 路径和mip server启动路径作relative，然后从map文件中取值，如果存在则替换
    while ((results = reg.exec(content)) != null)  {
        let name = results[1].trim();
        let defaultConfig = require(blp.TEMPLATE_DIR + '/mip.config');
        let configPath = defaultConfig.baseDir = process.cwd();
        let filePath = path.resolve(path.dirname(pth), name);
        let relativePath = path.relative(path.resolve(rootPath, tmp), filePath);
        if (mapFile['res'][relativePath]) {
            let rpPath = mapFile['res'][relativePath]['uri'].replace(configPath, '');
            content = content.replace(name, rpPath);
        }
    }
    content = content.replace(/(\/\*(.|\s)*?\*\/)/g, '')
                    .replace(/([\r\n])[\s\r\n]*([\r\n])/g, '\n')
                    .replace(/[\n\t]/g, '')
                    .replace(/ \s+/g, '');
    common.writeFile(pth, content);
}

function handleRequire (pth) {
    let results;
    let content = common.readFile(pth);
    let reg = new RegExp("require\\([\"|\'](.+?)[\"|\']\\)","igm")

    // 路径和mip server启动路径作relative，然后从map文件中取值，如果存在则替换
    while ((results = reg.exec(content)) != null)  {
        let name = results[1].trim();
        let defaultConfig = require(blp.TEMPLATE_DIR + '/mip.config');
        let configPath = defaultConfig.baseDir = process.cwd();
        let filePath = path.resolve(rootPath, tmp, name);
        let relativePath = '/' + path.relative(configPath, filePath);

        if (common.existsFile(filePath + '.js')) {
            content = content.replace(name, relativePath.replace('/tmp/', '/dist/'));
        }
    }
    common.writeFile(pth, content);
}

function exec (obj) {
    if (!obj) {
        return;
    }
    let cb;
    initData(obj);
    handleFile(path.resolve(rootPath, src), function (pth) {
        promiseArr.push(handleCustom(pth));
    });
    if (type === preview) {
        cb = function () {
            compilePreview(obj);
        };
    } else {
        cb = compileOnline;
    }
    Promise.all(promiseArr).then(function () {
        let fisPath = path.resolve(rootPath, src);
        let fisFile = path.resolve(rootPath, 'fis-conf.js');
        let output = path.resolve(rootPath, tmp);
        let command = 'fis3 release -r ' + fisPath + ' -f ' + fisFile + ' -d ' + output;
        execSync(command);
        let mapPath = path.resolve(rootPath, tmp, 'map.json');
        mapFile = JSON.parse(common.readFile(mapPath));
        handleFile(path.resolve(rootPath, tmp), function (pth) {
            if (common.isCSS(pth) && (pth.match('/tmp/template/') || pth.match('/tmp/common/'))) {
                let ct = common.cssScope(pth, getExtensionName(pth));
                common.writeFile(pth, ct);
            } else if (common.isHTML(pth)) {
                handleMap(pth);
            } else if (common.isJS(pth)) {
                handleRequire(pth);
            }
        });
        cb();
    }).catch (function (err) {
        cli.error(err);
        cli.error('请解决log信息中的错误才能进行编译！')
        process.exit();
    });
}

exports.exec = exec;