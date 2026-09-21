const prompt = require('prompt-sync')();
const apprenants = [
    {
        id: 1,
        nomComplet: "Sara Dev",
        ville: "Nador",
        resultats: [
            { jour: 1, exercicesTermines: 18,
                totalExercices: 20, challengeTermine: true },
            { jour: 2, exercicesTermines: 14,
                totalExercices: 20, challengeTermine: false }
        ]
    },

    {
        id: 2,
        nomComplet: "Yassine Code",
        ville: "Oujda",
        resultats: [
            { jour: 1, exercicesTermines: 12,
                totalExercices: 20, challengeTermine: false }
        ]
    },

    {
        id: 3,
        nomComplet: "Badr Algo",
        ville: "Tanger",
        resultats: [
            { jour: 1, exercicesTermines: 15,
                totalExercices: 20, challengeTermine: true }
        ]
    }
];

function normaliserNom(nom){
    if(!nom) return "";
    return nom.trim().toLowerCase();

}


function validerResultat(jour, exercicesTermines, totalExercices){
    if(jour<1 || jour>7){
        return false
    }
    if(exercicesTermines<0 || totalExercices<=0){
        return false
    }
    if(exercicesTermines>totalExercices){
        return false
    }
    return true
}


function ajouterapprenants(id, nom, ville){
    id = parseInt(prompt("Entre l'id :"));
    let existeID= true;
    while(existeID || isNaN(id)){
        existeID = false;
        for(let i=0; i<apprenants.length; i++){
            if(apprenants[i].id===id){
                existeID =true;
                break;
            }
        }
        if(existeID || isNaN(id)){
            id = parseInt(prompt("erreur : id existe deja , enter un nouveau id :  "));
        }
    }

    nom = prompt("Entre le nom complet :");
    ville = prompt("Entre la ville :");

    let nouvelApprenant ={
        id: id,
        nomComplet: normaliserNom(nom),
        ville:normaliserNom(ville) ,
        resultats:[]
    }
    apprenants.push(nouvelApprenant);
    console.log("apprenant ajoute avec succes.");
    return nouvelApprenant


}



function enregistrerResultat(id, jour, exercicesTermines, totalExercices, challengeTermine){

    let apprenantTrouve;
    for(let i=0; i<apprenants.length; i++){
        if(apprenants[i].id === parseInt(id)){
            apprenantTrouve = apprenants[i]
            break;
        }
    }
    if(!apprenantTrouve){
        console.log("apprenant non Trouve");
        return
    }

    let verifieJour= validerResultat(jour, exercicesTermines, totalExercices);
    if(!verifieJour){
        console.log("les donne sont valide");
        return

    }
    let resultatJour = null;
    for(let i=0; i<apprenantTrouve.resultats.length; i++){
        if(apprenantTrouve.resultats[i].jour == jour){
            resultatJour=apprenantTrouve.resultats[i];
            break;

        }
    }
    if(resultatJour!==null){
        resultatJour.exercicesTermines = exercicesTermines;
        resultatJour.totalExercices= totalExercices
        resultatJour.challengeTermine = challengeTermine;
        console.log("mise a jour avec succes ")
    }else{
        apprenantTrouve.resultats.push({
            jour : jour,
            exercicesTermines : exercicesTermines,
            totalExercices : totalExercices,
            challengeTermine: challengeTermine
        })
        console.log("jour ajoute");
    }
}


function calculerProgression(apprenant){
    let totalExercices =0;
    let totalProposes = 0;
    let joursRs= apprenant.resultats.length;

    for(let i=0; i<joursRs; i++){
        let res = apprenant.resultats[i];
        totalExercices += res.exercicesTermines
        totalProposes += res.totalExercices;

    }

    if(totalExercices===0){
        return {pourcentage: 0, statut: "À renforcer"};
    }
    let pourcentage= (totalExercices / totalProposes)*100;
    pourcentage=Number(pourcentage.toFixed(2))

    let statut ="";
    if(pourcentage>=80){
        statut ="Solide";
    }else if(pourcentage>=50 && pourcentage<80){
        statut ="En progression";
    }else if(pourcentage<50){
        statut ="À renforcer";
    }
    return{
        pourcentage : pourcentage,
        statut : statut

    }
}

