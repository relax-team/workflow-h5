### 前端开发工作流之h5页面开发

使用pug编写html，less编写css，ts编写js文件，支持es6/7语法，gulp作为工作流打包工具。

**`.PUG`**
```pug
 body
    .app
      p 测试
```

**`.JS`**
+ 全面使用es6语法，支持async/await
+ 可修改配置，支持`TypeScript`、`Coffee`编写

```javascript
function sleep(t) {
  return new Promise(resolve => {
    setTimeout(resolve, t || 10)
  })
}

async function fn() {
  await sleep(200);
}
```

**`.LESS`**
+ 可选择使用less、sass/scss编写样式

```less
/* input */
@red: #ff4d61;
body{
    padding: 20px;
    p{
        color: @red;
    }
}
```

```css
/* output */
body {
  padding: 20px;
}
body p {
  color: #ff4d61;
}
```

**`静态资源`**
+ 通过gulp sftp，一键上传静态资源到FTP或CDN

### 安装使用
1. 安装gulp4环境

```bash
npm install gulp-cli -g
npm install gulp@4 -D
```

2. 安装package.json中的依赖包

```bash
npm i
```

3. 启动编译   
可复制config.js并重命名为config.custom.js，然后根据个人实际需求改写相关配置信息（css预编译器、ftp服务器上传等）。 
    ```javascript
    module.exports = {
        assetsPath: 'https://cdn.aliyun.cn',
        ftp: {
            host: '',
            port: 20021,
            user: 'root',
            pass: 'password',
            remotePath: ''
        }
    };
    ```  
接下来打开Terminal，运行如下命令：

```bash
gulp
```


