const API_URL = "https://script.google.com/macros/s/AKfycby4faax5wrl4ScBqO6I9q8guYBdTUKFN2o-mq8Pt_yngg_97eA6qvyU5fYY_mb9jF28og/exec";

let students = [];
let filteredStudents = [];

let currentPage = 1;
const rowsPerPage = 10;

let editMode = false;


/* LOAD STUDENTS */

async function loadStudents() {

    try {

        const res = await fetch(API_URL);

        const data = await res.json();

        students = data;

        filteredStudents = [...students];

        updateDashboard();

        populateCourseFilter();

        renderTable();

    }

    catch (error) {

        console.error(error);

        showToast("Error loading data", true);
    }
}


/* SAVE OR UPDATE */

async function saveStudent() {

    showLoader(true);

    const rowId =
        document.getElementById("rowId").value;

    const studentName =
        document.getElementById("studentName").value.trim();

    const mobileNo =
        document.getElementById("mobileNo").value.trim();

    const enrollmentDate =
        document.getElementById("enrollmentDate").value;

    const courseName =
        document.getElementById("courseName").value;

    const batchMonth =
        document.getElementById("batchMonth").value;

    const batchYear =
        document.getElementById("batchYear").value;

    const enrollmentNo =
        document.getElementById("enrollmentNo").value.trim();


    if (!studentName || !enrollmentDate || !courseName) {

        showLoader(false);

        showToast("Please fill required fields", true);

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

            ||

            (student["Mobile No"] || "")
            .toLowerCase()
            .includes(search)

            ||

            (student["Enrollment No"] || "")
            .toLowerCase()
            .includes(search)

            ||

            (student["Course Name"] || "")
            .toLowerCase()
            .includes(search)
        );
    });

    currentPage = 1;

    renderTable();
}


/* COURSE FILTER */

function filterByCourse() {

    const course =
        document.getElementById("courseFilter").value;

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

    document.getElementById("studentCount").innerText =
        students.length;

    const courses = [

        ...new Set(

            students.map(
                s => s["Course Name"]
            )
        )
    ];

    document.getElementById("courseCount").innerText =
        courses.length;
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

    document.getElementById("enrollmentDate").value = "";

    document.getElementById("enrollmentNo").value = "";

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

    const date = new Date(dateString);

    return date.toLocaleDateString("en-GB");
}


function formatInputDate(dateString) {

    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toISOString().split('T')[0];
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

};
