# MIP CLI 工具

MIP脚手架.

### 安装

依赖环境: [Node.js](https://nodejs.org/en/) (>=4.x).

``` bash
$ npm install -g mip-cli
```
*注意：*
nodejs 5.x, 6.x 安装模块时，可能会报`node-gyp`相关错误，需要使用如下命令安装

```
$ npm install --unsafe-perm -g mip-cli
```

### 使用

初始化mip页面项目：

``` bash
$ mip init
```
会创建`mip.config`文件，相关配置如下：

```
module.exports = {

    /**
     * 启动mip server调试的端口号
     *
     * @type {number}
     */
    port: 8000,

    /**
     * 本地mip网页后缀名，进行本地组件调试时会向页面注入本地组件
     *
     * @type {RegExp}
     */
    mipPageExt: /\.(?:html|htm|mip)$/i,

    /**
     * 本地mip组件调试目录，主要用于开发组件时进行本地调试，会自动将本地mip组件注入到当前访问的页面中去
     *
     * @type {string}
     */
    extensionsDir: '',

    /**
     * 启用调试页面自动刷新
     *
     * @type {boolean}
     */
    livereload: true
};
```


创建一个mip模板网页：

``` bash
$ mip add index.html
```

创建一个mip组件：

``` bash
$ mip addelement mip-demo
```

验证一个mip网页：

``` bash
$ mip validate index.html
```

启动mip网页调试器：

``` bash
$ mip start
```

### License

[MIT](http://opensource.org/licenses/MIT)
