document.documentElement.className += ' has-jamlet'; // Let thisismyjam.com know we have jamlet installed

if (window.location.pathname === "/") {
  chrome.extension.sendMessage({'type': 'jamHomepageLoaded'});
}