function rechercherApprenant(recherche){
    let apprenantRecherche= null;
    for(let i=0; i<apprenants.length; i++){
        if(apprenants[i].id===parseInt(recherche) || apprenants[i].nomComplet.includes(normaliserNom(recherche))){
            apprenantRecherche = apprenants[i]
            break;
        }
    }
    if(apprenantRecherche === null){
        console.log("appreant non trouve.")
        return;
    }
    console.log(`ID : ${apprenantRecherche.id}`);
    console.log(`nomComplet : ${apprenantRecherche.nomComplet}`);
    console.log(`Ville : ${apprenantRecherche.ville}`);

    if(apprenantRecherche.resultats.length == 0){
        console.log("aucun resultat enregistre");
    }else{
        for(let i=0; i<apprenantRecherche.resultats.length; i++){
            let rech = apprenantRecherche.resultats[i];
            console.log(`jour : ${rech.jour} : ${rech.exercicesTermines} : ${rech.totalExercices} exercices`)
        }
    }
    let prog = calculerProgression(apprenantRecherche);
    console.log(`Pourcentage: ${prog.pourcentage}%`);
    console.log(`statut : ${prog.statut}`);
}

function filtrerParNiveau(niveauRecherche){
    let trouve = 0;
    let niveauNom = normaliserNom(niveauRecherche);

    for(let i=0; i<apprenants.length; i++){
        let appreant = apprenants[i];
        let statut = calculerProgression|(appreant);

        if(normaliserNom(stats.statut) === niveauNom){
            console.log(`id: ${appreant.id} | nom: ${appreant.nomComplet} | villa: ${appreant.ville} || progression: ${pourcentage.pourcentage}% | statut: ${statut.statut}`);
            trouve++;
        }
    }
    if(trouve===0){
        console.log("aucun apprenant trouve pour ce niveau");
    }

}

function trierParProgression(tableau){
    for(let i=0; i<tableau.length; i++){
        for(let j=0; j<tableau.length-1-i; j++){
            let p1= calculerProgression(tableau[j]).pourcentage;
            let p2= calculerProgression(tableau[j+1]).pourcentage;
            if(p1<p2){
                let temp = tableau[j];
                tableau[j]= tableau[j+1];
                tableau[j+1]= temp;
            }
        }
    }
    return tableau;
}

function  trierParAlphabetique(tableau){
    for(let i=0; i<tableau.length; i++){
        for(let j =0; j<tableau.length-1-i; j++){
            let alpha1 = apprenants[j].nomComplet.toLowerCase();
            let alpha2 = apprenants[j+1].nomComplet.toLowerCase();
            if(alpha1 > alpha2){
                let temp = tableau[j];
                tableau[j]= tableau[j+1];
                tableau[j+1]= temp;
            }
        }
    }
    return tableau;
}

