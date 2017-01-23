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

tinymce.PluginManager.add('ttp_newdocument', function(editor) {

    editor.addCommand('ttpNewDocument', function() {
        editor.settings.core.docUtil.actionOnNotSavedDoc = () => {
            editor.setContent('');
            editor.settings.core.docUtil.rememberDocument();
        };

        var edited = editor.settings.core.docUtil.isDocumentEdited();

        if (edited) {
            editor.settings.core.globalVar.modalCheckSavedDocument.modal('show');
        } else {
            editor.setContent('');
            editor.settings.core.docUtil.rememberDocument();
        }
    });

    editor.addButton('ttpNewDocument', {
        title: 'New document',
        cmd: 'ttpNewDocument',
        icon: "newdocument"
    });
});