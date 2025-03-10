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
      } else {
        createErrorElement();
      }
    });
  });
};

const fetchSimilar = async () => {
  document.querySelector('.fetched').innerHTML = '';

  const spinner = document.querySelector('.spinner-container');
  spinner.style.display = 'flex';

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

  const promises = stores.map(async (store) => {
    if (!currentPage.url.includes(store.url)) {
      const searchUrl = store.searchUrl + searchFor;

      try {
        const response = await fetch(searchUrl);
        const html = await response.text();

        const parser = new DOMParser();
        const htmlPage = parser.parseFromString(html, 'text/html');
        const product = getProductData(htmlPage, store);

        createProductElement(product);

        // container.textContent =
        //   productName + ' ' + productPrice + ' ' + productUrl + '' + searchUrl;
        // document.getElementById('productPrice').appendChild(container);
      } catch (error) {
        console.error(error.message);
        // todo: feedback in ui that there was an error
      }
    }
  });

  Promise.all(promises).then(() => {
    spinner.style.display = 'none';
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

  const product = {
    storeName: store.name,
    name: productName,
    price: productPrice,
    url: productUrl,
  };

  return product;
};

const createProductElement = (item) => {
  const fetchedDiv = document.querySelector('.fetched');

  const container = document.createElement('div');
  const infoContainer = document.createElement('div');
  const productStoreName = document.createElement('p');
  const productName = document.createElement('h2');
  const productUrl = document.createElement('a');
  const productPrice = document.createElement('p');
  const hr = document.createElement('hr');

  container.className = 'product-container';
  productStoreName.className = 'product-store-name';
  productUrl.className = 'product-url';
  productPrice.className = 'product-price';
  hr.className = 'h-line';

  if (item.price > currentPage.productPrice) {
    productPrice.classList.add('price-high');
  } else {
    productPrice.classList.add('price-low');
  }

  productUrl.href = item.url;
  productUrl.target = '_blank';
  productUrl.textContent = item.name;

  productStoreName.textContent = item.storeName;
  productPrice.textContent = item.price;

  productName.appendChild(productUrl);
  infoContainer.append(productStoreName, productName);
  container.append(infoContainer, productPrice);

  fetchedDiv.append(container, hr);
};

const createErrorElement = () => {
  const fetchedDiv = document.querySelector('.fetched');

  const errorContainer = document.createElement('div');
  const error = document.createElement('h2');
  const message = document.createElement('p');

  errorContainer.className = 'error-container';
  error.className = 'error';
  message.className = 'error-submessage';

  error.textContent = 'There was an error while trying to extract the data.';
  message.textContent = 'Please refresh and try again or check if you are on supported website.';

  errorContainer.append(error, message);
  fetchedDiv.appendChild(errorContainer);
};
