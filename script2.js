const API_URL = "https://script.google.com/macros/s/AKfycby4faax5wrl4ScBqO6I9q8guYBdTUKFN2o-mq8Pt_yngg_97eA6qvyU5fYY_mb9jF28og/exec";
const ENROLLMENT_LOOKUP_URL = "https://script.google.com/macros/s/AKfycbw5i7hJ2hHthyMdhk-lsq_HhDA7ai1xW17V_01JpVv_WeMnDMBJbeH8Dw6HUAh8nSVnsw/exec";
const MIN_NAME_LOOKUP_SEARCH_LENGTH = 3;
const MOBILE_LOOKUP_DIGIT_LENGTH = 10;
const STUDENT_LOOKUP_DELAY = 400;
const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
];

let students = [];
let filteredStudents = [];

let currentPage = 1;
const rowsPerPage = 10;

let editMode = false;
let studentLookupTimer = null;
let lastStudentLookupValue = "";
let enrollmentLookupBy = "mobileNo";


/* LOAD STUDENTS */

async function loadStudents() {

    try {

        console.log("STEP 1");

        const res = await fetch(API_URL);

        console.log("STEP 2");

        const text = await res.text();

        console.log("STEP 3", text);

        const data = JSON.parse(text);

        console.log("STEP 4", data);

        students = sortStudentsDescending(data);

        console.log("STEP 5");

        filteredStudents = [...students];

        console.log("STEP 6");

        updateDashboard();

        console.log("STEP 7");

        populateCourseFilter();

        console.log("STEP 8");

        renderTable();

        console.log("STEP 9 SUCCESS");

    }

    catch (error) {

        console.error("FULL ERROR:", error);

        alert(error.message);

        showToast("Error loading data", true);
    }
}


/* SAVE OR UPDATE */

function formatStudentName(value) {

    return value
        .toLowerCase()
        .replace(/\b[a-z]/g, letter => letter.toUpperCase());
}

function handleStudentNameInput() {

    const input =
        document.getElementById("studentName");

    const cursorPosition =
        input.selectionStart;

    input.value =
        formatStudentName(input.value);

    input.setSelectionRange(cursorPosition, cursorPosition);

    handleEnrollmentLookup("studentName");
}

function validateMobileNumber() {

    const input =
        document.getElementById("mobileNo");

    const error =
        document.getElementById("mobileError");

    const isInvalid =
        input.value.replace(/\D/g, "").length > 10;

    input.classList.toggle("border-red-500", isInvalid);
    input.classList.toggle("focus:ring-red-500", isInvalid);
    input.classList.toggle("border-gray-300", !isInvalid);

    if (error) {

        error.innerText =
            isInvalid ? "Mobile number must be 10 digits only" : "";
    }

    return !isInvalid;
}

function handleMobileInput() {

    validateMobileNumber();

    handleEnrollmentLookup("mobileNo");
}

async function saveStudent() {

    showLoader(true);

    const rowId =
        document.getElementById("rowId").value;

    const studentName =
        document.getElementById("studentName").value.trim();

    const mobileNo =
        document.getElementById("mobileNo").value.trim();

    const enrollmentDate =
        normalizeEnrollmentDate(
            document.getElementById("enrollmentDate").value
        );

    const courseName =
        document.getElementById("courseName").value;

    const batchMonth =
        document.getElementById("batchMonth").value;

    const batchYear =
        document.getElementById("batchYear").value;

    const enrollmentNo =
        document.getElementById("enrollmentNo").value.trim();


    if (!validateMobileNumber()) {

        showLoader(false);

        showToast("Mobile number must be 10 digits only", true);

        return;
    }


    if (!studentName || !enrollmentDate || !courseName) {

        showLoader(false);

        showToast("Please fill required fields and date as DD-MM-YYYY", true);

        return;
    }


    try {

        const formData = new FormData();

        formData.append(
            "action",
            editMode ? "update" : "add"
        );

        formData.append("rowId", rowId);

        formData.append("studentName", studentName);

        formData.append("mobileNo", mobileNo);

        formData.append("enrollmentNo", enrollmentNo);

        formData.append("enrollmentDate", enrollmentDate);

        formData.append("courseName", courseName);

        formData.append("batchMonth", batchMonth);

        formData.append("batchYear", batchYear);


        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            body: formData
        });


        clearForm();

        setTimeout(() => {

            loadStudents();

            showLoader(false);

            showToast(
                editMode
                    ? "Student Updated Successfully"
                    : "Student Added Successfully"
            );

            editMode = false;

            document.getElementById("saveBtn").innerText =
                "Save Student";

            document.getElementById("formMode").innerText =
                "Add Student";

            // AUTO FOCUS
            document.getElementById("studentName").focus();

        }, 1000);

    }

    catch (error) {

        console.error(error);

        showLoader(false);

        showToast("Error Saving Student", true);
    }
}


