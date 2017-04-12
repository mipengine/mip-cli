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
const process = require('child_process').exec;

let content = "";
let rootPath;

function exec(config) {
    let filePath = config.files[0];
    rootPath = path.resolve(config.baseDir, filePath);
    filePath = path.resolve(rootPath, 'src');
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

    var command = 'mip-extension-optimise ' + rootPath + '/tmp -o ' + rootPath + '/dist';
    process(command, function (error, stdout, stderr) {
        if (error) {
            cli.error(error);
            return;
        }
        cli.info(stdout);
        merge();
    });
    var command = 'mip-extension-optimise ' + rootPath + '/tmp -o ' + rootPath + '/dist';
    process(command, function (error, stdout, stderr) {});

    setTimeout(function () {
        var tmpPath = path.resolve(rootPath, 'tmp');
        process('rm -rf ' + tmpPath, function(err, out) {
            if (err) {
                cli.error(err);
            }
        });
    }, 500);
}

function handleCustom (fileDir) {
    var files = fileDir.split('/');
    var baseName = files[files.length - 2];
    var filePath = path.resolve(rootPath, 'tmp', baseName, path.basename(fileDir));

    if (fileDir.match(/\.(css|less|sass|js|html)$/)) {
        if (!fs.existsSync(path.resolve(rootPath, 'tmp'))) {
            fs.mkdirSync(path.resolve(rootPath, 'tmp'));
        }
        var writePath = path.resolve(rootPath, 'tmp', baseName);
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
    } else if (fileDir.match(/\.js$/)) {
        fs.writeFileSync(filePath, fs.readFileSync(fileDir));
    } else if (fileDir.match(/\.html$/)) {
        var ct = fs.readFileSync(fileDir);
        require('../lib/validate').exec({
            files: [fileDir]
        });
        fs.writeFileSync(filePath, ct);
    } else if (fileDir.match(/\.(json|.md)$/)) {
        fs.writeFileSync(filePath, fs.readFileSync(fileDir));
    }
    // validate via fecs,check js and css
    var options = {
        _: [fileDir],
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
    return true;
}

function htmlCompile (fileDir) {
    if (fileDir.match(/\.html$/)) {
        var content = fs.readFileSync(fileDir, 'utf-8');
        var output = "";
        var reg = new RegExp("{{>>([^{]*)}}", "g");
        // var results = reg.exec(content);

        var results;
        var i=1;
        while ((results = reg.exec(content)) != null)  {
            if (results && results.length > 0) {
                var name = results[1];
                name = name.trim();
                var packageFile = path.resolve(rootPath, "src", name, "package.json");
                var pct = fs.readFileSync(packageFile, "utf-8");
                pct = JSON.parse(pct);

                var file = name.split('/');
                file = file[file.length - 1];
                var tplPath = path.resolve(rootPath, "dist", file, pct.version, file + '.html');

                output = fs.readFileSync(tplPath, "utf-8");
                content = content.replace(results[0], output);
            }
        }
        fs.writeFileSync(fileDir, content);
    }
}

function merge () {
    var dist = path.resolve(rootPath, 'dist');

    var distFiles = fs.readdirSync(dist);
    distFiles.forEach(function (cFlile) {
        var cFilePath = path.resolve(rootPath, "dist", cFlile);
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
        var cFilePath = path.resolve(rootPath, "dist", cFlile);
        var cFliles = fs.readdirSync(cFilePath);
        cFliles.forEach(function (file) {
            var filePath = path.resolve(cFilePath, file);
            var files = fs.readdirSync(filePath);
            files.forEach(function (ct) {
                var contentPath = path.resolve(filePath, ct);
                if (contentPath.match(/\.html$/)) {
                    htmlCompile(contentPath);
                }
                // content += wrapContent(contentPath);
            });

        });
    });

    // var dist = path.resolve(rootPath, 'dist');
    // fs.readdir(dist, function (err, distFiles) {
    //     distFiles.forEach(function (cFlile) {
    //         var cFilePath = path.resolve(rootPath, "dist", cFlile);
    //         fs.readdir(cFilePath, function (err, cFliles) {
    //             cFliles.forEach(function (file) {
    //                 var filePath = path.resolve(cFilePath, file);
    //                 fs.readdir(filePath, function (err, files) {
    //                     files.forEach(function (ct) {
    //                         if (ct.match(/\.html$/)) {
    //                             htmlCompile(path.resolve(filePath, ct));
    //                         }
    //                     });
    //                 });
    //             });
    //         });
    //     });
    // });
}

function wrapContent (path) {
    // if (path.match(/\.css|less|sass$/)) {
        // content = "<style>"
        //         + fs.readFileSync(path, 'utf-8')
        //         + "</style>";
    // } else
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

exports.exec = exec;
