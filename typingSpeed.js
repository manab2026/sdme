// typingSpeed.js

let typingStartTime = null;

function updateTypingSpeed(wpm, chars = 0){

    const maxSpeed = 100;

    const speed =
        Math.min(wpm, maxSpeed);

    document.getElementById(
        "typingSpeedValue"
    ).innerText = speed;

    const gaugeWpm =
        document.getElementById("gaugeWpmValue");

    if (gaugeWpm) {

        gaugeWpm.innerText = speed;
    }

    document.getElementById(
        "typingCharCount"
    ).innerText = `${chars} chars`;

    const degree =
        -135 + (speed / maxSpeed) * 270;

    const needle =
        document.getElementById("needle");

    if (needle) {

        needle.style.transform =
            `rotate(${degree}deg)`;
    }

    const progress =
        document.getElementById("gaugeProgress");

    if (progress) {

        const arcLength = 239;

        progress.style.strokeDashoffset =
            arcLength - (speed / maxSpeed) * arcLength;
    }
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
