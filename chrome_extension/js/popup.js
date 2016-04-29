$(function() {
  $("#cForm").submit(function(event) {
    btnClick();
    event.preventDefault();
  });
});

function btnClick(){
  chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
    // since only one tab should be active and in the current window at once
    // the return variable should only have one entry
    var activeTab = arrayOfTabs[0];
    var activeTabId = activeTab.id;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      chrome.tabs.sendMessage(activeTabId, {action: "start", time: $('#time').val(), bw: $('#bw').val() }, function(response) {});
    });
  });
}