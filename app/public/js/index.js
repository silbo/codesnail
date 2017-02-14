/* Buffers automatically when created */
var nSound = new Audio("audio/notify_awais.mp3");
/* Notify sound for the chat */
function notifySound() {
    nSound.play();
}

/* Animations for login forms */
$(function() {
    $('.goto-login').click(function() {
        $('.login-wrapper > form:visible').fadeOut(500);
    });
    $('.goto-forgot').click(function() {
        $('.login-wrapper > form:visible').fadeOut(500);
    });
    $('.goto-signup').click(function() {
        $('.login-wrapper > form:visible').fadeOut(500);
    });
});
