// Called when URLs change
function checkForJammableUrl(tabId, changeInfo, tab) {
  if (isPotentiallyJammable(tab.url)) {
    chrome.pageAction.show(tabId);
  } else {
    chrome.pageAction.hide(tabId);
  }
};

// Listen to URL changes
chrome.tabs.onUpdated.addListener(checkForJammableUrl);

// Called when jamlet icon is clicked
function jamletClicked(tab) {
  var destUrl = 'http://www.thisismyjam.com/jam/create?signin=1&source=jamlet&url=' + encodeURIComponent(tab.url);
  chrome.tabs.create({'url': destUrl});
}

function isPotentiallyJammable(url) {
  // YouTube watch page
  if (url.match(/^(https?:\/\/)?(www\.)?youtube\.com\/watch.+/i))
    return true;
  
  // Potential SoundCloud track page (TODO: Introspect page to make sure?)
  if (url.match(/^(https?:\/\/)?(www\.)?soundcloud\.com\/[^\/]+\/[^\/]+/i))
    return true;
  
  // Found audio
  if (url.match(/^[^ ]+\/[^ ]+\.mp3$/))
    return true;
  
  // Hype Machine track page
  if (url.match(/^(https?:\/\/)?(www\.)?hypem.com\/track[^\/]+/i))
    return true;
  
  // Potential Bandcamp track page (TODO: Introspect page to make sure?)
  if (url.match(/^(https?:\/\/)[^\/]+\/track\//))
    return true;

  return false;
}

// Listen to clicks
chrome.pageAction.onClicked.addListener(jamletClicked);