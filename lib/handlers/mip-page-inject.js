/**
 * @file mip页面注入处理
 * @author mengke01(kekee000@gmail.com)
 */

const fs = require('fs');
const path = require('path');
const cli = require('../cli');

module.exports = function () {
    return function (context) {
        const baseDir = context.config.baseDir;
        var pathname = context.req._parsedUrl.pathname;
        var filePath = path.join(baseDir, pathname);
        if (!fs.existsSync(filePath)) {
            return;
        }

        cli.info('process page inject', pathname);
        var html = require('./mip-util').pageInject(fs.readFileSync(filePath, 'utf8'));
        context.res.header('content-type', 'text/html');
        context.res.send(html);
        context.end();
    };
};
