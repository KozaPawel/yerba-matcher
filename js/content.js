const extractData = () => {
  let productName =
    document.querySelector('.product_name__name')?.textContent ||
    document.querySelector('div h1')?.textContent ||
    'Add more cases';
  let productPrice =
    document.querySelector('#projector_price_value')?.textContent ||
    document.querySelector('.promoprice')?.textContent ||
    'Add more cases';

  productName.trim();
  productPrice.trim();

  productPrice = productPrice.replace(/[^\d.,-]/g, '');
  productPrice = productPrice.replace(/\,/, '.');

  return { productName, productPrice, url: window.location.href };
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractData') {
    // Send data to popup when requested
    const data = extractData();
    sendResponse(data);
  }
});
