调试mip网页
---

1.进入mip项目目录，使用`mip init`创建`mip.config`配置文件

```
# 进入到一个目录
$ cd mip-project
$ mip init
```

2.新建一个mip网页

```
$ mip add index.html
```

在新建网页的时候可以添加需要载入的mip组件，例如：

```
$ mip add index.html mip-img mip-video
```

将载入`mip-img`和`mip-video`两个组件


3.编写mip网页代码

在编写mip代码的时候需要注意符合mip网页规范，否则通不过mip校验程序，mip校验规则地址：

https://www.mipengine.org/doc/2-tech/2-validate-mip.html

4.校验mip网页

```
$ mip validate index.html
```

出现`ERROR`的条目通不过mip校验，需要进行修改。

![validate](./example/mip-validate.png)

**注意**
mip页面应该为`utf-8`编码，其他编码格式通不过校验，如果需要使用其他编码格式，可以使用线上校验器粘贴代码进行校验，

线上校验器地址：
https://www.mipengine.org/validator/validate


5.调试mip网页
进入到mip项目目录，启动`mip server`，然后访问`http://127.0.01:8000`进入调试页面。

```
$ cd mip-project
$ mip server
```
**注意**

`mip server`默认监听`8000`和`35730`端口，如果有端口冲突可以在`mip.config`中修改启动端口。

也可以使用`mip server -f`命令强制关闭当前占用端口的node进程(windows下无效)。

