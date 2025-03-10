document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('extractButton').addEventListener('click', extractData);
  document.getElementById('searchButton').addEventListener('click', fetchSimilar);
});

const nameImput = document.getElementById('nameInput');
const searchButton = document.getElementById('searchButton');
let currentPage;

const extractData = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'extractData' }, (response) => {
      if (response) {
        nameImput.disabled = false;
        searchButton.disabled = false;

        nameImput.value = response.productName;
        currentPage = response;

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
  document.getElementById('productPrice').innerHTML = '';
  let searchFor = nameImput.value;
  searchFor = searchFor.replace(/\ /g, '+');

  const stores = [
    {
      name: 'Poyerbani',
      url: 'https://www.poyerbani.pl/',
      searchUrl: 'https://www.poyerbani.pl/search.php?text=',
    },
    {
      name: 'MateMundo',
      url: 'https://www.matemundo.pl/',
      searchUrl: 'https://www.matemundo.pl/search.php?text=',
    },
    {
      name: 'Dobre Ziele',
      url: 'https://dobreziele.pl/',
      searchUrl: 'https://dobreziele.pl/szukaj?k=',
    },
  ];

  stores.forEach(async (store) => {
    if (!currentPage.url.includes(store.url)) {
      const container = document.createElement('p');
      const searchUrl = store.searchUrl + searchFor;

      try {
        const response = await fetch(searchUrl);
        const html = await response.text();

        const parser = new DOMParser();
        const htmlPage = parser.parseFromString(html, 'text/html');
        const { productName, productPrice, productUrl } = getProductData(htmlPage, store);

        container.textContent =
          productName + ' ' + productPrice + ' ' + productUrl + '' + searchUrl;
        document.getElementById('productPrice').appendChild(container);
      } catch (error) {
        console.error(error.message);
        // todo: feedback in ui that there was an error
      }
    }
  });
};

const getProductData = (htmlPage, store) => {
  let productPrice =
    htmlPage.querySelector('strong.price')?.textContent ||
    htmlPage.querySelector('div.shop-item span.price')?.textContent ||
    'Add more cases';
  let productName =
    htmlPage.querySelector('.product__name')?.textContent ||
    htmlPage.querySelector('div.shop-item a')?.getAttribute('title') ||
    'Add more cases';
  let productUrl =
    htmlPage.querySelector('a.product__name')?.getAttribute('href') ||
    htmlPage.querySelector('div.shop-item a')?.getAttribute('href') ||
    'Add more cases';

  if (productUrl.charAt(0) === '/') {
    productUrl = store.url + productUrl;
  }

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
