// Fonction pour récupérer UNIQUEMENT le modèle MZN (les données viennent désormais de l'app)
async function fetchModel() {
  const modelResponse = await fetch('minizinc/thesis_scheduling_v1/model.mzn');
  return await modelResponse.text();
}

// Modifié pour accepter l'objet jsonData
async function runMiniZincModel(jsonData) {
  const modelContent = await fetchModel();

  const model = new MiniZinc.Model();
  model.addFile('model.mzn', modelContent);
  
  // On passe le JSON généré dynamiquement au solveur en le convertissant en texte
  model.addFile('data.json', JSON.stringify(jsonData));

  const solve = model.solve({
    options: {
      solver: 'gecode',
      'all-solutions': false,
    },
  });

  return await solve;
}

// On ajoute 'mappingData' comme deuxième paramètre
async function runMinizincAndDisplay(jsonData, mappingData) {
  const solverResultsElement = document.getElementById('solver-results');
  
  try {
    solverResultsElement.innerHTML = '<p style="color: #0078D4; font-weight: bold;">⏳ Exécution du modèle MiniZinc en cours (cela peut prendre quelques secondes)...</p>';

    const result = await runMiniZincModel(jsonData);
    console.log('MiniZinc result:', result);

    let finalOutput = "";

    if (result.solution) {
        // On récupère le texte brut généré par ton model.mzn
        let rawText = result.solution.output.default;

        // MAGIE JAVASCRIPT : On détecte la phrase "🎓 Étudiant X (Spé: Y...)" 
        // et on la remplace dynamiquement par les vraies informations du dictionnaire
        finalOutput = rawText.replace(/🎓 Étudiant (\d+) \([^)]+\)/g, (match, idString) => {
            const etudiantId = parseInt(idString);
            const infos = mappingData[etudiantId]; // On pioche dans le dictionnaire
            
            if (infos) {
                // On crée notre belle ligne lisible
                return `🎓 ${infos.nom} | 🏢 Entr: ${infos.etp} | 📚 Spé: ${infos.spe} | 👨‍🏫 TP: ${infos.tp} | 👔 TI: ${infos.ti}`;
            }
            return match; // Sécurité : si l'étudiant n'est pas trouvé, on laisse le texte d'origine
        });
        
        // On l'encadre dans une balise <pre> pour garder la mise en forme
        finalOutput = `<pre style="background: #f1f1f1; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 14px; line-height: 1.5;">${finalOutput}</pre>`;
    } else {
        finalOutput = '<p class="error">Aucune solution trouvée avec ces paramètres. Essaie d\'augmenter le nombre de jours ou de salles.</p>';
    }

    // Affichage sur la page Web
    solverResultsElement.innerHTML =
      `
        <h3>⚙️ Résultats du Solveur</h3>
        <p><strong>Statut:</strong> ${result.status}</p>
        <div>${finalOutput}</div>
      `;
  } catch (error) {
    console.error(error);
    solverResultsElement.innerHTML = `<p class="error">Erreur lors de l'exécution du solveur : ${error.message}</p>`;
  }
}


