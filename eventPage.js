
chrome.runtime.onMessage.addListener(function(req, sender, sendRes) {
    if (req.type) {

        sendRes({
            status: 'succeed', 
            source: "from eventPage.js"
        });
    } else {
        sendRes({
            status: 'failed', 
            source: "from eventPage.js",
            message: 'Unkown message'
        });
    }
   
});

function sendMessage(data, cb){
    chrome.runtime.sendMessage(data, cb);
}

