const nameImput = document.querySelector('#nameInput');
const searchButton = document.querySelector('#searchButton');
const contentContainer = document.querySelector('.content-container');
const searchedContent = document.querySelector('#searchedContent');
const tabContent = document.querySelectorAll('.tab-content');
const tabLinks = document.querySelectorAll('.tab-links');

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

let currentPage;
let history = [];

const extractPageData = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'extractPageData' }, (response) => {
      if (response) {
        nameImput.disabled = false;
        searchButton.disabled = false;
        tabLinks[1].disabled = false;

        nameImput.value = response.productName;
        currentPage = response;
      } else {
        tabLinks[1].disabled = true;
        // createErrorElement();
      }
    });
  });
};

const fetchSimilarProducts = async () => {
  searchedContent.innerHTML = '';
  contentContainer.style.display = 'none';

  const spinner = document.querySelector('.spinner-container');
  spinner.style.display = 'flex';

  let searchFor = nameImput.value;
  searchFor = searchFor.replace(/\ /g, '+');

  clearHistory();

  const promises = stores.map(async (store) => {
    if (!currentPage.url.includes(store.url)) {
      const searchUrl = store.searchUrl + searchFor;

      try {
        const response = await fetch(searchUrl);
        const html = await response.text();

        const parser = new DOMParser();
        const htmlPage = parser.parseFromString(html, 'text/html');
        const product = getProductData(htmlPage, store);

        saveHistory(product);
        const items = createProductElement(product, true);
        searchedContent.append(...items);
      } catch (error) {
        console.error(error.message);
        // todo: feedback in ui that there was an error
      }
    }
  });

  Promise.all(promises).then(() => {
    spinner.style.display = 'none';
    contentContainer.style.display = 'flex';
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

const createProductElement = (item, priceColor) => {
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

  if (item.price > currentPage?.productPrice && priceColor) {
    productPrice.classList.add('price-high');
  } else if (item.price < currentPage?.productPrice && priceColor) {
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

  return [container, hr];
};

const createErrorElement = () => {
  contentContainer.innerHTML = ' ';

  const errorContainer = document.createElement('div');
  const error = document.createElement('h2');
  const message = document.createElement('p');

  errorContainer.className = 'error-container';
  error.className = 'error';
  message.className = 'error-submessage';

  error.textContent = 'There was an error while trying to extract the data.';
  message.textContent = 'Please refresh and try again or check if you are on supported website.';

  errorContainer.append(error, message);
  contentContainer.appendChild(errorContainer);
};

const fetchHistory = (callback) => {
  history = [];

  chrome.storage.sync.get(['history']).then((result) => {
    if (result.history !== undefined) {
      history.push(...result.history);
    }
    callback();
  });
};

const saveHistory = (product) => {
  chrome.storage.sync.get('history', (result) => {
    const currentHistory = result.history || [];

    const updated = [...currentHistory, product];

    chrome.storage.sync.set({ history: updated }).then(() => {
      history.push(product);
    });
  });
};

const clearHistory = () => {
  chrome.storage.sync.clear();
  history = [];
};

const createHistoryElement = (tabIndex) => {
  history.forEach((element) => {
    const product = createProductElement(element);
    tabContent[tabIndex].append(...product);
  });
};

const createAboutElement = (tabIndex) => {
  tabContent[tabIndex].innerHTML = '';

  const topText = document.createElement('h2');
  topText.textContent = 'Supported stores:';
  const list = document.createElement('ul');

  stores.forEach((store) => {
    const listItem = document.createElement('li');
    const link = document.createElement('a');

    link.href = store.url;
    link.target = '_blank';
    link.textContent = store.name;

    listItem.append(link);
    list.append(listItem);
  });

  tabContent[tabIndex].append(topText, list);
};

const changeTab = (id) => {
  searchedContent.innerHTML = '';
  let currentTabIndex;

  for (let i = 0; i < tabLinks.length; i++) {
    if (tabLinks[i].id === id) {
      tabLinks[i].classList.add('active');
      tabContent[i].style.display = 'flex';
      currentTabIndex = i;
    } else {
      tabLinks[i].classList.remove('active');
      tabContent[i].style.display = 'none';
    }
  }

  switch (id) {
    case 'showSearch':
      fetchSimilarProducts();
      break;
    case 'showHistory':
      tabContent[currentTabIndex].innerHTML = `<h2>Last search</h2>`;
      fetchHistory(() => {
        createHistoryElement(currentTabIndex);
      });
      break;
    case 'showAbout':
      createAboutElement(currentTabIndex);
      break;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#extractButton').addEventListener('click', extractPageData);
  document.querySelector('#searchButton').addEventListener('click', fetchSimilarProducts);

  document.querySelector('#showHistory').addEventListener('click', () => {
    changeTab('showHistory');
  });

  document.querySelector('#showSearch').addEventListener('click', () => {
    changeTab('showSearch');
  });

  document.querySelector('#showAbout').addEventListener('click', () => {
    changeTab('showAbout');
  });

  extractPageData();
  document.querySelector('#showHistory').click();
});
