const { PLUGIN_OWNER_ID } = require('./constants');
const DeathMonitor = require('./lib/DeathMonitor');

async function onLoad(bot, { settings }) {
    const log = bot.sendLog;
    const monitor = new DeathMonitor(bot, settings);

    // Обработчик события
    const messageHandler = (rawMessageText) => {
        monitor.handleRawMessage(rawMessageText);
    };

    // Подписываемся на сырые сообщения сервера
    bot.events.on('core:raw_message', messageHandler);

    // Сохраняем ссылку на обработчик для корректной выгрузки
    bot._customDeathHandler = messageHandler;

    log(`[${PLUGIN_OWNER_ID}] Плагин мониторинга смертей загружен.`);
}

async function onUnload({ botId, prisma }) {
    // В BlockMine при выгрузке (удалении) мы должны почистить глобальные переменные, если они были
    // Но так как подписка идет внутри процесса бота, она удалится сама при рестарте процесса.
    // Однако хорошей практикой считается логирование очистки.
    console.log(`[CustomDeath] Очистка ресурсов для бота ${botId}`);
}

module.exports = {
    onLoad,
    onUnload
};