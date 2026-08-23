// ===== КОНФИГУРАЦИЯ GITHUB =====
const GITHUB_CONFIG = {
    owner: 'hakar74',
    repo: 'TLRBLogresKingdom.github.io', // Проверьте точное название репозитория!
    token: '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', // ВСТАВЬТЕ СЮДА НОВЫЙ ТОКЕН С ПРАВАМИ 'repo'
    path: 'data.json'
};

// ===== НАЧАЛЬНЫЕ ДАННЫЕ (ЕСЛИ ФАЙЛ НЕ СУЩЕСТВУЕТ) =====
const INITIAL_DATA = {
    members: [],
    bosses: {
        "daigon": {
            name: "Дайгон",
            items: ["Daigon's Stormblade", "Daigon's Charred Emberstaff"]
        },
        "leviathan": {
            name: "Левиафан",
            items: ["Leviathan's Bloodstorm Longbow", "Leviathan's Bladed Tendrils"]
        },
        "pakilo": {
            name: "Пакило Нару",
            items: ["Spectral Overseer's Tunic"]
        },
        "manticus": {
            name: "Мантикусы",
            items: ["Manticus Fraternal Core"]
        }
    },
    bids: {}, // Структура: { "bossKey": { "itemName": { "playerNick": points } } }
    freezes: [] // Структура: [{ playerNick, reason, date }]
};

// ===== ГЛОБАЛЬНОЕ СОСТОЯНИЕ =====
let appData = null;
let currentUser = null;

// ===== РАБОТА С GITHUB API =====

/**
 * Получает данные из data.json
 */
async function getData() {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 404) {
            console.log('Файл данных не найден. Создаём новый...');
            await saveData(INITIAL_DATA);
            return INITIAL_DATA;
        }

        if (!response.ok) {
            throw new Error(`Ошибка GitHub API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // Декодируем base64 контент
        const content = JSON.parse(atob(data.content));
        return content;
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        throw error;
    }
}

/**
 * Сохраняет данные в data.json
 */
async function saveData(newData) {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
    
    try {
        // Сначала получаем текущий SHA файла
        let sha = '';
        const checkResponse = await fetch(url, {
            headers: { 'Authorization': `token ${GITHUB_CONFIG.token}` }
        });
        
        if (checkResponse.ok) {
            const fileData = await checkResponse.json();
            sha = fileData.sha;
        }

        const contentBase64 = btoa(JSON.stringify(newData, null, 2));

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Обновление данных Logres Kingdom [Auto]',
                content: contentBase64,
                sha: sha
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка сохранения: ${response.status}`);
        }
        
        console.log('Данные успешно сохранены в вечности.');
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении данных:', error);
        alert('Не удалось вписать данные в Книгу Судеб. Проверьте токен и права доступа.');
        throw error;
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

function getBossKeyByName(name) {
    for (const [key, value] of Object.entries(appData.bosses)) {
        if (value.name === name) return key;
    }
    return null;
}

function isFrozen(nick) {
    return appData.freezes.some(f => f.playerNick.toLowerCase() === nick.toLowerCase());
}

// ===== ЭКСПОРТ ДЛЯ СТРАНИЦ =====
window.LogresApp = {
    getData,
    saveData,
    getBossKeyByName,
    isFrozen,
    set currentUser(val) { currentUser = val; },
    get currentUser() { return currentUser; },
    get data() { return appData; },
    set data(val) { appData = val; }
};

console.log('⚔️ Logres Kingdom — Система распределения лута загружена');
