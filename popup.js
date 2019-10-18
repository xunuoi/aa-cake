// ===================
// function clearChromeStorage() {
//     chrome.storage.sync.clear(() => {
//         $user.val('');
//         $pwd.val('');
//         console.log('Cleared Chrome Storage!');

//         tip('Cleared');
//     });
//     return false;
// }

// function saveUserInfo(user, pwd, callback) {
//     chrome.storage.sync.set({user: user, pwd: pwd}, function() {
//       console.log('Save user info succeed!');
//       callback && callback(user, pwd);
//     });
// }
// $clearBtn.click(evt => clearChromeStorage());

chrome.runtime.onMessage.addListener(function(req, sender, sendRes) {
    console.log('Message', req);

    if (req.target === 'popup.js') {
        const data = req.data;
        actionMap[req.action](data);

        sendRes({status: "none"})
    } else {
        sendRes({status: "none"})
    } 
});


var $actionPanel = $('#action-panel');
var $clearBtn = $('#clear_btn');
const $hostBtn = $('#action-panel .action_btn[data-action="switch"]');
const $copyJSONBtn = $('#action-panel .static_action_btn[data-action="copyJSON"]');
var $cakeTitle = $('#cake-title');
var titleText = 'AA Cake';


function sendMessage(data, cb){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, data, cb);
    });
}

function getUrlParameter(maiPageLocation, name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(maiPageLocation.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

const actionMap = {
    copy: (txt) => {
        copyToClipboard(txt);
        tip('URL Copied!', 900, false);
        setTimeout(() => {
            window.close();
        }, 5500);
    },
    sync: (mainPageLocation) => {
        detectHost(mainPageLocation);
        parseRisonURL(mainPageLocation)
    }

}

function tip(txt, time, shouldClose) {
    $cakeTitle.html(txt);
    setTimeout(() => {
        $cakeTitle.html(titleText);
        shouldClose != false && window.close();
    }, time || 1200);
}

const detectHost = (maiPageLocation) => {
    let targetHost = 'localhost';
    let targetHostName = 'localhost';
    if (maiPageLocation.host.match('localhost')) {
        targetHost = 'www.appannie.com'
        targetHostName = 'WWW';
    }

    $hostBtn.html(`To ${targetHostName}`);
    $hostBtn.data('type', targetHost);
    $hostBtn.removeAttr('disabled');
}

const db = {};
const parseRisonURL = (maiPageLocation) => {
    const queryRison = getUrlParameter(maiPageLocation, 'queries') || '()';
    const queryJSON = rison.decode(queryRison);
    db['query-json'] = queryJSON;
    
    $copyJSONBtn.html(`Copy JSON`);
    $copyJSONBtn.removeAttr('disabled');
}

const staticAction = {
    copyJSON: (evt) => {
        const queryJSON = db['query-json'];
        copyToClipboard(JSON.stringify(queryJSON));
        tip('JSON Copied!', 900, false);
    }
}


$actionPanel.on('click', '.action_btn' ,function(evt){
    evt.preventDefault()
    evt.stopPropagation()
    var $btn = $(this);
    if ($btn.attr('disabled')) {
        return false;
    }
    var action = $btn.data('action');
    var type = $btn.data('type');

    sendMessage(
        {
            status: "success", 
            source: 'popup.js',
            action: action,
            type: type,
        }, 
        function(res) {
            tip('OK!');
        }
    );
});

$actionPanel.on('click', '.static_action_btn' ,function(evt){
    evt.preventDefault()
    evt.stopPropagation()
    var $btn = $(this);
    if ($btn.attr('disabled')) {
        return false;
    }
    var action = $btn.data('action');
    var type = $btn.data('type');

    staticAction[action](type);
});


const sendActionToMainPage = (action, cb) => {
    sendMessage(
        {
            status: "success", 
            source: 'popup.js',
            action: action,
        }, 
        function(res) {
            cb && cb(res);
        }
    );
}

const initMainPageAction = ()=> {
    sendActionToMainPage('copy');
    sendActionToMainPage('sync')
}

const initUI = () => {
    $cakeTitle.html(titleText);
}

$(() => {
    initUI();
    initMainPageAction();
});
