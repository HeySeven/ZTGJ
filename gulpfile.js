var gulp = require('gulp');
var concat = require('gulp-concat');
var header = require('gulp-header');
var connect = require("gulp-connect");
var less = require("gulp-less");
var autoprefixer = require('gulp-autoprefixer');
var ejs = require("gulp-ejs");
var uglify = require('gulp-uglify');
var ext_replace = require('gulp-ext-replace');
var cssmin = require('gulp-cssmin');

var pkg = require("./package.json");

var banner =
"/** \n\
* DJ" + pkg.version + " \n\
* By Shang\n\
*/\n";

gulp.task('js', function(cb) {
  count = 0;
  var end = function(){
    count ++;
    if(count >= 3) cb();
  };

  gulp.src([
    './src/base/adaptive-version2.js',
    './src/base/jquery-2.1.4.js',
    './src/base/jquery-weui.js',
    './src/base/fastclick.js'
  ])
    .pipe(concat({ path: 'base.js'}))
    .pipe(header(banner))
    .pipe(gulp.dest('./js/'))
    .on("end", end);

  gulp.src(['./src/plugins/**/*'])
    .pipe(gulp.dest('./js/plugins/'))
    .on("end", end);

  gulp.src(['./src/pages/**/*'])
    .pipe(concat({ path: 'app.js'}))
    .pipe(gulp.dest('./js/'))
    .on("end", end);
});

gulp.task('uglify', ["js"], function() {
  return gulp.src(['./js/*.js', '!./js/*.min.js'])
    .pipe(uglify({
      preserveComments: "license"
    }))
    .pipe(ext_replace('.min.js'))
    .pipe(gulp.dest('./js'));
});


gulp.task('watch', function () {
  gulp.watch('src/**/*.js', ['js','uglify']);

});

gulp.task('server', function () {
  connect.server();
});
gulp.task("default", ['uglify']);
