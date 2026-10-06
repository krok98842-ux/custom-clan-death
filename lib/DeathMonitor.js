class DeathMonitor {
    constructor(bot, settings) {
        this.bot = bot;
        this.settings = settings;
        this.log = bot.sendLog;
        
        // Очищаем паттерны и компилируем их
        this.patterns = (settings.deathPatterns || []).map(p => {
            // Убираем ^ если он есть, чтобы ловить ник в середине строки
            const cleanPattern = p.startsWith('^') ? p.substring(1) : p;
            return new RegExp(cleanPattern, 'i');
        });
    }

    _stripFormatting(text) {
        // Очистка от параграфов и странных символов, которые мешают Regex
        return text.replace(/§./g, '').replace(/[^\x00-\x7Fа-яА-ЯёЁ]/g, ' ').trim();
    }

    handleRawMessage(rawText) {
        if (!rawText || rawText.length < 3) return;

        const cleanText = this._stripFormatting(rawText);
        
        // DEBUG: Раскомментируй строку ниже, если хочешь видеть ВООБЩЕ ВСЁ, что видит бот
        // this.log(`[DeathDebug] Вижу строку: ${cleanText}`);

        let detectedUsername = null;

        for (const regex of this.patterns) {
            const match = cleanText.match(regex);
            if (match && match[1]) {
                detectedUsername = match[1].trim();
                // На некоторых серверах в ник попадают лишние символы
                detectedUsername = detectedUsername.split(' ')[0]; 
                break;
            }
        }

        if (detectedUsername) {
            this._processDeath(detectedUsername);
        }
    }

    _processDeath(username) {
        const customMessages = this.settings.customMessages || {};
        const ignoreCase = this.settings.ignoreCase ?? true;

        let messageTemplate = null;

        // Поиск сообщения для ника
        if (ignoreCase) {
            const lowerUsername = username.toLowerCase();
            const foundKey = Object.keys(customMessages).find(k => k.toLowerCase() === lowerUsername);
            if (foundKey) messageTemplate = customMessages[foundKey];
        } else {
            messageTemplate = customMessages[username];
        }

        if (messageTemplate) {
            const finalMessage = messageTemplate.replace(/{user}/g, username);
            
            // Пробуем отправить в клан
            // Если плагин parser-keksik не загружен, 'clan' может не сработать.
            try {
                this.bot.api.sendMessage('clan', finalMessage);
                this.log(`[CustomDeath] Умер ${username}. Отправлено в клан: ${finalMessage}`);
            } catch (e) {
                this.log(`[CustomDeath] Ошибка отправки: ${e.message}`, 'error');
            }
        }
    }
}

module.exports = DeathMonitor;