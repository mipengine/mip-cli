/**
 * @file 定制化 MIP 组件预览功能
 * @author wupeng(smartfutureplayer@gmail.com)
 */

'use strict';
const cli = require('./cli');
const fs = require('fs');
const path = require('path');
const boilerplate = require('./boilerplate');
const fecs = require('fecs');
const process = require('child_process').execSync;

let content = "";
let rootPath;
let version;
const tmpMiddleName = "preview-tmp-middle";
const tmpDistName = "preview-dist-middle";

function exec(config) {
    let customDir = config.mipCustomDir;
    let customItems = config.mipCustomItems;
    let mipCustomData = config.mipCustomData;
    rootPath = config.baseDir || process.cwd();
    rootPath = path.resolve(rootPath, customDir);
    return getContent(rootPath, customItems, mipCustomData);
}

function getContent (rootPath, customItems, mipCustomData) {
    var filePath = path.resolve(rootPath, 'src');
    var files = fs.readdirSync(filePath);
    files.forEach(function (file) {
        var ePath = path.resolve(filePath, file);
        if (fs.existsSync(ePath) && fs.statSync(ePath).isDirectory()) {
            var files = fs.readdirSync(ePath);
            files.forEach(function (file) {
                var pth = path.resolve(ePath, file);
                if (fs.statSync(pth).isDirectory()) {
                    var epfiles = fs.readdirSync(pth);
                    epfiles.forEach(function (compileFile) {
                        var epFilePath = path.resolve(pth, compileFile);
                        if (handleCustom(epFilePath)) {
                            return;
                        }
                    });
                }
            });
        }
    });

    var command = 'mip-extension-optimise ' + rootPath + '/' + tmpMiddleName + ' -o ' + rootPath + '/' + tmpDistName;
    process(command);
    merge();
    var output = getJson(customItems, mipCustomData);
    delTmp();
    return output;
}

function delTmp () {
    var tmpMiddle = path.resolve(rootPath, tmpMiddleName);
    var tmpDist = path.resolve(rootPath, tmpDistName);
    process('rm -rf ' + tmpMiddle);
    process('rm -rf ' + tmpDist);
}

function getJson (customItems, mipCustomData) {
    var content = "";
    var data = [];
    for (var i = 0; i < customItems.length; i++) {
        var files = customItems[i].split('/');
        var fileName = files[files.length - 1];
        var obj = {};
        var pth = path.resolve(rootPath, tmpDistName, fileName, version, fileName + '.html');
        obj.tpl = encodeURIComponent(fs.readFileSync(pth, 'utf-8'));
        obj.data = mipCustomData[i];
        data.push(obj);
    }
    return data;
}

function handleCustom (fileDir) {
    var files = fileDir.split('/');
    var baseName = files[files.length - 2];
    var filePath = path.resolve(rootPath, tmpMiddleName, baseName, path.basename(fileDir));

    if (fileDir.match(/\.(css|less|sass|js|html)$/)) {
        if (!fs.existsSync(path.resolve(rootPath, tmpMiddleName))) {
            fs.mkdirSync(path.resolve(rootPath, tmpMiddleName));
        }
        var writePath = path.resolve(rootPath, tmpMiddleName, baseName);
        if (!fs.existsSync(writePath)) {
            fs.mkdirSync(writePath);
        }
    }
    if (fileDir.match(/\.css|less|sass$/)) {
        var cssContent = "";
        var cssScope = fs.readFileSync(fileDir, 'utf-8')
        .replace(/(\/\*(.|\s)*?\*\/)/g, '')
        .replace(/(^|\s|[^'":\w\d\\])(\/\/(?!m\.baidu)[^\r\n]*)/g, '')
        .replace(/\n/g, '')
        .split(/\}/g).filter(function (line) {
            if (line) {
                line = line.trim();
                cssContent += baseName + " " + line + "}";
            }
        });
        fs.writeFileSync(filePath, cssContent);
    } else if (fileDir.match(/\.(js|html|json)$/)) {
        fs.writeFileSync(filePath, fs.readFileSync(fileDir, 'utf-8'));
    }
}

function merge () {
    var dist = path.resolve(rootPath, tmpDistName);

    var distFiles = fs.readdirSync(dist);
    distFiles.forEach(function (cFlile) {
        var cFilePath = path.resolve(rootPath, tmpDistName, cFlile);
        var cFliles = fs.readdirSync(cFilePath);
        cFliles.forEach(function (file) {
            var filePath = path.resolve(cFilePath, file);
            var files = fs.readdirSync(filePath);
            files.forEach(function (ct) {
                var contentPath = path.resolve(filePath, ct);
                content += wrapContent(contentPath);
            });
            var fileName = filePath.split('/');
            fileName = fileName.length > 0 ? fileName[fileName.length - 2] : "";
            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath);
            }
            fs.writeFileSync(path.resolve(filePath, fileName + '.html'), content);
            content = "";
        });
    });

    distFiles.forEach(function (cFlile) {
        var cFilePath = path.resolve(rootPath, tmpDistName, cFlile);
        var cFliles = fs.readdirSync(cFilePath);
        cFliles.forEach(function (file) {
            var filePath = path.resolve(cFilePath, file);
            var files = fs.readdirSync(filePath);
            files.forEach(function (ct) {
                var contentPath = path.resolve(filePath, ct);
                if (contentPath.match(/\.html$/)) {
                    htmlCompile(contentPath);
                }
            });

        });
    });
}

function wrapContent (path) {
    if (path.match(/\.js$/)) {
        content = "<script>"
                + fs.readFileSync(path, 'utf-8')
                + "</script>";
    } else if (path.match(/\.html$/)) {
        content = fs.readFileSync(path, 'utf-8');
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
        var content = fs.readFileSync(fileDir, 'utf-8');
        var output = "";
        var reg = new RegExp("{{>>([^{]*)}}", "g");

        var results;
        var i=1;
        while ((results = reg.exec(content)) != null)  {
            if (results && results.length > 0) {
                var name = results[1];
                name = name.trim();
                var packageFile = path.resolve(rootPath, "src", name, "package.json");
                var pct = fs.readFileSync(packageFile, "utf-8");
                pct = JSON.parse(pct);
                version = pct.version;

                var file = name.split('/');
                file = file[file.length - 1];
                var tplPath = path.resolve(rootPath, tmpDistName, file, version, file + '.html');
                output = fs.readFileSync(tplPath, "utf-8");
                content = content.replace(results[0], output);
            }
        }
        fs.writeFileSync(fileDir, content);
    }
}

exports.exec = exec;
