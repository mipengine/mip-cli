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
const process = require('child_process').execSync;
const common = require('./custom-common');
const validator = require('mip-validator')();

let rootPath;
const dist = 'dist';
const tmp = 'tmp';
const src = 'src';
const charset = 'utf-8';
let errors;
let component;

let header = '<!DOCTYPE html>'
            + '<html mip>'
            + '<head>'
            +    '<meta charset="UTF-8">'
            +    '<meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">'
            +    '<link rel="stylesheet" type="text/css" href="https://mipcache.bdstatic.com/static/v1/mip.css">'
            +    '<link rel="canonical" href="https://www.baidu.com">'
            + '</head>'
            + '<body>';
let footer = '<script src="https://mipcache.bdstatic.com/static/v1/mip.js"></script>'
            + '</body></html>';
let fecsArray = [];

function exec(config) {
    let filePath = config && config.files && config.files.length
                    ? config.files[0] : null;
    component = config && config.files && config.files.length > 1
    ? config.files.slice(1).join(' ') : '';
    if (!filePath) {
        return;
    }
    rootPath = path.resolve(config.baseDir, filePath);
    filePath = path.resolve(rootPath, src);

    // handle file
    handleFile(filePath, function (pth) {
        if (handleCustom(pth)) {
            return;
        }
    });
}

function compile () {
    // compile
    if (!errors || !errors.length) {
        const distPath = path.resolve(rootPath, dist);
        let command = 'mip-extension-optimise ' + rootPath + '/tmp -o ' + distPath + ' ' + component;
        process(command);
        merge();
    } else {
        cli.error('请解决log信息中的错误才能进行编译！')
    }
    // remove temporary file
    setTimeout(function () {
        let tmpPath = path.resolve(rootPath, tmp);
        process('rm -rf ' + tmpPath);
    }, 100);
}

function handlePath (pth) {
    if (!fs.existsSync(pth)) {
        handlePath(path.dirname(pth));
        fs.mkdirSync(pth);
    }
}

function handleFile (pth, cb) {
    if (component) {
        var componentArr = component.split(' ');
        componentArr.forEach(function (item) {
            var componentPath = path.resolve(rootPath, src, 'template', item);
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

function fecsCheck (pth) {
    let options = {
        _: [pth],
        type: 'js,css',
        stream: false,
        rule: true,
        silent: true,
        color: true
    };
    fecs.check(options, function (success, error) {
        fecsArray.pop(pth);
        if (!success) {
            errors = error;
        }
        if (!fecsArray.length) {
            compile();
        }
    });
}

function handleCustom (pth) {
    let ct = '';
    let files = pth.split('/');
    let baseName = files[files.length - 2];
    let filePath = path.resolve(rootPath, tmp, baseName, path.basename(pth));
    let writePath = path.resolve(rootPath, tmp, baseName);

    if (common.isValidFile(pth)) {
        handlePath(writePath);
        if (common.isCSS(pth)) {
            ct = common.cssScope(pth);
        } else if (common.isJS(pth) || common.isOther(pth)) {
            ct = common.readFile(pth);
        } else
        if (common.isHTML(pth)) {
            ct = common.readFile(pth);
            validate(pth, header + ct + footer);
        }
        common.writeFile(filePath, ct);
        fecsArray.push(pth);
        fecsCheck(pth);
    }
    return true;
}

function validate (pth, ct) {
    if (!ct) {
        return;
    }
    let errs = validator.validate(ct);
    if (errs && errs.length) {
        cli.log('validate error', cli.chalk.green(pth));
        errors = errs;
        errs.forEach(error => {
            cli.error('line', error.line, 'col', error.col +  ':', error.message);
        });
    }
    else {
        cli.log('validate success', cli.chalk.green(pth));
    }
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
                let packageFile = path.resolve(rootPath, 'src', name, 'package.json');
                let pct = common.readFile(packageFile);
                pct = JSON.parse(pct);

                let file = name.split('/');
                file = file[file.length - 1];
                let tplPath = path.resolve(rootPath, 'dist', file, pct.version, file + '.html');

                output = common.readFile(tplPath);
                content = content.replace(results[0], output);
            }
        }
        common.writeFile(pth, content);
    }
}

function wrapContent (pth) {
    var ct = "";
    if (common.isJS(pth)) {
        ct = '<script>'
            + common.readFile(pth)
            + '</script>';
    } else if (common.isHTML(pth)) {
        ct = common.readFile(pth);
    }
    return ct;
}

function merge () {
    let output = '';
    let distPath = path.resolve(rootPath, dist);

    let distFiles = fs.readdirSync(distPath);
    distFiles.forEach(function (cFlile) {
        let cFilePath = path.resolve(rootPath, distPath, cFlile);
        let cFliles = fs.readdirSync(cFilePath);
        cFliles.forEach(function (file) {
            let filePath = path.resolve(cFilePath, file);
            let files = fs.readdirSync(filePath);
            files.forEach(function (ct) {
                let contentPath = path.resolve(filePath, ct);
                if (contentPath.match(/\.html$/)) {
                    htmlCompile(contentPath, rootPath);
                }
                output += wrapContent(contentPath);
            });
            let fileName = filePath.split('/');
            fileName = fileName.length > 0 ? fileName[fileName.length - 2] : '';
            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath);
            }
            common.writeFile(path.resolve(filePath, fileName + '.html'), output);
            output = '';
        });
    });
}

exports.exec = exec;
