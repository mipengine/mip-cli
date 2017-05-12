/**
 * @file 定义定制化 MIP 常量和变量
 * @author wupeng(smartfutureplayer@gmail.com)
 */

function define(name, value, enumerable) {
    Object.defineProperty(global, name, {
        value: value,
        writable: enumerable
    });
}

define("src", "src", false);
define("conf", "conf", false);
define("tmp", "tmp", false);
define("dist", "dist", true);
define("cm", "common", false);
define("charset", "utf-8", false);
define("template", "template", false);
define("preview", "preview", false);
define("compile", "compile", false);
define("component", [], true);
define("fecsArray", [], true);
define("rootPath", "", true);
define("errors", "", true);
define("requireConfig", "mip-require.config.json", false);
define("header", '<!DOCTYPE html>'
                + '<html mip>'
                + '<head>'
                +    '<meta charset="UTF-8">'
                +    '<meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">'
                +    '<link rel="stylesheet" type="text/css" href="https://mipcache.bdstatic.com/static/v1/mip.css">'
                +    '<link rel="canonical" href="https://www.baidu.com">'
                + '</head>'
                + '<body>', true);
define("footer", '<script src="https://mipcache.bdstatic.com/static/v1/mip.js"></script>'
                + '</body></html>' , true);