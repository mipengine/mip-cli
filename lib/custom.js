/**
 * @file 定制化 MIP 组件编译
 * @author wupeng(smartfutureplayer@gmail.com)
 */

'use strict';
const cli = require('./cli');
const fs = require('fs');
const path = require('path');
const boilerplate = require('./boilerplate');
const fecs = require('fecs');
const process = require('child_process').execSync;

let rootPath;
const dist = 'dist';
const tmp = 'tmp';
const src = 'src';
const charset = 'utf-8';

function exec(config) {
    let filePath = config && config.files && config.files.length
                    ? config.files[0] : null;
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

    // compile
    const distPath = path.resolve(rootPath, dist);
    let command = 'mip-extension-optimise ' + rootPath + '/tmp -o ' + distPath;
    process(command);
    merge();

    // remove temporary file
    setTimeout(function () {
        let tmpPath = path.resolve(rootPath, tmp);
        process('rm -rf ' + tmpPath);
    }, 500);
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
    if (!fs.existsSync(pth)) {
        handlePath(path.dirname(pth));
        fs.mkdirSync(pth);
    }
}

function cssScope (pth) {
    let ct = '';
    let files = pth.split('/');
    let baseName = files[files.length - 2];
    let cssScope = readFile(pth)
    .replace(/(\/\*(.|\s)*?\*\/)/g, '')
    .replace(/(^|\s|[^'":\w\d\\])(\/\/(?!m\.baidu)[^\r\n]*)/g, '')
    .replace(/\n/g, '')
    .split(/\}/g).filter(function (line) {
        if (line) {
            line = line.trim();
            ct += baseName + ' ' + line + '}';
        }
    });
    return ct;
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
        if (error) {
            return false;
        }
    });
}

function handleCustom (pth) {
    let ct = '';
    let files = pth.split('/');
    let baseName = files[files.length - 2];
    let filePath = path.resolve(rootPath, tmp, baseName, path.basename(pth));
    let writePath = path.resolve(rootPath, tmp, baseName);

    if (isValidFile(pth)) {
        handlePath(writePath);
        if (isCSS(pth)) {
            ct = cssScope(pth);
        } else if (isJS(pth) || isOther(pth)) {
            ct = readFile(pth);
        } else if (isHTML(pth)) {
            ct = readFile(pth);
            require('../lib/validate').exec({
                files: [pth]
            });
        }
        writeFile(filePath, ct);
        fecsCheck(pth);

    }
    return true;
}

function htmlCompile (pth) {
    if (pth.match(/\.html$/)) {
        let results;
        let output = '';
        let content = readFile(pth);
        let reg = new RegExp('{{>>([^{]*)}}', 'g');
        while ((results = reg.exec(content)) != null)  {
            if (results && results.length > 0) {
                let name = results[1];
                name = name.trim();
                let packageFile = path.resolve(rootPath, 'src', name, 'package.json');
                let pct = readFile(packageFile);
                pct = JSON.parse(pct);

                let file = name.split('/');
                file = file[file.length - 1];
                let tplPath = path.resolve(rootPath, 'dist', file, pct.version, file + '.html');

                output = readFile(tplPath);
                content = content.replace(results[0], output);
            }
        }
        writeFile(pth, content);
    }
}

function wrapContent (pth) {
    var ct = "";
    if (isJS(pth)) {
        ct = '<script>'
            + readFile(pth)
            + '</script>';
    } else if (isHTML(pth)) {
        ct = readFile(pth);
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
                    htmlCompile(contentPath);
                }
                output += wrapContent(contentPath);
            });
            let fileName = filePath.split('/');
            fileName = fileName.length > 0 ? fileName[fileName.length - 2] : '';
            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath);
            }
            writeFile(path.resolve(filePath, fileName + '.html'), output);
            output = '';
        });
    });
}

exports.exec = exec;