let choix;
console.log("=== SAS PROGRESS CONSOLE ===");
console.log("1. Afficher le tableau de bord");
console.log("2. Afficher la liste des apprenants");
console.log("3. Ajouter un apprenant");
console.log("4. Consulter un apprenant par identifiant");
console.log("5. Ajouter ou modifier le résultat d'une journée");
console.log("6. Rechercher un apprenant par nom");
console.log("7. Filtrer les apprenants par niveau");
console.log("8. Trier les apprenants par progression décroissante");
console.log("9. Trier les apprenants par ordre alphabétique");
console.log("0. Quitter");
do{
    choix = Number(prompt("entre le choix :"));
    switch(choix){
        case 1:
            let sommePourcentages = 0;
            let nbSolide = 0;
            let nbProgression = 0;
            let nbRenforcer = 0;
            console.log("--------- le tableau de bord --------");
            if(apprenants.length===0){
                console.log("aucun apprenant trouve");
            }else{
                console.log("ID | Nom | Ville | Progression | Statut");
                console.log("-------------------------");
                for(let i=0; i<apprenants.length; i++){
                    let stats = calculerProgression(apprenants[i]);
                    sommePourcentages += stats.pourcentage;
                    if(stats.statut === "Solide"){
                        nbSolide++;
                    }else if(stats.statut === "En progression"){
                        nbProgression++;
                    }else{
                        nbRenforcer++;
                    }
                    console.log(`${apprenants[i].id} | ${apprenants[i].nomComplet} | ${apprenants[i].ville} | ${stats.pourcentage} | ${stats.statut}`);
                }
            }
            let MoyenGroupe = (sommePourcentages / apprenants.length).toFixed(2);
            console.log("---------------------------");
            console.log(`Nomber total d'apprenants : ${apprenants.length}`);
            console.log(`progression moyenne de groupe: ${MoyenGroupe}%`);
            console.log(`++++++ repartition par niveau ++++++ : `);
            console.log(`* Solide : ${nbSolide}`);
            console.log(`* en progression : ${nbProgression}`);
            console.log(`* a renforcer : ${nbRenforcer}`);
            console.log("---------------------------");
            break;
        case 2:
            console.log("-------- Liste des apprenants --------");
            for(let i=0; i<apprenants.length; i++){
                console.log(`${apprenants[i].id}. ${apprenants[i].nomComplet}. ${apprenants[i].ville}`)
            }
            break;
        case 3:
            console.log("--------- Ajouter un apprenant --------");
            ajouterapprenants();
            break;
        case 4:
            console.log("--------- Consulter un apprenant --------");
            let idConsulter = parseInt(prompt("enter l'id consulter : "));
            let trouve = false;
            for(let i=0; i<apprenants.length; i++){
                if(apprenants[i].id=== idConsulter){
                    let prog = calculerProgression(apprenants[i]);

                    console.log("===== fiche apprenant =====");
                    console.log(`ID : ${apprenants[i].id}`);
                    console.log(`nomComplet : ${normaliserNom(apprenants[i].nomComplet)}`);
                    console.log(`ville : ${apprenants[i].ville}`);
                    console.log(`progression : ${prog.pourcentage}%`);
                    console.log(`statut : ${prog.statut}`);

                    trouve = true;
                    break;
                }
            }
            if(!trouve){
                console.log(`aucun apprenant trouve avec l'id ${idConsulter}`);
            }
            break
        case 5:
            console.log("--------- Ajouter ou modifier un résultat --------");
            let idRes = parseInt(prompt("enter l'id de l'apprenant: "));
            let jour = parseInt(prompt("enter le jour enter 1 et 7 :"));
            let exTermines = parseInt(prompt("enter le nomber d'exercices termine: "));
            let exTotal = parseInt(prompt("enter le nomber total d'exercices :"));
            let challenge = prompt("le challenge est termine ? (oui/non) : ");
            let challengeTermine=(normaliserNom(challenge)==="oui");
            enregistrerResultat(idRes, jour, exTermines,exTotal,challengeTermine);
            break;
        case 6:
            console.log("--------- Rechercher un apprenant --------");
            let recherche =prompt("enter l'id ou nom: ");
            rechercherApprenant(recherche);
            break
        case 7:
            console.log("--------- Filtrer par niveau --------");
            let niveau=prompt("enter le niveau (Solide / En progression / À renforcer): ");
            filtrerParNiveau(niveau);
            break
        case 8:
            console.log("--------- Trier par progression --------");
            if(apprenants.length===0){
                console.log("aucun apprenant trouve");
            }else{
                let apprenantsTries = trierParProgression(apprenants);

                console.log("ID | Nom | Ville | Progression | Statut");
                console.log("-------------------------");
                for(let i=0; i<apprenantsTries.length; i++){
                    let stats = calculerProgression(apprenants[i]);
                    console.log(`${apprenantsTries[i].id} | ${apprenantsTries[i].nomComplet} | ${apprenantsTries[i].ville} | ${stats.pourcentage}% | ${stats.statut}`);
                }
            }
            break
        case 9:
            console.log("--------- Trier par ordre alphabétique --------");
            if(apprenants.length === 0){
                console.log("aucun apprenant trouve.")
            }else {
                let apprenantsTriesAlpha = trierParAlphabetique(apprenants);
                console.log("ID | Nom | Ville | Progression | Statut");
                console.log("-------------------------");

                for(let i=0; i<apprenantsTriesAlpha.length; i++){
                    let stats = calculerProgression(apprenantsTriesAlpha[i])
                    console.log(`${apprenantsTriesAlpha[i].id} | ${apprenantsTriesAlpha[i].nomComplet} | ${apprenantsTriesAlpha[i].ville} | ${stats.pourcentage}% | ${stats.statut}`);
                }
            }
            break
        case 0:
            console.log("--------- Quiter --------");
            break
        default:
            console.log("--------- le choix invalide --------");
            break
    }
}while(choix!==0)


    
        