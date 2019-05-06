var timer;
var startTime;

function startTimer() {
  startTime = parseInt(localStorage.getItem('startTime') || Date.now());
  localStorage.setItem('startTime', startTime);
  timer = setInterval(clockTick, 100);
}

function stopTimer() {
  clearInterval(timer);
  reset();
}

function reset() {
  clearInterval(timer);
  localStorage.clear();
}

function clockTick() {
  var currentTime = Date.now(),
    timeElapsed = new Date(currentTime - startTime),
    hours = timeElapsed.getUTCHours(),
    mins = timeElapsed.getUTCMinutes(),
    secs = timeElapsed.getUTCSeconds(),
    display = document.getElementById("span-time");

  display.innerHTML =
    (hours > 9 ? hours : "0" + hours) + ":" +
    (mins > 9 ? mins : "0" + mins) + ":" +
    (secs > 9 ? secs : "0" + secs);
}
