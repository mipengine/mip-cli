/**
 * @file 定制化 MIP 组件编译
 * @author wupeng(smartfutureplayer@gmail.com)
 */

'use strict';
const fs = require('fs');
const path = require('path');
const cli = require('../cli');
const request = require('request');
const Promise = require('bluebird');
const validator = require('../validate');
const common = require('./custom-common');
const blp = require('mip-cli-boilerplate');
const boilerplate = require('../boilerplate');
const processor = require('mip-processor-md5');
const constVarible = require('./custom-defined');
const execSync = require('child_process').execSync;
const getIPAddress = require('../util/get-ip-address');
const extOptimizer = require('mip-extension-optimizer');
const validatorElement = require('../validate-element');
const FECS_IGNORE_FILE = path.resolve(__dirname, '../fecs-ignore.conf');

const rimraf = require('rimraf');

let type;
let baseDir;
let mapFile;
let promiseArr = [];
let optimiseArr = [];

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
        rimraf.sync(path.resolve(rootPath, tmp));
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
        "errorno": 0,
        "errmsg": "",
        "data": {
            "common": {},
            "template": [],
            "config": {}
        },
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

    let config = common.readFile(path.resolve(rootPath, dist, conf, requireConfig));
    try {
        config = JSON.parse(config);
    } catch (e) {
        cli.error('JSON parsing failed in mip-require.config.json!');
        return;
    }
    data.data.config = config;
    return data;
}

/***************compile**********************/

function compileOnline () {
    handleCompile(function () {
        merge();
        let tmpPath = path.resolve(rootPath, tmp);
        rimraf.sync(tmpPath);
    });
}

/***************common**********************/

function handleCompile (cb) {
    let cms = common.handleClassify(component);
    if (!common.isEmptyObject(cms)) {
        for (let key in cms) {
            let item = cms[key];
            let components = {};
            item.forEach(function (ext) {
                components[ext] = ext;
            });
            let distPath = path.resolve(rootPath, dist, key);
            let originPath = path.resolve(rootPath, tmp, key);
            optimiseArr.push(optimise(originPath, distPath, components));
        }
    } else {
        cms = [cm, template];
        cms.forEach(function (item) {
            let distPath = path.resolve(rootPath, dist, item);
            let originPath = path.resolve(rootPath, tmp, item);
            optimiseArr.push(optimise(originPath, distPath));
        });
    }

    Promise.all(optimiseArr).then(function () {
        common.build(rootPath, path.resolve(rootPath, tmp, 'static'), path.resolve(rootPath, dist, 'static')).then(function () {
            common.build(rootPath, path.resolve(rootPath, tmp, 'deps'), path.resolve(rootPath, dist, 'deps')).then(function () {
                common.build(rootPath, path.resolve(rootPath, tmp, 'processor'), path.resolve(rootPath, dist, 'processor')).then(function () {
                    handleConf();
                    cb && cb();
                });
            });
        });
    });
}

function optimise (input, output, components) {
    return Promise.fromCallback(function (callback) {
        if (common.existsFile(input)) {
            extOptimizer.load(input).then(function (extensions) {
                extensions.forEach(function (extension) {
                    if (!components || components && components[extension.info.name]) {
                        extension.build(output);
                    }
                });
                callback();
            });
        } else {
            cli.warn('Path ' + input + ' doesn\'t exist!');
            callback();
        }
    });
}

function handleConf () {
    let pth = path.resolve(rootPath, conf, requireConfig);
    let distPath = path.resolve(rootPath, dist, 'conf', requireConfig);
    let content = common.readFile(pth);
    handlePath(path.resolve(rootPath, dist, conf));
    common.writeFile(distPath, content);
}

function initData (config) {
    var output = config.output;
    baseDir = config.baseDir;
    type = config.type;
    dist = output ? path.resolve(baseDir, output)
            : path.resolve(rootPath, dist);
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
                    if (!common.existsFile(packageFile)) {
                        content = content.replace(results[0], '');
                        continue;
                    }
                    let pct = common.readFile(packageFile);
                    pct = JSON.parse(pct);
                    let file = name.split('/');
                    file = file[file.length - 1];
                    let tplPath = path.resolve(rootPath, dist, name, pct.version, file + '.mustache');
                    if (!common.existsFile(tplPath)) {
                        content = content.replace(results[0], '');
                        continue;
                    }
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
        content = content.replace(/(\/\*(.|\s)*?\*\/)/g, '')
                .replace(/([\r\n])[\s\r\n]*([\r\n])/g, '\n')
                .replace(/[\n\t]/g, '').replace(/ \s+/g, '');
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
                fs.unlinkSync(contentPath);
            });
            let fileName = filePath.split(path.sep);
            fileName = fileName.length > 0 ? fileName[fileName.length - 2] : '';
            if (!common.existsFile(filePath)) {
                fs.mkdirSync(filePath);
            }
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

function validateComponents () {
    let cms = [cm, template];
    cms.forEach(function (item) {
        let pth = path.resolve(rootPath, src, item);
        if (!common.existsFile(pth)) {
            return;
        }
        let files = fs.readdirSync(pth);
        files.forEach(function (file) {
            let item = path.resolve(pth, file);
            if (fs.statSync(item).isDirectory()) {
                let promiseItme = Promise.fromCallback(function (callback) {
                    let result = validatorElement.exec({
                        baseDir: pth,
                        file: file
                    },
                    function (success, errors) {
                        if (success) {
                            callback();
                        } else {
                            callback(errors);
                        }
                    });
                });
                promiseArr.push(promiseItme);
            }
        });
    });
}

function exec (config) {
    if (!config) {
        return;
    }
    let cb;
    initData(config);
    handleFile(path.resolve(rootPath, src), function (pth) {
        promiseArr.push(handleCustom(pth));
    });
    if (type === preview) {
        cb = function () {
            compilePreview(config);
        };
    } else {
        validateComponents();
        cb = compileOnline;
    }
    Promise.all(promiseArr).then(function () {
        let configPath = path.resolve(rootPath, 'conf/mip-conf.config.json');
        let config = JSON.parse(common.readFile(configPath));
        processor.md5({
            baseDir: rootPath,
            domain: config.domain,
            exts: config.exts,
            paths: config.paths,
            outputDir: path.resolve(rootPath, 'tmp')
        });
        handleFile(path.resolve(rootPath, tmp), function (pth) {
            if (common.isCSS(pth) && (pth.match('/tmp/template/') || pth.match('/tmp/common/'))) {
                let ct = common.cssScope(pth, getExtensionName(pth));
                common.writeFile(pth, ct);
            }
        });
        cb();
    }).catch (function (err) {
        cli.error(err.message);
        cli.error(err.stack);
        cli.error('请解决log信息中的错误才能进行编译！');
        process.exit();
    });
}

exports.exec = exec;