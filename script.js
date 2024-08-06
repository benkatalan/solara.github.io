const WWO_API_KEY = '4684c714b8b449b7a4d175547240508';
let beachesData = [];
let currentLanguage = 'en';
let currentWeatherData = null;

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    setupLanguageSelector();
    setupHamburgerMenu();
    loadBeachesData();
    setupCardPopups();
    loadSurfNews();
});


async function loadBeachesData() {
    try {
        const response = await fetch('beaches.json');
        beachesData = await response.json();
        setupBeachSearch();
    } catch (error) {
        console.error('Error loading beaches data:', error);
        showError(true, 'Failed to load beaches data. Please refresh the page.');
    }
}

function loadSurfNews() {
    const newsItems = [
        "New study shows surfing improves mental health",
        "World Surf League announces 2024 championship tour dates",
        "Top 5 surf spots for beginners revealed",
        "Environmental group launches beach clean-up initiative",
        "Revolutionary eco-friendly surfboard material developed"
    ];

    const newsContainer = document.getElementById('surfNews');
    newsItems.forEach(item => {
        const newsElement = document.createElement('p');
        newsElement.textContent = item;
        newsContainer.appendChild(newsElement);
    });
}

function setupLanguageSelector() {
    const langToggle = document.getElementById('langToggle');
    const langDropdown = document.querySelector('.language-dropdown');
    const langOptions = document.querySelectorAll('.language-option');

    langToggle.addEventListener('click', () => {
        langDropdown.classList.toggle('hidden');
    });

    langOptions.forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.dataset.lang;
            currentLanguage = lang;
            updateLanguage();
            langDropdown.classList.add('hidden');
        });
    });

    document.addEventListener('click', (e) => {
        if (!langToggle.contains(e.target) && !langDropdown.contains(e.target)) {
            langDropdown.classList.add('hidden');
        }
    });
}

function setupHamburgerMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const menu = document.getElementById('menu');

    menuToggle.addEventListener('click', () => {
        menu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!menuToggle.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });
}

function updateLanguage() {
    const currentFlag = document.getElementById('currentFlag');
    currentFlag.src = currentLanguage === 'en' ? 'https://flagcdn.com/w20/gb.png' : 'https://flagcdn.com/w20/il.png';

    document.getElementById('logo').textContent = currentLanguage === 'en' ? 'Surfly.io' : 'סרפלי';
    document.getElementById('beachSearch').placeholder = currentLanguage === 'en' ? 'Search for a beach' : 'חפש חוף';
    document.getElementById('forecastTitle').textContent = currentLanguage === 'en' ? 'Weekly Forecast' : 'תחזית שבועית';

    document.getElementById('homeLink').textContent = currentLanguage === 'en' ? 'Home' : 'בית';
    document.getElementById('aboutLink').textContent = currentLanguage === 'en' ? 'About' : 'אודות';
    document.getElementById('contactLink').textContent = currentLanguage === 'en' ? 'Contact' : 'צור קשר';

    const cardTitles = {
        'Wave Height': 'גובה הגלים',
        'Wind': 'רוח',
        'Air Temp': 'טמפ׳ אוויר',
        'Water Temp': 'טמפ׳ מים'
    };

    document.querySelectorAll('.card h3').forEach(el => {
        el.textContent = currentLanguage === 'en' ? 
            Object.keys(cardTitles).find(key => cardTitles[key] === el.textContent) || el.textContent :
            cardTitles[el.textContent] || el.textContent;
    });

    document.body.dir = currentLanguage === 'en' ? 'ltr' : 'rtl';

    const selectedBeach = document.querySelector('#beachList li.selected');
    if (selectedBeach) {
        fetchData(beachesData[selectedBeach.dataset.index]);
    }
}

function setupBeachSearch() {
    const searchInput = document.getElementById('beachSearch');
    const beachList = document.getElementById('beachList');

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredBeaches = beachesData.filter(beach => 
            beach.name.toLowerCase().includes(searchTerm) ||
            beach.country.toLowerCase().includes(searchTerm)
        );

        renderBeachList(filteredBeaches);
    });

    searchInput.addEventListener('focus', () => {
        beachList.classList.remove('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !beachList.contains(e.target)) {
            beachList.classList.add('hidden');
        }
    });

    renderBeachList(beachesData);
}

function renderBeachList(beaches) {
    const beachList = document.getElementById('beachList');
    beachList.innerHTML = '';
    beaches.forEach((beach,index) => {
        const li = document.createElement('li');
        li.textContent = `${beach.name}, ${beach.country}`;
        li.dataset.index = index;
        li.addEventListener('click', () => selectBeach(beach, index));
        beachList.appendChild(li);
    });
}

function selectBeach(beach, index) {
    const searchInput = document.getElementById('beachSearch');
    const beachList = document.getElementById('beachList');
    searchInput.value = `${beach.name}, ${beach.country}`;
    beachList.classList.add('hidden');
    beachList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
    beachList.children[index].classList.add('selected');
    fetchData(beach);
}

