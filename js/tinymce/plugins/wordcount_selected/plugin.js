/**
 * plugin.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/*global tinymce:true */

tinymce.PluginManager.add('wordcount_selected', function(editor) {
	var self = this, countre, cleanre;

	// Included most unicode blocks see: http://en.wikipedia.org/wiki/Unicode_block
	// Latin-1_Supplement letters, a-z, u2019 == &rsquo;
	countre = editor.getParam('wordcount_countregex', /[\w\u2019\x27\-\u00C0-\u1FFF]+/g);
	cleanre = editor.getParam('wordcount_cleanregex', /[0-9.(),;:!?%#$?\x27\x22_+=\\\/\-]*/g);

	function update() {
		editor.theme.panel.find('#wordcount').text(['\u0412\u044B\u0434\u0435\u043B\u0435\u043D\u043E \u0441\u043B\u043E\u0432: {0}', self.getCount()]);
	}

	editor.on('init', function() {
		var statusbar = editor.theme.panel && editor.theme.panel.find('#statusbar')[0];

		if (statusbar) {
			tinymce.util.Delay.setEditorTimeout(editor, function() {
				statusbar.insert({
					type: 'label',
					name: 'wordcount',
					text: ['\u0412\u044B\u0434\u0435\u043B\u0435\u043D\u043E \u0441\u043B\u043E\u0432: {0}', self.getCount()],
					classes: 'wordcount',
					disabled: editor.settings.readonly
				}, 0);

				editor.on('setcontent beforeaddundo', update);

                editor.on('MouseUp', function (e) {
                      update();
                });

                editor.on('MouseDown', function (e) {
                      update();
                });

                editor.iframeElement.contentDocument.addEventListener('mousemove', DelayedSubmission);

			}, 0);
		}
	});

    function DelayedSubmission() {
        var date = new Date();
        initial_time = date.getTime();
        if (typeof setInverval_Variable == 'undefined') {
                setInverval_Variable = setInterval(DelayedSubmission_Check, 50);
        }
    }
    function DelayedSubmission_Check() {
        var date = new Date();
        check_time = date.getTime();
        var limit_ms=check_time-initial_time;
        if (limit_ms > 100) { //Change value in milliseconds
            update();
            clearInterval(setInverval_Variable);
            delete setInverval_Variable;
        }
    }

	self.getCount = function() {
        var tx = editor.selection.getContent();
		var tc = 0;

		if (tx) {
			tx = tx.replace(/\.\.\./g, ' '); // convert ellipses to spaces
			tx = tx.replace(/<.[^<>]*?>/g, ' ').replace(/&nbsp;|&#160;/gi, ' '); // remove html tags and space chars

			// deal with html entities
			tx = tx.replace(/(\w+)(&#?[a-z0-9]+;)+(\w+)/i, "$1$3").replace(/&.+?;/g, ' ');
			tx = tx.replace(cleanre, ''); // remove numbers and punctuation

			var wordArray = tx.match(countre);
			if (wordArray) {
				tc = wordArray.length;
			}
		}

		return tc;
	};
});