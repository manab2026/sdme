(function () {
    const MAX_WPM = 120;
    const FORM_FIELD_IDS = [
        "studentName",
        "mobileNo",
        "enrollmentDate",
        "batchYear",
        "enrollmentNo"
    ];

    let startTime = null;
    let typedCharacters = 0;
    let lastLengths = {};

    function getFieldValueLength(field) {
        return String(field.value || "").length;
    }

    function getFields() {
        return FORM_FIELD_IDS
            .map(id => document.getElementById(id))
            .filter(Boolean);
    }

    function cacheFieldLengths() {
        lastLengths = {};

        getFields().forEach(field => {
            lastLengths[field.id] = getFieldValueLength(field);
        });
    }

    function calculateWpm() {
        if (!startTime) return 0;

        const elapsedMinutes =
            (Date.now() - startTime) / 60000;

        if (elapsedMinutes <= 0) return 0;

        return Math.round((typedCharacters / 5) / elapsedMinutes);
    }

    function setGauge(wpm) {
        const value =
            document.getElementById("typingSpeedValue");

        const chars =
            document.getElementById("typingCharCount");

        const needle =
            document.getElementById("needle");

        const readout =
            document.getElementById("mi-km");

        if (value) {
            value.innerText = wpm;
        }

        if (chars) {
            chars.innerText = `${typedCharacters} chars`;
        }

        if (readout) {
            readout.innerText = `${wpm} WPM`;
        }

        if (needle) {
            const cappedSpeed =
                Math.min(Math.max(wpm, 0), MAX_WPM);

            const rotation =
                150 + (cappedSpeed / MAX_WPM) * 240;

            if (window.TweenLite) {
                window.TweenLite.to(needle, 0.35, {
                    rotation,
                    ease: window.Power2 ? window.Power2.easeOut : undefined
                });
            }
            else {
                needle.style.transform =
                    `rotate(${rotation}deg)`;
            }
        }
    }

    function resetTypingSpeed() {
        startTime = null;
        typedCharacters = 0;
        cacheFieldLengths();
        setGauge(0);
    }

    function updateTypingSpeed(event) {
        const field = event.currentTarget;
        const previousLength =
            lastLengths[field.id] || 0;

        const currentLength =
            getFieldValueLength(field);

        const addedCharacters =
            Math.max(currentLength - previousLength, 0);

        lastLengths[field.id] = currentLength;

        if (addedCharacters === 0) {
            setGauge(calculateWpm());
            return;
        }

        if (!startTime) {
            startTime = Date.now();
        }

        typedCharacters += addedCharacters;
        setGauge(calculateWpm());
    }

    function watchFormFields() {
        getFields().forEach(field => {
            field.addEventListener("input", updateTypingSpeed);
            field.addEventListener("change", updateTypingSpeed);
        });
    }

    function wrapFormHelpers() {
        if (typeof window.clearForm === "function") {
            const originalClearForm = window.clearForm;

            window.clearForm = function () {
                const result =
                    originalClearForm.apply(this, arguments);

                resetTypingSpeed();

                return result;
            };
        }

        if (typeof window.editStudent === "function") {
            const originalEditStudent = window.editStudent;

            window.editStudent = function () {
                const result =
                    originalEditStudent.apply(this, arguments);

                resetTypingSpeed();

                return result;
            };
        }
    }

    function initTypingSpeedometer() {
        cacheFieldLengths();
        watchFormFields();
        wrapFormHelpers();
        setGauge(0);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initTypingSpeedometer);
    }
    else {
        initTypingSpeedometer();
    }
})();
