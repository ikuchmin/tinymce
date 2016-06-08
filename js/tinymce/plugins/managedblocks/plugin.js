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

	function logicalBlock(element) {
		var checkOnTable = editor.dom.getParent(element, 'th,tr,td');
		if (checkOnTable == null) {
			return function() {
				editor.fire('ttp-selectblock', [element], false);
			};
		} else {
			return function() { editor.execCommand('mceTableSelectCells'); };
		}
	}

	function removeClass(currentClasses, className, callback) {
		var re = new RegExp(' ' + className + ' ', 'g');
		return callback((' ' + currentClasses + ' ').replace(re, " ").trim());
	}

	editor.addCommand('ttpChooseLogicalBlock', function() {
		logicalBlock(editor.selection.getNode())();
	});

	editor.addCommand('mceManagedBlocks', function() {
		var dom = editor.dom, linkElm;

		if (!cssId) {
			cssId = dom.uniqueId();
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

	editor.addCommand('ttpProcessingBlocks', function() {
		var blocks = editor.$(".ttp-chosenblock");
		blocks.reduce = Array.prototype.reduce;
		var maxAndFilterList = blocks.reduce(function(tupl, el) {
			var max = tupl[0];
			var arr = tupl[1];
			if (el.hasAttribute("data-ttpid")) {
				if (el.getAttribute("data-ttpid") > max) {
					return [el.getAttribute("data-ttpid"), arr];
				}

				return tupl;
			}

			return [max, arr.concat(el)];
		}, [0, []]);

		var nextId = maxAndFilterList[0]++;
		var procBlocks = maxAndFilterList[1];

		var mk = editor.dom.create.bind(editor.dom);
		var containerBlocks = procBlocks.map(function(block) {
			var clearBlock = removeClass(block.className, 'ttp-chosenblock', function(clazz) {
				block.className = clazz;
				return block;
			});
			var or = mk('div', {'class': 'origin viewed'});
			var bl = mk('div', {'data-ttpid': nextId++, 'class': 'ttp-processing'});

			or.appendChild(clearBlock);
			bl.appendChild(or);
			return bl;
		});
		console.log(containerBlocks);
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
		}
	});

	editor.on('remove', function() {
		editor.dom.removeClass(editor.getBody(), 'ttp-managedblocks');
	});

	editor.on('ttp-selectblock', function(selectedblocks) {
		selectedblocks.forEach(function(block) {
			editor.dom.addClass(block, 'ttp-chosenblock');
		});
	});
});
