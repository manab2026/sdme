const API_URL = "https://script.google.com/macros/s/AKfycbwnHqmmRSodSKpAfRZTytHgJNTA4A5RopGvYDgHrUup3snPDQwaDn1rQt4pSSwXUX6lbQ/exec";

let students = [];

/* SAVE STUDENT */
async function saveStudent() {

    const studentName = document.getElementById("studentName").value.trim();
    const mobileNo = document.getElementById("mobileNo").value.trim();
    const asnNo = document.getElementById("asnNo").value.trim();
    const enrollmentDate = document.getElementById("enrollmentDate").value;
    const courseName = document.getElementById("courseName").value;
    const batch = document.getElementById("batch").value;

    if (!studentName || !asnNo || !enrollmentDate || !courseName) {
        alert("Please fill all required fields");
        return;
    }

    try {

        const formData = new FormData();
        formData.append("studentName", studentName);
        formData.append("mobileNo", mobileNo);
        formData.append("asnNo", asnNo);
        formData.append("enrollmentDate", enrollmentDate);
        formData.append("courseName", courseName);
        formData.append("batch", batch);

        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            body: formData
        });

        clearForm();

        setTimeout(() => {
            loadStudents(); // reload from sheet
            alert("Saved successfully ✅");
        }, 800);

    } catch (error) {
        console.error(error);
        alert("Error Sending Data ❌");
    }
}

/* LOAD STUDENTS */
async function loadStudents() {
    try {

        const res = await fetch(API_URL);
        const data = await res.json();

        students = data.map(item => ({
            studentName: item["Student Name"],
            mobileNo: item["Mobile No"],
            asnNo: item["ASN No"],
            enrollmentDate: item["Enrollment Date"],
            courseName: item["Course Name"],
            batch: item["Batch"]
        }));

        renderTable();

    } catch (error) {
        console.error("Load error:", error);
    }
}

/* RENDER TABLE */
function renderTable(data = students) {

    const table = document.getElementById("studentTable");
    table.innerHTML = "";

    data.forEach((student, index) => {
        table.innerHTML += `
            <tr class="border-b">
                <td class="p-2">${index + 1}</td>
                <td class="p-2">${student.studentName}</td>
                <td class="p-2">${student.mobileNo}</td>
                <td class="p-2">${student.courseName}</td>
                <td class="p-2">${student.asnNo}</td>
                <td class="p-2">${student.batch}</td>
                <td class="p-2">${student.enrollmentDate}</td>
            </tr>
        `;
    });
}

/* SEARCH */
function searchStudent() {

    const search = document.getElementById("search").value.toLowerCase();

    const filtered = students.filter(student =>
        (student.studentName || "").toLowerCase().includes(search) ||
        (student.mobileNo || "").toLowerCase().includes(search) ||
        (student.courseName || "").toLowerCase().includes(search) ||
        (student.asnNo || "").toString().includes(search)
    );

    renderTable(filtered);
}

/* EXPORT */
function exportExcel() {
    const table = document.getElementById("studentTableExcel");
    const wb = XLSX.utils.table_to_book(table, { sheet: "Students" });
    XLSX.writeFile(wb, "Student_Data.xlsx");
}

/* CLEAR */
function clearForm() {
    document.getElementById("studentName").value = "";
    document.getElementById("mobileNo").value = "";
    document.getElementById("asnNo").value = "";
    document.getElementById("enrollmentDate").value = "";
    document.getElementById("courseName").value = "";
    document.getElementById("batch").value = "";
}

/* LOAD ON START */
window.onload = loadStudents;