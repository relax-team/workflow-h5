'use strict';

/*
* 说明：gulp版本4.0及以上
* npm install gulp-cli -g
* npm install gulp@4 -D
* */

const gulp = require('gulp'),
    pug = require('gulp-pug'),
    less = require('gulp-less'),
    babel = require("gulp-babel"),    //请勿升级至8.0及以上版本
    uglify = require('gulp-uglify'),
    cleanCSS = require('gulp-clean-css'),
    autoprefixer = require('gulp-autoprefixer'),
    tiny = require('gulp-tinypng-nokey'),
    gulpif = require('gulp-if'),
    del = require('del'),
    rev = require('gulp-rev'),
    revCollector = require('gulp-rev-collector'),
    replace = require('gulp-replace'),
    rename = require('gulp-rename'),
    //当发生异常时提示错误 确保本地安装gulp-notify和gulp-plumber
    plumber = require('gulp-plumber'),
    gutil = require('gulp-util'),
    sftp = require('gulp-sftp'),      // 自动部署静态资源
    connect = require('gulp-connect'); //自动刷新页面，解放F5

/*===== 获取用户配置文件，可修改 ====*/
let config;
try {
    config = require('./config.js');    //默认配置
} catch (e) {
    return log(gutil.colors.red('丢失配置文件config.js'));
}

/*=== 处理环境变量 ===*/
const {NODE_ENV = 'development'} = process.env;
log(gutil.colors.green('当前编译环境', NODE_ENV));

let isLocal = NODE_ENV === 'development';
if (isLocal) {
    config.assetsPath = '/assets';
}

/*===== 相关路径配置 ====*/
let paths = {
    src: {
        baseDir: 'src',
        baseFiles: ['src/**/*', '!src/**/*.pug', '!src/**/*.less', '!src/**/*.css', '!src/**/*.ts', '!src/**/*.js', 'src/**/*.min.css', 'src/**/*.min.js'],
        htmlFiles: ['src/**/*.pug'],
        cssFiles: ['src/assets/**/*.less', 'src/assets/**/*.css', '!src/**/*.min.css'],
        jsFiles: ['src/assets/**/*.ts', 'src/assets/**/*.js', '!src/**/*.min.js'],
    },
    dist: {
        assetsDir: 'dist/assets',        //要上传到ftp或cdn的静态资源文件
        baseDir: 'dist'
    }
};


/*===== 定义主要任务方法 ====*/

// 日志输出
function log() {
    let args = Array.prototype.slice.call(arguments);
    gutil.log.apply(null, args);
}

// 替换目录路径
function replaceDir(file) {
    return file.replace(`${paths.src.baseDir}`, `${paths.dist.baseDir}`);
}

// clean 任务, dist 目录
function removeFiles() {
    return del([paths.dist.baseDir, 'rev']);
}

// 新建webserver
function runServer() {
    connect.serverClose();
    connect.server({
        root: 'dist',
        livereload: true,
        port: 80,
        host: '0.0.0.0'
    });
}


// 复制文件
function copyFiles(file) {
    let files = typeof file === 'string' ? file : paths.src.baseFiles;
    return gulp.src(files, {allowEmpty: true})
        .pipe(gulp.dest(paths.dist.baseDir));
}

// 编译.pug/.html
function compileHTML(file) {
    let files = typeof file === 'string' ? file : paths.src.htmlFiles;
    return gulp.src(files, {allowEmpty: true})
        .pipe(plumber())
        .pipe(pug())
        .pipe(gulpif(!!config.assetsPath, replace('@assets', config.assetsPath)))
        .pipe(gulp.dest(paths.dist.baseDir));
}

// 编译.less
function compileCSS(file) {
    let files = typeof file === 'string' ? file : paths.src.cssFiles;
    return gulp.src(files, {allowEmpty: true})
        .pipe(plumber())
        .pipe(less())
        .pipe(gulpif(!!config.assetsPath, replace('@assets', config.assetsPath)))
        .pipe(autoprefixer())
        .pipe(rename({extname: '.css'}))     //修改文件类型
        //.pipe(gulpif(!isLocal, cleanCSS()))
        .pipe(gulpif(!isLocal, rev()))
        .pipe(gulp.dest(`${paths.dist.baseDir}/assets`))
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/css'));
}

// 编译.ts/.js
function compileJS(file) {
    let files = typeof file === 'string' ? file : paths.src.jsFiles;
    return gulp.src(files, {allowEmpty: true})
        .pipe(plumber())
        .pipe(babel())
        .pipe(gulpif(!!config.assetsPath, replace('@assets', config.assetsPath)))
        .pipe(gulpif(!isLocal, uglify({mangle: {reserved: ['require', 'exports', 'module', '$']}}))) //排除混淆关键字
        .pipe(gulpif(!isLocal, rev()))
        .pipe(gulp.dest(`${paths.dist.baseDir}/assets`))
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/js'));
}

// 监听文件
function watch() {
    let watcher = gulp.watch([paths.src.baseDir], {ignored: /[/\\]\./});
    return watcher.on('all', watchHandler);
}

function watchHandler(event, file) {
    log(`${gutil.colors.yellow(file)} ${event}, running task...`);

    file = file.replace(/\\/, '/');    //替换路径分隔符, 只替换第一个'\', 重要！
    let ext_name = path.extname(file);
    if (event === 'unlink') {
        let tmp = replaceDir(file);
        if (ext_name === '.less') {
            tmp = tmp.replace(ext_name, '.css');
        }
        del(tmp);
    } else {
        if (ext_name === '.less') {
            compileCSS(file);  // 样式 文件
        } else if (ext_name === '.pug') {
            compileHTML(file); // html 文件
        } else {
            copyFiles(file);
        }
    }
}


// 上传静态资源文件到FTP
function uploadFTP() {
    return gulp.src(paths.dist.assetsDir)
        .pipe(sftp(config.ftp));
}

// 替换md5路径
function revReplace() {
    return gulp.src(['rev/**/*.json', 'dist/**/*.html'])
        .pipe(revCollector())
        .pipe(gulp.dest('dist'));
}

// 浏览器自动刷新
function liveReload(path) {
    return gulp.src(path)
        .pipe(connect.reload())
}


/*======= 注冊任務 =======*/

gulp.task('clean', removeFiles);  // 删除任务
gulp.task('FTP', uploadFTP);    // 上传FTP

// 开发
gulp.task('dev', gulp.series(
    copyFiles,
    gulp.parallel(
        compileCSS,
        compileHTML,
        compileJS,
    ),
    revReplace,
    runServer,
    watch
));
