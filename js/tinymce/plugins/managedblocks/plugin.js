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
				element = getRootElement(element);
				editor.fire('ttp-selectblock', [element], false);
			};
		} else {
			return function() { editor.execCommand('mceTableSelectCells'); };
		}
	}
	
	var showOriginContent = function() {
		if(!editor.dom.getParent(editor.selection.getNode(), 'div')){
			editor.settings.ppA.clearComparisonPanel();
			return;
		}
			
		editor.settings.ppA.showHiddenElementContent(editor.selection.getNode());	
	}

	function removeClass(currentClasses, className, callback) {
		var re = new RegExp(' ' + className + ' ', 'g');
		return callback((' ' + currentClasses + ' ').replace(re, " ").trim());
	}

	function getRootElement(element){
		while(element.parentNode.nodeName != "BODY"){
				element = element.parentNode
		}
		return element;
	}
	
	editor.addCommand('ttpChooseLogicalBlock', function() {
		var sP = getRootElement(editor.selection.getStart())
		var eP = getRootElement(editor.selection.getEnd())
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
	
	function defaultMethodMappingMod() {
		var nextTextNodeId = 1;
		return function(node) {
			var clNode = node.cloneNode(true);
			var nodeMapping = {};
			
			mapNodes(clNode,this.currId+'.' + nextTextNodeId++,nodeMapping);
			
			return [clNode, nodeMapping];
		};
	}
	
	function mapNodes(clNode,masterLevel,nodeMapping){
		
		for(var i=0; i<clNode.childNodes.length;i++){
			node = clNode.childNodes[i];
			//editor.dom.setAttrib(node, 'data-ttpid', masterLevel+"."+(i+1));
			//editor.dom.setAttrib(node, 'data-process-status', 'preprocess');
			if(node.childNodes.length>0) {
				mapNodes(node,masterLevel+"."+(i+1),nodeMapping)
			}else{
				if(node.parentNode.childNodes.length==1)
					{
						var ttpTrackingId = masterLevel;
						editor.dom.setAttrib(node.parentNode, 'data-ttpid', ttpTrackingId);
						editor.dom.setAttrib(node.parentNode, 'data-process-status', 'preprocess');
						nodeMapping[ttpTrackingId] = node.wholeText;
					}else{
						var parNode = node.parentNode;
						var sp1 = document.createElement("span");
						var sp1_content = document.createTextNode(node.data);
						sp1.appendChild(sp1_content);
						node.parentNode.replaceChild(sp1, node);
						
						var ttpTrackingId = masterLevel+"."+(i+1);
						editor.dom.setAttrib(sp1, 'data-ttpid', ttpTrackingId);
						editor.dom.setAttrib(sp1, 'data-process-status', 'preprocess');
						nodeMapping[ttpTrackingId] = sp1.innerText;
					}
			}		
		}
	}

	function chooseMethodMapping() {
		return defaultMethodMappingMod();
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
