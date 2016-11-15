/**
 * @file 字符串操作
 * @author mengke01(kekee000@gmail.com)
 */

module.exports = {

    /**
     * 获取字符串字节长度
     *
     * @param  {string} source 字符串
     * @return {number}        长度
     */
    getByteLength: function (source) {
        return String(source).replace(/[^\x00-\xff]/g, '11').length;
    },

    /**
     * 解码html字符串
     *
     * @param  {string} source html字符串
     * @return {string} 解码后字符串
     */
    decodeHTML: function (source) {
        var str = String(source)
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');

        // 处理转义的中文和实体字符
        return str.replace(/&#((?:\d+)|(?:x[a-f\d]+));/gi, function ($0, $1) {
            return String.fromCharCode(Number('0' + $1));
        });
    },

    /**
     * 编码html字符串
     *
     * @param  {string} source html字符串
     * @return {string} 编码后字符串
     */
    encodeHTML: function (source) {
        return String(source)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    /**
     * javascript 字符串escape
     *
     * @param  {string} source javascript字符串
     * @return {string} 编码后字符串
     */
    escapeJS: function (source) {
        return String(source).replace(/["'\\\n\r\f\b\t\u2028\u2029]/g, function (c) {
            switch (c) {
                case '"':
                case '\'':
                case '\\':
                    return '\\' + c;
                case '\n':
                    return '\\n';
                case '\r':
                    return '\\r';
                case '\f':
                    return '\\f';
                case '\b':
                    return '\\b';
                case '\t':
                    return '\\t';
                case '\u2028':
                    return '\\u2028';
                case '\u2029':
                    return '\\u2029';
            }
        });
    },

    /**
     * regexp 字符串escape
     *
     * @param  {string} source 字符串
     * @return {string} 编码后字符串
     */
    escapeRegExp: function (source) {
        return String(source).replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
    },

    /**
     * 按字节截取字符串
     *
     * @param {string} str 字符串
     * @param {number} length 截取长度
     * @param {string} tail 加的后缀
     * @return {string} 截取后的字符串
     */
    cut: function (str, length, tail) {
        tail = tail || '';
        str = String(str);
        var size = 0;
        var l = str.length;

        for (var i = 0; i < l; i++) {
            size += str.charCodeAt(i) > 255 ? 2 : 1;
            if (size > length) {
                return str.slice(0, i) + tail;
            }
        }
        return str + tail;
    },

    /**
     * 判断字符串开头是否是另一字符串
     *
     * @param {string} str1 字符串1
     * @param {string} str2 字符串2
     * @return {boolean} 是否开头
     */
    startsWidth: function (str1, str2) {
        if (str1 == null || str2 == null || str1.length < str2.length) {
            return false;
        }
        return str1.indexOf(str2) === 0;
    },

    /**
     * 判断字符串结尾是否是另一字符串
     *
     * @param {string} str1 字符串1
     * @param {string} str2 字符串2
     * @return {boolean} 是否开头
     */
    endsWith: function (str1, str2) {
        if (str1 == null || str2 == null || str1.length < str2.length) {
            return false;
        }
        return str1.lastIndexOf(str2) === str1.length - str2.length;
    },

    /**
     * 字符串格式化，支持如 ${xxx.xxx} 的语法
     *
     * @param {string} source 模板字符串
     * @param {Object} data 数据
     * @return {string} 格式化后字符串
     */
    format: function (source, data) {
        return source.replace(/\$\{([\w.]+)\}/g, function ($0, $1) {
            var ref = $1.split('.');
            var refObject = data;
            var level;
            while (refObject != null && (level = ref.shift())) {
                refObject = refObject[level];
            }
            return refObject != null ?  refObject : '';
        });
    },

    /**
     * 获取字符串哈希编码
     *
     * @param {string} str 字符串
     * @return {number} 哈希值
     */
    hashcode: function (str) {
        if (null == str) {
            return 0;
        }

        str = String(str);

        var hash = 0;
        for (var i = 0, l = str.length; i < l; i++) {
            hash = 0x7FFFFFFFF & (hash * 131 + str.charCodeAt(i));
        }
        return hash;
    }
};
