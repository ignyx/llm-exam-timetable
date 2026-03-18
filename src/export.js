function export_test() {
    const data = [
        ["tirsdag 24 juni 2025", "", "", "", "", "", "", "", "", "", ""],
        ["", "Salle GEI 015", "", "", "Salle GEI 013", "", "", "Salle GEI 215 (matin) et GEI 013 (après-midi)", "", ""],
        ["", "", "", "", "", "", "", "", "", "", ""],
        ["", "SDBD", "A. HOLMSEN", "", "ESPE", "A. LIU", "", "ISS", "S. GRENIER", "", ""],
        ["", "Etudiant", "Entreprise", "Correspondant", "Etudiant", "Entreprise", "Correspondant", "Etudiant", "Entreprise", "Correspondant", ""],
        ["09h30-10h00", "Nicolas FOURNIER", "KFC", "Marcel Morel", "", "", "", "", "", "", "09h30-10h00"],
        ["10h00-10h30", "Vincent GARCIA", "IKEA", "Mohamed Ali", "Michel FRANCOIS", "Renault", "Henri Renault", "", "", "", "10h00-10h30"],
        ["10h30-11h00", "Florent HOLMSEN", "IKEA", "Arthur BYTE-MONNOT", "Vincent JANKOWSKI", "Casino", "AIME Martin", "Andreas ANDRE", "Burger King", "Albert Lemoine", "10h30-11h00"],
        ["11h00-11h30", "Noah ROHEL", "McDonald's", "Marcel Morel", "", "", "", "Alice MULLER", "Auchan", "Albert Lemoine", "11h00-11h30"],
        ["Délibération", "", "", "", "", "", "", "", "", "", "Délibération"],
        ["REPAS", "", "", "", "", "", "", "", "", "", "REPAS"],
        ["13h30-14h00", "Laure LEFEBVRE", "Leclerc", "Didier LE BOTWLAN", "", "", "", "", "", "", "13h30-14h00"],
        ["14h00-14h30", "Grete ROBIN", "Orange", "Arthur BYTE-MONNOT", "", "", "", "Wictor RICHARD", "Burger King", "Paulette Guerin", "14h00-14h30"],
        ["14h30-15h00", "Luc LAURENT", "MI6", "Albert Colin", "", "", "", "Hans BOYER", "Spotify", "Fernand Masson", "14h30-15h00"],
        ["Délibération", "", "", "", "", "", "", "", "", "", "Délibération"],
        ["PAUSE", "", "", "", "", "", "", "", "", "", "PAUSE"],
        ["16h15-16h45", "Luc BLANC", "Carrefour", "Sami Yangui", "", "", "", "Marie BERNARD", "La poste", "Marguerite Faure", "16h15-16h45"],
        ["16h45-17h15", "Marie ROBERT", "Dennis (visio", "Henri Renault", "", "", "", "Laure FRANCOIS", "CERN", "Jeanne Dupont", "16h45-17h15"],
        ["17h15-17h45", "Nathalie DUPUIS", "Wendy's", "Yoni LAHANA", "", "", "", "Paul MOREAU", "Boulangerie", "Lucien Caron", "17h15-17h45"],
        ["Délibération", "", "", "", "", "", "", "", "", "", "Délibération"]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }
];

data[1].forEach((cell, colIdx) => {
    if (cell.startsWith("Salle")) {
        if (colIdx + 1 < data[1].length && data[1][colIdx + 1] === "") {
            worksheet['!merges'].push({
                s: { r: 1, c: colIdx },
                e: { r: 1, c: colIdx + 2 }
            });
        }
    }
});

// Auto column width calculation
worksheet['!cols'] = data[0].map((_, colIdx) => {
    let maxLen = 10; // Minimum width
    data.forEach(row => {
        const cell = row[colIdx];
        if (cell && cell.toString().length > maxLen) {
            maxLen = cell.toString().length;
        }
    });
    return { wch: maxLen + 2 }; // Add padding
});

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Timetable");
    XLSX.writeFile(workbook, "exam-timetable.xlsx");
}