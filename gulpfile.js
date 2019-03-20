var gulp = require('gulp'),
    pug = require('gulp-pug'),
    less = require('gulp-less'),
    babel = require("gulp-babel"),    //请勿升级至8.0及以上版本
    uglify = require('gulp-uglify'),
    cleanCSS = require('gulp-clean-css'),
    autoprefixer = require('gulp-autoprefixer'),
    tiny = require('gulp-tinypng-nokey'),
    gulpif = require('gulp-if'),
    clean = require('gulp-clean'),
    rev = require('gulp-rev'),
    revCollector = require('gulp-rev-collector'),
    replace = require('gulp-replace'),
    //当发生异常时提示错误 确保本地安装gulp-notify和gulp-plumber
    notify = require('gulp-notify'),
    plumber = require('gulp-plumber'),
    gutil = require('gulp-util'),
    runSequence = require('run-sequence'),
    sftp = require('gulp-sftp'),      // 自动部署静态资源
    connect = require('gulp-connect'); //自动刷新页面，解放F5

//环境配置
var config = {
    production: {
        compress: true,
        staticPath: 'https://cnd.test.com/static'
    },
    development: {
        compress: false,
        staticPath: '/static'
    }
}[process.env.NODE_ENV || 'development'];

//新建webserver
gulp.task('webserver', function () {
    connect.serverClose();
    connect.server({
        root: 'dist',
        livereload: true,
        port: 80,
        host: '0.0.0.0'
    });
});

// 将pug文件转换为html
gulp.task('pug', function () {
    return gulp.src('src/page/**/*.pug')
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(pug())
        .pipe(replace(/@static/g, config.staticPath))
        .pipe(gulp.dest('dist/'));
});

//处理js
gulp.task('js', function () {
    return gulp.src(['src/static/**/*.js', '!src/static/**/*.min.js'])
        .pipe(babel())
        .pipe(gulpif(config.compress, uglify({mangle: {reserved: ['require', 'exports', 'module', '$']}}))) //排除混淆关键字
        .on('error', function (err) {
            gutil.log(gutil.colors.red('[Error]'), err);
        })
        .pipe(gulpif(config.compress, rev()))
        .pipe(replace(/@static/g, config.staticPath))
        .pipe(gulp.dest('dist/static/'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/js'));
});

//处理css
gulp.task('css', function () {
    return gulp.src(['src/static/**/*.css', '!src/static/**/*.min.css', 'src/static/**/*.less'])
        .pipe(less())
        .pipe(autoprefixer())
        //.pipe(gulpif(config.compress, cleanCSS()))
        .pipe(gulpif(config.compress, rev()))
        .pipe(gulp.dest('dist/static/'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/css'));
});

//压缩图片
gulp.task('tinypng', function () {
    gulp.src('src/static/**/*.{png,jpg,jpeg,gif,ico}')
        .pipe(tiny())
        .pipe(gulp.dest('dist/static/'));
});

//拷贝静态资源文件
gulp.task('copy', function () {
    return gulp.src([
        'src/static/**'
    ])
        .pipe(gulp.dest('dist/static/'))
});

//md5 替换路径
gulp.task('revCollector', function () {
    return gulp.src(['rev/**/*.json', 'dist/**/*.html'])
        .pipe(revCollector())
        .pipe(gulp.dest('dist'));
});

//定义看守任务
gulp.task('watch', function () {
    gulp.watch(['src/**/*.pug'], ['pug']).on('change', function (e) {
        livereload(e, ['pug']);
    });
    gulp.watch(['src/static/**/*.js']).on('change', function (e) {
        livereload(e, ['js']);
    });
    gulp.watch(['src/static/**/*.css', 'src/static/**/*.less']).on('change', function (e) {
        livereload(e, ['css']);
    });
});

//浏览器自动刷新
function livereload(e, task) {
    runSequence(task, function () {
        gutil.log(gutil.colors.green('恭喜，热更新完成！', JSON.stringify(e)));
        gulp.src(e.path)
            .pipe(connect.reload())
    });
}

//清除dist目录
gulp.task('clean', function () {
    return gulp.src('dist/')
        .pipe(clean())
});

// 上传FTP
gulp.task('ftp', function () {
    gutil.log(gutil.colors.green('恭喜，FTP上传完成！'));
});

//构建
gulp.task('dev', function () {
    gutil.log(gutil.colors.green('恭喜，服务启动成功！'));
});

//发布
gulp.task('build', ['clean'], function () {
    gutil.log(gutil.colors.green('恭喜，构建完成！'));
});


gulp.task('default', ['dev', 'watch', 'webserver']);
