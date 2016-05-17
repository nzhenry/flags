var gulp = require('gulp');

gulp.task('start', ['seed'], function() {
	return require('./lib/server')(
		require('./lib/app')()
	);
});

gulp.task('seed', ['migrate'], function() {
	return require('./lib/dbAdmin').seed();
});

gulp.task('migrate', function() {
	return require('./lib/dbAdmin').migrate();
});

gulp.task('test', ['unit'], function() {
	return gulp.src('test/e2e/*.js', {read: false})
			.pipe(require('gulp-mocha')({
					reporter: 'mocha-multi',
					reporterOptions: mochaReporterOptions('acceptance_tests', 'Acceptance Tests')
				}));
});

gulp.task('unit', ['instrument'], function(done) {
	var istanbul = require('gulp-istanbul');
	return gulp.src('test/unit/*.js', {read: false})
			.pipe(require('gulp-mocha')({
					reporter: 'mocha-multi',
					reporterOptions: mochaReporterOptions('unit_tests', 'Unit Tests')
				}))
			.pipe(istanbul.writeReports({dir: './artifacts/coverage'}));
});

gulp.task('instrument', function () {
	var istanbul = require('gulp-istanbul');
  return gulp.src(['lib/**/*.js'])
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

function mochaReporterOptions(name, title) {
	return {
		xunit: 'artifacts/xunit/' + name + '.xml',
		mochawesome: {
			stdout: '-',
			options: {
				reporterOptions: {
					reportDir: 'artifacts/mochawesome',
					reportName: name,
					reportTitle: title,
					inlineAssets: true
				}
			}
		}
	};
}
