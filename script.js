// ===== КОНФИГУРАЦИЯ GITHUB API =====
// ЗАМЕНИТЕ ЭТИ ЗНАЧЕНИЯ НА СВОИ ПОСЛЕ СОЗДАНИЯ РЕПОЗИТОРИЯ
const REPO_OWNER = 'hakar74'; // Ваш логин на GitHub
const REPO_NAME = 'TLRBLogresKingdom.github.io';   // Имя репозитория
const GITHUB_TOKEN = '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';  // Ваш Personal Access Token с правами repo
const BRANCH_NAME = 'main';                // Имя основной ветки (main или master)

// Путь к файлу данных
const DATA_PATH = 'data.json';

// ===== НАЧАЛЬНЫЕ ДАННЫЕ =====
const INITIAL_DATA = {
    members: [], // Список ников участников
    bosses: {
        daigon: {
            name: 'Дайгон',
            items: [
                "Daigon's Stormblade",
                "Daigon's Charred Emberstaff"
            ]
        },
        leviathan: {
            name: 'Левиафан',
            items: [
                "Leviathan's Bloodstorm Longbow",
                "Leviathan's Bladed Tendrils"
            ]
        },
        pakilo: {
            name: 'Пакило Нару',
            items: [
                "Spectral Overseer's Tunic"
            ]
        },
        manticus: {
            name: 'Мантикусы',
            items: [
                "Manticus Fraternal Core"
            ]
        }
    },
    bids: {}, // Заявки: { itemId: { memberNick: points } }
    freezes: [] // Замороженные участники: [memberNick]
};

// ===== ФУНКЦИИ ДЛЯ РАБОТЫ С GITHUB API =====

/**
 * Получает данные из data.json через GitHub API
 */
async function getData() {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_PATH}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 404) {
            // Файл не существует - создаём его
            console.log('Файл data.json не найден. Создаём новый...');
            await saveData(INITIAL_DATA);
            return JSON.parse(JSON.stringify(INITIAL_DATA));
        }

        if (!response.ok) {
            throw new Error(`Ошибка GitHub API: ${response.status}`);
        }

        const data = await response.json();
        // Декодируем base64 содержимое
        const content = atob(data.content);
        return JSON.parse(content);
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        alert('⚠️ Ошибка загрузки данных! Проверьте консоль и настройки GitHub API.');
        return null;
    }
}

/**
 * Сохраняет данные в data.json через GitHub API
 */
async function saveData(newData) {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_PATH}`;
        
        // Сначала получаем текущий sha файла
        let sha = '';
        const getResponse = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (getResponse.ok) {
            const getData = await getResponse.json();
            sha = getData.sha;
        }

        // Кодируем данные в base64
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));

        const body = {
            message: 'Обновление данных лоута [автоматически]',
            content: content,
            branch: BRANCH_NAME
        };

        if (sha) {
            body.sha = sha;
        }

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Ошибка сохранения: ${response.status}`);
        }

        console.log('✅ Данные успешно сохранены!');
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении данных:', error);
        alert('⚠️ Ошибка сохранения данных! Проверьте токен и права доступа.');
        return false;
    }
}

/**
 * Показывает пафосное уведомление
 */
function showNotification(message) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

/**
 * Проверяет, является ли пользователь админом (простая проверка по нику)
 */
function isAdmin(nick) {
    // Можно расширить список админов
    const adminNicks = ['Admin', 'GuildMaster', 'Leader'];
    return adminNicks.includes(nick);
}

/**
 * Проверяет, заморожен ли участник
 */
function isFrozen(nick, freezes) {
    return freezes.some(f => f.toLowerCase() === nick.toLowerCase());
}

/**
 * Получает очки участника для предмета
 */
function getBidForItem(bids, itemId, memberNick) {
    if (!bids[itemId]) return 0;
    return bids[itemId][memberNick] || 0;
}

/**
 * Устанавливает очки участника для предмета
 */
function setBidForItem(bids, itemId, memberNick, points) {
    if (!bids[itemId]) bids[itemId] = {};
    if (points > 0) {
        bids[itemId][memberNick] = points;
    } else {
        delete bids[itemId][memberNick];
    }
}

/**
 * Сортирует участников по очкам для предмета
 */
function getSortedQueue(bids, itemId, members, freezes) {
    const itemBids = bids[itemId] || {};
    
    // Создаём массив с очками
    const scored = members.map(nick => ({
        nick: nick,
        points: itemBids[nick] || 0,
        frozen: isFrozen(nick, freezes)
    }));

    // Сортируем: сначала не замороженные по убыванию очков, потом замороженные
    scored.sort((a, b) => {
        if (a.frozen && !b.frozen) return 1;
        if (!a.frozen && b.frozen) return -1;
        return b.points - a.points;
    });

    return scored;
}

// Экспорт функций для использования на других страницах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getData,
        saveData,
        showNotification,
        isAdmin,
        isFrozen,
        getBidForItem,
        setBidForItem,
        getSortedQueue,
        INITIAL_DATA
    };
}

console.log('⚔️ Logres Kingdom — Система распределения лута загружена');
