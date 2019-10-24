
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


// TODO: Fix this
function fixJiraLinkRedirection() {
    // if (location.href.match('appannie.atlassian.net')) {
    //     // $('#ghx-work').remove();
    //     $('#ghx-work').on('click', '#ghx-column-header-group', function(evt){
    //         alert(evt);
    //     })
    // }
}

function getUrlParameter(maiPageLocation, name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(maiPageLocation.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

const getQueryJSONFromURL = () => {
    let queryJSON;
    try {
        const queriesRison = getUrlParameter(location, 'queries');
        if (!queriesRison) {
            throw Error('No valid queries Rison params in URL');
        }
        queryJSON = rison.decode(queriesRison);
  
    } catch (err) {
        console.error(err);
    }

    return queryJSON;
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

const scrollPageTo = (position) => {
    document.body.scrollTop = position || 0;
    document.documentElement.scrollTop = position || 0;
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


const showJSONEditor = () => {

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
                <button class="aa_cake_action toggle_fullscreen" data-action="fullScreen">Full Screen</button>
                <button class="aa_cake_action" data-action="copy">Copy</button>
                <button class="aa_cake_action" data-action="apply">Apply Now</button>
                <button class="aa_cake_action" data-action="aqlexplorer">Open in AQL Explorer</button>
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

        const jsonContent = getQueryJSONFromURL();
        const $editor = $('#aa_cake_jsoneditor');
        $editor.val(JSON.stringify(jsonContent, null, 4));

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
        $('#aa_cake_jsoneditor_panel .aa_cake_json_editor_menus').on('click', '.aa_cake_action', function(evt) {
            evt.preventDefault();
            evt.stopPropagation();

            const $btn = $(this);
            const action = $btn.attr('data-action');
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

            if (action === 'aqlexplorer') {
                window.open(`/labs/projects/aql-explorer?queries=(aql_explorer:${updatedRisonString})`)

            } else if (action === 'apply') {

                location.search = `?queries=${updatedRisonString}`;

            } else if(action === 'copy') {

                copyToClipboard(updatedEditorContent);

            } else if(action === 'fullScreen') {
                $editor.height('90%');

                $('#aa_cake_jsoneditor_panel').get(0)
                    .requestFullscreen();

                $btn.text('Exit Full Screen');
                $btn.attr('data-action', 'exitFullScreen');

                
            } else if(action === 'exitFullScreen') {
                $editor.height('normal');

                document.exitFullscreen();
                $btn.text('Full Screen');
                $btn.attr('data-action', 'fullScreen');

            } else if (action === 'close') {

                destroyEditor();

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
    fixJiraLinkRedirection();
}

initScript();
