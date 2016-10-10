/**
 * @file mip-extensions项目列表
 * @author mengke01(kekee000@gmail.com)
 */

const fs = require('fs');
const path = require('path');
const render = require('../util/render');

module.exports = function () {
    return function (context) {
        const dirPath = context.config.baseDir;
        fs.readdir(dirPath, function (err, files) {
            var list = [];
            files.forEach(function (file) {
                var stat = fs.statSync(path.join(dirPath, file));
                if (file.match(/^mip-[\w-]+$/i) && stat.isDirectory()) {
                    list.push({
                        name: file,
                        url: '/local-extension-debug?name=' + file,
                        mtime: stat.mtime
                    });
                }
            });

            const tpl = fs.readFileSync(path.join(__dirname, 'mip-extensions-list.tpl'), 'utf8');
            var html = render.render(tpl, {
                files: list
            });

            context.res.header('content-type', 'text/html');
            context.res.send(html);
            context.end();
        });
    };
};