/* EDIT */

function editStudent(index) {

    const student = filteredStudents[index];

    editMode = true;

    document.getElementById("formMode").innerText =
        "Edit Student";

    document.getElementById("saveBtn").innerText =
        "Update Student";


    document.getElementById("rowId").value =
        student["Row ID"] || "";

    document.getElementById("studentName").value =
        student["Student Name"] || "";

    document.getElementById("mobileNo").value =
        student["Mobile No"] || "";

    document.getElementById("enrollmentNo").value =
        student["Enrollment No"] || "";

    document.getElementById("enrollmentDate").value =
        formatInputDate(student["Enrollment Date"]);

    document.getElementById("courseName").value =
        student["Course Name"] || "";

    document.getElementById("batchMonth").value =
        student["Batch Month"] || "";

    document.getElementById("batchYear").value =
        student["Batch Year"] || "";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* DELETE */

async function deleteStudent(rowId) {

    console.log("DELETE ROW ID:", rowId);

    if (!confirm("Delete this student?")) {
        return;
    }

    try {

        const formData = new FormData();

        formData.append("action", "delete");

        formData.append("rowId", rowId);

        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            body: formData
        });

        showToast("Student Deleted");

        setTimeout(() => {

            loadStudents();

        }, 1000);

    }

    catch (error) {

        console.error(error);

        showToast("Delete Failed", true);
    }
}


/* RENDER TABLE */

function renderTable(data = filteredStudents) {

    const table =
        document.getElementById("studentTable");

    table.innerHTML = "";


    const start =
        (currentPage - 1) * rowsPerPage;

    const end =
        start + rowsPerPage;

    const paginatedData =
        data.slice(start, end);


    paginatedData.forEach((student, index) => {

        table.innerHTML += `

        <tr class="border-b hover:bg-gray-50 transition">

            <td class="p-3">
                ${student["SL No"] || ""}
            </td>

            <td class="p-3 font-medium">
                ${student["Student Name"] || ""}
            </td>

            <td class="p-3">
                ${student["Mobile No"] || ""}
            </td>

            <td class="p-3">
                ${student["Enrollment No"] || ""}
            </td>

            <td class="p-3">
                ${student["Course Name"] || ""}
            </td>

            <td class="p-3">
                ${student["Batch Month"] || ""}
                ${student["Batch Year"] || ""}
            </td>

            <td class="p-3">
                ${formatDate(student["Enrollment Date"])}
            </td>

            <td class="p-3 flex gap-2">

                <button
                    onclick="editStudent(${start + index})"
                    class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">

                    Edit

                </button>

                <button
                    onclick="deleteStudent('${student["Row ID"] || ""}')"
                    class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs">

                    Delete

                </button>

            </td>

        </tr>

        `;
    });


    document.getElementById("pageNumber").innerText =
        currentPage;

    applyTheme(
        document.body.classList.contains("bg-gray-900")
    );
}


/* SEARCH */

function searchStudent() {

    const search =
        document.getElementById("search")
        .value
        .toLowerCase();

    filteredStudents = students.filter(student => {

        return (

            (student["Student Name"] || "")
            .toLowerCase()
            .includes(search)
        );
    });

    currentPage = 1;

    renderTable();
}


/* SORTING */

function sortStudentsDescending(data) {

    return [...data].sort((a, b) => {

        const rowA =
            Number(a["Row ID"] || a["SL No"] || 0);

        const rowB =
            Number(b["Row ID"] || b["SL No"] || 0);

        if (rowA || rowB) {

            return rowB - rowA;
        }

        return getDateTime(b["Enrollment Date"])
            - getDateTime(a["Enrollment Date"]);
    });
}


/* ENROLLMENT DATE */

