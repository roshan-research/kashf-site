const path = require('path');
const gulp = require('gulp');
const gutil = require('gulp-util');
const sass = require('gulp-sass');
const sassGlob = require('gulp-sass-glob');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const uglify = require('gulp-uglify');
const gulpif = require('gulp-if');
const imagemin = require('gulp-imagemin');
const changed = require('gulp-changed');
const htmlMin = require('gulp-htmlmin');
const browserSync = require('browser-sync').create();
const sourcemaps = require('gulp-sourcemaps');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const browserify = require('browserify');
const babelify = require('babelify');
const svgSprite = require('gulp-svg-sprites');
const sequence = require('run-sequence');
const stripDebug = require('gulp-strip-debug');
const del = require('del');
const ghPages = require('gulp-gh-pages');
const pug = require('gulp-pug-i18n');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const buster = require('gulp-cache-bust');

const cwd = path.basename(process.cwd());
var isProduction = process.env.NODE_ENV == "production" || false;
// var BASEURL = process.cwd() + "/dist";
var BASEURL = ".";

const src = 'src';
const dist = 'dist';

const paths = {
  html: {
    src: src + '/**/*.html',
    dist: dist
  },
  pug: {
    src: src + '/pug/*.pug',
    watch: src + '/pug/**/*.pug',
    locales: src + '/locale/*.*',
    dist: dist
  },
  styles: {
    src: src + '/scss/**/*.scss',
    dist: dist + '/assets/css'
  },
  js: {
    src: src + '/js/main.js',
    watch: src + '/js/**/*.js',
    dist: dist + '/assets/js'
  },
  fonts: {
    src: src + '/fonts/**/*',
    dist: dist + '/assets/fonts'
  },
  images: {
    src: src + '/images/**/*',
    dist: dist + '/assets/img'
  },
  svgSprite: {
    src: src + '/svg/**/*',
    dist: dist + '/assets/svg'
  },
  favicons: {
    src: src + '/favicons/**/*',
    dist: dist + '/assets/favicons'
  },
};

const plumberOptions = {
  errorHandler: function (err) {
    gutil.log(gutil.colors.red('========= ERROR ========='));
    gutil.log(err.toString());
    notify.onError({
      title: "Error in: " + err.plugin,
      message: err.toString()
    })(err);
  }
}

function htmlFn() {
  return gulp.src(paths.html.src)
    .pipe(plumber(plumberOptions))
    .pipe(gulpif(isProduction, htmlMin({
      sortAttributes: true,
      sortClassName: true,
      collapseWhitespace: true
    })))
    .pipe(gulp.dest(paths.html.dist))
    .pipe(gulpif(!isProduction, browserSync.stream()));
}

function pugFn() {
  return gulp.src(paths.pug.src)
    .pipe(plumber(plumberOptions))
    .pipe(pug({
      data: {
        baseurl: BASEURL
      },
      i18n: {
        locales: 'src/locale/*.*',
        filename: '{{{lang}}/}{{basename}}.html',
        default: 'fa'
      },
      pretty: true
    }))
    .pipe(gulpif(isProduction, htmlMin({
      sortAttributes: true,
      sortClassName: true,
      collapseWhitespace: true
    })))
    .pipe(gulp.dest(paths.pug.dist))
    .pipe(gulpif(!isProduction, browserSync.stream()));
}

gulp.task('html', () => {
  if (!isProduction) gulp.watch(paths.html.src, htmlFn);
  return htmlFn();
});

gulp.task('pug', () => {
  if (!isProduction) {
    gulp.watch(paths.pug.watch, pugFn);
    gulp.watch(paths.pug.locales, pugFn);
  }
  return pugFn();
});

gulp.task('cachebust', () => {
	return gulp.src('./dist/**/*.html')
	  .pipe(buster({
      type: "timestamp"
    }))
	  .pipe(gulp.dest('./dist'))
  });

gulp.task('js', function() {
	var bundler = browserify(paths.js.src, {
			debug: true
		})
		.transform(babelify, { presets: ["@babel/preset-env"] })
		.bundle()
    
    return bundler
		.pipe(plumber(plumberOptions))
		.pipe(source('script.js'))
		.pipe(buffer())
		.pipe(gulpif(!isProduction, sourcemaps.init({
			loadMaps: true
		})))
		.pipe(gulpif(!isProduction, sourcemaps.write('./')))
    .pipe(gulpif(isProduction, stripDebug()))
    .pipe(gulpif(isProduction, uglify()))
    .pipe(gulp.dest(paths.js.dist))
		.pipe(gulpif(!isProduction, browserSync.stream()));
});

