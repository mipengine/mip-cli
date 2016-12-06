/**
 * @file mip-extensions项目列表
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';
const fs = require('fs');
const path = require('path');
const render = require('../../util/render');
const cli = require('../../cli');

module.exports = function () {
    return function (context) {
        const dirPath = context.config.baseDir;

        context.stop();
        fs.readdir(dirPath, (err, files) => {
            if (err) {
                cli.error('read extensions dir error', err);
                return;
            }

            let list = [];
            files.forEach(file => {
                let stat = fs.statSync(path.join(dirPath, file));
                if (file.match(/^mip-[\w-]+$/i) && stat.isDirectory()) {
                    list.push({
                        name: file,
                        url: '/local-extension-debug/' + file,
                        mtime: stat.mtime
                    });
                }
            });

            const tpl = fs.readFileSync(path.join(__dirname, 'mip-extensions-list.tpl'), 'utf8');
            let html = render.render(tpl, {
                files: list
            });


            context.res.header('content-type', 'text/html');
            context.res.send(html);
            context.end();
        });
    };
};
