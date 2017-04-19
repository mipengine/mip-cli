/**
 * @file 定制化 MIP 组件预览功能
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

const common = {
    isValidFile: function (pth) {
        return pth.match(/\.(css|less|sass|js|json|html|md)$/);
    },

    isCSS: function (pth) {
        return pth.match(/\.css|less|sass$/);
    },

    isJS: function (pth) {
        return pth.match(/\.js$/);
    },

    isHTML: function (pth) {
        return pth.match(/\.html$/);
    },

    isOther: function (pth) {
        return pth.match(/\.(json|md)$/);
    },

    writeFile: function (pth, content) {
        if (!pth || !content) {
            return;
        }
        fs.writeFileSync(pth, content);
    },

    readFile: function (pth) {
        if (!pth) {
            return;
        }
        return fs.readFileSync(pth, charset);
    },

    cssScope: function (pth) {
        let ct = '';
        let files = pth.split('/');
        let baseName = files[files.length - 2];
        let cssScope = this.readFile(pth)
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
    },

    removeFile: function (component, pth) {
        if (component) {
            let components = component.split(' ');
            components.forEach(function (file) {
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
        // let amdPacker = new AMDPacker({
        //     config: {
        //         baseUrl: path.resolve(input, 'js'),
        //         files: [
        //             '/*.js'
        //         ]
        //     }
        // });
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
                // amdPacker,
                lessProcessor,
                jsCompressor
            ],
            outputDir: output,
        });
        return builder.build();
    }
};

module.exports = common;
