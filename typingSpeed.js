// typingSpeed.js

let typingStartTime = null;

function updateTypingSpeed(wpm, chars = 0){

    const maxSpeed = 120;

    const speed =
        Math.min(wpm, maxSpeed);

    document.getElementById(
        "typingSpeedValue"
    ).innerText = speed;

    document.getElementById(
        "typingCharCount"
    ).innerText = chars;

    const degree =
        -120 + (speed / maxSpeed) * 240;

    TweenLite.to("#needle", 0.4, {
        rotation: degree
    });

    const circumference = 315;

    const offset =
        circumference -
        (speed / maxSpeed) * circumference;

    document.getElementById(
        "gaugeProgress"
    ).style.strokeDashoffset = offset;
}


function startTypingTracker(inputIds = []){

    inputIds.forEach(id => {

        const input =
            document.getElementById(id);

        if(!input) return;

        input.addEventListener("input", () => {

            if(!typingStartTime){

                typingStartTime = Date.now();
            }

            let totalText = "";

            inputIds.forEach(fieldId => {

                const field =
                    document.getElementById(fieldId);

                if(field){

                    totalText +=
                        " " + field.value;
                }
            });

            const chars =
                totalText.length;

            const words =
                totalText
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .length;

            const minutes =
                (Date.now() - typingStartTime)
                / 1000 / 60;

            const wpm =
                minutes > 0
                ? Math.round(words / minutes)
                : 0;

            updateTypingSpeed(wpm, chars);
        });
    });
}