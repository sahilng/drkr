function show(enabled) {
    document.body.classList.toggle('state-on', enabled === true);
    document.body.classList.toggle('state-off', enabled === false);
}
function showError(message) {
    const error = document.getElementById('error');
    error.textContent = message;
    error.hidden = false;
}
document.querySelector('.open-preferences').addEventListener('click', () => {
    webkit.messageHandlers.controller.postMessage('open-preferences');
});
