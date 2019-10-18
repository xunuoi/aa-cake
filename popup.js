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
var $cakeTitle = $('#cake-title');
var titleText = 'AA Cake';


function sendMessage(data, cb){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, data, cb);
    });
}

const parseRisonToJSON = (queryURL) => {
    const queryJSON =  rison.decode(queryURL);
    alert(queryJSON);
}

const actionMap = {
    copy: (txt) => {
        copyToClipboard(txt);
        tip('URL Copied!', 900, false);
        parseRisonToJSON(txt);
        // setTimeout(() => {
        //     window.close();
        // }, 5500);
    },

}

function tip(txt, time, shouldClose) {
    $cakeTitle.html(txt);
    setTimeout(() => {
        $cakeTitle.html(titleText);
        shouldClose != false && window.close();
    }, time || 1200);
}

$actionPanel.on('click', '.action_btn' ,function(evt){
    evt.preventDefault()
    evt.stopPropagation()
    var $btn = $(this);
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
            tip('Ojbk👌');
        }
    );
});

$(() => {
    $cakeTitle.html(titleText);

    sendMessage(
        {
            status: "success", 
            source: 'popup.js',
            action: 'copy',
        }, 
        function(res) {}
    );

   
});
