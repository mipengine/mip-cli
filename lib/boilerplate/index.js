/**
 * @file 组件生成模板
 * @author mengke01(kekee000@gmail.com)
 */

'use strict';
const boilerplate = require('mip-cli-boilerplate');

const render = require('../util/render');
const string = require('../util/string');
const File = require('./File');

module.exports = {

    /**
     * 生成mip页面
     *
     * @param  {Object} options 生成参数
     * @return {Array.<File>} 生成的文件列表
     */
    page: function (options) {
        const content = render.render(boilerplate.readTemplate('mip.html'), options);
        return [new File(options.name, content)];
    },

    /**
     * 生成mip组件
     *
     * @param  {Object} options 生成参数
     * @return {Array.<File>} 生成的文件列表
     */
    element: function (options) {
        // 模板生成映射
        const templateMap = {
            'extensions/element.js': '${name}/${name}.js',
            'extensions/element.less': '${name}/${name}.less',
            'extensions/README.md': '${name}/README.md',
            'extensions/package.json': '${name}/package.json'
        };
        if (options.custom) {
            templateMap['extensions/element.mustache'] = '${name}/${name}.mustache';
            templateMap['extensions/element.json'] = '${name}/${name}.json';
        }
        let ret = [];
        Object.keys(templateMap).forEach(function (templatePath) {
            let content = render.render(boilerplate.readTemplate(templatePath), options);
            let fileName = string.format(templateMap[templatePath], options);
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
        let fileName = 'mip.config';
        if (options && options.isCustom) {
            fileName = 'mipcustom.config';
        }
        const content = render.render(boilerplate.readTemplate(fileName), options);
        return [new File('mip.config', content)];
    },

    /**
     * 生成定制化mip调试页面
     *
     * @param  {Object} options 生成参数
     * @return {Array.<File>} 生成的文件列表
     */
    mipcustom: function (options) {
        const content = render.render(boilerplate.readTemplate('mipcustom.html'), options);
        return [new File(options.name, content)];
    },

    /**
     * 生成mip主项目调试配置
     *
     * @param  {Object} options 生成参数
     * @return {string} 生成的mipmain调试代码片段
     */
    mipmain: function (options) {
        return render.render(boilerplate.readTemplate('mipmain.tpl'), options);
    }
};
