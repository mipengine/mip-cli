/**
 * @file 用来生成模板文件的File对象
 * @author mengke01(kekee000@gmail.com)
 */

const fs = require('fs');
const path = require('path');

/**
 * 生成的文件信息
 *
 * @constructor
 * @param {string} path    路径
 * @param {string} content 文件内容
 */
function File(path, content) {
    this.path = path; // 相对于项目根目录的路径
    this.content = content; // 文件内容
}

/**
 * 保存本文件到项目目录
 *
 * @param  {string} baseDir 基础目录
 * @return {boolean} 是否保存成功
 */
File.prototype.save = function (baseDir) {
    if (!this.path) {
        throw new Error('无法读取文件路径!');
    }

    fs.writeFileSync(path.resolve(baseDir, this.path), this.content);
    return true;
};

module.exports = File;