function parseEnrollmentDate(dateString) {

    if (!dateString) return null;

    const value =
        String(dateString).trim();

    const ddmmyyyy =
        value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);

    if (ddmmyyyy) {

        const day =
            Number(ddmmyyyy[1]);

        const month =
            Number(ddmmyyyy[2]);

        const year =
            Number(ddmmyyyy[3]);

        const date =
            new Date(year, month - 1, day);

        if (
            date.getFullYear() === year
            && date.getMonth() === month - 1
            && date.getDate() === day
        ) {

            return date;
        }
    }

    const yyyymmdd =
        value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

    if (yyyymmdd) {

        const year =
            Number(yyyymmdd[1]);

        const month =
            Number(yyyymmdd[2]);

        const day =
            Number(yyyymmdd[3]);

        const date =
            new Date(year, month - 1, day);

        if (
            date.getFullYear() === year
            && date.getMonth() === month - 1
            && date.getDate() === day
        ) {

            return date;
        }
    }

    const parsedDate =
        new Date(value);

    if (!Number.isNaN(parsedDate.getTime())) {

        return parsedDate;
    }

    return null;
}

function getDateTime(dateString) {

    const date =
        parseEnrollmentDate(dateString);

    return date ? date.getTime() : 0;
}

function normalizeEnrollmentDate(dateString) {

    const date =
        parseEnrollmentDate(dateString);

    if (!date) return "";

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1).padStart(2, "0");

    const day =
        String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function handleEnrollmentDateChange() {

    const date =
        parseEnrollmentDate(
            document.getElementById("enrollmentDate").value
        );

    if (!date) {

        return;
    }

    document.getElementById("batchMonth").value =
        MONTH_NAMES[date.getMonth()];
}


/* STUDENT ENROLLMENT LOOKUP */

