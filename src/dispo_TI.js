document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('fileInput')
        .addEventListener('change', handleFile);
});

function handleFile(event) {
    console.log("Handlefile called");
    document.getElementById('fileInput')
    .addEventListener('change', handleFile);
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Extract column 24 (index 23)
        const emails = rows
            .slice(1)
            .map(row => row[23])
            .filter(email => email && email.includes("@"));

        // Join emails
        const emailList = emails.join(";");

        // Optional subject & body
        const subject = encodeURIComponent("Subject");
        const body = encodeURIComponent("Hello,\n\nMessage.");

        const mailtoLink = `mailto:${emailList}?subject=${subject}&body=${body}`;

        // Display link
        const linkElement = document.getElementById("mailtoLink");
        linkElement.href = mailtoLink;
        linkElement.textContent = "Open email draft";
    };

    reader.readAsArrayBuffer(file);
}