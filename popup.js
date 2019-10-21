// Variables ===============================

const $actionPanel = $('#action-panel');
const $clearBtn = $('#clear_btn');
const $hostBtn = $('#action-panel .action_btn[data-action="switch"]');
const $copyJSONBtn = $('#action-panel .static_action_btn[data-action="copyJSON"]');
const $cakeTitle = $('#cake-title');
const $loading = $('#loading_icon');
const titleText = 'AA Cake';

const DATA_STATUS = {};


// Basic Utils ===============================

function getUrlParameter(maiPageLocation, name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(maiPageLocation.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

// Message Utils ===============================
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
    // console.log('Message', req);

    if (req.target === 'popup.js') {
        const data = req.data;
        actionMap[req.action](data);

        sendRes({status: "none"})
    } else {
        sendRes({status: "none"})
    } 
});

function sendMessage(data, cb){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, data, cb);
    });
}

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

// UI Utils ===============================

let initialClosePopoverTimeoutId;
const clearInitialClosePopoverTimeoutId = () => {
    clearTimeout(initialClosePopoverTimeoutId);
}

const closePopover = () => {
    // window.close();
}

// Show tip
const tip = (txt, time, shouldClose) => {
    $cakeTitle.addClass('highlight').html(txt);
    clearInitialClosePopoverTimeoutId();

    setTimeout(() => {
        $cakeTitle.removeClass('highlight').html(titleText);
        shouldClose != false && closePopover();
    }, time || 1200);
}

// Business ===============================

// For Popover Page Async Action
const actionMap = {
    copyURL: (txt) => {
        copyToClipboard(txt);
        tip('URL Copied', 1000, false);
        // The first initial close popover timeout
        initialClosePopoverTimeoutId = setTimeout(() => {
            closePopover();
        }, 5500);
    },
    sync: (mainPageLocation) => {
        detectMainPageHost(mainPageLocation);
        parseRisonURL(mainPageLocation);

        $loading.remove();
    }

}

// For Popover Page Sync Action
// Will execute this action immediately
const staticAction = {
    copyJSON: (evt) => {
        const queryJSON = DATA_STATUS['query-json'];
        copyToClipboard(JSON.stringify(queryJSON, null, '    '));
        tip('JSON Copied', 1000, false);
    }
}

const detectMainPageHost = (maiPageLocation) => {
    let targetHost = 'localhost';
    let targetHostName = 'localhost';
    if (maiPageLocation.host.match('localhost')) {
        targetHost = 'www.appannie.com'
        targetHostName = 'WWW';
    }

    $hostBtn.html(`To ${targetHostName}`);
    $hostBtn.data('type', targetHost);
    $hostBtn.removeAttr('disabled');

    // Show different actions for different sites
    if (maiPageLocation.href.match(/git\.appannie/)) {
        // gitlab site
        $actionPanel.find('.action_btn[data-action="fold"]').removeClass('hide');
    } else {
        // none gitlab site
        $actionPanel.find('.action_btn[data-action="switch"]').removeClass('hide');
    }
}

const parseRisonURL = (maiPageLocation) => {
    try {
        const queriesRison = getUrlParameter(maiPageLocation, 'queries');
        if (!queriesRison) {
            throw Error('No valid queries Rison params in URL');
        }
        const queryJSON = rison.decode(queriesRison);
        DATA_STATUS['query-json'] = queryJSON;
        $copyJSONBtn
            .removeClass('hide')
            .html(`Copy JSON`)
            .removeAttr('disabled');
    } catch (err) {
        console.error(err);
        $copyJSONBtn.addClass('hide');
    }
}

// Bind UI Events ===============================
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


// Init Plugin ===============================
const initUI = () => {
    $cakeTitle.html(titleText);
};

const initMainPageAction = ()=> {
    sendActionToMainPage('copyURL');
    sendActionToMainPage('sync')
};

$(() => {
    initUI();
    initMainPageAction();
});
