/**
 * @file 定制化 MIP 组件预览功能
 * @author wupeng(smartfutureplayer@gmail.com)
 */

'use strict';
const cli = require('../cli');
const fs = require('fs');
const path = require('path');
const boilerplate = require('../boilerplate');
const fecs = require('fecs');
const process = require('child_process').execSync;
const common = require('./custom-common');

let version;
let rootPath;
let content = '';
const tmpMiddleName = 'preview-tmp-middle';
const tmpDistName = 'preview-dist-middle';
let customItems;

function exec(config) {
    let customDir = config.mipCustomDir;
    customItems = config.mipCustomItems;
    let mipCustomData = config.mipCustomData;
    rootPath = config.baseDir || process.cwd();
    rootPath = path.resolve(rootPath, customDir);
    return getContent(rootPath, customItems, mipCustomData);
}

function getContent (rootPath, customItems, mipCustomData) {
    let filePath = path.resolve(rootPath, 'src');

    // handle file
    handleFile(filePath, function (pth) {
        if (handleCustom(pth)) {
            return;
        }
    });

    let componentArr = '';
    for (let i = 0; i < customItems.length; i++) {
        let items = customItems[i].split('/');
        componentArr += items[items.length - 1] + ' ';
    }
    common.removeFile(componentArr, path.resolve(rootPath, tmpDistName));
    let command = 'mip-extension-optimise ' + rootPath + '/' + tmpMiddleName + ' -o ' + rootPath + '/' + tmpDistName + ' ' + componentArr;
    process(command);
    merge();
    let output = getJson(customItems, mipCustomData);
    delTmp();
    return output;
}

function handleFile (pth, cb) {
    if (customItems) {
        customItems.forEach(function (item) {
            var componentPath = path.resolve(rootPath, 'src', item);
            let files = fs.readdirSync(componentPath);
            files.forEach(function (file) {
                let filePath = path.resolve(componentPath, file);
                if (fs.statSync(filePath).isFile()) {
                    cb && cb(filePath);
                }
            });
        });
    } else {
        if (fs.statSync(pth).isDirectory()) {
            let files = fs.readdirSync(pth);
            files.forEach(function (file) {
                handleFile(path.resolve(pth, file), cb);
            });
        } else if (fs.statSync(pth).isFile()) {
            cb && cb(pth);
        }
    }
}

function delTmp () {
    let tmpMiddle = path.resolve(rootPath, tmpMiddleName);
    let tmpDist = path.resolve(rootPath, tmpDistName);
    process('rm -rf ' + tmpMiddle);
    process('rm -rf ' + tmpDist);
}

function getJson (customItems, mipCustomData) {
    let content = '';
    let data = [];
    for (let i = 0; i < customItems.length; i++) {
        let files = customItems[i].split('/');
        let fileName = files[files.length - 1];
        let obj = {};

        let packageFile = path.resolve(rootPath, 'src/template', fileName, 'package.json');
        let content = common.readFile(packageFile);
        let version = JSON.parse(content).version;

        let pth = path.resolve(rootPath, tmpDistName, fileName, version, fileName + '.html');
        obj.tpl = encodeURIComponent(common.readFile(pth));
        obj.data = mipCustomData[i];
        data.push(obj);
    }
    return data;
}


function handlePath (pth) {
    if (!fs.existsSync(pth)) {
        handlePath(path.dirname(pth));
        fs.mkdirSync(pth);
    }
}

function handleCustom (pth) {
    let ct = '';
    let files = pth.split('/');
    let baseName = files[files.length - 2];
    let filePath = path.resolve(rootPath, tmpMiddleName, baseName, path.basename(pth));
    let writePath = path.resolve(rootPath, tmpMiddleName, baseName);

    if (common.isValidFile(pth)) {
        handlePath(writePath);
        if (common.isCSS(pth)) {
            common.writeFile(filePath, common.cssScope(pth));
        } else if (pth.match(/\.(js|html|json)$/)) {
            common.writeFile(filePath, common.readFile(pth));
        }
    }
}

function merge () {
    let dist = path.resolve(rootPath, tmpDistName);

    let distFiles = fs.readdirSync(dist);
    distFiles.forEach(function (cFlile) {
        let cFilePath = path.resolve(rootPath, tmpDistName, cFlile);
        let cFliles = fs.readdirSync(cFilePath);
        cFliles.forEach(function (file) {
            let filePath = path.resolve(cFilePath, file);
            let files = fs.readdirSync(filePath);
            files.forEach(function (ct) {
                let contentPath = path.resolve(filePath, ct);
                if (contentPath.match(/\.html$/)) {
                    htmlCompile(contentPath, rootPath);
                }
                content += wrapContent(contentPath);
            });
            let fileName = filePath.split('/');
            fileName = fileName.length > 0 ? fileName[fileName.length - 2] : '';
            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath);
            }
            common.writeFile(path.resolve(filePath, fileName + '.html'), content);
            content = '';
        });
    });
}

function wrapContent (pth) {
    if (pth.match(/\.js$/)) {
        content = '<script>'
                + common.readFile(pth)
                + '</script>';
    } else if (pth.match(/\.html$/)) {
        content = common.readFile(pth);
    }

    // setTimeout(function () {
    //     process('rm -rf ' + path, function(err, out) {
    //         if (err) {
    //             cli.error(err);
    //         }
    //     });
    // }, 100);
    return content;
}

function htmlCompile (fileDir) {
    if (fileDir.match(/\.html$/)) {
        let content = common.readFile(fileDir);
        let output = '';
        let reg = new RegExp('{{>>([^{]*)}}', 'g');

        let results;
        while ((results = reg.exec(content)) != null)  {
            if (results && results.length > 0) {
                let name = results[1];
                name = name.trim();
                let packageFile = path.resolve(rootPath, 'src', name, 'package.json');
                let pct = common.readFile(packageFile);
                pct = JSON.parse(pct);
                version = pct.version;

                let file = name.split('/');
                file = file[file.length - 1];
                let tplPath = path.resolve(rootPath, tmpDistName, file, version, file + '.html');
                output = common.readFile(tplPath);
                content = content.replace(results[0], output);
            }
        }
        common.writeFile(fileDir, content);
    }
}

exports.exec = exec;
