<?php

// ========================================
// CONNEXION À LA BASE DE DONNÉES
// ========================================

$host = "localhost";
$dbname = "annuaire-romance";
$username = "root";
$password = "";

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (PDOException $e) {
    die("Erreur de connexion à la base de données.");
}

// ========================================
// RÉCUPÉRATION DES LIVRES ET DES AUTRICES
// ========================================

$sql = "
    SELECT
        livre.ID,
        livre.Titre,
        livre.PrixHTb,
        livre.Date_sortie,
        GROUP_CONCAT(
            DISTINCT CONCAT(auteurs.Prénom, ' ', auteurs.Nom)
            SEPARATOR ', '
        ) AS Autrices
    FROM livre
    LEFT JOIN ecrits
        ON livre.ID = ecrits.`Id-titres`
    LEFT JOIN auteurs
        ON ecrits.`Id-auteurs` = auteurs.ID
    GROUP BY
        livre.ID,
        livre.Titre,
        livre.PrixHTb,
        livre.Date_sortie
    ORDER BY livre.Titre ASC
";

$requete = $pdo->query($sql);
$livres = $requete->fetchAll();

?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Annuaire des romances lesbiennes françaises</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #F8E8EC;
            color: #333;
            margin: 0;
            padding: 20px;
        }

        h1, h2 {
            color: #70243B;
        }

        .catalogue {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
            gap: 20px;
        }

        .livre {
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #D8AAB7;
        }

        .livre h2 {
            font-size: 20px;
        }
    </style>
</head>
<body>
    <header>
        <h1>Annuaire des romances lesbiennes françaises</h1>
        <p>Découvrez notre catalogue de romances lesbiennes.</p>
    </header>

    <main>
        <h2>Notre catalogue</h2>
        <p><?= count($livres) ?> livres dans l'annuaire.</p>

        <section class="catalogue">
            <?php foreach ($livres as $livre): ?>
                <article class="livre">
                    <h2><?= htmlspecialchars($livre["Titre"] ?? "", ENT_QUOTES, "UTF-8") ?></h2>

                    <p>
                        <strong>Autrice(s) :</strong>
                        <?= htmlspecialchars($livre["Autrices"] ?? "Non renseignée", ENT_QUOTES, "UTF-8") ?>
                    </p>

                    <p>
                        <strong>Prix :</strong>
                        <?php if ($livre["PrixHTb"] !== null): ?>
                            <?= htmlspecialchars((string) $livre["PrixHTb"], ENT_QUOTES, "UTF-8") ?> €
                        <?php else: ?>
                            Non renseigné
                        <?php endif; ?>
                    </p>

                    <p>
                        <strong>Date de sortie :</strong>
                        <?= htmlspecialchars($livre["Date_sortie"] ?? "Non renseignée", ENT_QUOTES, "UTF-8") ?>
                    </p>
                </article>
            <?php endforeach; ?>
        </section>
    </main>
</body>
</html>