function normalizeLookupValue(value) {

    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function setStudentLookupStatus(message, error = false) {

    const status =
        document.getElementById("studentLookupStatus");

    if (!status) return;

    status.innerText = message;

    status.classList.toggle("text-red-500", error);
    status.classList.toggle("text-gray-500", !error);
}

function setEnrollmentLookupBy(value) {

    enrollmentLookupBy = value;

    lastStudentLookupValue = "";

    setStudentLookupStatus("");

    handleEnrollmentLookup(value);
}

function handleEnrollmentLookup(fieldName) {

    if (fieldName !== enrollmentLookupBy) {

        return;
    }

    clearTimeout(studentLookupTimer);

    const lookupValue =
        document.getElementById(fieldName).value.trim();

    const courseShortName =
        getSelectedCourseShortName();

    if (fieldName === "mobileNo") {

        const mobileDigits =
            lookupValue.replace(/\D/g, "");

        if (mobileDigits.length < MOBILE_LOOKUP_DIGIT_LENGTH) {

            setStudentLookupStatus("");

            return;
        }

        if (!courseShortName) {

            setStudentLookupStatus("Select course to search enrollment");

            return;
        }
    }

    else if (lookupValue.length < MIN_NAME_LOOKUP_SEARCH_LENGTH) {

        setStudentLookupStatus("");

        return;
    }

    studentLookupTimer =
        setTimeout(() => {

            lookupEnrollment(fieldName, lookupValue, courseShortName);

        }, STUDENT_LOOKUP_DELAY);
}

function getSelectedCourseShortName() {

    const courseField =
        document.getElementById("courseName");

    const selectedOption =
        courseField.options[courseField.selectedIndex];

    return selectedOption && selectedOption.value
        ? selectedOption.text.trim()
        : "";
}

async function lookupEnrollment(fieldName, lookupValue, courseShortName = "") {

    if (!ENROLLMENT_LOOKUP_URL) {

        setStudentLookupStatus(
            "Add lookup Google Apps Script URL in script2.js"
        );

        return;
    }

    const normalizedLookupValue =
        `${fieldName}:${normalizeLookupValue(lookupValue)}:${normalizeLookupValue(courseShortName)}`;

    if (normalizedLookupValue === lastStudentLookupValue) {

        return;
    }

    lastStudentLookupValue = normalizedLookupValue;

    try {

        setStudentLookupStatus("Searching...");

        const lookupUrl =
            `${ENROLLMENT_LOOKUP_URL}?action=lookupEnrollment&lookupBy=${encodeURIComponent(fieldName)}&lookupValue=${encodeURIComponent(lookupValue)}&courseName=${encodeURIComponent(courseShortName)}`;

        const res =
            await fetch(lookupUrl);

        const data =
            await res.json();

        if (!data || !data.found) {

            setStudentLookupStatus("No matching enrollment found");

            return;
        }

        document.getElementById("enrollmentNo").value =
            data.enrollmentNo || "";

        if (
            data.mobileNo
            && fieldName !== "mobileNo"
            && !document.getElementById("mobileNo").value.trim()
        ) {

            document.getElementById("mobileNo").value =
                data.mobileNo;
        }

        if (
            data.studentName
            && fieldName !== "studentName"
            && !document.getElementById("studentName").value.trim()
        ) {

            document.getElementById("studentName").value =
                data.studentName;
        }

        setStudentLookupStatus("Enrollment found");

    }

    catch (error) {

        console.error(error);

        setStudentLookupStatus("Enrollment lookup failed", true);
    }
}


/* COURSE FILTER */

function filterByCourse() {

    const filter =
        document.getElementById("courseFilter");

    if (!filter) return;

    const course =
        filter.value;

    if (!course) {

        filteredStudents = [...students];
    }

    else {

        filteredStudents = students.filter(student =>

            student["Course Name"] === course
        );
    }

    currentPage = 1;

    renderTable();
}


/* POPULATE FILTER */

function populateCourseFilter() {

    const filter =
        document.getElementById("courseFilter");

    if (!filter) return;

    const uniqueCourses = [

        ...new Set(

            students.map(
                s => s["Course Name"]
            )
        )
    ];


    filter.innerHTML =
        `<option value="">All Courses</option>`;


    uniqueCourses.forEach(course => {

        filter.innerHTML += `

            <option value="${course}">
                ${course}
            </option>

        `;
    });
}


/* PAGINATION */

function nextPage() {

    const totalPages =
        Math.ceil(filteredStudents.length / rowsPerPage);

    if (currentPage < totalPages) {

        currentPage++;

        renderTable();
    }
}

function prevPage() {

    if (currentPage > 1) {

        currentPage--;

        renderTable();
    }
}


/* DASHBOARD */

function updateDashboard() {

    const studentCount =
        document.getElementById("studentCount");

    if (studentCount) {

        studentCount.innerText =
            String(students.length).padStart(2, "0");
    }

    const courses = [

        ...new Set(

            students.map(
                s => s["Course Name"]
            )
        )
    ];

    const courseCount =
        document.getElementById("courseCount");

    if (courseCount) {

        courseCount.innerText =
            courses.length;
    }
}


/* EXPORT EXCEL */

function exportExcel() {

    const table =
        document.getElementById("studentTableExcel");

    const workbook =
        XLSX.utils.table_to_book(table, {
            sheet: "Students"
        });

    XLSX.writeFile(
        workbook,
        "Student_Data.xlsx"
    );
}


/* CLEAR FORM */

function clearForm() {

    document.getElementById("rowId").value = "";

    document.getElementById("studentName").value = "";

    document.getElementById("mobileNo").value = "";

    validateMobileNumber();

    document.getElementById("enrollmentDate").value = "";

    document.getElementById("enrollmentNo").value = "";

    setStudentLookupStatus("");

    lastStudentLookupValue = "";

    // KEEP THESE
    // courseName
    // batchMonth
    // batchYear

    // AUTO FOCUS
    document.getElementById("studentName").focus();

    editMode = false;
}


/* TOAST */

function showLoader(show) {

    const loader =
        document.getElementById("formLoader");

    if (show) {

        loader.classList.remove("hidden");
    }

    else {

        loader.classList.add("hidden");
    }
}


/* FORMAT DATE */

function formatDate(dateString) {

    if (!dateString) return "";

    const date =
        parseEnrollmentDate(dateString);

    if (!date) return "";

    return date.toLocaleDateString("en-GB");
}


function formatInputDate(dateString) {

    if (!dateString) return "";

    const date =
        parseEnrollmentDate(dateString);

    if (!date) return "";

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1).padStart(2, "0");

    const day =
        String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* DARK MODE */

function toggleDarkMode() {

    const isDark =
        !document.body.classList.contains("bg-gray-900");

    applyTheme(isDark);
}

function replaceClasses(elements, removeClasses, addClasses) {

    elements.forEach(element => {

        element.classList.remove(...removeClasses);

        element.classList.add(...addClasses);
    });
}

function applyTheme(isDark) {

    const body =
        document.body;

    body.classList.toggle("bg-gray-900", isDark);
    body.classList.toggle("text-white", isDark);
    body.classList.toggle("bg-gray-100", !isDark);
    body.classList.toggle("text-gray-800", !isDark);

    replaceClasses(
        document.querySelectorAll(".bg-white"),
        isDark ? ["bg-white"] : ["bg-gray-800"],
        isDark ? ["bg-gray-800"] : ["bg-white"]
    );

    replaceClasses(
        document.querySelectorAll(".bg-gray-50"),
        isDark ? ["bg-gray-50"] : ["bg-gray-700"],
        isDark ? ["bg-gray-700"] : ["bg-gray-50"]
    );

    replaceClasses(
        document.querySelectorAll(".bg-gray-100"),
        isDark ? ["bg-gray-100"] : ["bg-gray-700"],
        isDark ? ["bg-gray-700"] : ["bg-gray-100"]
    );

    replaceClasses(
        document.querySelectorAll(".bg-gray-200:not([disabled])"),
        isDark ? ["bg-gray-200"] : ["bg-gray-700"],
        isDark ? ["bg-gray-700"] : ["bg-gray-200"]
    );

    replaceClasses(
        document.querySelectorAll(".text-gray-800"),
        isDark ? ["text-gray-800"] : ["text-white"],
        isDark ? ["text-white"] : ["text-gray-800"]
    );

    replaceClasses(
        document.querySelectorAll(".text-gray-700"),
        isDark ? ["text-gray-700"] : ["text-gray-200"],
        isDark ? ["text-gray-200"] : ["text-gray-700"]
    );

    replaceClasses(
        document.querySelectorAll(".text-gray-500"),
        isDark ? ["text-gray-500"] : ["text-gray-300"],
        isDark ? ["text-gray-300"] : ["text-gray-500"]
    );

    document
        .querySelectorAll("input, select")
        .forEach(field => {

            field.classList.toggle("bg-gray-900", isDark);
            field.classList.toggle("text-white", isDark);
            field.classList.toggle("border-gray-600", isDark);
            field.classList.toggle("bg-white", !isDark);
            field.classList.toggle("text-gray-800", !isDark);
            field.classList.toggle("border-gray-300", !isDark);
        });

    document
        .querySelectorAll("label.border")
        .forEach(label => {

            label.classList.toggle("border-gray-600", isDark);
            label.classList.toggle("border-gray-200", !isDark);
        });

    document
        .querySelectorAll("thead")
        .forEach(thead => {

            thead.classList.toggle("bg-gray-700", isDark);
            thead.classList.toggle("text-gray-100", isDark);
            thead.classList.toggle("bg-gray-100", !isDark);
            thead.classList.toggle("text-gray-800", !isDark);
        });

    document
        .querySelectorAll("#studentTable tr")
        .forEach(row => {

            row.classList.toggle("border-gray-700", isDark);
            row.classList.toggle("hover:bg-gray-700", isDark);
            row.classList.toggle("hover:bg-gray-50", !isDark);
        });

    const themeIcon =
        document.querySelector("[onclick='toggleDarkMode()'] i");

    if (themeIcon) {

        themeIcon.classList.toggle("fa-sun", isDark);
        themeIcon.classList.toggle("fa-moon", !isDark);
        themeIcon.classList.toggle("text-yellow-500", isDark);
    }
}

function toggleFieldSettings() {

    document
        .getElementById("fieldSettings")
        .classList
        .toggle("hidden");
}


function toggleField(fieldId, enabled) {

    document
        .getElementById(fieldId)
        .disabled = !enabled;


    if (!enabled) {

        document
            .getElementById(fieldId)
            .classList
            .add("bg-gray-100", "cursor-not-allowed");
    }

    else {

        document
            .getElementById(fieldId)
            .classList
            .remove("bg-gray-100", "cursor-not-allowed");
    }
}

function updateRunningClock() {

    const clock =
        document.getElementById("runningClock");

    if (!clock) return;

    clock.innerText =
        new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
}

/* TOAST */

function showToast(message, error = false) {

    const toast =
        document.getElementById("toast");

    toast.innerText = message;

    toast.className = error
        ? "fixed top-5 right-5 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg z-50"
        : "fixed top-5 right-5 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg z-50";

    toast.classList.remove("hidden");

    setTimeout(() => {

        toast.classList.add("hidden");

    }, 3000);
}
/* ON LOAD */

window.onload = () => {

    loadStudents();

    updateRunningClock();

    setInterval(updateRunningClock, 1000);

    // AUTO CURSOR ON PAGE LOAD
    document.getElementById("studentName").focus();

    startTypingTracker([
        "studentName",
        "mobileNo",
        "enrollmentNo"
    ]);

};
