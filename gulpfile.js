const { src, dest, series, watch, parallel } = require('gulp');
const concat = require('gulp-concat');
const htmlmin = require('gulp-htmlmin');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const assets = require('postcss-assets');
const sourcemaps = require('gulp-sourcemaps');
const clean = require('gulp-clean');
const imagemin = require('gulp-imagemin');
const environments = require('gulp-environments');
const CacheBuster = require('gulp-cachebust');

const cachebust = new CacheBuster({ random: true });

function cleanTask() {
	return src('build', { read: false, allowEmpty: true }).pipe(clean());
}

function imageTask() {
	return src('./src/images/**/*')
		.pipe(imagemin([imagemin.jpegtran({ progressive: true })]))
		.pipe(cachebust.resources())
		.pipe(dest('build/images'));
}

function cssTask() {
	var plugins = [assets({ loadPaths: ['./src/images/'] }), autoprefixer(), cssnano()];

	return src([
		'node_modules/bootstrap/dist/css/bootstrap-reboot.css',
		'node_modules/bootstrap/dist/css/bootstrap-grid.css',
		'node_modules/bootstrap/dist/css/bootstrap.css',
		'./src/css/background.css',
		'./src/css/main.css',
	])
		.pipe(environments.development(sourcemaps.init()))
		.pipe(postcss(plugins))
		.pipe(concat('app.min.css'))
		.pipe(environments.development(sourcemaps.write('.')))
		.pipe(cachebust.references())
		.pipe(cachebust.resources())
		.pipe(dest('build/css'));
}

function htmlTask() {
	return src('./src/*.html')
		.pipe(htmlmin({ collapseWhitespace: true }))
		.pipe(cachebust.references())
		.pipe(dest('build'));
}

if (environments.production()) {
	exports.default = series(cleanTask, imageTask, cssTask, htmlTask);
} else {
	const connect = require('gulp-connect');

	function serverTask() {
		connect.server({
			root: 'build',
			livereload: true,
		});
	}

	function watchTask() {
		watch(['./src/css/*.css', './src/*.html'], series(cssTask, htmlTask));
	}

	exports.default = series(cleanTask, imageTask, cssTask, htmlTask, parallel(serverTask, watchTask));
}
