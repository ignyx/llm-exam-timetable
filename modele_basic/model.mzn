%! -- INTERN PARAMETERS -- 

set of int: Sessions = 1..3;
set of int: Positions = 1..3;
 

%! -- EXTERN PARAMETERS --  
% Constants
int: nbEtud;
int: nbTuteurPeda;
int: nbSpe; % On confond une spé, et son responsable d'année.
int: nbSalle;
int: nbTuteurIndus;
int: nbJour;
int: nbEntreprise;

% Sets 
set of int: Etudiants = 1..nbEtud;
set of int: TuteursP = 1..nbTuteurPeda;
set of int: TuteursI = 1..nbTuteurIndus;
set of int: Salles = 1..nbSalle;
set of int: Jours = 1..nbJour;
set of int: Spe = 1..nbSpe;
set of int: Entreprises = 1..nbEntreprise;

%Arrays of correspondances
array[Etudiants] of int: etudiantTP;
array[Etudiants] of int: etudiantTI;
array[Etudiants] of int: etudiantSpe;
array[Etudiants] of int: etudiantEtp;

%Arrays of disponibilities
array[TuteursP, Jours, Sessions] of bool: dispoTP;
array[TuteursI, Jours, Sessions] of bool: dispoTI;

array[Spe, Jours] of bool: DispoJourSpe;

%! -- DECISION VARIABLES -- 

array[Etudiants] of var Salles: salle;
array[Etudiants] of var Jours: jour;
array[Etudiants] of var Sessions: session;
array[Etudiants] of var Positions: position;


%! -- PREDICATES --
predicate sameTime(int: i, int: j) =
    jour[i] == jour[j] /\ 
    session[i] == session[j] /\ 
    position[i] == position[j];

predicate present(int: e, int: j, int: s, int: p) = 
    jour[e] == j /\ session[e] == s /\ position[e] == p; 

%! -- CONSTRAINTS -- 

% * Conditions de session

% Deux étudiants ne peuvent pas passé en même temps, dans la même salle.
constraint forall(i, j in Etudiants where i < j) (
    (sameTime(i, j)) -> (salle[i] != salle[j])
);

% Les sessions de l'aprèm-midi possèdent 3 slots.
constraint forall(e in Etudiants) (
    (session[e] >= 2) -> (position[e] <= 3)
);

% Lors d'un session, tout les étudiants d'un spé sont dans la même salle, 
% qui accueille uniquement les étudiants de cette spé.
constraint forall(e, f in Etudiants where e < f)(
    (jour[e] == jour[f] /\ session[e] == session[f]) 
    -> (etudiantSpe[e] == etudiantSpe[f] <-> salle[e] == salle[f])
);

% * Conditions de présence

%présence obligatoire du respo d'année, lors du passage d'un de ses étudiant.
%TODO présense vérifié ici est QUE la journée. 
%TODO Ici, c'est en réalité une condition de disponibilité, et non de présence.
%TODO: a transformer en condition de présence comme le tuteur en bas, + condi de dispo, + condi de préférence
constraint forall(e in Etudiants, j in Jours) (
    (jour[e] == j -> DispoJourSpe[etudiantSpe[e], j])
);

% Contrainte de présence du tuteur péda. Il ne peut y avoir deux étudiants dans deux
% salles différentes qui ont le même tuteur péda, car celui doit être présent pour
% pour les deux.
%TODO: le transformer en contrainte par slot et non par session.
%TODO: ne pas oublier (plus tard) de mettre des grosses pénalités pour faire.
%TODO: attention qu'on priorise la présence, dans son entièreté, à une session.

constraint forall(e, f in Etudiants where e > f)(
    (
        etudiantTP[e] == etudiantTP[f] /\
        jour[e] == jour[f] /\
        session[e] == session[f]
    )
    -> (salle[e] == salle[f])
);

% * Contraintes de disponibilités.

% Dispo TP
constraint forall(e in Etudiants, j in Jours, s in Sessions, p in Positions) (
    present(e, j, s, p) -> dispoTP[etudiantTP[e], j, s]
);

% Dispo TI
constraint forall(e in Etudiants, j in Jours, s in Sessions, p in Positions) (
    present(e, j, s, p) -> dispoTI[etudiantTI[e], j, s]
);

%  * Contraintes d'arrangement


%! -- Objective --
solve satisfy;


%! -- AFFICHAGE DES RÉSULTATS (OUTPUT) --

output [ "=== 📅 EMPLOI DU TEMPS DES SOUTENANCES 📅 ===\n" ] ++
[
    % 1. On affiche un bel en-tête à chaque nouvelle session (quand on est sur la salle 1 et la position 1)
    if sa == 1 /\ p == 1 then 
        "\n--- JOUR " ++ show(j) ++ " | SESSION " ++ show(s) ++ " ---\n" 
    else "" endif ++
    
    % 2. On cherche s'il y a un étudiant assigné à ce créneau exact
    let {
        % On crée une liste temporaire avec l'étudiant qui passe ici (grâce à fix() qui lit le résultat)
        array[int] of int: etud_ici = [
            e | e in Etudiants 
            where fix(jour[e]) == j /\ fix(session[e]) == s /\ fix(salle[e]) == sa /\ fix(position[e]) == p
        ]
    } in
    % 3. Si la liste n'est pas vide (quelqu'un soutient), on l'affiche avec ses infos
    if length(etud_ici) > 0 then
        "  🏛️ Salle " ++ show(sa) ++ " | ⏰ Pos " ++ show(p) ++ 
        " -> 🎓 Étudiant " ++ show(etud_ici[1]) ++ 
        " (Spé: " ++ show(etudiantSpe[etud_ici[1]]) ++ 
        ", TP: " ++ show(etudiantTP[etud_ici[1]]) ++ 
        ", TI: " ++ show(etudiantTI[etud_ici[1]]) ++ ")\n"
    else
        "" % Si personne ne passe, on n'affiche rien pour garder l'emploi du temps propre
    endif
    
    % 4. Les boucles qui parcourent toutes les combinaisons possibles
    | j in Jours, s in 1..3, sa in 1..nbSalle, p in 1..4
];