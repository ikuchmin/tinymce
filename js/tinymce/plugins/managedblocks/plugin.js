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
		    if(element.textContent.trim().length==0)return function () {};
			return function() {
				element = getRootElement(element);
				editor.fire('ttp-selectblock', [element], false);
			};
		} else {
			return function() { editor.execCommand('mceTableSelectCellsSpecial'); };
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
		    if (!~'TABLEDOCUMENTID'.indexOf(section[i].nodeName))
			{
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
		}
	
		if(!startSelect) logicalBlock(editor.selection.getNode())();
	});

	editor.addCommand('ttpChooseAllLogicalBlock', function() {
        var body = editor.dom.select('body')[0];
        var nodes = body.childNodes;
        for(var i=0;i<nodes.length;i++){

            if (!~'TABLEDOCUMENTID'.indexOf(nodes[i].nodeName)){logicalBlock(nodes[i])();}
            else if(~'TABLE'.indexOf(nodes[i].nodeName)){
                var trList = nodes[i].childNodes[0].childNodes;
                var cells = [];
                for(trId in trList){
                    tr = trList[trId];
                    for(cellId in tr.childNodes){
                        cell = tr.childNodes[cellId];
                        if(~'TD'.indexOf(cell.nodeName) && cell.textContent.trim().length!=0) cells.push(cell);
                    }
                }
                editor.fire('ttp-selectblock', cells, false);
            }
        }

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
		if (element.hasAttribute("data-ttpid") ) {
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
	
	function chooseMethodMapping() {
		return defaultMethodMappingMod();
	}
	
	function mapNodes(clNode,masterLevel,nodeMapping){
		
		for(var i=0; i<clNode.childNodes.length;i++){
			node = clNode.childNodes[i];
			if(node.childNodes.length>0) {
				mapNodes(node,masterLevel+"."+(i+1),nodeMapping)
			}else{
				if(node.nodeName!="BR"){
					if(node.parentNode.childNodes.length==1)
					{
						var ttpTrackingId = masterLevel;
						editor.dom.setAttrib(node.parentNode, 'data-ttpid', ttpTrackingId);
						editor.dom.setAttrib(node.parentNode, 'data-process-status', 'preprocess');
						nodeMapping[ttpTrackingId] = node.wholeText;
					}else{
						var sp1 = wrapSinglChildNode(node);
						var ttpTrackingId = masterLevel+"."+(i+1);
						editor.dom.setAttrib(sp1, 'data-ttpid', ttpTrackingId);
						editor.dom.setAttrib(sp1, 'data-process-status', 'preprocess');
						nodeMapping[ttpTrackingId] = sp1.innerText;
					}
				}
			}
		}
	}
	
	function wrapSinglChildNode(node){
		if(node.nodeName!=="#text") return node;
		var sp1 = document.createElement("span");
		var sp1_content = document.createTextNode(node.data);
		sp1.appendChild(sp1_content);
		node.parentNode.replaceChild(sp1, node);
		return sp1;
	}

	function produceProcessingContainer(mk, initValueId) {
		var nextId = initValueId;

		return function(block) {
			var clearBlock = removeClass(block.className, 'ttp-chosenblock', function(clazz) {
				var copy = block.cloneNode(true);
				if(copy.childNodes.length==1)
					wrapSinglChildNode(copy.childNodes[0]);
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
			editor.dom.setAttrib(bl, 'data-process-status', 'preprocess');

			var or = mk('div', {'class': 'origin viewed'});
			var pr = mk('div', {'class': 'processed'});

			content.forEach(function(node) {
				or.appendChild(node);
				pr.appendChild(node.cloneNode(true));

			});

			bl.appendChild(or);
			bl.appendChild(pr);

           var mapped ={};
           mapped[currId] = block.innerText;

           return [block, bl, mapped];
		};
	}

	editor.addCommand('ttpGetSelection', function() {
	    editor.settings.ppA.variable.singleElement = editor.selection.getStart()===editor.selection.getEnd();
        editor.settings.ppA.variable.selectedText = editor.selection.getContent();
        editor.settings.ppA.variable.selectedBookmark = editor.selection.getBookmark();
	});


    //TO-DO возможно надо будет удалить
    editor.addCommand('ttpGetBlock', function() {
         function getRootElement(e){
            if (e.nodeName=="BODY") return null;
            while(e.parentNode.nodeName != "BODY" ){
                    if(e.nodeName == "TD") return e;
                    e = e.parentNode
            }
            return e;
        }


        var sP = getRootElement(editor.selection.getStart())
        var eP = getRootElement(editor.selection.getEnd())
        var section = editor.selection.getNode().childNodes;

        var zz = getRootElement(editor.selection.getNode())
        console.dir(editor.selection.getNode())
        console.dir(zz)

//        editor.settings.ppA.variable.selectedText = editor.selection.getContent({format : "text"});
    });

	editor.addCommand('ttpProcessingBlocks', function() {
		var blocks = editor.$(".ttp-chosenblock, .ttp-processingblock, .ttp-processedblock");
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
		image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAtklEQVR42t3SMQrCQBCF4W20MkcwibewzD08TUDbQNSDpNB0gq3BIwRyBu1soi/wL4wRiYWNDnwQhplhdzbO/W0EksgCCbnBmEshN6nlgJpcQc1LjGUrF0llSj6CI5dSs5GRb+4+SjlJaIZm0iIz+ZDa0g9ZSyUTUxTReEdrTuKoreh1uZx7SxoaENCT+yvsScQfXCGmdtffQ7eYqyzNILvEmayoeVriu2ds5Ihm6Bm/9iP9YDwAa200ktDK150AAAAASUVORK5CYII="
	});

	editor.addButton('ttpchooselogicalblock', {
		title: 'Choose logical block',
		cmd: 'ttpChooseLogicalBlock',
        icon: true,
        classes: 'choseLogicBlock',
        image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAFiSURBVHja7JhNSgNBEEbfxFER8QK6ElyqoGbnBTyFotcI6Crg0gMI8RhZKLhw6U4x0YXi3wUSXRgnM24+oWkSE81MaLAKCma6e5pHdX1VzURZlhGylQjcDNAADdAA/ztgPOzCcqX+0/QMsA2U9X4F1IB2vw8uq1v5Ag6wBWAXWNN7AzgFbkI54kVgA5iSrwJLoeVg13lOQhNJJrcy81d7B1JvrDXWMqNSMi9BuJZKIO5eEbCpAJS88SfgFXjLG3AP2AFWegDGUq+77wHw2QOwCZwAR3kDrssnhlw/KfdtWV5IDuah1LQokVyrQyQ6um/v9Kl7Xc25axPgHrgrQiTHQF0dInLGP9SD9508TIBD4AKY9vZ5AJ6LAGwrgo0ecy2g4qXCGXAeSh2c9aIKMBd6J4ms1f0yWnEB98zcAF90i+5I1U3gcdy9eBBgTRdVgFv13NGPxv5uGaABGqABGuBI9jUACthJmIPrqzwAAAAASUVORK5CYII="
	});

	editor.addMenuItem('managedblocks', {
		text: 'Show managed blocks',
		cmd: 'mceManagedBlocks',
		onPostRender: toggleActiveState,
		selectable: true,
		context: 'view',
		prependToContext: true
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
        if (limit_ms > editor.settings.delay_markup) { //Change value in milliseconds
            editor.settings.markUpFunction(editor.selection.getNode());
            clearInterval(setInverval_Variable);
            delete setInverval_Variable;
        }
    }

	editor.on('init', function() {
		editor.iframeElement.contentDocument.addEventListener('click', showOriginContent, false);
		if(editor.settings.isMarkUp)
		    editor.iframeElement.contentDocument.addEventListener('keydown', DelayedSubmission , false);

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
			if(d.hasClass(block, 'ttp-chosenblock')){
				editor.dom.removeClass(block, 'ttp-chosenblock');
				editor.dom.removeClass(block, 'ttp-chosenblock-speicalCell');
			} else if (!d.hasClass(block, 'ttp-processingblock') && !d.hasClass(block, 'ttp-processedblock')) {
				editor.dom.addClass(block, 'ttp-chosenblock');
			}

			if(d.hasClass(block, 'ttp-reprocess')) {
              editor.dom.removeClass(block, 'ttp-reprocess');
			}
			else if(d.hasClass(block, 'ttp-processedblock')) {
			   editor.dom.addClass(block, 'ttp-reprocess');
			   editor.dom.addClass(block, 'ttp-chosenblock');
			}
		});
	});
});
