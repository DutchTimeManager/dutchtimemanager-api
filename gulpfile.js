/* eslint-disable */
const gulp = require('gulp');
const ts = require('gulp-typescript');
const typedoc = require("gulp-typedoc");

const tsProject = ts.createProject('tsconfig.json');
gulp.task('default', function() {
    return tsProject.src().pipe(tsProject()).js.pipe(gulp.dest('out'));
});

gulp.task("docs", function() {
    return gulp
        .src(["src/*.ts"])
        .pipe(typedoc({
            // Output options (see TypeDoc docs http://typedoc.org/api/interfaces/typedocoptionmap.html)
            // NOTE: the out option and the json option cannot share the same directory
            out: "./docs/api/html/",
            json: "./docs/api/file.json",

            // TypeDoc options (see TypeDoc docs http://typedoc.org/api/interfaces/typedocoptionmap.html)
            name: "Dutch: Time Manager",
            version: true,
        }));
});