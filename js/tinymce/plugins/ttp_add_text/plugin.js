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

tinymce.PluginManager.add('ttp_add_text', function(editor) {
        editor.addCommand('addheadertext', function() {
            editor.insertContent(editor.settings.core.specText.headerText);
        });

        editor.addMenuItem('addheadertext', {
            text: 'Add header text',
            cmd: 'addheadertext'
        });

        editor.addCommand('addtrademarktext', function() {
            editor.execCommand('mceTableInsertTradeMarkText');
        });

        editor.addMenuItem('addtrademarktext', {
            text: 'Add trademark text',
            cmd: 'addtrademarktext'
        });

        var menuItems = [];

        var items = ["addheadertext","addtrademarktext"];

        for(var i=0;i<items.length;i++){
            menuItems.push(editor.menuItems[items[i]]);
        }

        editor.addButton("ttp_add_text", {
            type: "menubutton",
            title: "TTP special functions",
            menu: menuItems,
            image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB9klEQVR42sXXSyhEURgH8GsGk/F+ZGGBlMcCGYrymhoWkkgeZTGTLDyyQBFKKRs1Cwtlo1mwsZLHjhQrpShWFrIQivKcyKs8/qe+W1/TzKzud5361cyZU/9zzj1zzrmaJlecMAGx9D0CssHC2kQJ5mteOIZI1oExsLI245IdiCOmlZgwv9VJh8fDEaTS9zRIDtE2S6oTBfSc9RE7g7Rpg31IMOORWEKMvoQ+Z0iEloINitkM2GHdrIXYDKuwDMPghkwoD9G+yugO1MIS9MBGiJHzR5NjZHg+XMMXtEMerMEuLVAVXARzkGT0yAvhFn6J6sQo7LHNKBp26Pd6I8MdcMfCeScOYJC1VTMzQPuEIaUCHoOE/7B93i614mvADwu06nn4kPTfTe10r3Ti6St7E76hVzq8Ed5gmtVVwj14pMNb4YNWuF5ctA46pcO74JNWMZ+NJ2iRDu+mkXsCTrZnaJAO74d36GB1bgp3SYeP0IJrYnV9NO3V0uGT8BJwnVIdeghzuhlWZmiU/Licoi3XIR3upf90GaubhRs6dMSKus/NBwTpdVd03Ire3xbhEnJZnQ8ujL44BBYrHSbn9Oqk0dvMCpzRlUq0+Gja9Vuqja5Tp1I312AXQz9dItXZvQ0nkG7ma5XeCTXlh5Ci/UNRndiCRDND/wAYHWQ+3YK2NgAAAABJRU5ErkJggg=="
        });
});