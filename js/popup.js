document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('extractButton').addEventListener('click', extractData);
});

function extractData() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'extractData' }, (response) => {
      if (response) {
        document.getElementById('productName').textContent = JSON.stringify(response);
        const nameImput = document.getElementById('nameInput');
        nameImput.disabled = false;
        nameImput.value = response.productName;
        // document.getElementById('productPrice').textContent = response.productPrice;
        // document.getElementById('productUrl').textContent = response.url;
      } else {
        // Handle error or no response
        document.getElementById('productName').textContent = 'Error extracting data';
        // console.error('Failed to get data from content script', chrome.runtime.lastError);
      }
    });
  });
}
