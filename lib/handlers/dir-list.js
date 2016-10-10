/**
 * @file 列出静态资源目录
 * @author mengke01(kekee000@gmail.com)
 */

const fs = require('fs');
const path = require('path');
const render = require('../util/render');

module.exports = function () {
    return function (context) {
        var pathname = context.req._parsedUrl.pathname;

        var dirPath = path.join(context.config.baseDir, pathname);
        // 不存在的目录跳过
        if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
            return;
        }
        context.stop();
        fs.readdir(dirPath, function (err, files) {
            var list = [];
            files.forEach(function (file) {
                var stat = fs.statSync(path.join(dirPath, file));
                list.push({
                    name: stat.isDirectory() ? file + '/' :  file,
                    url: encodeURIComponent(file)
                            + (stat.isDirectory() ? '/' : ''),
                    size: stat.size,
                    mtime: stat.mtime
                });
            });

            var tplStr = fs.readFileSync(path.join(__dirname, 'dir-list.tpl'), 'utf8');
            var html = render.render(tplStr, {
                files: list
            });

            context.res.header('content-type', 'text/html');
            context.res.send(html);
            context.end();
        });
    };
};
