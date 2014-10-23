requirejs.config({
	// baseUrl: '/static/javascript',

	paths: {
		// folder shortcuts
		'templates': '../templates',

		// RequireJS plugins
		'async': 'lib/requirejs/async',
		'hbs': 'lib/requirejs/hbs',

		// jQuery and jQuery plugins
		'jquery': 'lib/jquery-1.8.2',
		'bootstrap': 'lib/bootstrap/bootstrap',
		'bootstrap-v3': 'lib/bootstrap/v3/bootstrap',
		'react': 'lib/react-0.9.0',
		'jquery-ui': 'lib/jquery-ui-1.8.24.custom.min',
        'jquery-ui-19': 'lib/jquery-ui-1.9.2.custom.min',
		'jquery-cookie': 'lib/jquery.cookie.min',
		'jquery-placeholder': 'lib/jquery.placeholder.min',
		'jquery-selectboxit': 'lib/jquery.selectBoxIt.min',
        'daterangepicker': 'lib/bootstrap-daterangepicker/daterangepicker',
        'moment': 'lib/bootstrap-daterangepicker/moment.min',
        'jquery-loadMore': 'lib/loadMore',
        'picker': 'lib/pickadate-picker',
        'picker.date': 'lib/pickadate-picker.date',
        'picker.time': 'lib/pickadate-picker.time',
        'hisrc': 'lib/hisrc',
        'spin': 'lib/spin.min',
        'tmpl' : 'lib/jquery-file-upload/tmpl.min',
        'jquery.fileupload': 'lib/jquery-file-upload/jquery.fileupload',
        'jquery.fileupload-process': 'lib/jquery-file-upload/jquery.fileupload-process',
        'jquery.fileupload-audio': 'lib/jquery-file-upload/jquery.fileupload-audio',
        'jquery.fileupload-image': 'lib/jquery-file-upload/jquery.fileupload-image',
        'jquery.fileupload-video': 'lib/jquery-file-upload/jquery.fileupload-video',
        'jquery.fileupload-validate': 'lib/jquery-file-upload/jquery.fileupload-validate',
        'jquery.fileupload-ui': 'lib/jquery-file-upload/jquery.fileupload-ui',
        'jquery.fileupload-jquery-ui': 'lib/jquery-file-upload/jquery.fileupload-jquery-ui',
        'jquery.iframe-transport': 'lib/jquery-file-upload/jquery.iframe-transport',
        'jquery.ui.widget': 'lib/jquery-file-upload/jquery.ui.widget',
        'canvas-to-blob' : 'lib/jquery-file-upload/canvas-to-blob.min',
        'load-image' : 'lib/jquery-file-upload/load-image',
        'load-image-exif' : 'lib/jquery-file-upload/load-image-exif',
        'load-image-ios' : 'lib/jquery-file-upload/load-image-ios',
        'load-image-meta' : 'lib/jquery-file-upload/load-image-meta',

		// Backbone and Backbone plugins
		'underscore': 'lib/lodash.underscore-1.3.1',
		'backbone': 'lib/backbone-0.9.10',
		'validation': 'lib/backbone.validation-amd-0.9.0',

		// Handlebars
		'handlebars': 'lib/handlebars-v1.3.0',
		'Handlebars': 'lib/handlebars-v1.3.0',
		'json2': 'lib/polyfill/json2', // needed for the hbs requirejs loader
		'i18nprecompile': 'lib/i18nprecompile', // needed for the hbs requirejs loader

		// Bootstrap and Bootstrap plugins
		'bootstrap-fileupload': 'lib/bootstrap/bootstrap-fileupload.min', // TODO: add unminified and version number
        'bootstrap-fileupload-v3': 'lib/bootstrap/v3/bootstrap-fileupload',
        'bootstrap-timepicker': 'lib/bootstrap/bootstrap-timepicker.min',
        'bootstrap-timepicker-v3': 'lib/bootstrap/v3/bootstrap-timepicker',
        'bootstrap-select': 'lib/bootstrap/bootstrap-select.min',
        'bootstrap-tour': 'lib/bootstrap/v3/bootstrap-tour-3wks-fork',
		// miscellaneous
		'matchmedia': 'lib/matchmedia',
		'picturefill': 'lib/picturefill-1.2.0',
		'icanhaz': 'lib/icanhaz-0.10.2',
		'accounting': 'lib/accounting.min',
		'parsley': 'lib/parsley.min',
		'sprintf': 'lib/sprintf',
		'amplify': 'lib/amplify.min',
		'ckeditor': 'lib/ckeditor/ckeditor',
        'summernote': 'lib/summernote.min',
        'codemirror': 'lib/codemirror',
        'fileupload' : 'lib/bootstrap-fileupload.min'

	},

	shim: {
		'icanhaz': {
			exports: 'ich'
		},
		'handlebars': {
			exports: 'Handlebars'
		},
		'Handlebars': {
			exports: 'Handlebars'
		},
		'json2': {
			exports: 'JSON'
		},
		'bootstrap': ['jquery'],
		'bootstrap-v3': ['jquery'],
		'jquery-ui': ['jquery'],
		'jquery-cookie': ['jquery'],
		'jquery-placeholder': ['jquery'],
		'jquery-selectboxit': ['jquery'],
		'hisrc': {
			exports: '$.fn.hisrc',
			deps: ['jquery']
		},
		'bootstrap-fileupload': ['bootstrap'],
		'picturefill': {
			exports: 'picturefill',
			deps: ['matchmedia']
		},
		'backbone': {
			exports: 'Backbone',
			deps: ['underscore', 'jquery']
		},
		'amplify': {
			exports: 'amplify',
			deps: ['jquery']
		},
		'parsley': {
			exports: 'parsley',
			deps: ['jquery']
		},
		'ckeditor': {
			exports: 'CKEDITOR'
		}
	},

	// Handlebars setup
	hbs: {
		disableI18n: true, // we dont use i18n
		disableHelpers: false, // we do want to use helpers

		// return the path where we can find a helper with a certain name
		helperPathCallback: function(name) {
			return 'template_helpers/' + name;
		},

		templateExtension: 'hbs', // we use the default .hbs extension for template files
		compileOptions: {} // we're not passing any extra options to the Handlebars compiler
	}

});
