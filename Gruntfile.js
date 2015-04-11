'use strict';

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %>; Copyright 2015 Adrian Toncean; released under the MIT license */\n'
			},
			build: {
				src: 'src/**/*.js',
				dest: 'build/<%= pkg.name %>.min.js'
			}
		},
		wrap: {
			build: {
				src: ['build/espace.min.js'],
				dest: 'build/espace.min.js',
				options: {
					wrapper: [
						'(function (espace) {',
						'})(typeof module !== "undefined" && module.exports ? module.exports : window.espace = {})'
					]
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-wrap');

	grunt.registerTask('default', ['uglify', 'wrap']);
};