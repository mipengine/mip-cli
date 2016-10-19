/**
 * @file 组件生成模板
 * @author mengke01(kekee000@gmail.com)
 */

const fs = require('fs');
const path = require('path');
const render = require('../util/render');
const string = require('../util/string');
const File = require('./File');

const TEMPLATE_DIR = path.resolve(__dirname, '../../boilerplate');

function readTemplate(filePath) {
    return fs.readFileSync(path.resolve(TEMPLATE_DIR, filePath), 'utf-8');
}


module.exports = {

    /**
     * 生成mip页面
     *
     * @param  {Object} options 生成参数
     * @return {Array.<File>} 生成的文件列表
     */
    page: function (options) {
        var content = render.render(readTemplate('mip.html'), options);
        return [new File(options.name, content)];
    },

    /**
     * 生成mip组件
     *
     * @param  {Object} options 生成参数
     * @return {Array.<File>} 生成的文件列表
     */
    element: function (options) {
        var ret = [];
        // 模板生成映射
        var templateMap = {
            'extensions/element.js': '${name}/${name}.js',
            'extensions/element.less': '${name}/${name}.less',
            'extensions/README.md': '${name}/README.md',
            'extensions/package.json': '${name}/package.json'
        };
        Object.keys(templateMap).forEach(function (templatePath) {
            var content = render.render(readTemplate(templatePath), options);
            var fileName = string.format(templateMap[templatePath], options);
            ret.push(new File(fileName, content));
        });

        return ret;
    },

    /**
     * 生成mip项目配置
     *
     * @param  {Object} options 生成参数
     * @return {Array.<File>} 生成的文件列表
     */
    config: function (options) {
        var content = render.render(readTemplate('mip.config'), options);
        return [new File('mip.config', content)];
    }
};
