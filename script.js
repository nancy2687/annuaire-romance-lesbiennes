// Annuaire des romances lesbiennes françaises
// Charge les CSV placés dans le dossier "data/".
// Dans ta page HTML, prévois un élément : <section id="catalogue"></section>
// Puis ajoute : <script src="script.js" defer></script>

const DOSSIER_DATA = "data/";

function lireCSV(texte) {
    const lignes = texte.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
    if (!lignes.length) return [];

    function separerLigne(ligne) {
        const cellules = [];
        let cellule = "";
        let entreGuillemets = false;

        for (let i = 0; i < ligne.length; i++) {
            const caractere = ligne[i];

            if (caractere === '"') {
                if (entreGuillemets && ligne[i + 1] === '"') {
                    cellule += '"';
                    i++;
                } else {
                    entreGuillemets = !entreGuillemets;
                }
            } else if (caractere === ";" && !entreGuillemets) {
                cellules.push(cellule);
                cellule = "";
            } else {
                cellule += caractere;
            }
        }
        cellules.push(cellule);
        return cellules;
    }

    const entetes = separerLigne(lignes.shift()).map(x => x.trim());

    return lignes.filter(ligne => ligne.trim() !== "").map(ligne => {
        const valeurs = separerLigne(ligne);
        return Object.fromEntries(
            entetes.map((entete, index) => [entete, valeurs[index] ?? ""])
        );
    });
}

async function chargerCSV(nomFichier) {
    const reponse = await fetch(DOSSIER_DATA + nomFichier);
    if (!reponse.ok) {
        throw new Error(`Impossible de charger ${nomFichier} (${reponse.status})`);
    }
    return lireCSV(await reponse.text());
}

function echapperHTML(valeur) {
    return String(valeur ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}

function afficherDate(date) {
    if (!date) return "Non renseignée";
    const [annee, mois, jour] = date.split("-");
    return `${jour}/${mois}/${annee}`;
}

async function afficherCatalogue() {
    const catalogue = document.getElementById("catalogue");

    if (!catalogue) {
        console.error('Élément HTML manquant : <section id="catalogue"></section>');
        return;
    }

    catalogue.textContent = "Chargement du catalogue…";

    try {
        const [livres, auteurs, ecrits, genres, editeurs] = await Promise.all([
            chargerCSV("livre.csv"),
            chargerCSV("auteurs.csv"),
            chargerCSV("ecrits.csv"),
            chargerCSV("genres.csv"),
            chargerCSV("editeurs.csv")
        ]);

        const auteursParId = new Map(auteurs.map(a => [
            a.ID,
            [a.Prénom, a.Nom].filter(Boolean).join(" ")
        ]));

        const livresParId = new Map(livres.map(livre => [livre.ID, livre]));
        const auteursParLivre = new Map();

        ecrits.forEach(lien => {
            const nom = auteursParId.get(lien["Id-auteurs"]);
            if (!nom) return;

            if (!auteursParLivre.has(lien["Id-titres"])) {
                auteursParLivre.set(lien["Id-titres"], []);
            }
            auteursParLivre.get(lien["Id-titres"]).push(nom);
        });

        const genresParId = new Map(genres.map(g => [g.ID, g.Genre]));
        const editeursParId = new Map(editeurs.map(e => [e.ID, e.Nom]));

        catalogue.innerHTML = "";

        livres.sort((a, b) => a.Titre.localeCompare(b.Titre, "fr"));

        livres.forEach(livre => {
            const auteursDuLivre = [...new Set(auteursParLivre.get(livre.ID) || [])];
            const article = document.createElement("article");
            article.className = "livre";

            article.innerHTML = `
                <h2>${echapperHTML(livre.Titre)}</h2>
                <p><strong>Autrice(s) :</strong>
                    ${echapperHTML(auteursDuLivre.join(", ") || "Non renseignée")}
                </p>
                <p><strong>Prix papier :</strong>
                    ${livre.PrixHTb ? echapperHTML(livre.PrixHTb.replace(".", ",")) + " €" : "Non renseigné"}
                </p>
                <p><strong>Date de sortie :</strong>
                    ${echapperHTML(afficherDate(livre.Date_sortie))}
                </p>
                <p><strong>Genre :</strong>
                    ${echapperHTML(genresParId.get(livre["Id-genre"]) || "Non renseigné")}
                </p>
                <p><strong>Éditeur :</strong>
                    ${echapperHTML(editeursParId.get(livre["Id-éditeur"]) || "Non renseigné")}
                </p>
            `;

            catalogue.appendChild(article);
        });

        const compteur = document.getElementById("nombre-livres");
        if (compteur) compteur.textContent = livres.length;

    } catch (erreur) {
        console.error(erreur);
        catalogue.textContent = "Le catalogue n'a pas pu être chargé. Vérifie le dossier data et les noms des fichiers CSV.";
    }
}

document.addEventListener("DOMContentLoaded", afficherCatalogue);
