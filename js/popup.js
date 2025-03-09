document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('extractButton').addEventListener('click', extractData);
  document.getElementById('searchButton').addEventListener('click', fetchSimilar);
});

const nameImput = document.getElementById('nameInput');
const searchButton = document.getElementById('searchButton');

const extractData = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'extractData' }, (response) => {
      if (response) {
        nameImput.disabled = false;
        nameImput.value = response.productName;

        searchButton.disabled = false;

        document.getElementById('productName').textContent = JSON.stringify(response);
        // document.getElementById('productPrice').textContent = response.productPrice;
        // document.getElementById('productUrl').textContent = response.url;
      } else {
        document.getElementById('productName').textContent = 'Error extracting data';
      }
    });
  });
};

const fetchSimilar = async () => {
  let searchFor = nameImput.value;
  searchFor = searchFor.replace(/\ /g, '+');
  const url = 'https://www.poyerbani.pl/search.php?text=' + searchFor;

  try {
    const response = await fetch(url);
    const html = await response.text();

    const parser = new DOMParser();
    const htmlPage = parser.parseFromString(html, 'text/html');
    const { productName, productPrice, productUrl } = getProductData(htmlPage);

    document.getElementById('productPrice').textContent =
      productName + ' ' + productPrice + ' ' + productUrl;
  } catch (error) {
    console.error(error.message);
    // todo: feedback in ui that there was an error
  }
};

const getProductData = (htmlPage) => {
  let productPrice = htmlPage.querySelector('strong.price')?.textContent;
  let productName = htmlPage.querySelector('.product__name')?.textContent;
  let productUrl = htmlPage.querySelector('a.product__name').getAttribute('href');

  productPrice = productPrice.trim();
  productName = productName.trim();

  productPrice = productPrice.replace(/[^\d.,-]/g, '');
  productPrice = productPrice.replace(/\,/g, '.');

  const firstDotIndex = productPrice.indexOf('.');
  productPrice =
    productPrice.substring(0, firstDotIndex + 1) +
    productPrice.substring(firstDotIndex + 1).replace(/\./g, '');

  return { productName, productPrice, productUrl };
};