async function fetchData(beach) {
    showLoading(true);
    showError(false);

    try {
        const response = await fetch(`https://api.worldweatheronline.com/premium/v1/marine.ashx?key=${WWO_API_KEY}&q=${beach.lat},${beach.lng}&format=json&includelocation=yes&tide=yes`);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        currentWeatherData = data.data.weather[0].hourly[0];
        updateUI(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        showError(true, currentLanguage === 'en' ? 'Failed to fetch surf data. Please try again later.' : 'נכשל בהבאת נתוני הגלישה. אנא נסה שוב מאוחר יותר.');
    } finally {
        showLoading(false);
    }
}

function updateUI(data) {
    const currentCondition = data.data.weather[0].hourly[0];

    document.getElementById('waveHeight').textContent = `${currentCondition.swellHeight_m} m`;
    document.getElementById('windSpeed').textContent = `${currentCondition.windspeedKmph} km/h`;
    document.getElementById('windDirection').textContent = currentCondition.winddir16Point;
    document.getElementById('airTemp').textContent = `${currentCondition.tempC}°C`;
    document.getElementById('waterTemp').textContent = `${currentCondition.waterTemp_C}°C`;

    document.getElementById('currentConditions').classList.remove('hidden');

    updateForecast(data.data.weather);
}

function updateForecast(weatherData) {
    const forecastContainer = document.getElementById('forecast');
    forecastContainer.innerHTML = '';

    weatherData.forEach(day => {
        const dayCard = document.createElement('div');
        dayCard.className = 'card';
        dayCard.innerHTML = `
            <p>${new Date(day.date).toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'he-IL', { weekday: 'short' })}</p>
            <i data-lucide="${getWeatherIcon(day.hourly[4].weatherCode)}" class="icon"></i>
            <p class="data">${day.hourly[4].swellHeight_m} m</p>
            <p class="subdata">${day.hourly[4].tempC}°C</p>
        `;
        forecastContainer.appendChild(dayCard);
    });

    lucide.createIcons();
    document.getElementById('forecastTitle').classList.remove('hidden');
    forecastContainer.classList.remove('hidden');
}

function getWeatherIcon(code) {
    if (code < 300) return 'sun';
    if (code < 600) return 'cloud-rain';
    if (code < 700) return 'cloud-snow';
    return 'cloud';
}

function showLoading(show) {
    // Instead of showing/hiding a loading message, we can add/remove a 'loading' class to the body
    document.body.classList.toggle('loading', show);
    
    // Hide/show the main content
    document.getElementById('currentConditions').classList.toggle('hidden', show);
    document.getElementById('forecast').classList.toggle('hidden', show);
    document.getElementById('forecastTitle').classList.toggle('hidden', show);
}

function showError(show, message = '') {
    const errorElement = document.getElementById('errorMessage');
    errorElement.classList.toggle('hidden', !show);
    errorElement.textContent = message;
}

function setupCardPopups() {
    const cards = document.querySelectorAll('.card');
    const popup = document.getElementById('popup');
    const popupTitle = document.getElementById('popupTitle');
    const popupDescription = document.getElementById('popupDescription');
    const popupDetails = document.getElementById('popupDetails');
    const popupClose = document.getElementById('popupClose');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            const info = getCardInfo(type);
            popupTitle.textContent = info.title;
            popupDescription.textContent = info.description;
            popupDetails.innerHTML = info.details;
            popup.classList.remove('hidden');
            card.classList.add('selected');
        });
    });

    popupClose.addEventListener('click', () => {
        popup.classList.add('hidden');
        document.querySelector('.card.selected')?.classList.remove('selected');
    });

    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.classList.add('hidden');
            document.querySelector('.card.selected')?.classList.remove('selected');
        }
    });
}

function getCardInfo(type) {
    const currentCondition = getCurrentCondition();
    if (!currentCondition) {
        return {
            title: 'No Data',
            description: 'Sorry, no data is currently available.',
            details: '<p>Please try selecting a beach first.</p>'
        };
    }

    switch (type) {
        case 'waveHeight':
            return {
                title: 'Wave Height',
                description: 'The vertical distance between the crest and trough of a wave.',
                details: `
                    <p>Current wave height: ${currentCondition.waveHeight}</p>
                    <p>Swell direction: ${currentCondition.swellDir16Point}</p>
                    <p>Swell period: ${currentCondition.swellPeriod_secs} seconds</p>
                `
            };
        case 'wind':
            return {
                title: 'Wind',
                description: 'The speed and direction of air movement near the water surface.',
                details: `
                    <p>Wind speed: ${currentCondition.windSpeed}</p>
                    <p>Wind direction: ${currentCondition.windDir16Point}</p>
                    <p>Gust speed: ${currentCondition.gust_kph} km/h</p>
                `
            };
        case 'airTemp':
            return {
                title: 'Air Temperature',
                description: 'The temperature of the air near the water surface.',
                details: `
                    <p>Current temperature: ${currentCondition.airTemp}</p>
                    <p>Feels like: ${currentCondition.feelsLikeC}°C</p>
                    <p>Humidity: ${currentCondition.humidity}%</p>
                `
            };
        case 'waterTemp':
            return {
                title: 'Water Temperature',
                description: 'The temperature of the water at the surface.',
                details: `
                    <p>Water temperature: ${currentCondition.waterTemp}</p>
                    <p>Visibility: ${currentCondition.visibility} km</p>
                    <p>Cloud cover: ${currentCondition.cloudcover}%</p>
                `
            };
    }
}

function getCurrentCondition() {
    if (!currentWeatherData) {
        return null;
    }
    return {
        waveHeight: `${currentWeatherData.swellHeight_m} m`,
        swellDir16Point: currentWeatherData.swellDir16Point,
        swellPeriod_secs: currentWeatherData.swellPeriod_secs,
        windSpeed: `${currentWeatherData.windspeedKmph} km/h`,
        windDir16Point: currentWeatherData.winddir16Point,
        gust_kph: currentWeatherData.gust_kph,
        airTemp: `${currentWeatherData.tempC}°C`,
        feelsLikeC: currentWeatherData.FeelsLikeC,
        humidity: currentWeatherData.humidity,
        waterTemp: `${currentWeatherData.waterTemp_C}°C`,
        visibility: currentWeatherData.visibility,
        cloudcover: currentWeatherData.cloudcover
    };
}