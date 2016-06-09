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

tinymce.PluginManager.add('loaddoc', function(editor, url) {
	var cssId, enabled;

	function removeById(id) {
		return (elem=document.getElementById(id)).parentNode.removeChild(elem);
	}

	// // We don't support older browsers like IE6/7 and they don't provide prototypes for DOM objects
	if (!window.NodeList) {
		return;
	}

	function toggleActiveState() {
		var self = this;

		self.active(enabled);

		editor.on('loaddoc', function() {
		});

	}


	editor.addCommand('mceLoadDoc', function() {
		var fileSelector =  document.createElement("INPUT");
		fileSelector.setAttribute("type", "file");
		fileSelector.addEventListener("change", handleFiles, false);
			function handleFiles() {
				require("docx2html")(this.files[0]).then(function(converted){
					var content = converted.toString();
					content = content.substring(content.indexOf("<body>")+6);
					content = content.substring(0, content.indexOf("</body>")-1);
					removeById("A");
					editor.setContent(content);
				})
		}
		fileSelector.click();
	});

	
	
	editor.addButton('loaddoc', {
		title: 'Load docx file',
		cmd: 'mceLoadDoc',
		onPostRender: toggleActiveState,
		icon: true,
		image: 'http://docs.qgis.org/2.8/ru/_images/mActionFileOpen.png'
	});

	editor.addMenuItem('loaddoc', {
		text: 'Load docx file',
		cmd: 'mceLoadDoc',
		onPostRender: toggleActiveState,
		selectable: true,
		context: 'file',
		prependToContext: true,
	});

		
	editor.on('init', function() {
	});

	editor.on('remove', function() {
		
	});

});
