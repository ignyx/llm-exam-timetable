var gotten_result = false;

// Listener, checks when minizinc is done and takes the result for exporting
window.addEventListener('MiniZincSolved', (e) => {
     window.lastMiniZincResult = e.detail; // <-- Add this line
    gotten_result = true;
    console.log("Export.js received the minizinc result!");
    console.log(window.lastMiniZincResult.solution.output);
});

// Parsing function
function parseScheduleString(scheduleStr, mapping) {
    const lines = scheduleStr.split('\n').filter(line => line.trim() !== "");
    const rows = [];
    let currentJour = "";
    let currentSession = "";

    // Add header row for Excel
    rows.push([
        "Jour",
        "Session",
        "Salle",
        "Position",
        "Étudiant",
        "Spécialité",
        "Tuteur Pédagogique",
        "Tuteur Industriel"
    ]);

    lines.forEach(line => {
        if (line.startsWith('--- JOUR')) {
            const match = line.match(/--- JOUR (\d+) \| SESSION (\d+) ---/);
            if (match) {
                currentJour = match[1];
                currentSession = match[2];
            } else {
                currentJour = "";
                currentSession = "";
            }
        } else if (line.trim().startsWith('🏛️')) {
            // Match: 🏛️ Salle 1 | ⏰ Pos 1 -> 🎓 Étudiant 5 (Spé: 1, TP: 1, TI: 5)
            const match = line.match(
                /🏛️ Salle (\d+)\s*\|\s*⏰ Pos (\d+)\s*->\s*🎓 Étudiant (\d+)\s*\(Spé:\s*([^,]+),\s*TP:\s*([^,]+),\s*TI:\s*([^)]+)\)/
            );
            if (match) {
                const etuId = parseInt(match[3].trim());
                const student = mapping && mapping[etuId] ? mapping[etuId] : {};
                rows.push([
                    currentJour,           // Jour
                    currentSession,        // Session
                    match[1].trim(),       // Salle
                    match[2].trim(),       // Position
                    student.nom || `Étudiant ${match[3].trim()}`, // Étudiant name
                    student.spe || match[4].trim(),               // Spécialité
                    student.tp || match[5].trim(),                // Tuteur pédagogique
                    student.ti || match[6].trim()                 // Tuteur industriel
                ]);
            } else {
                rows.push([currentJour, currentSession, line.trim()]);
            }
        }
    });
    return rows;
}


// Export to excel
function exportMinizincResultToExcel() {
    if (!gotten_result) {
        alert("Aucun résultat MiniZinc disponible à exporter !");
        return;
    }   

    const scheduleStr = window.lastMiniZincResult.solution.output.default;
    const mapping = window.studentMapping || [];
    const rows = parseScheduleString(scheduleStr, mapping);

    // Turn into excel format
    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Auto column width calculation
    worksheet['!cols'] = rows[0].map((_, colIdx) => {
        let maxLen = 10; // Minimum width
        rows.forEach(row => {
            const cell = row[colIdx];
            if (cell && cell.toString().length > maxLen) {
                maxLen = cell.toString().length;
            }
        });
        return { wch: maxLen + 2 }; // Add padding
    });


    // Export
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Timetable");
    XLSX.writeFile(workbook, "exam-timetable.xlsx");
}