gulp.task('styles', function() {
	return gulp.src(paths.styles.src)
    .pipe(plumber(plumberOptions))
		.pipe(gulpif(!isProduction, sourcemaps.init()))
		.pipe(sassGlob())
		.pipe(sass({
			outputStyle: (isProduction) ? 'compressed' : 'expanded'
		}))
    .pipe(gulpif(isProduction, postcss([autoprefixer({
			browsers: ['> 5%', '> 2% in IR', 'ie >= 9']
		})])))
		.pipe(gulpif(!isProduction, sourcemaps.write('./')))
		.pipe(gulp.dest(paths.styles.dist))
		.pipe(gulpif(!isProduction, browserSync.stream({
			match: "**/*.css"
		})));
});

gulp.task('svg-sprite', function() {
	return gulp.src(paths.svgSprite.src)
		.pipe(svgSprite({
			mode: "symbols",
			svgId: "%f",
			preview: {
				sprite: false,
				symbols: false,
			},
			svg: {
				symbols: "sprite.svg"
			},
			transformData: function (data, config) {
		    data.svg.map(function(item) {
		      //change id attribute
		      item.data=item.data.replace(/id=\"([^\"]+)\"/gm, 'id="'+item.name+'-$1"');

		      //change id in fill attribute
		      item.data=item.data.replace(/fill=\"url\(\#([^\"]+)\)\"/gm, 'fill="url(#'+item.name+'-$1)"');

		      //change id in filter attribute
          item.data=item.data.replace(/filter=\"url\(\#([^\"]+)\)\"/gm, 'filter="url(#'+item.name+')"');

		      //change id in mask attribute
		      item.data=item.data.replace(/mask=\"url\(\#([^\"]+)\)\"/gm, 'mask="url(#'+item.name+'-$1)"');

		      //replace double id for the symbol tag
		      item.data=item.data.replace('id="'+item.name+'-'+item.name+'"', 'id="'+item.name+'"');
		      return item;
		    });
		    return data; // modify the data and return it
		  }
		}))
    .pipe(plumber(plumberOptions))
		.pipe(gulp.dest(paths.svgSprite.dist))
		.pipe(gulpif(!isProduction, browserSync.stream()));
});

gulp.task('fonts', function () {
	return gulp.src(paths.fonts.src)
    .pipe(gulp.dest(paths.fonts.dist))
});

gulp.task('images', function () {
  return gulp.src(paths.images.src)
		.pipe(changed(paths.images.dist))
		.pipe(gulpif(isProduction, imagemin()))
    .pipe(gulp.dest(paths.images.dist))
});

gulp.task('favicons', function () {
  return gulp.src(paths.favicons.src)
    .pipe(gulp.dest(paths.favicons.dist))
});

gulp.task('clean', function() {
	// return del([dist]); // temporary disabled
	return del(['index.html', 'en', 'assets', '.publish']);
});

gulp.task('browser-sync', function() {
	return browserSync.init({
		server: dist,
		notify: true // set to false for no notifications
	});
});

gulp.task('all', (cb) => {
  sequence('html', 'pug', 'js', 'styles', 'svg-sprite', 'fonts', 'images', 'favicons', cb);
});

gulp.task('watch', function() {
	gulp.watch(paths.html.src, ['html']);
	gulp.watch(paths.styles.src, ['styles']);
	gulp.watch(paths.js.watch, ['js']);
	gulp.watch(paths.svgSprite.src, ['svg-sprite']);
	gulp.watch(paths.images.src, { cwd:'./' }, ['images']);
});

gulp.task('serve', function(cb) {
  isProduction = false;
  BASEURL = "http://localhost:3000";
	sequence('clean', 'all', 'browser-sync', 'watch', cb);
});

gulp.task('build', function(cb) {
	isProduction = true;
	sequence('clean', 'all', 'cachebust', cb);
});

gulp.task('default', ['serve']);

gulp.task('gh-pages', () => {
	return gulp.src('./dist/**/*').pipe(ghPages());
});

gulp.task('deploy', (cb) => {
  // BASEURL = "/";
	sequence('build', 'gh-pages', cb);
});
