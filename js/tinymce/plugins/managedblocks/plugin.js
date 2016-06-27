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
			var elementP = editor.dom.getParent(element, 'p,ul,ol'); // если элемент находится внутри P, то мы просто берем сразу родительский элемент
			while(elementP.parentNode.nodeName != "BODY"){
				elementP = elementP.parentNode
			}
			
			return function() {
				editor.fire('ttp-selectblock', [elementP], false);
			};
		} else {
			return function() { editor.execCommand('mceTableSelectCells'); };
		}
	}
	
	//Показать старый контент для сравнения
	var showOriginContent = function() {
		if(!editor.dom.getParent(editor.selection.getNode(), 'div'))
			return;
		
		var showElement = editor.dom.getParent(editor.selection.getNode(), 'div').parentNode;
		
		if(showElement && showElement.className=="ttp-processingblock"){
			if(showElement.childNodes[1] && showElement.childNodes[1]=="processed")
				document.getElementsByClassName(editor.settings.managedblocks_div_to_comparison)[0].innerHTML = showElement.childNodes[1].innerHTML;
		}
	}

	function removeClass(currentClasses, className, callback) {
		var re = new RegExp(' ' + className + ' ', 'g');
		return callback((' ' + currentClasses + ' ').replace(re, " ").trim());
	}

	editor.addCommand('ttpChooseLogicalBlock', function() {

		//Временное решение для выбора сразу нескольких элементов P
		var sP = editor.dom.getParent(editor.selection.getStart(), 'p');
		var eP = editor.dom.getParent(editor.selection.getEnd(), 'p');
		var section = editor.selection.getNode().childNodes;

		var startSelect = false;
		
		for(var i=0;i<section.length;i++){
			if(startSelect){
				logicalBlock(section[i])();
				if(section[i]==eP){
					return;
				}
			}else{
				if(section[i]==sP){
					startSelect = true;
					logicalBlock(section[i])();
				}
			}
		}
	
		//Изначальный блок, до него не доходит, если мы выбрали несколько блоков
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


	function reduceToFilterListAndMax(prevState, element) {
		var max = prevState[0];
		var arr = prevState[1];
		if (element.hasAttribute("data-ttpid")) {
			var possibleId = parseInt(element.getAttribute("data-ttpid"));
			if (possibleId > max) {
				return [possibleId, arr];
			}

			return prevState;
		}

		return [max, arr.concat(element)];
	}

	function defaultMethodMapping() {
		var nextTextNodeId = 1;

		return function(node) {
			var clNode = node.cloneNode(true);
			var tw = document.createTreeWalker(clNode, NodeFilter.SHOW_TEXT);
			var nodeMapping = {};

			while (tw.nextNode()) {
				var txtNode = tw.currentNode;
				var ttpTrackingId = this.currId + '.' + nextTextNodeId++;
				editor.dom.setAttrib(txtNode.parentNode, 'data-ttpid', ttpTrackingId);
				nodeMapping[ttpTrackingId] = txtNode.wholeText;
			}

			return [clNode, nodeMapping];
		};
	}

	function chooseMethodMapping() {
		return defaultMethodMapping();
	}

	function produceProcessingContainer(mk, initValueId) {
		var nextId = initValueId;

		return function(block) {
			var clearBlock = removeClass(block.className, 'ttp-chosenblock', function(clazz) {
				var copy = block.cloneNode(true);
				copy.className = clazz;
				return copy;
			});

			var bl;
			var content;
			switch (block.nodeName) {
				case 'TD':
					content = [].slice.call(clearBlock.children);
				
					bl = clearBlock;
					while (bl.firstChild) bl.removeChild(bl.firstChild); // remove children
					break;
				default:
					content = [clearBlock];
					bl = mk('div', {});
					break;
			}

			var currId = nextId++;
			editor.dom.addClass(bl, 'ttp-processingblock');
			editor.dom.setAttrib(bl, 'data-ttpid', currId);

			var or = mk('div', {'class': 'origin viewed'});
			content.forEach(function(node) {
				or.appendChild(node);
			});

			var pr = mk('div', {'class': 'processed'});
			var mapped = content
				.map(chooseMethodMapping().bind({currId: currId}))
				.reduce(function(acc, el) {
					// Dirty hack
					pr.appendChild(el[0]);
					Object.assign(acc, el[1]);
					
					return acc;
				}, {});

			
			bl.appendChild(or);
			bl.appendChild(pr);
			return [block, bl, mapped];
		};
	}

	editor.addCommand('ttpProcessingBlocks', function() {
		var blocks = editor.$(".ttp-chosenblock, .ttp-processingblock");
		blocks.reduce = Array.prototype.reduce;

		var maxAndFilterList = blocks.reduce(reduceToFilterListAndMax, [0, []]);
		var nextId = maxAndFilterList[0] + 1;
		var procBlocks = maxAndFilterList[1];

		var mk = editor.dom.create.bind(editor.dom);
		var dataToDecode = {};
		var mapped = procBlocks
			.map(produceProcessingContainer(mk, nextId))
			.reduce(function(acc, tupl) {
				var block = tupl[0];
				var container = tupl[1];
				
				editor.dom.replace(container, block, false);
				editor.execCommand('mceDisableEditableBlock', false, [container]);

				Object.assign(acc, tupl[2]);
				Object.assign(dataToDecode, tupl[2]);
				
				return acc;
			}, {});
		editor.fire('ttp-processingblock', mapped, false);
		console.log(dataToDecode);
		editor.selection.collapse();
		editor.settings.webActions.sendData(dataToDecode);
		
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
		editor.iframeElement.contentDocument.addEventListener('click', showOriginContent, false);
		
		if (editor.settings.managedblocks_default_state) {
			editor.execCommand('mceManagedBlocks', false, null, {skip_focus: true});
		}
	});

	editor.on('remove', function() {
		editor.dom.removeClass(editor.getBody(), 'ttp-managedblocks');
	});

	editor.on('ttp-selectblock', function(selectedblocks) {
		var d = editor.dom;
		selectedblocks.forEach(function(block) {
			if (!d.hasClass(block, 'ttp-processingblock') && !d.hasClass(block, 'ttp-processedblock')) {
				editor.dom.addClass(block, 'ttp-chosenblock');
			}
		});
	});
});
