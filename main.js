
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

function appendCSSStyle(css) {
    head = document.head || document.getElementsByTagName('head')[0],
    style = document.createElement('style');

    head.appendChild(style);

    style.type = 'text/css';
    if (style.styleSheet){
      // This is required for IE8 and below.
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
}

function fixJiraLinkRedirection() {
    // TODO: Fix this
    // if (location.href.match('appannie.atlassian.net')) {
    //     // $('#ghx-work').remove();
    //     $('#ghx-work').on('click', '#ghx-column-header-group', function(evt){
    //         alert(evt);
    //     })
    // }
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

function initScript() {
    appendCSSStyle('div[class*="FeedbackWidget__"] { display: none; }');
    fixJiraLinkRedirection();
}

initScript();
