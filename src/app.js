// Main application logic
document.addEventListener('DOMContentLoaded', function () {
    const statusElement = document.getElementById('status');
    if(statusElement) {
        statusElement.textContent = 'Loaded! Ready to schedule exams.';
        statusElement.style.color = '#28a745';
    }

    const inputElement = document.getElementById('excel-input');
    const infoElement = document.getElementById('file-info');
    const paramsSection = document.getElementById('params-section');
    const incompSection = document.getElementById('incomp-section');
    const btnAnalyse = document.getElementById('btn-analyse');
    const btnDownload = document.getElementById('btn-download');
    const btnGenerate = document.getElementById('btn-generate-schedule'); // Nouveau
    const resultsDiv = document.getElementById('results');
    
    const selectEtp1 = document.getElementById('select-etp-1');
    const selectEtp2 = document.getElementById('select-etp-2');
    const btnAddPair = document.getElementById('btn-add-pair');
    const pairsList = document.getElementById('pairs-list');

    let excelDataCache = null;
    let pairesIncompatibles = [];

    // --- LECTURE DU FICHIER ---
    inputElement.addEventListener('change', function(event) {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            infoElement.innerHTML = `<strong>Fichier chargé :</strong> ${selectedFile.name}`;
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                excelDataCache = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

                const entreprises = new Set();
                excelDataCache.forEach(row => { if (row['Entreprise']) entreprises.add(row['Entreprise']); });

                selectEtp1.innerHTML = ''; selectEtp2.innerHTML = '';
                entreprises.forEach(etp => {
                    selectEtp1.add(new Option(etp, etp));
                    selectEtp2.add(new Option(etp, etp));
                });
                
                paramsSection.style.display = 'block';
                incompSection.style.display = 'block';
                btnAnalyse.style.display = 'inline-block';
                btnDownload.style.display = 'inline-block';
                btnGenerate.style.display = 'none'; // Caché par défaut
                resultsDiv.style.display = 'none';
                pairesIncompatibles = [];
                pairsList.innerHTML = '';
            };
            reader.readAsArrayBuffer(selectedFile);
        }
    });

    // --- AJOUTER DUO CONCURRENT ---
    btnAddPair.addEventListener('click', function() {
        const val1 = selectEtp1.value; const val2 = selectEtp2.value;
        if (val1 && val2 && val1 !== val2) {
            const exists = pairesIncompatibles.some(p => (p.e1 === val1 && p.e2 === val2) || (p.e1 === val2 && p.e2 === val1));
            if (!exists) {
                pairesIncompatibles.push({e1: val1, e2: val2});
                const li = document.createElement('li');
                li.innerHTML = `<span><strong>${val1}</strong> ⚡ <strong>${val2}</strong></span>`;
                const btnDel = document.createElement('button');
                btnDel.className = 'btn-delete-pair'; btnDel.textContent = 'X';
                btnDel.onclick = function() {
                    pairesIncompatibles = pairesIncompatibles.filter(p => p.e1 !== val1 || p.e2 !== val2);
                    li.remove();
                };
                li.appendChild(btnDel); pairsList.appendChild(li);
            } else alert("Ce duo est déjà dans la liste !");
        } else if (val1 === val2) alert("Veuillez sélectionner deux entreprises différentes.");
    });

    // --- ANALYSE ---
    btnAnalyse.addEventListener('click', function() {
        if (!excelDataCache) return;
        const nbSalles = parseInt(document.getElementById('nb-salles').value) || 1;
        const etuParSlot = parseInt(document.getElementById('etu-par-slot').value) || 1;
        const nbJoursSaisis = parseInt(document.getElementById('nb-jours').value) || 1;

        const etudiants = new Set(); const filieres = new Set();
        const entreprises = new Set(); const tuteursInd = new Set(); const tuteursPed = new Set();

        excelDataCache.forEach(row => {
            if (row['Etudiants']) etudiants.add(row['Etudiants']);
            if (row['Filière']) filieres.add(row['Filière']);
            if (row['Entreprise']) entreprises.add(row['Entreprise']);
            if (row['Tuteur industriel']) tuteursInd.add(row['Tuteur industriel']);
            if (row['Tuteur pédagogique']) tuteursPed.add(row['Tuteur pédagogique']);
        });

        document.getElementById('results-list-base').innerHTML = `
            <li>Étudiants : <span class="highlight">${etudiants.size}</span></li>
            <li>Filières : <span class="highlight">${filieres.size}</span></li>
            <li>Entreprises : <span class="highlight">${entreprises.size}</span></li>
        `;

        const minSlots = Math.ceil(etudiants.size / etuParSlot);
        const minJours = Math.ceil(minSlots / (2 * nbSalles));
        const estFaisable = nbJoursSaisis >= minJours;

        document.getElementById('results-list-planning').innerHTML = `
            <li>Slots nécessaires : <span class="highlight">${minSlots}</span></li>
            <li>Jours minimum requis : <span class="highlight">${minJours}</span></li>
            <li>Capacité : ${estFaisable ? `<span class="success">✅ Faisable</span>` : `<span class="error">❌ Il manque ${minJours - nbJoursSaisis} jour(s).</span>`}</li>
        `;
        resultsDiv.style.display = 'block';

        // Afficher le bouton MiniZinc seulement si c'est faisable
        if(estFaisable) {
            btnGenerate.style.display = 'inline-block';
        } else {
            btnGenerate.style.display = 'none';
        }
    });

    // --- FONCTION DE GENERATION DU JSON (Partagée) ---
    function generateScheduleData() {
        if (!excelDataCache) return null;
        const nbSalles = parseInt(document.getElementById('nb-salles').value) || 1;
        const nbJoursSaisis = parseInt(document.getElementById('nb-jours').value) || 1;
        const etuParSlot = parseInt(document.getElementById('etu-par-slot').value) || 1;

        const mapTP = new Map(); const mapTI = new Map();
        const mapSpe = new Map(); const mapEtp = new Map();
        const etudiantTP = []; const etudiantTI = []; const etudiantSpe = []; const etudiantEtp = [];
        let nbEtudiants = 0;

        excelDataCache.forEach(row => {
            if (!row['Etudiants']) return;
            nbEtudiants++;
            const tp = row['Tuteur pédagogique']; if (tp && !mapTP.has(tp)) mapTP.set(tp, mapTP.size + 1); etudiantTP.push(mapTP.get(tp) || 0);
            const ti = row['Tuteur industriel']; if (ti && !mapTI.has(ti)) mapTI.set(ti, mapTI.size + 1); etudiantTI.push(mapTI.get(ti) || 0);
            const spe = row['Filière']; if (spe && !mapSpe.has(spe)) mapSpe.set(spe, mapSpe.size + 1); etudiantSpe.push(mapSpe.get(spe) || 0);
            const etp = row['Entreprise']; if (etp && !mapEtp.has(etp)) mapEtp.set(etp, mapEtp.size + 1); etudiantEtp.push(mapEtp.get(etp) || 0);
        });

        const pairesFormatees = pairesIncompatibles.map(p => ({ "etp1": mapEtp.get(p.e1), "etp2": mapEtp.get(p.e2) }));
        //const totalSlotsRequis = Math.ceil(nbEtudiants / etuParSlot);
        //const slotsParJour = Math.ceil(totalSlotsRequis / nbJoursSaisis) || 1;
        const nbSessions = 3 ;

        return {
            "nbEtud": nbEtudiants, "nbTuteurPeda": mapTP.size, "nbSpe": mapSpe.size, "nbSalle": nbSalles,
            "nbTuteurIndus": mapTI.size, "nbJour": nbJoursSaisis, "nbEntreprise": mapEtp.size,
            "etudiantTP": etudiantTP, "etudiantTI": etudiantTI, "etudiantSpe": etudiantSpe, "etudiantEtp": etudiantEtp,
            "pairesIncompatibles": pairesFormatees,
            "DispoJourSpe": Array.from({ length: mapSpe.size }, () => Array(nbJoursSaisis).fill(true)),
            "dispoTP": Array.from({ length: mapTP.size }, () => Array.from({ length: nbJoursSaisis }, () => Array(/*slotsParJour*/nbSessions).fill(true))),
            "dispoTI": Array.from({ length: mapTI.size }, () => Array.from({ length: nbJoursSaisis }, () => Array(/*slotsParJour*/nbSessions).fill(true)))
        };
    }

    // --- TÉLÉCHARGER LE JSON ---
    btnDownload.addEventListener('click', function() {
        const jsonData = generateScheduleData();
        if(!jsonData) return;
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = "donnees_planification.json";
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    });

    // --- LANCER MINIZINC ---
    btnGenerate.addEventListener('click', async function() {
        const jsonData = generateScheduleData();
        if(!jsonData) return;

        // NOUVEAU : Création d'un dictionnaire de traduction pour l'affichage 
        // // L'index 0 est vide car MiniZinc commence à compter à partir de 1 
        const studentMapping = [""]; 
        excelDataCache.forEach(row => { if (!row['Etudiants']) return; 
        // On stocke toutes les vraies infos textuelles de l'étudiant 
        studentMapping.push({ nom: row['Etudiants'], 
          spe: row['Filière'] || 'N/A', 
          etp: row['Entreprise'] || 'N/A', 
          tp: row['Tuteur pédagogique'] || 'N/A', 
          ti: row['Tuteur industriel'] || 'N/A' 
        }); 
      });

        
        // On fait appel à la fonction du fichier minizincRunner.js en lui passant notre objet JSON
        if(typeof runMinizincAndDisplay === "function") {
            await runMinizincAndDisplay(jsonData, studentMapping);
        } else {
            console.error("La fonction runMinizincAndDisplay n'est pas trouvée.");
        }
    });

    console.log('App loading complete');
});

