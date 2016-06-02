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

tinymce.PluginManager.add('managedblocks', function(editor, url) {
    var cssId, managedBlocksMenuItem, enabled;
    console.log(arguments);

	// We don't support older browsers like IE6/7 and they don't provide prototypes for DOM objects
	if (!window.NodeList) {
		return;
	}

	function toggleActiveState() {
		var self = this;

		self.active(enabled);

		editor.on('ManagedBlocks', function() {
			self.active(editor.dom.hasClass(editor.getBody(), 'ttp-managedblocks'));
		});

	}

    function computeLogicalBlock(element) {
		
	console.log(element);	
	
	var cell = editor.dom.getParent(element, 'td');
	console.log(cell);
	if (cell != null) {
	    return cell;
	} 
	
	var cellUL = editor.dom.getParent(element, 'ul');
	if (cellUL != null) {
	    return cellUL;
	}	
	
	var cellOL = editor.dom.getParent(element, 'ol');
	if (cellOL != null) {
	    return cellOL;
	}	
	
	return element;
	
    };
    
    editor.addCommand('ttpChooseLogicalBlock', function() {
	document.ttpRange = editor.selection.getRng();
	document.ttpSel = editor.selection.getSel();
	var logicalBlock = computeLogicalBlock(editor.selection.getNode());
	editor.dom.addClass(logicalBlock, 'ttp-chosenblock');
    });
    
        editor.addCommand('mceManagedBlocks', function() {
		var dom = editor.dom, linkElm;

		if (!cssId) {
		    cssId = dom.uniqueId();
		    console.log('url: ' + url);
			linkElm = dom.create('link', {
				id: cssId,
			        rel: 'stylesheet',
			        href: url + '/css/managedblocks.css'
			});

			editor.getDoc().getElementsByTagName('head')[0].appendChild(linkElm);
		}

		// Toggle on/off managed blocks while computing previews
		editor.on("PreviewFormats AfterPreviewFormats", function(e) {
			if (enabled) {
				dom.toggleClass(editor.getBody(), 'ttp-managedblocks', e.type == "afterpreviewformats");
			}
		});

		dom.toggleClass(editor.getBody(), 'ttp-managedblocks');
		enabled = editor.dom.hasClass(editor.getBody(), 'ttp-managedblocks');

		if (managedBlocksMenuItem) {
			managedBlocksMenuItem.active(dom.hasClass(editor.getBody(), 'mce-managedblocks'));
		}

		editor.fire('ManagedBlocks');
	});

	editor.addButton('managedblocks', {
		title: 'Show managed blocks',
		cmd: 'mceManagedBlocks',
         	onPostRender: toggleActiveState,
	        icon: true,
	    	image: 'https://pdfimages.wondershare.com/pdfelement-mac/guide/icon-11-convert.png'
	});

    	editor.addButton('ttpchooselogicalblock', {
		title: 'Choose logical block',
		cmd: 'ttpChooseLogicalBlock',
	        icon: true,
	    image: 'https://d30y9cdsu7xlg0.cloudfront.net/png/37722-200.png'

	});

	editor.addMenuItem('managedblocks', {
		text: 'Show managed blocks',
		cmd: 'mceManagedBlocks',
		onPostRender: toggleActiveState,
		selectable: true,
		context: 'view',
		prependToContext: true
	});

	editor.on('init', function() {
		if (editor.settings.managedblocks_default_state) {
		    editor.execCommand('mceManagedBlocks', false, null, {skip_focus: true});
		    //		    editor.execCommand('ttpChooseLogicalBlock', false, null, {skip_focus: true});
		}
	});

	editor.on('remove', function() {
		editor.dom.removeClass(editor.getBody(), 'ttp-managedblocks');
	});
});
