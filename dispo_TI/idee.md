**But : Connaître et communiquer les disponibilités des tuteurs industriels**

En entrée : Tableau convention de stage contenant
            - le nom des étudiants
            - le nom du tuteur industriel de chaque étudiant
            - l'adresse mail du tuteur industriel de chaque étudiant

**Lien poll framadate**
https://beta.framadate.org/polls/0541c19fd134d2985385

**Pour connaître les disponibilités des tuteurs industriels**
1. Creation d'un framadate/framaform
2. Extraction des mails tuteurs à partir du tableau en entrée
3. Emission de mail

Entrée                                       Sortie      
fichier .xlsx tableau convention de stage -> liste mails TI
fichier .csv de framadate -> liste mails de qui a répondu, qui n'a pas encore répondu

**Relance de mail**
1. Extraction des résulats courants 
2. Analyse de "qui n'a pas encore répondu"
3. Extraction de ces mails
4. Emission de deuxième mail

**Idée générale**
- Chaque fois, après avoir fourni à l'application le forms, on obtiendra une liste des mails de ce 
- Bouttons
    - Upload tableau convention de stage
    - Creation framadate
    

En sortie : Une formalisation des disponibilités des tuteurs industriels que le modèle MiniZinc     prend en entrée
