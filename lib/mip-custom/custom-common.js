/**
 * @file 定制化 MIP 编译、预览通用方法
 * @author wupeng(smartfutureplayer@gmail.com)
 */

'use strict';
const fs = require('fs');
const charset = 'utf-8';
const path = require('path');
const cli = require('../cli');
const execSync = require('child_process').execSync;
const Builder = require('mip-builder');
const amdProcessor = require('mip-processor-amd');
const AMDCompiler = amdProcessor.Compiler;
const AMDPacker = amdProcessor.Packer;
const JSCompressor = require('mip-processor-jscompress');
const LessProcessor = require('mip-processor-less');

const src = 'src';

const common = {
    isValidFile: function (pth) {
        return pth.match(/\.(css|less|sass|js|json|mustache|md)$/);
    },

    isCSS: function (pth) {
        return pth.match(/\.css|less|sass$/);
    },

    isJS: function (pth) {
        return pth.match(/\.js$/);
    },

    isHTML: function (pth) {
        return pth.match(/\.(mustache|html)$/);
    },

    isOther: function (pth) {
        return pth.match(/\.(json|md)$/);
    },

    existsFile: function (pth) {
        if (!pth) {
            return;
        }
        return fs.existsSync(pth);
    },

    writeFile: function (pth, content) {
        if (!pth || !content) {
            return;
        }
        fs.writeFileSync(pth, content);
    },

    readFile: function (pth) {
        if (!pth || !this.existsFile(pth)) {
            cli.warn("file does not exist: " + pth);
            return;
        }
        return fs.readFileSync(pth, charset);
    },

    cssScope: function (pth, extName) {
        let ct = '';
        let cssScope = this.readFile(pth)
        .replace(/(\/\*(.|\s)*?\*\/)/g, '')
        .replace(/(^|\s|[^'":\w\d\\])(\/\/(?!m\.baidu)[^\r\n]*)/g, '')
        .replace(/\n/g, '')
        .split(/\}/g).filter(function (line) {
            if (line) {
                line = line.trim();
                var tag = '^\\s*' + extName + '.*';
                var reg = new RegExp(tag);
                if (!/^\@.*/.test(line) && !reg.exec(line)) {
                    ct += extName + ' ' + line + '}';
                } else {
                    ct += line + '}';
                }
            }
        });
        return ct;
    },

    removeFile: function (pth, component) {
        if (component) {
            component.forEach(function (file) {
                execSync('rm -rf ' + path.resolve(pth, file));
            });
        } else {
            execSync('rm -rf ' + pth);
        }
    },

    build: function (rootPath, input, output) {
        let amdCompiler = new AMDCompiler({
            config: {
                baseUrl: input,
                files: [
                    '/**/*.js'
                ]
            }
        });
        let lessProcessor = new LessProcessor({
            files: [
                '*.less',
                '*.css',
                '**/*.css',
                '**/*.css'
            ]
        });
        let jsCompressor = new JSCompressor();
        let builder = new Builder({
            dir: input,
            processors: [
                amdCompiler,
                lessProcessor,
                jsCompressor
            ],
            outputDir: output,
        });
        return builder.build();
    },

    handleDependence: function (rootPath, tpls) {
        if (!tpls || tpls.length === 0 || !rootPath) {
            return;
        }
        let self = this;
        let results = [];
        for (var i = 0; i < tpls.length; i++) {
            let item = tpls[i];
            let pth = path.resolve(rootPath, src, item, path.basename(item) + '.mustache');
            if (common.existsFile(pth)) {
                self.handleContent(self.readFile(pth), tpls);
                results.push(item);
            } else {
                cli.warn('The "' + item + '" module does not exist!');
            }
        }
        return results;
    },

    handleClassify: function (components) {
        if (!components) {
            return;
        }
        var cms = {};
        components.forEach(function (item) {
            let vls = item.split('/');
            if (vls && vls.length > 1) {
                let key = vls[0];
                if (!(cms[key] instanceof Array)) {
                    cms[key] = [vls[1]];
                } else {
                    cms[key].push(vls[1]);
                }
            }
        });
        return cms;
    },

    handleContent: function (ct, tpls) {
        let results;
        let output = '';
        let reg = new RegExp('{{>>([^{]*)}}', 'g');
        while ((results = reg.exec(ct)) != null)  {
            if (results && results.length > 0) {
                let name = results[1];
                name = name.trim();
                if (!this.isValidFile(name)) {
                    let existed = false;
                    tpls.forEach(function (item) {
                        if (item === name) {
                            existed = true;
                            return false;
                        }
                    });
                    if (!existed) {
                        tpls.push(name);
                    }
                }
            }
        }
    },

    isEmptyObject: function (obj) {
        var key;
        for (key in obj) {
            return false;
        }
        return true;
    }
};

module.exports = common;
