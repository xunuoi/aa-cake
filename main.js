
// ===========================================
// Set to `false` when run it for production;
const DEBUG = false;

// utils =================
const runAsync = (fn, delay) => {
    setTimeout(fn, delay || 50);

    return {
        then: runAsync,
    };
};

function getRandomNumber(start,end,n){
    var arr=[];
    for(var i=0;i<n;i++){
        var number=Math.floor(Math.random()*(end-start+1)+start);
        if(arr.indexOf(number)<0){
            arr.push(number);
        }else{
            i--;
        }
    }
    return arr;
}

function appendCSSStyle(css, cssId) {
    head = document.head || document.getElementsByTagName('head')[0],
    style = document.createElement('style');
    if (cssId) {
        style.id = cssId;
    }

    head.appendChild(style);

    style.type = 'text/css';
    if (style.styleSheet){
      // This is required for IE8 and below.
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    return style;
}


function getUrlParameter(maiPageLocation, name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(maiPageLocation.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

const getQueryJSONFromURL = (searchString) => {
    const pageLocation = {
        search: searchString || location.search,
    };

    const queriesRison = getUrlParameter(pageLocation, 'queries');

    if (!queriesRison) {
        throw Error('No valid queries Rison params in URL');
    }

    const queryJSON = rison.decode(queriesRison);


    return queryJSON;
}

const scrollPageTo = (position) => {
    document.body.scrollTop = position || 0;
    document.documentElement.scrollTop = position || 0;
}

// =======message===
function sendMessage(data, cb){
    chrome.runtime.sendMessage(data, cb);
}

chrome.runtime.onMessage.addListener(function(req, sender, sendRes) {
    if (req.action) {
        const action = req.action;
        const type = req.type;
        actionMessageMap[action](req, type);
        sendRes({
            status: 'succeed', 
            source: "from main.js"
        });
    } else {
        sendRes({
            status: 'failed', 
            source: "from main.js",
            message: 'Unknown message'
        });
    }
   
});

const sendAction = (action, data, cb) => {
    return sendMessage(
            {
                status: "request", 
                source: 'main.js',
                target: 'popup.js',
                action: action,
                data: data,
            }, 
            function(res) {
                cb && cb(res);
            }
        );;
}


// Business ===========

const actionMessageMap = {
    clean: (req) => {
        cleanAndReload();
    },
    fold: (req, type) => {
        foldFiles(type);
    },
    copyURL: (req) => {
        sendAction('copyURL', location.href);
      
    },
    sync: (req)=> {
        sendAction('sync', location);
    },
    switch: (req, type) => {
        const newHostURL = `${location.protocol}//${type}${location.pathname}${location.search}${location.hash}`;
        window.open(newHostURL);
    },
    editQuery: (req, type) => {
        showJSONEditor();
    },
    debugQuery: (req, type) => {
        const isDebug = getUrlParameter(location, 'debug');
        if (isDebug) {
            const queryRison = getUrlParameter(location, 'queries');
            location.search = `?queries=${queryRison}`;

            // Scroll to top when new page load finished
            sendAction('mainPageScrollTo', 0);

        } else {
             if (location.search) {
                location.search += '&debug=1'
            } else {
                location.search = '?debug=1';
            }
            // Scroll to bottom when new page load finished
            sendAction('mainPageScrollTo', 99999);
        }

    },
    scrollTo: (req, type) => {
        scrollPageTo(parseInt(type));
    }
}

// business =======

const isGoogleDocs = location.host.match('docs.google.com');

function cleanAndReload() {
    localStorage.clear();
    location.href = location.origin+location.pathname;
}

function foldFiles(type) {
    if(type === 'snap') {
        matchPt = /\.js\.snap$/g
    } else if (type === 'test') {
        matchPt = /\/test\.js$/g;
    }

    $(".js-file-title .file-title-name").each((index, item) => {
        var $item = $(item);
        const fileName = $item.data('original-title') || '';
        let matchPt;
        if (
            fileName.match(matchPt) &&
            $item.parents(".file-holder").find(".diff-content").length > 0
        ) {
            $item
            .parents(".js-file-title")
            .click();
        }
    });
}

const initAQLDetectorForGoogleDoc = () => {
    const svgIcon = `
        <svg width="18" height="18" viewBox="0, 0, 42, 32" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <g transform="translate(2.5 0)" fill="currentColor" fill-rule="evenodd" stroke="currentColor" stroke-width="1.5">
                <path d="M13.22 0h12.634l13.22 13.318L19.537 33 0 13.318 13.22 0zm1.874 1.58l4.427 4.344 4.426-4.344h-8.853zm5.619 5.563l5.382 5.364h9.973L25.7 2.172l-4.986 4.97zm-7.36-4.97L3.006 12.506H13.02l5.34-5.334-5.008-5zm.924 11.289l5.211 15.798 5.21-15.798-5.21-5.267-5.211 5.267zm-11.271.625l14.636 14.679-4.88-14.68H3.007zm23.293 0l-4.835 14.679 14.506-14.68H26.3z" id="svg_aa_cake_aql_svg_btn"></path>
            </g>
        </svg>
    `

    // Only enable for google docs;
    if (!isGoogleDocs) {
        return false;
    }

    appendCSSStyle(`
        .docs-bubble a.aa_cake_highlight_style {
            color: red !important;
        }
    `);


    $('.kix-zoomdocumentplugin-inner').on('click', (evt) => {
        const $tar = $(evt.target);
        
        if ($tar.hasClass('kix-lineview-text-block')) {
            const $a = $tar.find('a');

            if ($a.length) {
                const linkURL = $a.attr('href');
                const searchPos = linkURL.indexOf('?');
                const searchString = linkURL.slice(searchPos);
                const hasAQL = (searchPos !== -1) && searchString.includes('queries=');


                window.requestAnimationFrame(() => {

                    const $bubble = $('#docs-link-bubble');

                    if (!hasAQL) {
                        // if click target a has no AQL,
                        // then remove existing one
                        $bubble.find('.aa_cake_aql_btn')
                        .off('click')
                        .remove();
                        // if no AQL link, then remove button and return
                        return false;
                    }

                    if (
                        $bubble.length &&
                        !$bubble.find('.aa_cake_aql_btn').length) 
                    {
                        const $btnWrapper = $bubble.find('.link-bubble-header .docs-bubble-button').parent('span');

                        const $aqlBtn = $(`
                            <div role="button" class="goog-inline-block jfk-button jfk-button-standard docs-material docs-bubble-button aa_cake_aql_btn" tabindex="0" data-tooltip="AQL" aria-label="AQL">
                                    <div class="docs-icon goog-inline-block ">
                                        <div class="docs-icon-img-container" aria-hidden="true">
                                        ${svgIcon}
                                        </div>
                                    </div>
                            </div>`);

                        $aqlBtn.on('click', evt => {
                            evt.preventDefault();
                            evt.stopPropagation();

                            const $bubbleA = $('#docs-linkbubble-link-text');
                            const linkURL = $bubbleA.attr('href');
                            const searchPos = linkURL.indexOf('?');
                            const searchString = linkURL.slice(searchPos);
                            const hasAQL = (searchPos !== -1) && searchString.includes('queries=');

                            if (hasAQL) {
                                showJSONEditor(linkURL, searchString);
                            } else {
                                $aqlBtn.off('click').remove();
                            }
                            
                        });

                        $btnWrapper.append($aqlBtn);
                    }
                })
            }
        }
    });

    window.addEventListener('unload', function(event) {
        $('.kix-zoomdocumentplugin-inner').off('click');
    });
}


const showJSONEditor = (initialLinkURL, initialRisonSearchString) => {

    let editorPanelWidth = 600;
    let editorPanelHeight = 640;
    let editorHeight = 540;

    if (window.innerHeight <= 640) {
        editorPanelHeight = window.innerHeight * 0.86;
        editorHeight = editorPanelHeight - 80;
    }

    const EDITOR_CSS_STYLE = `
        #aa_cake_jsoneditor_mask {
            position:fixed;
            width: 100%;
            height: 100%;
            z-index: 9996;
            background-color: #0c0a1da6;

            top: 0;
            left: 0;
        }

        #aa_cake_jsoneditor_panel {
            width: ${editorPanelWidth}px;
            min-height: ${editorPanelHeight}px;
            padding: 0 0 40px 0;
            box-shadow: 4px 4px #070b25b8;
            background: #2e134a94;
            box-sizing: border-box;

            font-size: 13px;

            position:fixed;
            top:50%;
            left:50%;
            margin-top: -${editorPanelHeight/2 + 10}px;
            margin-left: -${editorPanelWidth/2}px;
            z-index: 9999;
            
        }

        .aa_cake_json_editor_header {
            width: 100%;
            text-align: center;
            padding: 4px;
        }

        #aa_cake_jsoneditor {
            box-sizing: border-box;
            width: 100%;
            min-height: ${editorHeight}px;
            outline: none;
            font-size: 14px;
        }

        .aa_cake_json_editor_menus {
            width: 100%;
            text-align: center;
            padding: 8px 10px;
            font-size: 16px;
        }
        .aa_cake_json_editor_menus button {
            cursor: pointer;
        }
    `;

    const EDITOR_LAYOUT = `
        <div id="aa_cake_jsoneditor_panel">
            <div class="aa_cake_json_editor_header">Query JSON</div>
            <textarea id="aa_cake_jsoneditor"></textarea>

            <div class="aa_cake_json_editor_menus">
                <button class="aa_cake_action" data-action="copyURL">Copy URL</button>
                <button class="aa_cake_action" data-action="copy">Copy</button>
                <button class="aa_cake_action" data-action="apply">Apply</button>
                <button class="aa_cake_action" data-action="aqlexplorer">Open in AQL Explorer</button>
                <button class="aa_cake_action toggle_fullscreen" data-action="fullScreen">Full Screen</button>
                <button class="aa_cake_action" data-action="close">Close</button>
            </div>
        </div>
    `;

    const EDITOR_MASK_LAYOUT = `
        <div id="aa_cake_jsoneditor_mask"></div>;
    `;

    let editorCSSStyle;

    const initEditor = () => {
        if (!$('#aa_cake_jsoneditor_panel').length) {
            editorCSSStyle = appendCSSStyle(EDITOR_CSS_STYLE);
            $(document.body).append(EDITOR_MASK_LAYOUT);
            $(document.body).append(EDITOR_LAYOUT);
        }

        let jsonContent;
        let error;

        try {
            jsonContent = getQueryJSONFromURL(initialRisonSearchString);
        } catch (err) {
            error = err;
        }
        
        const $editor = $('#aa_cake_jsoneditor').focus();

        if (error) {
            $editor.val(error);
        } else {
            $editor.val(JSON.stringify(jsonContent, null, 4));
        }

        return $editor;
    }

    const destroyEditor = () => {
        $('#aa_cake_jsoneditor_panel').off('click').remove();
        $('#aa_cake_jsoneditor_mask').remove();
        $(editorCSSStyle).remove();
    };

    const getEditorContent = ($editor) => {
        return $editor.val();
    }

    const bindEditorEvent = ($editor) => {
        // esc to close
        $editor.on('keydown', (evt) => {
            if (evt.keyCode === 27) {
                destroyEditor();
            }
        })

        $('#aa_cake_jsoneditor_panel .aa_cake_json_editor_menus').on('click', '.aa_cake_action', function(evt) {
            evt.preventDefault();
            evt.stopPropagation();

            const $btn = $(this);
            const action = $btn.attr('data-action');

            // close panel
            if (action === 'close') {
                destroyEditor();

                return false;
            } else if(action === 'fullScreen') {
                $editor.height('90%');

                $('#aa_cake_jsoneditor_panel').get(0)
                    .requestFullscreen();

                $btn.text('Exit Full Screen');
                $btn.attr('data-action', 'exitFullScreen');

                return true;
                
            } else if(action === 'exitFullScreen') {
                $editor.height('normal');

                document.exitFullscreen();
                $btn.text('Full Screen');
                $btn.attr('data-action', 'fullScreen');

                return true;
            }

            const updatedEditorContent = getEditorContent($editor);
            let jsonData;
            let minifiedJSONString;
            let formatedJSONString;
            let updatedRisonString;

            try {
                jsonData = JSON.parse(updatedEditorContent);
                minifiedJSONString = JSON.stringify(jsonData);
                formatedJSONString = JSON.stringify(jsonData, null, 4);
                updatedRisonString = rison.encode(jsonData);

            } catch(error) {
                console.log(error);
                alert(`Content Error: \n\n ${error},\n\n Please check and try again.`);
                
                return false;
            }

            const newURLBase = initialLinkURL.slice(0, initialLinkURL.indexOf('?'));
            const newURL = `${newURLBase}?queries=${updatedRisonString}`;


            if (action === 'aqlexplorer') {
                let prefix = '';
                if (isGoogleDocs) {
                    prefix = 'https://www.appannie.com';
                }
                window.open(`${prefix}/labs/projects/aql-explorer?queries=(aql_explorer:${updatedRisonString})`)

            } else if (action === 'apply') {
                if (isGoogleDocs) {

                    destroyEditor();

                    const $bubble = $('#docs-link-bubble');
                    const $editLinkBtn = $bubble.find('.docs-bubble-button[aria-label="Edit link"]');
                    $editLinkBtn.click();

                    window.requestAnimationFrame(() => {
                        
                        window.requestAnimationFrame(() => {
                            const $editBubble = $('.docs-linkbubble-bubble.docs-calloutbubble-bubble');
                            const $linkInput =  $editBubble.find('.docs-link-urlinput-url-container .docs-link-urlinput-url');
                            $linkInput.val(newURL).select();

                            const linkInput = $linkInput.get(0);
                            const evtOps = {
                                bubbles: true,
                                cancelBubble: false,
                                cancelable: false,
                                composed: true,
                                data: null,
                                inputType: "insertFromPaste",
                                isComposing: false,
                                isTrusted: true,
                                returnValue: true,
                                sourceCapabilities: null,
                                view: null,
                                which: 0
                            };
                            const inputEvent = new Event('input', evtOps);
                            linkInput.dispatchEvent(inputEvent);

                            const $applyBtn = $editBubble.find('.docs-link-insertlinkbubble .jfk-button-action');

                            // Have to trigger mousedown then mouseup
                            const applyBtn = $applyBtn.get(0);
                            applyBtn.dispatchEvent(new MouseEvent('mousedown'))
                            applyBtn.dispatchEvent(new MouseEvent('mouseup'));
                            
                            // show link updated tip
                            window.requestAnimationFrame(() => {
                                const $linkA = $('#docs-linkbubble-link-text');
                                const originalText = $linkA.html();

                                $linkA.addClass('aa_cake_highlight_style').html('URL Link Updated');

                                setTimeout(() => $linkA
                                    .html(originalText)
                                    .removeClass('aa_cake_highlight_style'), 
                                800);
                            });
                            
                        });

                    });

                } else {
                    location.search = `?queries=${updatedRisonString}`;
                }

            } else if(action === 'copy') {

                copyToClipboard(updatedEditorContent);

            } else if(action === 'copyURL') {

                copyToClipboard(newURL);

            }

        });

    }


    // Init editor
    $(() => {
        const $editor = initEditor() 
        bindEditorEvent($editor);
    });
}


// init =========================
function initScript() {
    appendCSSStyle('div[class*="FeedbackWidget__"] { display: none; }');

    $(() => {
        initAQLDetectorForGoogleDoc();
    })
}

initScript();
