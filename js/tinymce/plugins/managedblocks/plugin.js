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
			return function() {
				editor.fire('ttp-selectblock', [elementP], false);
			};
		} else {
			return function() { editor.execCommand('mceTableSelectCells'); };
		}
	}
	
	//Показать старый контент для сравнения
	var showOriginContent = function() {
		document.getElementsByClassName(editor.settings.managedblocks_div_to_comparison)[0].innerHTML = this.innerHTML;
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
			if(section[i]==sP){
				startSelect = true;
			}
			if(section[i]==eP){
				logicalBlock(section[i])();
				return;
			}
			
			if(startSelect){
				logicalBlock(section[i])();
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
			};

			editor.dom.addClass(bl, 'ttp-processingblock');
			editor.dom.setAttrib(bl, 'data-ttpid', nextId++);
			
			var or = mk('div', {'class': 'origin viewed'});
			content.forEach(function(node) {	
				or.appendChild(node);
			})

			bl.appendChild(or);
			return [block, bl];
		};
	}

	editor.addCommand('ttpProcessingBlocks', function() {
		var blocks = editor.$(".ttp-chosenblock, .ttp-processingblock");
		blocks.reduce = Array.prototype.reduce;

		var maxAndFilterList = blocks.reduce(reduceToFilterListAndMax, [0, []]);
		var nextId = maxAndFilterList[0] + 1;
		var procBlocks = maxAndFilterList[1];

		var mk = editor.dom.create.bind(editor.dom);
		procBlocks.map(produceProcessingContainer(mk, nextId))
				  .forEach(function(tupl) {
					  var block = tupl[0];
					  var container = tupl[1];
					  
					  editor.dom.replace(container, block, false);
					  editor.execCommand('mceDisableEditableBlock', false, [container]);
					  return container;
				  });
		editor.fire('ttp-processingblock', procBlocks, false);
		
		//Вешаем листнеры для просмотра обработанного контента//тег класса возможно надо изменить
		var originElements = editor.$(".origin");

		for (var i = 0; i < originElements.length; i++) {
			originElements[i].parentElement.addEventListener('click', showOriginContent, false);
		}
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
		var d = editor.dom;
		selectedblocks.forEach(function(block) {
			if (!d.hasClass(block, 'ttp-processingblock') && !d.hasClass(block, 'ttp-processedblock')) {
				editor.dom.addClass(block, 'ttp-chosenblock');
			}
		});
	});
});
